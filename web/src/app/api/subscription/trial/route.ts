import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { trialManager } from "@/lib/subscription/trial-manager";

/**
 * @swagger
 * /api/subscription/trial:
 *   get:
 *     summary: Get trial status for user
 *     description: Returns the current trial status and eligibility for the authenticated user
 *     tags:
 *       - Subscription
 *     responses:
 *       200:
 *         description: Trial status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 trial:
 *                   type: object
 *                   properties:
 *                     isInTrial:
 *                       type: boolean
 *                     trialStartDate:
 *                       type: string
 *                       format: date-time
 *                     trialEndDate:
 *                       type: string
 *                       format: date-time
 *                     daysRemaining:
 *                       type: number
 *                     isEligible:
 *                       type: boolean
 *                     hasTrialExpired:
 *                       type: boolean
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

    const trialStatus = await trialManager.getTrialStatus(user.id);

    return Response.json({
      success: true,
      trial: trialStatus,
    });

  } catch (error) {
    console.error("Trial status error:", error);
    return Response.json(
      { error: "Internal server error", message: "Failed to get trial status" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/subscription/trial:
 *   post:
 *     summary: Start or manage free trial
 *     description: Start a free trial or perform trial management actions
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
 *                 enum: [start, cancel, convert]
 *               plan:
 *                 type: string
 *                 enum: [pro, agency]
 *                 description: Required for convert action
 *               billingPeriod:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 description: Required for convert action
 *             required:
 *               - action
 *     responses:
 *       200:
 *         description: Trial action completed successfully
 *       400:
 *         description: Invalid request or action not allowed
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
    const { action, plan, billingPeriod } = body;

    if (!action || !['start', 'cancel', 'convert'].includes(action)) {
      return Response.json(
        { error: "Invalid action", message: "Action must be 'start', 'cancel', or 'convert'" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'start':
        result = await trialManager.startFreeTrial(user.id);
        break;

      case 'cancel':
        result = await trialManager.cancelTrial(user.id);
        break;

      case 'convert':
        if (!plan || !billingPeriod) {
          return Response.json(
            { error: "Missing parameters", message: "Plan and billing period required for conversion" },
            { status: 400 }
          );
        }
        
        if (!['pro', 'agency'].includes(plan)) {
          return Response.json(
            { error: "Invalid plan", message: "Plan must be 'pro' or 'agency'" },
            { status: 400 }
          );
        }
        
        if (!['monthly', 'yearly'].includes(billingPeriod)) {
          return Response.json(
            { error: "Invalid billing period", message: "Billing period must be 'monthly' or 'yearly'" },
            { status: 400 }
          );
        }

        result = await trialManager.convertTrialToPaid(user.id, plan, billingPeriod);
        break;

      default:
        return Response.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    if (!result.success) {
      return Response.json(
        { error: "Action failed", message: result.error },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      message: `Trial ${action} completed successfully`,
    });

  } catch (error) {
    console.error("Trial management error:", error);
    return Response.json(
      { error: "Internal server error", message: "Failed to manage trial" },
      { status: 500 }
    );
  }
}
