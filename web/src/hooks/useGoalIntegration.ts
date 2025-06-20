import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { GoalType, Platform } from '@/types/goals';

export interface GoalSuggestion {
  suggested_target: number;
  current_value: number;
}

export function useGoalIntegration() {
  const [syncing, setSyncing] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const syncGoals = useCallback(async (): Promise<boolean> => {
    try {
      setSyncing(true);
      
      const response = await fetch('/api/goals/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync goals');
      }

      toast.success('Goals synchronized with your social media metrics!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync goals';
      toast.error(errorMessage);
      return false;
    } finally {
      setSyncing(false);
    }
  }, []);

  const suggestGoal = useCallback(async (
    goalType: GoalType,
    platform: Platform,
    targetMultiplier: number = 1.5
  ): Promise<GoalSuggestion | null> => {
    try {
      setSuggesting(true);

      // Fetch social media metrics directly
      const response = await fetch('/api/social/metrics');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch social media metrics');
      }

      if (!data.metrics || !Array.isArray(data.metrics) || data.metrics.length === 0) {
        throw new Error('No social media accounts connected. Please connect your accounts first.');
      }

      // Find relevant metrics
      let relevantMetrics;
      if (platform === 'all') {
        // Aggregate all platforms
        relevantMetrics = data.metrics.reduce((acc: any, metric: any) => ({
          followers_count: (acc.followers_count || 0) + metric.followers_count,
          following_count: (acc.following_count || 0) + metric.following_count,
          posts_count: (acc.posts_count || 0) + metric.posts_count,
          engagement_rate: acc.engagement_rate
            ? (acc.engagement_rate + metric.engagement_rate) / 2
            : metric.engagement_rate,
        }), {});
      } else {
        relevantMetrics = data.metrics.find((m: any) => m.platform === platform);
      }

      if (!relevantMetrics) {
        throw new Error(`No metrics found for ${platform === 'all' ? 'any platform' : platform}. Please connect your ${platform} account.`);
      }

      // Extract current value based on goal type
      let currentValue: number;
      switch (goalType) {
        case 'followers':
          currentValue = relevantMetrics.followers_count;
          break;
        case 'engagement_rate':
          currentValue = relevantMetrics.engagement_rate;
          break;
        case 'posts_count':
          currentValue = relevantMetrics.posts_count;
          break;
        default:
          throw new Error(`Goal type "${goalType}" is not supported for automatic suggestions. Please enter the target value manually.`);
      }

      if (!currentValue || currentValue === 0) {
        throw new Error(`Current ${goalType} value is 0. Please ensure your account has some activity before creating goals.`);
      }

      const suggestedTarget = Math.ceil(currentValue * targetMultiplier);

      return {
        suggested_target: suggestedTarget,
        current_value: currentValue
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get goal suggestion';
      toast.error(errorMessage);
      return null;
    } finally {
      setSuggesting(false);
    }
  }, []);

  return {
    syncGoals,
    suggestGoal,
    syncing,
    suggesting,
  };
}

// Hook for automatic goal sync
export function useAutoGoalSync(intervalMinutes: number = 60) {
  const { syncGoals } = useGoalIntegration();

  const startAutoSync = useCallback(() => {
    // Initial sync
    syncGoals();

    // Set up interval for periodic sync
    const interval = setInterval(() => {
      syncGoals();
    }, intervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [syncGoals, intervalMinutes]);

  return { startAutoSync };
}
