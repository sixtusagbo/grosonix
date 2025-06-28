"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PricingCard } from "./PricingCard";
import { REVENUECAT_CONFIG } from "@/lib/revenuecat/config";
import { revenueCatService } from "@/lib/revenuecat/service";
import { getCurrentUser } from "@/lib/auth";
import { X } from "lucide-react";
import { toast } from "sonner";

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  currentTier?: "free" | "pro" | "agency";
  highlightTier?: "pro" | "agency";
  onSubscriptionSuccess?: () => void;
}

export function Paywall({
  isOpen,
  onClose,
  title = "Upgrade Your Plan",
  description = "Choose the perfect plan for your social media growth needs",
  currentTier = "free",
  highlightTier = "pro",
  onSubscriptionSuccess,
}: PaywallProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleSelectPlan = async (
    tier: string,
    billing: "monthly" | "yearly"
  ) => {
    if (tier === "free") {
      onClose();
      return;
    }

    setLoading(true);
    setSelectedTier(tier);

    try {
      // Initialize RevenueCat if not already done
      const user = await getCurrentUser();
      if (!user) {
        toast.error("Please log in to continue");
        return;
      }

      await revenueCatService.initialize(user.id);

      // Determine product ID based on tier and billing
      let productId: string;
      if (tier === "pro") {
        productId =
          billing === "yearly"
            ? REVENUECAT_CONFIG.products.pro_yearly
            : REVENUECAT_CONFIG.products.pro_monthly;
      } else if (tier === "agency") {
        productId =
          billing === "yearly"
            ? REVENUECAT_CONFIG.products.agency_yearly
            : REVENUECAT_CONFIG.products.agency_monthly;
      } else {
        throw new Error("Invalid tier selected");
      }

      // Attempt purchase
      const result = await revenueCatService.purchaseSubscription(productId);

      if (result.success) {
        toast.success("Subscription activated successfully!");
        onSubscriptionSuccess?.();
        onClose();
      } else {
        toast.error(result.error || "Failed to process subscription");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to process subscription. Please try again.");
    } finally {
      setLoading(false);
      setSelectedTier(null);
    }
  };

  const handleStartFreeTrial = async () => {
    setLoading(true);
    setSelectedTier("pro");

    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error("Please log in to continue");
        return;
      }

      try {
        // Try RevenueCat first
        await revenueCatService.initialize(user.id);
        const result = await revenueCatService.startFreeTrial();

        if (result.success) {
          toast.success("Free trial started! Enjoy 7 days of Pro features.");
          onSubscriptionSuccess?.();
          onClose();
          return;
        }
      } catch (revenueCatError) {
        console.warn(
          "RevenueCat failed, using database fallback:",
          revenueCatError
        );
      }

      // Fallback: Start trial directly in database
      const { trialManager } = await import("@/lib/subscription/trial-manager");

      // Check eligibility
      const eligibility = await trialManager.checkTrialEligibility(user.id);
      if (!eligibility.eligible) {
        toast.error(eligibility.reason || "Not eligible for free trial");
        return;
      }

      // Start trial
      const trialResult = await trialManager.startFreeTrial(user.id);

      if (trialResult.success) {
        toast.success("Free trial started! Enjoy 7 days of Pro features.");
        onSubscriptionSuccess?.();
        onClose();
      } else {
        toast.error(trialResult.error || "Failed to start free trial");
      }
    } catch (error) {
      console.error("Free trial error:", error);
      toast.error("Failed to start free trial. Please try again.");
    } finally {
      setLoading(false);
      setSelectedTier(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            {title}
          </DialogTitle>

          <p className="text-text-secondary text-center mb-6">{description}</p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span
              className={`text-sm ${
                billingPeriod === "monthly"
                  ? "text-text-primary font-medium"
                  : "text-text-secondary"
              }`}>
              Monthly
            </span>
            <Switch
              checked={billingPeriod === "yearly"}
              onCheckedChange={(checked) =>
                setBillingPeriod(checked ? "yearly" : "monthly")
              }
            />
            <span
              className={`text-sm ${
                billingPeriod === "yearly"
                  ? "text-text-primary font-medium"
                  : "text-text-secondary"
              }`}>
              Yearly
            </span>
            {billingPeriod === "yearly" && (
              <span className="text-xs bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-full">
                Save up to 17%
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-8">
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PricingCard
              tier="free"
              tierData={REVENUECAT_CONFIG.tiers.free}
              isCurrentPlan={currentTier === "free"}
              onSelectPlan={handleSelectPlan}
              loading={loading && selectedTier === "free"}
              billingPeriod={billingPeriod}
            />

            <PricingCard
              tier="pro"
              tierData={REVENUECAT_CONFIG.tiers.pro}
              isCurrentPlan={currentTier === "pro"}
              isPopular={highlightTier === "pro"}
              onSelectPlan={handleSelectPlan}
              loading={loading && selectedTier === "pro"}
              billingPeriod={billingPeriod}
            />

            <PricingCard
              tier="agency"
              tierData={REVENUECAT_CONFIG.tiers.agency}
              isCurrentPlan={currentTier === "agency"}
              isPopular={highlightTier === "agency"}
              onSelectPlan={handleSelectPlan}
              loading={loading && selectedTier === "agency"}
              billingPeriod={billingPeriod}
            />
          </div>

          {/* Free Trial CTA */}
          {currentTier === "free" && (
            <div className="text-center pt-6 border-t border-border/30">
              <h3 className="text-lg font-semibold mb-2">
                Try Pro Free for 7 Days
              </h3>
              <p className="text-text-secondary text-sm mb-4">
                No commitment • Cancel anytime • Full access to Pro features
              </p>
              <Button
                onClick={handleStartFreeTrial}
                disabled={loading}
                className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white px-8 py-3">
                {loading && selectedTier === "pro" ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Starting Trial...
                  </div>
                ) : (
                  "Start Free Trial"
                )}
              </Button>
            </div>
          )}

          {/* Trust Indicators */}
          <div className="text-center text-xs text-text-secondary pt-4 border-t border-border/30">
            <p>🔒 Secure payment • 💳 Cancel anytime • 📞 24/7 support</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
