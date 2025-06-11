import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface UsageLimits {
  content_generation: number;
  style_analysis: number;
  cross_platform_adaptation: number;
}

export interface UsageQuota {
  feature_type: string;
  used: number;
  limit: number;
  remaining: number;
  resets_at: string;
}

export class RateLimiter {
  private supabase;

  constructor() {
    const cookieStore = cookies();
    this.supabase = createServerClient(
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
  }

  static getUsageLimitsForTier(tier: "free" | "pro" | "agency"): UsageLimits {
    switch (tier) {
      case "free":
        return {
          content_generation: 5,
          style_analysis: 1,
          cross_platform_adaptation: 0, // Pro feature
        };
      case "pro":
        return {
          content_generation: -1, // Unlimited
          style_analysis: -1, // Unlimited
          cross_platform_adaptation: -1, // Unlimited
        };
      case "agency":
        return {
          content_generation: -1, // Unlimited
          style_analysis: -1, // Unlimited
          cross_platform_adaptation: -1, // Unlimited
        };
      default:
        return {
          content_generation: 5,
          style_analysis: 1,
          cross_platform_adaptation: 0,
        };
    }
  }

  async checkUsageQuota(
    userId: string,
    featureType: keyof UsageLimits,
    subscriptionTier: "free" | "pro" | "agency" = "free"
  ): Promise<{ allowed: boolean; quota: UsageQuota }> {
    const limits = RateLimiter.getUsageLimitsForTier(subscriptionTier);
    const limit = limits[featureType];

    // Unlimited for pro/agency tiers
    if (limit === -1) {
      return {
        allowed: true,
        quota: {
          feature_type: featureType,
          used: 0,
          limit: -1,
          remaining: -1,
          resets_at: this.getNextResetTime(),
        },
      };
    }

    // TEMPORARY: Skip database check due to function schema issues
    // TODO: Fix database function and re-enable proper usage tracking
    console.log(
      `[TEMP] Bypassing usage check for ${featureType} - user: ${userId}`
    );
    const currentUsage = 0; // Temporary: allow all requests

    /*
    // Original database check - re-enable after fixing function
    const { data: usage, error } = await this.supabase.rpc(
      "get_daily_ai_usage",
      {
        p_date: new Date().toISOString().split("T")[0],
        p_feature_type: featureType,
        p_user_id: userId,
      }
    );

    if (error) {
      console.error("Error checking usage quota:", error);
      throw new Error("Failed to check usage quota");
    }

    const currentUsage = usage || 0;
    */
    const remaining = Math.max(0, limit - currentUsage);

    return {
      allowed: currentUsage < limit,
      quota: {
        feature_type: featureType,
        used: currentUsage,
        limit,
        remaining,
        resets_at: this.getNextResetTime(),
      },
    };
  }

  async incrementUsage(
    userId: string,
    featureType: keyof UsageLimits,
    increment: number = 1
  ): Promise<number> {
    // TEMPORARY: Skip database increment due to function schema issues
    console.log(
      `[TEMP] Bypassing usage increment for ${featureType} - user: ${userId}, increment: ${increment}`
    );
    return 0; // Temporary: return 0 usage count

    /*
    // Original database increment - re-enable after fixing function
    const { data: newCount, error } = await this.supabase.rpc(
      "increment_ai_usage",
      {
        p_user_id: userId,
        p_feature_type: featureType,
        p_increment: increment,
      }
    );

    if (error) {
      console.error("Error incrementing usage:", error);
      throw new Error("Failed to increment usage");
    }

    return newCount || 0;
    */
  }

  async getAllUsageQuotas(
    userId: string,
    subscriptionTier: "free" | "pro" | "agency" = "free"
  ): Promise<UsageQuota[]> {
    const limits = RateLimiter.getUsageLimitsForTier(subscriptionTier);
    const quotas: UsageQuota[] = [];

    for (const [featureType, limit] of Object.entries(limits)) {
      const { quota } = await this.checkUsageQuota(
        userId,
        featureType as keyof UsageLimits,
        subscriptionTier
      );
      quotas.push(quota);
    }

    return quotas;
  }

  async getUserSubscriptionTier(
    userId: string
  ): Promise<"free" | "pro" | "agency"> {
    const { data: subscription, error } = await this.supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (error || !subscription) {
      return "free";
    }

    return subscription.plan as "free" | "pro" | "agency";
  }

  private getNextResetTime(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  async getUsageStats(userId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: stats, error } = await this.supabase
      .from("ai_usage_tracking")
      .select("feature_type, usage_count, date_used")
      .eq("user_id", userId)
      .gte("date_used", startDate.toISOString().split("T")[0])
      .order("date_used", { ascending: true });

    if (error) {
      console.error("Error fetching usage stats:", error);
      return [];
    }

    return stats || [];
  }

  async resetDailyUsage(userId: string): Promise<void> {
    // This would typically be called by a cron job at midnight
    // For now, it's here for manual testing/admin purposes
    const { error } = await this.supabase
      .from("ai_usage_tracking")
      .delete()
      .eq("user_id", userId)
      .eq("date_used", new Date().toISOString().split("T")[0]);

    if (error) {
      console.error("Error resetting daily usage:", error);
      throw new Error("Failed to reset daily usage");
    }
  }

  // Helper method to check if user can perform an action
  async canPerformAction(
    userId: string,
    featureType: keyof UsageLimits,
    subscriptionTier?: "free" | "pro" | "agency"
  ): Promise<boolean> {
    if (!subscriptionTier) {
      subscriptionTier = await this.getUserSubscriptionTier(userId);
    }

    const { allowed } = await this.checkUsageQuota(
      userId,
      featureType,
      subscriptionTier
    );
    return allowed;
  }

  // Get upgrade suggestions based on usage patterns
  async getUpgradeSuggestions(userId: string): Promise<{
    shouldUpgrade: boolean;
    reasons: string[];
    recommendedTier: "pro" | "agency";
  }> {
    const currentTier = await this.getUserSubscriptionTier(userId);

    if (currentTier !== "free") {
      return {
        shouldUpgrade: false,
        reasons: [],
        recommendedTier: "pro",
      };
    }

    const stats = await this.getUsageStats(userId, 7);
    const reasons: string[] = [];

    // Check if user is hitting limits frequently
    const contentGenerationUsage = stats.filter(
      (s) => s.feature_type === "content_generation"
    );
    const avgDailyUsage =
      contentGenerationUsage.reduce((sum, s) => sum + s.usage_count, 0) / 7;

    if (avgDailyUsage >= 4) {
      reasons.push(
        "You're consistently using most of your daily content generation quota"
      );
    }

    const styleAnalysisUsage = stats.filter(
      (s) => s.feature_type === "style_analysis"
    );
    if (styleAnalysisUsage.length > 0) {
      reasons.push(
        "You've used your style analysis feature - get unlimited access with Pro"
      );
    }

    const adaptationAttempts = stats.filter(
      (s) => s.feature_type === "cross_platform_adaptation"
    );
    if (adaptationAttempts.length > 0) {
      reasons.push(
        "Cross-platform adaptation is only available in Pro and Agency tiers"
      );
    }

    return {
      shouldUpgrade: reasons.length > 0,
      reasons,
      recommendedTier: "pro",
    };
  }
}

export default RateLimiter;
