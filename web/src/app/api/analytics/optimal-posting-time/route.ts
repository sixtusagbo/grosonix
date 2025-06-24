import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { OptimalPostingTimeAnalyzer } from "@/lib/analytics/optimal-posting-time";

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

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform") as 'twitter' | 'linkedin' | 'instagram';
    const timezone = searchParams.get("timezone") || "UTC";

    if (!platform || !['twitter', 'linkedin', 'instagram'].includes(platform)) {
      return Response.json(
        { error: "Bad request", message: "Valid platform parameter is required (twitter, linkedin, instagram)" },
        { status: 400 }
      );
    }

    // Initialize the analyzer
    const analyzer = new OptimalPostingTimeAnalyzer();

    // Analyze optimal posting times
    const analysis = await analyzer.analyzeOptimalTimes(user.id, platform, timezone);

    // Get user's subscription tier for feature access
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("tier")
      .eq("user_id", user.id)
      .single();

    const subscriptionTier = subscription?.tier || "free";

    // Limit features based on subscription
    let limitedAnalysis = analysis;
    
    if (subscriptionTier === "free") {
      // Free users get top 3 recommendations only
      limitedAnalysis = {
        ...analysis,
        recommendations: analysis.recommendations.slice(0, 3),
      };
    } else if (subscriptionTier === "pro") {
      // Pro users get top 5 recommendations
      limitedAnalysis = {
        ...analysis,
        recommendations: analysis.recommendations.slice(0, 5),
      };
    }
    // Agency users get all recommendations (no limit)

    return Response.json({
      success: true,
      analysis: limitedAnalysis,
      subscription_tier: subscriptionTier,
      next_optimal_time: OptimalPostingTimeAnalyzer.getNextOptimalTime(limitedAnalysis.recommendations),
    });

  } catch (error) {
    console.error("Optimal posting time analysis error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to analyze optimal posting times",
      },
      { status: 500 }
    );
  }
}

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
    const { platforms, timezone } = body;

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return Response.json(
        { error: "Bad request", message: "Platforms array is required" },
        { status: 400 }
      );
    }

    // Validate platforms
    const validPlatforms = platforms.filter(p => ['twitter', 'linkedin', 'instagram'].includes(p));
    if (validPlatforms.length === 0) {
      return Response.json(
        { error: "Bad request", message: "At least one valid platform is required" },
        { status: 400 }
      );
    }

    // Initialize the analyzer
    const analyzer = new OptimalPostingTimeAnalyzer();

    // Analyze optimal posting times for all platforms
    const analyses = await Promise.all(
      validPlatforms.map(platform => 
        analyzer.analyzeOptimalTimes(user.id, platform as any, timezone || "UTC")
      )
    );

    // Get user's subscription tier
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("tier")
      .eq("user_id", user.id)
      .single();

    const subscriptionTier = subscription?.tier || "free";

    // Apply subscription limits
    const limitedAnalyses = analyses.map(analysis => {
      if (subscriptionTier === "free") {
        return {
          ...analysis,
          recommendations: analysis.recommendations.slice(0, 3),
        };
      } else if (subscriptionTier === "pro") {
        return {
          ...analysis,
          recommendations: analysis.recommendations.slice(0, 5),
        };
      }
      return analysis; // Agency gets all
    });

    // Find overall best times across platforms
    const allRecommendations = limitedAnalyses.flatMap(analysis => analysis.recommendations);
    const bestOverallTimes = allRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return Response.json({
      success: true,
      analyses: limitedAnalyses,
      best_overall_times: bestOverallTimes,
      subscription_tier: subscriptionTier,
      timezone: timezone || "UTC",
    });

  } catch (error) {
    console.error("Multi-platform optimal posting time analysis error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to analyze optimal posting times",
      },
      { status: 500 }
    );
  }
}
