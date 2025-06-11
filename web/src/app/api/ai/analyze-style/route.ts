import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { StyleAnalyzer } from "@/lib/ai/style-analyzer";
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
    const { force_refresh = false } = body;

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

    // Get user's connected social accounts
    const { data: socialAccounts } = await supabase
      .from("social_accounts")
      .select("platform, access_token")
      .eq("user_id", user.id);

    if (!socialAccounts || socialAccounts.length === 0) {
      // No social accounts connected - create demo profile
      console.log(
        "No social accounts connected, creating demo style profile for user:",
        user.id
      );

      const demoStyleProfile = {
        user_id: user.id,
        tone: "professional",
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
        confidence_score: 30, // Lower confidence since it's demo data
        last_analyzed: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
          " (Note: This is a demo profile. Connect your Twitter account in Settings for personalized analysis.)",
        posts_analyzed: 0,
        from_cache: false,
        is_demo: true,
        message:
          "Connect your Twitter account to get personalized style analysis based on your actual posts.",
      });
    }

    // Fetch user's posts for analysis
    const accessTokens: Record<string, string> = {};
    socialAccounts.forEach((account) => {
      accessTokens[account.platform] = account.access_token;
    });

    const platforms = socialAccounts.map((account) => account.platform);
    const posts = await styleAnalyzer.fetchUserPostsForAnalysis(
      user.id,
      platforms,
      accessTokens
    );

    if (posts.length === 0) {
      // Connected accounts but no posts fetched - likely API issue
      console.log(
        "Connected accounts found but no posts fetched for user:",
        user.id,
        "Platforms:",
        platforms
      );

      return Response.json(
        {
          error: "No posts available",
          message:
            "Unable to fetch posts from your connected accounts. This might be due to API rate limits or connection issues. Please try again later or check your account connections in Settings.",
          connected_platforms: platforms,
          suggestion:
            "Try reconnecting your Twitter account in Settings if the issue persists.",
        },
        { status: 400 }
      );
    }

    // Perform style analysis
    const styleProfile = await styleAnalyzer.analyzeUserStyle(
      user.id,
      posts,
      subscriptionTier
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
      posts_analyzed: posts.length,
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
