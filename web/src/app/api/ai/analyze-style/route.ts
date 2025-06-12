import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { StyleAnalyzer, UserStyleProfile } from "@/lib/ai/style-analyzer";
import { RateLimiter } from "@/lib/ai/rate-limiter";

/**
 * @swagger
 * /api/ai/analyze-style:
 *   post:
 *     summary: Analyze user's writing style
 *     description: Analyze user's writing style from their social media posts
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               force_refresh:
 *                 type: boolean
 *                 description: Force re-analysis even if recent analysis exists
 *                 default: false
 *     responses:
 *       200:
 *         description: Style analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 style_profile:
 *                   $ref: '#/components/schemas/UserStyleProfile'
 *                 analysis_summary:
 *                   type: string
 *                   description: Human-readable summary of the user's style
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
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
    const { force_refresh = false, voice_samples, default_tone } = body;

    // Initialize services
    const rateLimiter = new RateLimiter();
    const styleAnalyzer = new StyleAnalyzer();

    // Check subscription tier and usage limits
    const subscriptionTier = await rateLimiter.getUserSubscriptionTier(user.id);
    const canAnalyze = await rateLimiter.canPerformAction(
      user.id,
      "style_analysis",
      subscriptionTier
    );

    if (!canAnalyze) {
      return Response.json(
        {
          error: "Rate limit exceeded",
          message:
            "Style analysis limit reached. Upgrade to Pro for unlimited access.",
        },
        { status: 429 }
      );
    }

    // Check if we have a recent analysis and don't need to refresh
    if (!force_refresh) {
      const { data: existingProfile } = await supabase
        .from("user_style_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existingProfile) {
        const lastAnalyzed = new Date(existingProfile.last_analyzed);
        const daysSinceAnalysis =
          (Date.now() - lastAnalyzed.getTime()) / (1000 * 60 * 60 * 24);

        // If analysis is less than 7 days old, return existing profile
        if (daysSinceAnalysis < 7) {
          return Response.json({
            style_profile: existingProfile,
            analysis_summary:
              styleAnalyzer.generateStyleSummary(existingProfile),
            from_cache: true,
          });
        }
      }
    }

    // Check if we have voice samples to analyze
    let postsToAnalyze: any[] = [];

    if (voice_samples && voice_samples.length > 0) {
      // Use provided voice samples
      postsToAnalyze = voice_samples.map((sample: any) => ({
        content: sample.content,
        platform: sample.platform,
        additional_instructions: sample.additional_instructions,
      }));
    } else {
      // Get user's stored voice samples
      const { data: storedSamples } = await supabase
        .from("user_voice_samples")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (storedSamples && storedSamples.length > 0) {
        postsToAnalyze = storedSamples.map((sample) => ({
          content: sample.content,
          platform: sample.platform,
          additional_instructions: sample.additional_instructions,
        }));
      }
    }

    if (postsToAnalyze.length === 0) {
      // No voice samples available - create demo profile
      console.log(
        "No voice samples available, creating demo style profile for user:",
        user.id
      );

      const demoStyleProfile: UserStyleProfile = {
        user_id: user.id,
        tone: default_tone || "professional",
        topics: ["technology", "business", "innovation", "productivity"],
        writing_patterns: [
          "clear and concise",
          "uses examples",
          "asks questions",
        ],
        engagement_strategies: [
          "calls to action",
          "thought-provoking questions",
          "industry insights",
        ],
        vocabulary_level: "professional",
        emoji_usage: "minimal",
        hashtag_style: "moderate usage",
        content_length_preference: "medium",
        analyzed_posts_count: 0,
        confidence_score: 30,
        last_analyzed: new Date().toISOString(),
      };

      // Store the demo profile in the database
      const { error: upsertError } = await supabase
        .from("user_style_profiles")
        .upsert(demoStyleProfile, {
          onConflict: "user_id",
        });

      if (upsertError) {
        console.error("Error storing demo style profile:", upsertError);
      }

      const analysisSummary =
        styleAnalyzer.generateStyleSummary(demoStyleProfile);

      return Response.json({
        style_profile: demoStyleProfile,
        analysis_summary:
          analysisSummary +
          " (Note: This is a demo profile. Add your favorite posts in the Style tab for personalized analysis.)",
        posts_analyzed: 0,
        from_cache: false,
        is_demo: true,
        message:
          "Add your favorite posts in the Style tab to get personalized style analysis based on your actual writing.",
      });
    }

    // Perform style analysis using voice samples
    const styleProfile = await styleAnalyzer.analyzeUserStyleFromSamples(
      user.id,
      postsToAnalyze,
      subscriptionTier,
      default_tone
    );

    // Store the analysis in the database
    const { error: upsertError } = await supabase
      .from("user_style_profiles")
      .upsert(styleProfile, {
        onConflict: "user_id",
      });

    if (upsertError) {
      console.error("Error storing style profile:", upsertError);
    }

    // Increment usage tracking
    await rateLimiter.incrementUsage(user.id, "style_analysis", 1);

    const analysisSummary = styleAnalyzer.generateStyleSummary(styleProfile);

    return Response.json({
      style_profile: styleProfile,
      analysis_summary: analysisSummary,
      posts_analyzed: postsToAnalyze.length,
      from_cache: false,
    });
  } catch (error) {
    console.error("Style analysis error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to analyze writing style",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ai/analyze-style:
 *   get:
 *     summary: Get user's current style profile
 *     description: Retrieve the user's current writing style profile
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Style profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 style_profile:
 *                   $ref: '#/components/schemas/UserStyleProfile'
 *                 analysis_summary:
 *                   type: string
 *                   description: Human-readable summary of the user's style
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No style profile found
 */
export async function GET(request: NextRequest) {
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

    // Get user's style profile
    const { data: styleProfile, error } = await supabase
      .from("user_style_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !styleProfile) {
      return Response.json(
        {
          error: "Not found",
          message: "No style profile found. Please run style analysis first.",
        },
        { status: 404 }
      );
    }

    const styleAnalyzer = new StyleAnalyzer();
    const analysisSummary = styleAnalyzer.generateStyleSummary(styleProfile);

    return Response.json({
      style_profile: styleProfile,
      analysis_summary: analysisSummary,
    });
  } catch (error) {
    console.error("Get style profile error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to retrieve style profile",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ai/analyze-style:
 *   patch:
 *     summary: Update default tone
 *     description: Update the user's default tone preference
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - default_tone
 *             properties:
 *               default_tone:
 *                 type: string
 *                 enum: [professional, casual, humorous, inspirational, educational]
 *     responses:
 *       200:
 *         description: Default tone updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 style_profile:
 *                   $ref: '#/components/schemas/UserStyleProfile'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No style profile found
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
    const { default_tone } = body;

    if (!default_tone) {
      return Response.json(
        { error: "Bad request", message: "Default tone is required" },
        { status: 400 }
      );
    }

    const validTones = [
      "professional",
      "casual",
      "humorous",
      "inspirational",
      "educational",
    ];
    if (!validTones.includes(default_tone)) {
      return Response.json(
        { error: "Bad request", message: "Invalid tone value" },
        { status: 400 }
      );
    }

    // Update the user's style profile with new default tone
    const { data: updatedProfile, error: updateError } = await supabase
      .from("user_style_profiles")
      .update({
        default_tone,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating default tone:", updateError);
      return Response.json(
        {
          error: "Internal server error",
          message: "Failed to update default tone",
        },
        { status: 500 }
      );
    }

    if (!updatedProfile) {
      return Response.json(
        {
          error: "Not found",
          message: "No style profile found. Please run style analysis first.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      style_profile: updatedProfile,
      message: "Default tone updated successfully",
    });
  } catch (error) {
    console.error("Update default tone error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to update default tone",
      },
      { status: 500 }
    );
  }
}
