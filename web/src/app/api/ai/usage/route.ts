import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { RateLimiter } from "@/lib/ai/rate-limiter";

/**
 * @swagger
 * /api/ai/usage:
 *   get:
 *     summary: Get AI usage statistics
 *     description: Retrieve user's AI feature usage statistics and quotas
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 30
 *           default: 7
 *         description: Number of days to include in statistics
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 current_quotas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UsageQuota'
 *                 usage_history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       feature_type:
 *                         type: string
 *                       usage_count:
 *                         type: integer
 *                       date_used:
 *                         type: string
 *                         format: date
 *                 subscription_tier:
 *                   type: string
 *                   enum: [free, pro, agency]
 *                 upgrade_suggestions:
 *                   type: object
 *                   properties:
 *                     should_upgrade:
 *                       type: boolean
 *                     reasons:
 *                       type: array
 *                       items:
 *                         type: string
 *                     recommended_tier:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "7");

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

    const rateLimiter = new RateLimiter();

    // Get current subscription tier
    const subscriptionTier = await rateLimiter.getUserSubscriptionTier(user.id);

    // Get current quotas for all features
    const currentQuotas = await rateLimiter.getAllUsageQuotas(
      user.id,
      subscriptionTier
    );

    // Get usage history
    const usageHistory = await rateLimiter.getUsageStats(
      user.id,
      Math.min(days, 30)
    );

    // Get upgrade suggestions
    const upgradeSuggestions = await rateLimiter.getUpgradeSuggestions(user.id);

    // Calculate daily usage summary
    const dailyUsageSummary = usageHistory.reduce((acc, usage) => {
      const date = usage.date_used;
      if (!acc[date]) {
        acc[date] = {};
      }
      acc[date][usage.feature_type] = usage.usage_count;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    // Calculate total usage by feature
    const totalUsageByFeature = usageHistory.reduce((acc, usage) => {
      if (!acc[usage.feature_type]) {
        acc[usage.feature_type] = 0;
      }
      acc[usage.feature_type] += usage.usage_count;
      return acc;
    }, {} as Record<string, number>);

    // Transform quotas into the expected format
    const contentGenerationQuota = currentQuotas.find(
      (q) => q.feature_type === "content_generation"
    );
    const adaptationQuota = currentQuotas.find(
      (q) => q.feature_type === "cross_platform_adaptation"
    );

    // Get today's usage from the summary
    const today = new Date().toISOString().split("T")[0];
    const todayUsage = dailyUsageSummary[today] || {};

    // Handle unlimited quotas (-1) properly for display
    const getDisplayLimit = (limit: number, tier: string, feature: string) => {
      if (limit === -1) {
        // For unlimited plans, show a high number for display purposes
        if (tier === "pro") {
          return feature === "content_generation" ? 50 : 25;
        } else if (tier === "agency") {
          return feature === "content_generation" ? 200 : 100;
        }
        return 999; // Fallback for unlimited
      }
      return limit;
    };

    const getDisplayRemaining = (
      used: number,
      limit: number,
      tier: string,
      feature: string
    ) => {
      if (limit === -1) {
        // For unlimited plans, show remaining as the display limit minus used
        const displayLimit = getDisplayLimit(limit, tier, feature);
        return Math.max(0, displayLimit - used);
      }
      return Math.max(0, limit - used);
    };

    const dailyGenerations = todayUsage.content_generation || 0;
    const dailyAdaptations = todayUsage.cross_platform_adaptation || 0;
    const generationLimit = contentGenerationQuota?.limit || 5;
    const adaptationLimit = adaptationQuota?.limit || 0;

    return Response.json({
      daily_generations: dailyGenerations,
      daily_limit: getDisplayLimit(
        generationLimit,
        subscriptionTier,
        "content_generation"
      ),
      daily_adaptations: dailyAdaptations,
      adaptation_limit: getDisplayLimit(
        adaptationLimit,
        subscriptionTier,
        "cross_platform_adaptation"
      ),
      remaining_generations: getDisplayRemaining(
        dailyGenerations,
        generationLimit,
        subscriptionTier,
        "content_generation"
      ),
      remaining_adaptations: getDisplayRemaining(
        dailyAdaptations,
        adaptationLimit,
        subscriptionTier,
        "cross_platform_adaptation"
      ),
      subscription_tier: subscriptionTier,
      is_unlimited: generationLimit === -1,
      reset_time:
        contentGenerationQuota?.resets_at ||
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      // Additional data for debugging/future use
      current_quotas: currentQuotas,
      usage_history: usageHistory,
      daily_usage_summary: dailyUsageSummary,
      total_usage_by_feature: totalUsageByFeature,
      upgrade_suggestions: upgradeSuggestions,
      stats_period_days: days,
    });
  } catch (error) {
    console.error("Usage statistics error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to retrieve usage statistics",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ai/usage:
 *   delete:
 *     summary: Reset daily usage (Admin/Testing only)
 *     description: Reset daily usage counters for testing purposes
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Usage reset successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function DELETE(request: NextRequest) {
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

    // Only allow in development or for testing
    if (process.env.NODE_ENV === "production") {
      return Response.json(
        {
          error: "Forbidden",
          message: "Usage reset not allowed in production",
        },
        { status: 403 }
      );
    }

    const rateLimiter = new RateLimiter();
    await rateLimiter.resetDailyUsage(user.id);

    return Response.json({
      message: "Daily usage reset successfully",
      reset_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Usage reset error:", error);
    return Response.json(
      { error: "Internal server error", message: "Failed to reset usage" },
      { status: 500 }
    );
  }
}
