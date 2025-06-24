import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

/**
 * @swagger
 * /api/content/analytics:
 *   get:
 *     summary: Get content suggestion analytics
 *     description: Retrieve analytics data about user's content suggestions and interactions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Number of days to include in analytics
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [twitter, instagram, linkedin]
 *         description: Filter analytics by platform
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_generated:
 *                       type: number
 *                     total_saved:
 *                       type: number
 *                     total_discarded:
 *                       type: number
 *                     total_used:
 *                       type: number
 *                     overall_save_rate:
 *                       type: number
 *                     avg_engagement_score:
 *                       type: number
 *                     most_active_platform:
 *                       type: string
 *                 daily_metrics:
 *                   type: array
 *                   items:
 *                     type: object
 *                 platform_breakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");
  const platform = searchParams.get("platform");

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

    // Get analytics summary using the database function
    // Fix: Change the parameter order to match the function definition (p_user_id, p_days)
    const { data: summaryData, error: summaryError } = await supabase.rpc(
      "get_user_analytics_summary",
      {
        p_user_id: user.id,
        p_days: Math.min(days, 365),
      }
    );

    if (summaryError) {
      console.error("Error fetching analytics summary:", summaryError);
      return Response.json(
        {
          error: "Internal server error",
          message: "Failed to fetch analytics summary",
        },
        { status: 500 }
      );
    }

    const summary = summaryData?.[0] || {
      total_generated: 0,
      total_saved: 0,
      total_discarded: 0,
      total_used: 0,
      overall_save_rate: 0,
      avg_engagement_score: 0,
      most_active_platform: null,
      daily_metrics: [],
    };

    // Get platform breakdown
    let platformQuery = supabase
      .from("content_analytics")
      .select("platform, action_type, engagement_score")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (platform) {
      platformQuery = platformQuery.eq("platform", platform);
    }

    const { data: platformData, error: platformError } = await platformQuery;

    if (platformError) {
      console.error("Error fetching platform data:", platformError);
      return Response.json(
        {
          error: "Internal server error",
          message: "Failed to fetch platform data",
        },
        { status: 500 }
      );
    }

    // Process platform breakdown
    const platformBreakdown = (platformData || []).reduce((acc: any, item: any) => {
      const platform = item.platform;
      if (!acc[platform]) {
        acc[platform] = {
          platform,
          generated: 0,
          saved: 0,
          discarded: 0,
          used: 0,
          total_engagement: 0,
          count: 0,
        };
      }

      acc[platform][item.action_type] = (acc[platform][item.action_type] || 0) + 1;
      acc[platform].total_engagement += item.engagement_score || 0;
      acc[platform].count += 1;

      return acc;
    }, {} as Record<string, Record<string, number>>);

    // Calculate averages and rates for each platform
    const platformBreakdownArray = Object.values(platformBreakdown).map((platform: any) => ({
      ...platform,
      save_rate: platform.generated > 0 ? (platform.saved / platform.generated) * 100 : 0,
      avg_engagement_score: platform.count > 0 ? platform.total_engagement / platform.count : 0,
    }));

    // Get recent activity (last 7 days for trend analysis)
    const { data: recentActivity, error: activityError } = await supabase
      .from("content_analytics")
      .select("created_at, action_type, platform")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    if (activityError) {
      console.error("Error fetching recent activity:", activityError);
    }

    // Process daily metrics from the summary
    const dailyMetrics = summary.daily_metrics || [];

    return Response.json({
      summary: {
        total_generated: Number(summary.total_generated),
        total_saved: Number(summary.total_saved),
        total_discarded: Number(summary.total_discarded),
        total_used: Number(summary.total_used),
        overall_save_rate: Number(summary.overall_save_rate),
        avg_engagement_score: Number(summary.avg_engagement_score),
        most_active_platform: summary.most_active_platform,
      },
      daily_metrics: dailyMetrics,
      platform_breakdown: platformBreakdownArray,
      recent_activity: recentActivity || [],
      period_days: days,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to fetch analytics data",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/content/analytics:
 *   post:
 *     summary: Track content interaction
 *     description: Record a user interaction with content suggestions
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
 *               - action_type
 *               - platform
 *             properties:
 *               suggestion_id:
 *                 type: string
 *                 description: ID of the content suggestion
 *               action_type:
 *                 type: string
 *                 enum: [generated, viewed, saved, discarded, copied, used]
 *                 description: Type of interaction
 *               platform:
 *                 type: string
 *                 enum: [twitter, instagram, linkedin]
 *                 description: Platform of the content
 *               engagement_score:
 *                 type: number
 *                 description: Engagement score of the content
 *     responses:
 *       200:
 *         description: Interaction tracked successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
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
    const { suggestion_id, action_type, platform, engagement_score = 0 } = body;

    if (!suggestion_id || !action_type || !platform) {
      return Response.json(
        {
          error: "Bad request",
          message: "suggestion_id, action_type, and platform are required",
        },
        { status: 400 }
      );
    }

    const validActions = ["generated", "viewed", "saved", "discarded", "copied", "used"];
    if (!validActions.includes(action_type)) {
      return Response.json(
        {
          error: "Bad request",
          message: `Invalid action_type. Must be one of: ${validActions.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Track the interaction using the database function
    const { error: trackError } = await supabase.rpc("track_content_interaction", {
      p_user_id: user.id,
      p_suggestion_id: suggestion_id,
      p_action_type: action_type,
      p_platform: platform,
      p_engagement_score: engagement_score,
    });

    if (trackError) {
      console.error("Error tracking interaction:", trackError);
      return Response.json(
        {
          error: "Internal server error",
          message: "Failed to track interaction",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Interaction tracked successfully",
    });
  } catch (error) {
    console.error("Track interaction error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to track interaction",
      },
      { status: 500 }
    );
  }
}