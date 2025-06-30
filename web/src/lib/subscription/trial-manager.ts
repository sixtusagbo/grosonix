import { createBrowserClient } from '@supabase/ssr';

export interface TrialStatus {
  isInTrial: boolean;
  trialStartDate?: string;
  trialEndDate?: string;
  daysRemaining?: number;
  isEligible: boolean;
  hasTrialExpired: boolean;
}

export interface TrialEligibility {
  eligible: boolean;
  reason?: string;
}

class TrialManager {
  private supabase;

  constructor() {
    this.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Check if user is eligible for free trial
   */
  async checkTrialEligibility(userId: string): Promise<TrialEligibility> {
    try {
      // Check if user has ever had a subscription or trial
      const { data: subscription, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking trial eligibility:', error);
        return { eligible: false, reason: 'Database error' };
      }

      // If no subscription record, user is eligible
      if (!subscription) {
        return { eligible: true };
      }

      // If user has had a subscription before, not eligible
      return { 
        eligible: false, 
        reason: 'User has previously had a subscription' 
      };

    } catch (error) {
      console.error('Trial eligibility check failed:', error);
      return { eligible: false, reason: 'Check failed' };
    }
  }

  /**
   * Get current trial status for user
   */
  async getTrialStatus(userId: string): Promise<TrialStatus> {
    try {
      const { data: subscription, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting trial status:', error);
        return {
          isInTrial: false,
          isEligible: false,
          hasTrialExpired: false,
        };
      }

      // No subscription record
      if (!subscription) {
        const eligibility = await this.checkTrialEligibility(userId);
        return {
          isInTrial: false,
          isEligible: eligibility.eligible,
          hasTrialExpired: false,
        };
      }

      // Check if currently in trial
      const now = new Date();
      const currentPeriodEnd = new Date(subscription.current_period_end);
      const isInTrial = subscription.status === 'active' && 
                       subscription.plan === 'pro' && 
                       currentPeriodEnd > now;

      // Calculate trial dates (assuming 7-day trial)
      let trialStartDate: string | undefined;
      let trialEndDate: string | undefined;
      let daysRemaining: number | undefined;

      if (isInTrial) {
        trialEndDate = subscription.current_period_end;
        trialStartDate = new Date(currentPeriodEnd.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();
        daysRemaining = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      const hasTrialExpired = subscription.plan === 'pro' && 
                             subscription.status === 'inactive' && 
                             currentPeriodEnd < now;

      return {
        isInTrial,
        trialStartDate,
        trialEndDate,
        daysRemaining,
        isEligible: !subscription, // Not eligible if they've had a subscription
        hasTrialExpired,
      };

    } catch (error) {
      console.error('Failed to get trial status:', error);
      return {
        isInTrial: false,
        isEligible: false,
        hasTrialExpired: false,
      };
    }
  }

  /**
   * Start free trial for user
   */
  async startFreeTrial(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check eligibility first
      const eligibility = await this.checkTrialEligibility(userId);
      if (!eligibility.eligible) {
        return {
          success: false,
          error: eligibility.reason || 'Not eligible for free trial',
        };
      }

      // Calculate trial end date (7 days from now)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      // Create subscription record for trial
      const { error } = await this.supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: 'pro',
          status: 'active',
          current_period_end: trialEndDate.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to create trial subscription:', error);
        return {
          success: false,
          error: 'Failed to start trial',
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Trial start failed:', error);
      return {
        success: false,
        error: 'Failed to start trial',
      };
    }
  }

  /**
   * Convert trial to paid subscription
   */
  async convertTrialToPaid(
    userId: string, 
    plan: 'pro' | 'agency',
    billingPeriod: 'monthly' | 'yearly'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Calculate new period end based on billing period
      const newPeriodEnd = new Date();
      if (billingPeriod === 'yearly') {
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
      } else {
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      }

      const { error } = await this.supabase
        .from('subscriptions')
        .update({
          plan,
          status: 'active',
          current_period_end: newPeriodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to convert trial:', error);
        return {
          success: false,
          error: 'Failed to convert trial',
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Trial conversion failed:', error);
      return {
        success: false,
        error: 'Failed to convert trial',
      };
    }
  }

  /**
   * Cancel trial (set to expire at end of trial period)
   */
  async cancelTrial(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancel_at: new Date().toISOString(), // Cancel immediately
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to cancel trial:', error);
        return {
          success: false,
          error: 'Failed to cancel trial',
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Trial cancellation failed:', error);
      return {
        success: false,
        error: 'Failed to cancel trial',
      };
    }
  }
}

// Export singleton instance
export const trialManager = new TrialManager();