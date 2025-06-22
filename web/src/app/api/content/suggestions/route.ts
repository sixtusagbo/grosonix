import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { OpenAIService } from "@/lib/ai/openai";
import { StyleAnalyzer } from "@/lib/ai/style-analyzer";
import { RateLimiter } from "@/lib/ai/rate-limiter";

/**
 * @swagger
 * /api/content/suggestions:
 *   get:
 *     summary: Get AI content suggestions
 *     description: Retrieve AI-generated content suggestions for social media posts
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [twitter, instagram, linkedin]
 *         description: Target platform for content suggestions
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         description: Topic or theme for content suggestions
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of suggestions to return
 *       - in: query
 *         name: saved_only
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Return only saved content suggestions
 *     responses:
 *       200:
 *         description: Content suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContentSuggestion'
 *                 remaining_quota:
 *                   type: number
 *                   description: Remaining daily quota for free users
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: Request) {
  const cookieStore = cookies();
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform") || "twitter";
  const topic = searchParams.get("topic") || "general";
  const limit = parseInt(searchParams.get("limit") || "10");
  const savedOnly = searchParams.get("saved_only") === "true";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // If requesting saved content only, return saved suggestions from database
    if (savedOnly) {
      let query = supabase
        .from("content_suggestions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_saved", true)
        .order("created_at", { ascending: false });

      if (platform !== "all") {
        query = query.eq("platform", platform);
      }

      const { data: savedSuggestions, error: savedError } = await query.limit(limit);

      if (savedError) {
        console.error("Error fetching saved suggestions:", savedError);
        return Response.json(
          { error: "Internal server error", message: "Failed to fetch saved suggestions" },
          { status: 500 }
        );
      }

      // Transform database format to API format
      const formattedSuggestions = (savedSuggestions || []).map((suggestion) => ({
        id: suggestion.id,
        content: suggestion.content,
        platform: suggestion.platform,
        hashtags: suggestion.hashtags || [],
        engagement_score: suggestion.engagement_score || 0,
        created_at: suggestion.created_at,
        is_saved: suggestion.is_saved,
      }));

      return Response.json({
        suggestions: formattedSuggestions,
        remaining_quota: null, // Not applicable for saved content
        subscription_tier: "saved",
        total_saved: formattedSuggestions.length,
      });
    }

    // Original logic for generating new content suggestions
    const rateLimiter = new RateLimiter();
    const openaiService = OpenAIService.getInstance();
    const styleAnalyzer = new StyleAnalyzer();

    // Check subscription tier and usage limits
    const subscriptionTier = await rateLimiter.getUserSubscriptionTier(user.id);
    const { allowed, quota } = await rateLimiter.checkUsageQuota(
      user.id,
      "content_generation",
      subscriptionTier
    );

    if (!allowed) {
      return Response.json(
        {
          error: "Rate limit exceeded",
          message:
            "Daily content generation limit reached. Upgrade to Pro for unlimited access.",
          quota,
        },
        { status: 429 }
      );
    }

    // Get user's style profile for personalization
    const { data: styleProfile } = await supabase
      .from("user_style_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    let userStyle: string | undefined;
    if (styleProfile) {
      userStyle = styleAnalyzer.generateStyleSummary(styleProfile);
    }

    // Generate AI content suggestions
    const suggestions = [];
    const actualLimit = Math.min(
      limit,
      subscriptionTier === "free" ? quota.remaining : 10
    );

    for (let i = 0; i < actualLimit; i++) {
      try {
        const generatedContent = await openaiService.generateContent({
          prompt: `Create engaging content about ${topic}`,
          platform: platform as any,
          tone: (styleProfile?.tone as any) || "professional",
          userStyle,
          maxTokens: 150,
          subscriptionTier,
          priority: "standard",
        });

        const suggestion = {
          id: `suggestion-${Date.now()}-${i}`,
          content: generatedContent.content,
          platform,
          hashtags: generatedContent.hashtags,
          engagement_score: generatedContent.engagement_score,
          created_at: new Date().toISOString(),
          is_saved: false,
        };

        suggestions.push(suggestion);

        // Store suggestion in database
        await supabase.from("content_suggestions").insert({
          user_id: user.id,
          content: suggestion.content,
          platform,
          hashtags: suggestion.hashtags,
          engagement_score: suggestion.engagement_score,
          prompt: `Content about ${topic}`,
          tone: styleProfile?.tone || "professional",
          is_saved: false,
        });
      } catch (error) {
        console.error("Error generating suggestion:", error);
        // Continue with other suggestions even if one fails
      }
    }

    // Increment usage tracking
    if (suggestions.length > 0) {
      await rateLimiter.incrementUsage(
        user.id,
        "content_generation",
        suggestions.length
      );
    }

    // Get updated quota
    const { quota: updatedQuota } = await rateLimiter.checkUsageQuota(
      user.id,
      "content_generation",
      subscriptionTier
    );

    return Response.json({
      suggestions,
      remaining_quota:
        subscriptionTier === "free" ? updatedQuota.remaining : null,
      subscription_tier: subscriptionTier,
    });
  } catch (error) {
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to generate content suggestions",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/content/suggestions:
 *   post:
 *     summary: Generate custom content suggestion
 *     description: Generate a custom AI content suggestion based on user input
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *               - platform
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: User's content prompt or idea
 *               platform:
 *                 type: string
 *                 enum: [twitter, instagram, linkedin]
 *                 description: Target platform
 *               tone:
 *                 type: string
 *                 enum: [professional, casual, humorous, inspirational]
 *                 description: Desired tone for the content
 *     responses:
 *       200:
 *         description: Custom content suggestion generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContentSuggestion'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      prompt,
      platform,
      tone = "professional",
      use_voice_style = true,
      ignore_tone = false,
    } = body;

    if (!prompt || !platform) {
      return Response.json(
        { error: "Bad request", message: "Prompt and platform are required" },
        { status: 400 }
      );
    }

    // Initialize services
    const rateLimiter = new RateLimiter();
    const openaiService = OpenAIService.getInstance();
    const styleAnalyzer = new StyleAnalyzer();

    // Check subscription tier and usage limits
    const subscriptionTier = await rateLimiter.getUserSubscriptionTier(user.id);
    const canGenerate = await rateLimiter.canPerformAction(
      user.id,
      "content_generation",
      subscriptionTier
    );

    if (!canGenerate) {
      return Response.json(
        {
          error: "Rate limit exceeded",
          message:
            "Daily content generation limit reached. Upgrade to Pro for unlimited access.",
        },
        { status: 429 }
      );
    }

    // Get user's style profile and voice samples for personalization
    const { data: styleProfile } = await supabase
      .from("user_style_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    let userStyle: string | undefined;
    let effectiveTone = tone;

    if (use_voice_style && styleProfile) {
      // Get user's voice samples for more detailed style analysis
      const { data: voiceSamples } = await supabase
        .from("user_voice_samples")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (voiceSamples && voiceSamples.length > 0) {
        // Create detailed style context from voice samples
        const voiceContext = voiceSamples
          .map(
            (sample, index) =>
              `Sample ${index + 1} (${sample.platform}): ${sample.content}${
                sample.additional_instructions
                  ? ` [Context: ${sample.additional_instructions}]`
                  : ""
              }`
          )
          .join("\n\n");

        userStyle = `User's Voice & Style Analysis:
${styleAnalyzer.generateStyleSummary(styleProfile)}

Voice Samples:
${voiceContext}

Please generate content that matches this specific voice and writing style.`;
      } else {
        // Fallback to basic style profile
        userStyle = styleAnalyzer.generateStyleSummary(styleProfile);
      }

      // Handle tone preferences
      if (ignore_tone) {
        effectiveTone = styleProfile.tone; // Use the analyzed tone from style profile
      } else {
        // Use default tone if set, otherwise use the requested tone
        effectiveTone = styleProfile.default_tone || tone;
      }
    }

    // Generate custom AI content
    const generatedContent = await openaiService.generateContent({
      prompt,
      platform: platform as any,
      tone: effectiveTone as any,
      userStyle: use_voice_style ? userStyle : undefined,
      maxTokens: 200,
      subscriptionTier,
      priority: subscriptionTier === "agency" ? "high" : "standard",
    });

    const customSuggestion = {
      id: `custom-${Date.now()}`,
      content: generatedContent.content,
      platform,
      hashtags: generatedContent.hashtags,
      engagement_score: generatedContent.engagement_score,
      created_at: new Date().toISOString(),
      is_saved: false,
    };

    // Store suggestion in database
    const { data: storedSuggestion } = await supabase.from("content_suggestions").insert({
      user_id: user.id,
      content: customSuggestion.content,
      platform,
      hashtags: customSuggestion.hashtags,
      engagement_score: customSuggestion.engagement_score,
      prompt,
      tone,
      is_saved: false,
    }).select().single();

    // Update the suggestion ID with the database ID
    if (storedSuggestion) {
      customSuggestion.id = storedSuggestion.id;
    }

    // Increment usage tracking
    await rateLimiter.incrementUsage(user.id, "content_generation", 1);

    // Get updated quota
    const { quota: updatedQuota } = await rateLimiter.checkUsageQuota(
      user.id,
      "content_generation",
      subscriptionTier
    );

    return Response.json({
      suggestion: customSuggestion,
      remaining_quota:
        subscriptionTier === "free" ? updatedQuota.remaining : null,
      subscription_tier: subscriptionTier,
    });
  } catch (error) {
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to generate custom content",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/content/suggestions:
 *   patch:
 *     summary: Update content suggestion
 *     description: Update properties of a content suggestion (e.g., save/unsave)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - suggestion_id
 *             properties:
 *               suggestion_id:
 *                 type: string
 *                 description: ID of the content suggestion to update
 *               is_saved:
 *                 type: boolean
 *                 description: Whether to save or unsave the suggestion
 *               is_used:
 *                 type: boolean
 *                 description: Whether the suggestion has been used
 *     responses:
 *       200:
 *         description: Content suggestion updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 suggestion:
 *                   $ref: '#/components/schemas/ContentSuggestion'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Suggestion not found
 */
export async function PATCH(request: NextRequest) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { suggestion_id, is_saved, is_used } = body;

    if (!suggestion_id) {
      return Response.json(
        { error: "Bad request", message: "Suggestion ID is required" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (typeof is_saved === "boolean") {
      updateData.is_saved = is_saved;
    }
    if (typeof is_used === "boolean") {
      updateData.is_used = is_used;
    }

    if (Object.keys(updateData).length === 0) {
      return Response.json(
        { error: "Bad request", message: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update the suggestion
    const { data: updatedSuggestion, error: updateError } = await supabase
      .from("content_suggestions")
      .update(updateData)
      .eq("id", suggestion_id)
      .eq("user_id", user.id) // Ensure user can only update their own suggestions
      .select()
      .single();

    if (updateError) {
      console.error("Error updating suggestion:", updateError);
      return Response.json(
        { error: "Internal server error", message: "Failed to update suggestion" },
        { status: 500 }
      );
    }

    if (!updatedSuggestion) {
      return Response.json(
        { error: "Not found", message: "Suggestion not found or access denied" },
        { status: 404 }
      );
    }

    // Transform to API format
    const formattedSuggestion = {
      id: updatedSuggestion.id,
      content: updatedSuggestion.content,
      platform: updatedSuggestion.platform,
      hashtags: updatedSuggestion.hashtags || [],
      engagement_score: updatedSuggestion.engagement_score || 0,
      created_at: updatedSuggestion.created_at,
      is_saved: updatedSuggestion.is_saved,
      is_used: updatedSuggestion.is_used,
    };

    return Response.json({
      success: true,
      message: "Suggestion updated successfully",
      suggestion: formattedSuggestion,
    });
  } catch (error) {
    console.error("PATCH suggestions error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to update suggestion",
      },
      { status: 500 }
    );
  }
}
