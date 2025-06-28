import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * @swagger
 * /api/subscription/webhook:
 *   post:
 *     summary: Handle RevenueCat webhook events
 *     description: Processes webhook events from RevenueCat to update subscription status
 *     tags:
 *       - Subscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                   app_user_id:
 *                     type: string
 *                   product_id:
 *                     type: string
 *                   period_type:
 *                     type: string
 *                   purchased_at_ms:
 *                     type: number
 *                   expiration_at_ms:
 *                     type: number
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook data
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body.event;

    if (!event || !event.type || !event.app_user_id) {
      return Response.json({ error: "Invalid webhook data" }, { status: 400 });
    }

    // Verify webhook signature (in production, you should verify the webhook signature)
    // const signature = request.headers.get('authorization');
    // if (!verifyWebhookSignature(signature, body)) {
    //   return Response.json({ error: "Invalid signature" }, { status: 401 });
    // }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for webhook
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // No-op for webhooks
          },
        },
      }
    );

    const userId = event.app_user_id;
    const eventType = event.type;

    console.log(
      `Processing RevenueCat webhook: ${eventType} for user ${userId}`
    );

    switch (eventType) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "PRODUCT_CHANGE":
        await handleSubscriptionActivation(supabase, event);
        break;

      case "CANCELLATION":
        await handleSubscriptionCancellation(supabase, event);
        break;

      case "EXPIRATION":
        await handleSubscriptionExpiration(supabase, event);
        break;

      case "BILLING_ISSUE":
        await handleBillingIssue(supabase, event);
        break;

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleSubscriptionActivation(supabase: any, event: any) {
  const userId = event.app_user_id;
  const productId = event.product_id;
  const expirationDate = new Date(event.expiration_at_ms);

  // Determine tier from product ID
  let tier = "free";
  if (productId.includes("pro")) {
    tier = "pro";
  } else if (productId.includes("agency")) {
    tier = "agency";
  }

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      plan: tier,
      status: "active",
      current_period_end: expirationDate.toISOString(),
      cancel_at: null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    console.error("Failed to update subscription:", error);
    throw error;
  }

  console.log(`Subscription activated for user ${userId}: ${tier}`);
}

async function handleSubscriptionCancellation(supabase: any, event: any) {
  const userId = event.app_user_id;
  const expirationDate = new Date(event.expiration_at_ms);

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancel_at: expirationDate.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to cancel subscription:", error);
    throw error;
  }

  console.log(`Subscription cancelled for user ${userId}`);
}

async function handleSubscriptionExpiration(supabase: any, event: any) {
  const userId = event.app_user_id;

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "inactive",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to expire subscription:", error);
    throw error;
  }

  console.log(`Subscription expired for user ${userId}`);
}

async function handleBillingIssue(supabase: any, event: any) {
  const userId = event.app_user_id;

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to update billing issue:", error);
    throw error;
  }

  console.log(`Billing issue for user ${userId}`);
}