import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * @swagger
 * /api/subscription/change:
 *   post:
 *     summary: Change subscription plan
 *     description: Change the user's subscription plan (upgrade, downgrade, or change billing period)
 *     tags:
 *       - Subscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPlan:
 *                 type: string
 *                 enum: [pro, agency]
 *                 description: The new subscription plan
 *               billingPeriod:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 description: The billing period for the new plan
 *             required:
 *               - newPlan
 *               - billingPeriod
 *     responses:
 *       200:
 *         description: Subscription changed successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
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
    const { newPlan, billingPeriod } = body;

    if (!newPlan || !['pro', 'agency'].includes(newPlan)) {
      return Response.json(
        { error: "Invalid plan", message: "Plan must be 'pro' or 'agency'" },
        { status: 400 }
      );
    }

    if (!billingPeriod || !['monthly', 'yearly'].includes(billingPeriod)) {
      return Response.json(
        { error: "Invalid billing period", message: "Billing period must be 'monthly' or 'yearly'" },
        { status: 400 }
      );
    }

    // Determine the new period end date based on billing period
    const newPeriodEnd = new Date();
    if (billingPeriod === 'yearly') {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
    } else {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    }

    // Update the subscription in the database
    const { data: subscription, error: updateError } = await supabase
      .from("subscriptions")
      .update({
        plan: newPlan,
        status: 'active',
        current_period_end: newPeriodEnd.toISOString(),
        cancel_at: null, // Clear any cancellation if present
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update subscription:", updateError);
      return Response.json(
        { error: "Update failed", message: "Failed to update subscription" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: `Subscription changed to ${newPlan} (${billingPeriod})`,
      subscription,
    });

  } catch (error) {
    console.error("Subscription change error:", error);
    return Response.json(
      { error: "Internal server error", message: "Failed to change subscription" },
      { status: 500 }
    );
  }
}