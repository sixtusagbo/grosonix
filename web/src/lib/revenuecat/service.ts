import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from "@revenuecat/purchases-js";
import { REVENUECAT_CONFIG } from "./config";
import { createBrowserClient } from "@supabase/ssr";

export interface SubscriptionResult {
  success: boolean;
  error?: string;
  customerInfo?: CustomerInfo;
}

export interface SubscriptionStatus {
  isActive: boolean;
  tier: "free" | "pro" | "agency";
  expirationDate?: string;
  isInFreeTrial?: boolean;
  willRenew?: boolean;
}

class RevenueCatService {
  private initialized = false;
  private supabase;

  constructor() {
    this.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Initialize RevenueCat with user ID
   */
  async initialize(userId: string): Promise<void> {
    if (this.initialized) return;

    try {
      await Purchases.configure({
        apiKey: REVENUECAT_CONFIG.apiKey,
        appUserId: userId,
      });

      this.initialized = true;
      console.log("RevenueCat initialized successfully");
    } catch (error) {
      console.error("Failed to initialize RevenueCat:", error);
      throw new Error("Failed to initialize payment system");
    }
  }

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();

      // Check for active subscriptions
      const activeSubscriptions = customerInfo.activeSubscriptions;

      if (activeSubscriptions.length === 0) {
        return {
          isActive: false,
          tier: "free",
        };
      }

      // Determine tier based on active subscription
      let tier: "free" | "pro" | "agency" = "free";
      let expirationDate: string | undefined;
      let isInFreeTrial = false;
      let willRenew = true;

      for (const subscription of activeSubscriptions) {
        const entitlement = customerInfo.entitlements.active[subscription];
        if (entitlement) {
          // Determine tier from product identifier
          if (entitlement.productIdentifier.includes("pro")) {
            tier = "pro";
          } else if (entitlement.productIdentifier.includes("agency")) {
            tier = "agency";
          }

          expirationDate = entitlement.expirationDate;
          isInFreeTrial = entitlement.isInFreeTrial;
          willRenew = entitlement.willRenew;
          break;
        }
      }

      return {
        isActive: true,
        tier,
        expirationDate,
        isInFreeTrial,
        willRenew,
      };
    } catch (error) {
      console.error("Failed to get subscription status:", error);
      return {
        isActive: false,
        tier: "free",
      };
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(productId: string): Promise<SubscriptionResult> {
    try {
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;

      if (!currentOffering) {
        return {
          success: false,
          error: "No subscription offerings available",
        };
      }

      // Find the package with the specified product ID
      const packageToPurchase = currentOffering.availablePackages.find(
        (pkg: PurchasesPackage) => pkg.product.identifier === productId
      );

      if (!packageToPurchase) {
        return {
          success: false,
          error: "Subscription plan not found",
        };
      }

      const { customerInfo } = await Purchases.purchasePackage(
        packageToPurchase
      );

      // Update subscription in database
      await this.updateSubscriptionInDatabase(customerInfo);

      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      console.error("Purchase failed:", error);

      // Handle user cancellation
      if (error.userCancelled) {
        return {
          success: false,
          error: "Purchase cancelled",
        };
      }

      return {
        success: false,
        error: error.message || "Purchase failed",
      };
    }
  }

  /**
   * Start free trial
   */
  async startFreeTrial(): Promise<SubscriptionResult> {
    try {
      // Import trial manager dynamically to avoid circular dependencies
      const { trialManager } = await import("@/lib/subscription/trial-manager");

      // Get current user ID
      const customerInfo = await Purchases.getCustomerInfo();
      const userId = customerInfo.originalAppUserId;

      if (!userId) {
        return {
          success: false,
          error: "User ID not found",
        };
      }

      // Check trial eligibility
      const eligibility = await trialManager.checkTrialEligibility(userId);
      if (!eligibility.eligible) {
        return {
          success: false,
          error: eligibility.reason || "Not eligible for free trial",
        };
      }

      // Start trial in database
      const result = await trialManager.startFreeTrial(userId);

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Failed to start trial",
        };
      }

      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      console.error("Free trial failed:", error);

      return {
        success: false,
        error: error.message || "Failed to start free trial",
      };
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<SubscriptionResult> {
    try {
      const customerInfo = await Purchases.restorePurchases();

      // Update subscription in database
      await this.updateSubscriptionInDatabase(customerInfo);

      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      console.error("Restore failed:", error);
      return {
        success: false,
        error: error.message || "Failed to restore purchases",
      };
    }
  }

  /**
   * Update subscription information in Supabase
   */
  private async updateSubscriptionInDatabase(
    customerInfo: CustomerInfo
  ): Promise<void> {
    try {
      const status = await this.getSubscriptionStatus();

      const { error } = await this.supabase.from("subscriptions").upsert(
        {
          user_id: customerInfo.originalAppUserId,
          plan: status.tier,
          status: status.isActive ? "active" : "inactive",
          current_period_end: status.expirationDate || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) {
        console.error("Failed to update subscription in database:", error);
      }
    } catch (error) {
      console.error("Database update error:", error);
    }
  }

  /**
   * Get available offerings
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error("Failed to get offerings:", error);
      return null;
    }
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();
