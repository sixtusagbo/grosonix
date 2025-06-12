import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { ContentAdapter } from "@/lib/ai/content-adapter";
import { StyleAnalyzer } from "@/lib/ai/style-analyzer";
import { RateLimiter } from "@/lib/ai/rate-limiter";

/**
 * @swagger
 * /api/ai/adapt-content:
 *   post:
 *     summary: Adapt content for multiple platforms
 *     description: Adapt a piece of content for Twitter, Instagram, and LinkedIn
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Original content to adapt
 *               target_platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [twitter, instagram, linkedin]
 *                 description: Specific platforms to adapt for (default - all)
 *     responses:
 *       200:
 *         description: Content adapted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 original_content:
 *                   type: string
 *                 adaptations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlatformContent'
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Feature not available in current subscription tier
 *       429:
 *         description: Rate limit exceeded
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
    const { content, target_platforms } = body;

    if (!content || content.trim().length === 0) {
      return Response.json(
        { error: "Bad request", message: "Content is required" },
        { status: 400 }
      );
    }

    // Initialize services
    const rateLimiter = new RateLimiter();
    const contentAdapter = new ContentAdapter();
    const styleAnalyzer = new StyleAnalyzer();

    // Check subscription tier - cross-platform adaptation is Pro+ feature
    const subscriptionTier = await rateLimiter.getUserSubscriptionTier(user.id);

    if (subscriptionTier === "free") {
      return Response.json(
        {
          error: "Feature not available",
          message:
            "Cross-platform content adaptation is available in Pro and Agency tiers. Upgrade to access this feature.",
          upgrade_required: true,
          recommended_tier: "pro",
        },
        { status: 403 }
      );
    }

    // Check usage limits for Pro+ users (they have unlimited, but we still track)
    const canAdapt = await rateLimiter.canPerformAction(
      user.id,
      "cross_platform_adaptation",
      subscriptionTier
    );

    if (!canAdapt) {
      return Response.json(
        {
          error: "Rate limit exceeded",
          message: "Cross-platform adaptation limit reached.",
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

    // Adapt content for all platforms or specified platforms
    let adaptedContent;

    if (target_platforms && target_platforms.length > 0) {
      // Adapt for specific platforms
      const adaptations = [];
      for (const platform of target_platforms) {
        if (!["twitter", "instagram", "linkedin"].includes(platform)) {
          continue;
        }

        try {
          const adaptation = await contentAdapter.adaptContentForPlatform(
            content,
            platform,
            userStyle,
            subscriptionTier
          );
          adaptations.push(adaptation);
        } catch (error) {
          console.error(`Failed to adapt for ${platform}:`, error);
          // Add fallback adaptation
          adaptations.push(
            contentAdapter.createFallbackAdaptation(content, platform)
          );
        }
      }

      adaptedContent = {
        original_content: content,
        adaptations,
        created_at: new Date().toISOString(),
      };
    } else {
      // Adapt for all platforms
      adaptedContent = await contentAdapter.adaptContentForAllPlatforms(
        content,
        userStyle,
        subscriptionTier
      );
    }

    // Store the adaptation in database
    const { error: insertError } = await supabase
      .from("content_adaptations")
      .insert({
        user_id: user.id,
        original_content: content,
        adapted_content: adaptedContent,
      });

    if (insertError) {
      console.error("Error storing content adaptation:", insertError);
    }

    // Increment usage tracking
    await rateLimiter.incrementUsage(user.id, "cross_platform_adaptation", 1);

    // Validate each adaptation
    const validatedAdaptations = adaptedContent.adaptations.map(
      (adaptation) => {
        const validation = contentAdapter.validatePlatformContent(adaptation);
        return {
          ...adaptation,
          validation: validation,
        };
      }
    );

    // Get updated quota
    const { quota: updatedQuota } = await rateLimiter.checkUsageQuota(
      user.id,
      "cross_platform_adaptation",
      subscriptionTier
    );

    return Response.json({
      adaptation: {
        ...adaptedContent,
        adaptations: validatedAdaptations,
      },
      remaining_quota: updatedQuota.remaining,
      subscription_tier: subscriptionTier,
      user_style_applied: !!userStyle,
    });
  } catch (error) {
    console.error("Content adaptation error:", error);
    return Response.json(
      { error: "Internal server error", message: "Failed to adapt content" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ai/adapt-content:
 *   get:
 *     summary: Get recent content adaptations
 *     description: Retrieve user's recent content adaptations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of adaptations to return
 *     responses:
 *       200:
 *         description: Content adaptations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 adaptations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CrossPlatformContent'
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10");

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

    // Get user's recent content adaptations
    const { data: adaptations, error } = await supabase
      .from("content_adaptations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(Math.min(limit, 50));

    if (error) {
      console.error("Error fetching adaptations:", error);
      return Response.json(
        {
          error: "Internal server error",
          message: "Failed to fetch adaptations",
        },
        { status: 500 }
      );
    }

    return Response.json({
      adaptations: adaptations || [],
      count: adaptations?.length || 0,
    });
  } catch (error) {
    console.error("Get adaptations error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to retrieve adaptations",
      },
      { status: 500 }
    );
  }
}
