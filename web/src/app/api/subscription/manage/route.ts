import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * @swagger
 * /api/subscription/manage:
 *   post:
 *     summary: Manage subscription (cancel, reactivate)
 *     description: Allows users to manage their subscription status
 *     tags:
 *       - Subscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [cancel, reactivate]
 *             required:
 *               - action
 *     responses:
 *       200:
 *         description: Subscription management action completed
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  
  // Create a Supabase client with the service role key for admin operations
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key to bypass RLS
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    // First get the user to verify authentication
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
    const { action } = body;

    if (!action || !['cancel', 'reactivate'].includes(action)) {
      return Response.json(
        { error: "Invalid action", message: "Action must be 'cancel' or 'reactivate'" },
        { status: 400 }
      );
    }

    // Get current subscription
    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !subscription) {
      return Response.json(
        { error: "Subscription not found", message: "No active subscription found" },
        { status: 404 }
      );
    }

    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    switch (action) {
      case 'cancel':
        if (subscription.status === 'cancelled') {
          return Response.json(
            { error: "Already cancelled", message: "Subscription is already cancelled" },
            { status: 400 }
          );
        }
        
        updateData.status = 'cancelled';
        updateData.cancel_at = subscription.current_period_end;
        break;

      case 'reactivate':
        if (subscription.status !== 'cancelled') {
          return Response.json(
            { error: "Cannot reactivate", message: "Subscription is not cancelled" },
            { status: 400 }
          );
        }
        
        updateData.status = 'active';
        updateData.cancel_at = null;
        break;
    }

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update subscription:", updateError);
      return Response.json(
        { error: "Update failed", message: "Failed to update subscription", details: updateError },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: `Subscription ${action}led successfully`,
      subscription: {
        ...subscription,
        ...updateData,
      },
    });

  } catch (error) {
    console.error("Subscription management error:", error);
    return Response.json(
      { error: "Internal server error", message: "Failed to manage subscription" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/subscription/manage:
 *   get:
 *     summary: Get subscription management options
 *     description: Returns available management options for the user's subscription
 *     tags:
 *       - Subscription
 *     responses:
 *       200:
 *         description: Management options retrieved successfully
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

    // Get current subscription
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Database error:", error);
      return Response.json(
        { error: "Database error", message: "Failed to fetch subscription" },
        { status: 500 }
      );
    }

    // If no subscription, user is on free tier
    if (!subscription) {
      return Response.json({
        success: true,
        options: {
          canUpgrade: true,
          canCancel: false,
          canReactivate: false,
          currentTier: 'free',
        },
      });
    }

    const options = {
      canUpgrade: subscription.plan !== 'agency',
      canCancel: subscription.status === 'active',
      canReactivate: subscription.status === 'cancelled',
      currentTier: subscription.plan,
      status: subscription.status,
      expiresAt: subscription.current_period_end,
      cancelAt: subscription.cancel_at,
    };

    return Response.json({
      success: true,
      options,
    });

  } catch (error) {
    console.error("Subscription management options error:", error);
    return Response.json(
      { error: "Internal server error", message: "Failed to get management options" },
      { status: 500 }
    );
  }
}