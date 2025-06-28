import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * @swagger
 * /api/subscription/status:
 *   get:
 *     summary: Get user's subscription status
 *     description: Returns the current subscription status and tier for the authenticated user
 *     tags:
 *       - Subscription
 *     responses:
 *       200:
 *         description: Subscription status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     tier:
 *                       type: string
 *                       enum: [free, pro, agency]
 *                     status:
 *                       type: string
 *                       enum: [active, inactive, cancelled, past_due]
 *                     current_period_end:
 *                       type: string
 *                       format: date-time
 *                     cancel_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
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

    // Get subscription from database
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Database error:", error);
      return Response.json(
        { error: "Database error", message: "Failed to fetch subscription" },
        { status: 500 }
      );
    }

    // If no subscription found, user is on free tier
    if (!subscription) {
      return Response.json({
        success: true,
        subscription: {
          tier: 'free',
          status: 'active',
          current_period_end: null,
          cancel_at: null,
        },
      });
    }

    return Response.json({
      success: true,
      subscription: {
        tier: subscription.plan,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        cancel_at: subscription.cancel_at,
      },
    });

  } catch (error) {
    console.error("Subscription status error:", error);
    return Response.json(
      { error: "Internal server error", message: "Failed to get subscription status" },
      { status: 500 }
    );
  }
}