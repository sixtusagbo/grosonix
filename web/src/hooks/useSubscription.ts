"use client";

import { useState, useEffect, useCallback } from "react";
import {
  revenueCatService,
  SubscriptionStatus,
} from "@/lib/revenuecat/service";
import { getCurrentUser } from "@/lib/auth";

export interface UseSubscriptionReturn {
  subscription: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  showPaywall: (reason?: string) => void;
  hidePaywall: () => void;
  isPaywallOpen: boolean;
  paywallReason: string | null;
  checkFeatureAccess: (
    feature:
      | "content_generation"
      | "cross_platform_adaptation"
      | "style_analysis"
  ) => Promise<boolean>;
  changeSubscription: (productId: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string | null>(null);

  const refreshSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await getCurrentUser();
      if (!user) {
        setSubscription({
          isActive: false,
          tier: "free",
        });
        return;
      }

      try {
        // Try to initialize RevenueCat and get subscription status
        await revenueCatService.initialize(user.id);
        const status = await revenueCatService.getSubscriptionStatus();
        setSubscription(status);
      } catch (revenueCatError) {
        console.warn(
          "RevenueCat failed, checking database fallback:",
          revenueCatError
        );

        // Fallback: Check database for subscription status
        const { trialManager } = await import(
          "@/lib/subscription/trial-manager"
        );
        const trialStatus = await trialManager.getTrialStatus(user.id);

        if (trialStatus.isInTrial) {
          setSubscription({
            isActive: true,
            tier: "pro",
            isInFreeTrial: true,
            expirationDate: trialStatus.trialEndDate,
            willRenew: false,
          });
        } else {
          // Default to free tier
          setSubscription({
            isActive: false,
            tier: "free",
          });
        }
      }
    } catch (err) {
      console.error("Failed to refresh subscription:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load subscription"
      );

      // Fallback to free tier on error
      setSubscription({
        isActive: false,
        tier: "free",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const showPaywall = useCallback((reason?: string) => {
    setPaywallReason(reason || null);
    setIsPaywallOpen(true);
  }, []);

  const hidePaywall = useCallback(() => {
    setIsPaywallOpen(false);
    setPaywallReason(null);
  }, []);

  const checkFeatureAccess = useCallback(
    async (
      feature:
        | "content_generation"
        | "cross_platform_adaptation"
        | "style_analysis"
    ): Promise<boolean> => {
      if (!subscription) {
        return false;
      }

      // Pro and Agency tiers have access to all features
      if (subscription.tier === "pro" || subscription.tier === "agency") {
        return true;
      }

      // Free tier has limited access
      if (subscription.tier === "free") {
        switch (feature) {
          case "content_generation":
            // Check daily usage limit via API
            try {
              const response = await fetch("/api/ai/usage-stats");
              if (response.ok) {
                const data = await response.json();
                return data.remaining_generations > 0;
              }
            } catch (error) {
              console.error("Failed to check usage stats:", error);
            }
            return false;

          case "cross_platform_adaptation":
            // Free tier doesn't have access to cross-platform adaptation
            return false;

          case "style_analysis":
            // Free tier has limited style analysis
            return true;

          default:
            return false;
        }
      }

      return false;
    },
    [subscription]
  );

  const changeSubscription = useCallback(async (productId: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      // Initialize RevenueCat
      await revenueCatService.initialize(user.id);
      
      // Change subscription
      const result = await revenueCatService.changeSubscription(productId);
      
      if (result.success) {
        await refreshSubscription();
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to change subscription',
        };
      }
    } catch (error) {
      console.error('Failed to change subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }, [refreshSubscription]);

  // Initialize subscription on mount
  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  return {
    subscription,
    loading,
    error,
    refreshSubscription,
    showPaywall,
    hidePaywall,
    isPaywallOpen,
    paywallReason,
    checkFeatureAccess,
    changeSubscription,
  };
}