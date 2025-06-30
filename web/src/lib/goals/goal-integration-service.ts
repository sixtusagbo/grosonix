import { Goal, GoalType, Platform } from '@/types/goals';
import { SupabaseClient } from '@supabase/supabase-js';

export interface SocialMetrics {
  platform: Platform;
  followers_count: number;
  following_count: number;
  posts_count: number;
  engagement_rate: number;
  growth_rate?: number;
  last_updated: string;
}

export class GoalIntegrationService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Update goal progress based on current social media metrics
   */
  async updateGoalProgressFromMetrics(userId: string, metrics: SocialMetrics[]): Promise<void> {
    try {
      // Get all active goals for the user
      const { data: goals, error: goalsError } = await this.supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (goalsError) {
        console.error('Error fetching goals:', goalsError);
        return;
      }

      if (!goals || goals.length === 0) {
        return;
      }

      // Process each goal
      for (const goal of goals) {
        await this.updateSingleGoalProgress(goal, metrics);
      }
    } catch (error) {
      console.error('Error updating goal progress from metrics:', error);
    }
  }

  /**
   * Update a single goal's progress based on metrics
   */
  private async updateSingleGoalProgress(goal: Goal, metrics: SocialMetrics[]): Promise<void> {
    try {
      const relevantMetrics = this.getRelevantMetrics(goal, metrics);
      if (!relevantMetrics) {
        return;
      }

      const newValue = this.extractValueFromMetrics(goal.goal_type, relevantMetrics);
      if (newValue === null || newValue === goal.current_value) {
        return; // No change needed
      }

      // Update the goal's current value
      const { error: updateError } = await this.supabase
        .from('user_goals')
        .update({ 
          current_value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', goal.id);

      if (updateError) {
        console.error('Error updating goal current value:', updateError);
        return;
      }

      // Log the progress change
      const changeAmount = newValue - goal.current_value;
      const newProgressPercentage = goal.target_value > 0
        ? Math.min(100, (newValue / goal.target_value) * 100)
        : 0;

      const { error: progressError } = await this.supabase
        .from('goal_progress_log')
        .insert({
          goal_id: goal.id,
          previous_value: goal.current_value,
          new_value: newValue,
          change_amount: changeAmount,
          progress_percentage: newProgressPercentage,
          source: 'automatic',
          notes: `Auto-updated from ${relevantMetrics.platform} metrics`
        });

      if (progressError) {
        console.error('Error logging progress:', progressError);
      }

      // Check and update milestones
      await this.checkAndUpdateMilestones(goal.id, newValue);

      // Auto-complete goal if target reached
      if (newValue >= goal.target_value && goal.status === 'active') {
        await this.supabase
          .from('user_goals')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', goal.id);

        // Create notification for goal completion
        await this.createGoalCompletionNotification(goal);
      }
    } catch (error) {
      console.error('Error updating single goal progress:', error);
    }
  }

  /**
   * Get relevant metrics for a goal based on platform and type
   */
  private getRelevantMetrics(goal: Goal, metrics: SocialMetrics[]): SocialMetrics | null {
    if (!goal.platform || goal.platform === 'all') {
      // For 'all' platform goals, aggregate metrics from all platforms
      return this.aggregateMetrics(metrics);
    }

    // Find metrics for the specific platform
    return metrics.find(m => m.platform === goal.platform) || null;
  }

  /**
   * Aggregate metrics from all platforms
   */
  private aggregateMetrics(metrics: SocialMetrics[]): SocialMetrics | null {
    if (metrics.length === 0) return null;

    const aggregated: SocialMetrics = {
      platform: 'all',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      engagement_rate: 0,
      last_updated: new Date().toISOString()
    };

    let totalEngagementRate = 0;
    let platformCount = 0;

    for (const metric of metrics) {
      aggregated.followers_count += metric.followers_count;
      aggregated.following_count += metric.following_count;
      aggregated.posts_count += metric.posts_count;

      totalEngagementRate += metric.engagement_rate;
      platformCount++;
    }

    // Average engagement rate across platforms
    aggregated.engagement_rate = platformCount > 0 ? totalEngagementRate / platformCount : 0;

    return aggregated;
  }

  /**
   * Extract the relevant value from metrics based on goal type
   */
  private extractValueFromMetrics(goalType: GoalType, metrics: SocialMetrics): number | null {
    switch (goalType) {
      case 'followers':
        return metrics.followers_count;
      case 'engagement_rate':
        return metrics.engagement_rate;
      case 'posts_count':
        return metrics.posts_count;
      case 'likes':
      case 'comments':
      case 'shares':
      case 'impressions':
        // These metrics aren't available in the current API response
        // Return null so they need manual updates
        return null;
      default:
        return null; // Custom goals need manual updates
    }
  }

  /**
   * Check and update milestones for a goal
   */
  private async checkAndUpdateMilestones(goalId: string, currentValue: number): Promise<void> {
    try {
      const { data: milestones, error } = await this.supabase
        .from('goal_milestones')
        .select('*')
        .eq('goal_id', goalId)
        .eq('is_achieved', false)
        .lte('milestone_value', currentValue);

      if (error || !milestones || milestones.length === 0) {
        return;
      }

      // Update achieved milestones
      const { error: updateError } = await this.supabase
        .from('goal_milestones')
        .update({ 
          is_achieved: true, 
          achieved_at: new Date().toISOString() 
        })
        .in('id', milestones.map(m => m.id));

      if (updateError) {
        console.error('Error updating milestones:', updateError);
      }

      // Create notifications for achieved milestones
      for (const milestone of milestones) {
        await this.createMilestoneNotification(goalId, milestone);
      }
    } catch (error) {
      console.error('Error checking milestones:', error);
    }
  }

  /**
   * Create notification for goal completion
   */
  private async createGoalCompletionNotification(goal: Goal): Promise<void> {
    try {
      await this.supabase
        .from('in_app_notifications')
        .insert({
          user_id: goal.user_id,
          title: '🎉 Goal Completed!',
          message: `Congratulations! You've achieved your goal: "${goal.title}"`,
          type: 'success',
          action_url: `/dashboard/goals`,
          action_label: 'View Goals'
        });
    } catch (error) {
      console.error('Error creating goal completion notification:', error);
    }
  }

  /**
   * Create notification for milestone achievement
   */
  private async createMilestoneNotification(goalId: string, milestone: any): Promise<void> {
    try {
      // Get goal details
      const { data: goal } = await this.supabase
        .from('user_goals')
        .select('user_id, title')
        .eq('id', goalId)
        .single();

      if (!goal) return;

      await this.supabase
        .from('in_app_notifications')
        .insert({
          user_id: goal.user_id,
          title: '🎯 Milestone Achieved!',
          message: `You've reached ${milestone.milestone_percentage}% of your goal: "${goal.title}"`,
          type: 'success',
          action_url: `/dashboard/goals`,
          action_label: 'View Progress'
        });
    } catch (error) {
      console.error('Error creating milestone notification:', error);
    }
  }

  /**
   * Sync goals with social media metrics (to be called periodically)
   */
  async syncGoalsWithMetrics(userId: string): Promise<void> {
    try {
      // Fetch current social media metrics using the existing API
      const response = await fetch(`/api/social/metrics`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch social metrics:', response.status, response.statusText);
        return;
      }

      const data = await response.json();
      if (data.metrics && Array.isArray(data.metrics)) {
        // Convert the API response format to our expected format
        const convertedMetrics: SocialMetrics[] = data.metrics.map((metric: any) => ({
          platform: metric.platform,
          followers_count: metric.followers_count,
          following_count: metric.following_count,
          posts_count: metric.posts_count,
          engagement_rate: metric.engagement_rate,
          last_updated: metric.last_updated,
        }));

        await this.updateGoalProgressFromMetrics(userId, convertedMetrics);
      }
    } catch (error) {
      console.error('Error syncing goals with metrics:', error);
    }
  }

  /**
   * Create a goal based on current metrics (smart goal suggestion)
   */
  async suggestGoalFromMetrics(
    userId: string,
    goalType: GoalType,
    platform: Platform,
    targetMultiplier: number = 1.5
  ): Promise<{ suggested_target: number; current_value: number } | null> {
    try {
      // Fetch current social media metrics using the existing API
      const response = await fetch(`/api/social/metrics`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch social metrics for suggestion:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      if (!data.metrics || !Array.isArray(data.metrics)) {
        console.error('No metrics data available for goal suggestion');
        return null;
      }

      // Convert the API response format to our expected format
      const convertedMetrics: SocialMetrics[] = data.metrics.map((metric: any) => ({
        platform: metric.platform,
        followers_count: metric.followers_count,
        following_count: metric.following_count,
        posts_count: metric.posts_count,
        engagement_rate: metric.engagement_rate,
        last_updated: metric.last_updated,
      }));

      const relevantMetrics = platform === 'all'
        ? this.aggregateMetrics(convertedMetrics)
        : convertedMetrics.find((m: SocialMetrics) => m.platform === platform);

      if (!relevantMetrics) {
        console.error(`No metrics found for platform: ${platform}`);
        return null;
      }

      const currentValue = this.extractValueFromMetrics(goalType, relevantMetrics);
      if (currentValue === null || currentValue === 0) {
        console.error(`No current value available for goal type: ${goalType}`);
        return null;
      }

      const suggestedTarget = Math.ceil(currentValue * targetMultiplier);

      return {
        suggested_target: suggestedTarget,
        current_value: currentValue
      };
    } catch (error) {
      console.error('Error suggesting goal from metrics:', error);
      return null;
    }
  }
}