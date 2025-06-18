import { createBrowserClient } from "@supabase/ssr";

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  metric_type: 'followers' | 'engagement' | 'posts' | 'reach' | 'custom';
  target_value: number;
  current_value: number;
  start_value: number;
  platform: string;
  deadline: string;
  status: 'active' | 'completed' | 'paused' | 'failed';
  priority: 'low' | 'medium' | 'high';
  milestones: number[];
  achieved_milestones: number[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface GoalProgress {
  goal_id: string;
  progress_percentage: number;
  days_remaining: number;
  daily_target: number;
  current_pace: number;
  projected_completion: string;
  is_on_track: boolean;
  next_milestone: number | null;
}

export interface GoalAnalytics {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  failed_goals: number;
  average_completion_rate: number;
  goals_by_platform: Record<string, number>;
  goals_by_metric: Record<string, number>;
  upcoming_deadlines: Goal[];
}

export class GoalTracker {
  private supabase;

  constructor() {
    this.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Create a new goal
   */
  async createGoal(goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'current_value' | 'achieved_milestones'>): Promise<Goal | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_goals')
        .insert({
          ...goalData,
          current_value: goalData.start_value,
          achieved_milestones: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating goal:', error);
      return null;
    }
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(goalId: string, currentValue: number): Promise<Goal | null> {
    try {
      // Get current goal
      const { data: goal, error: fetchError } = await this.supabase
        .from('user_goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (fetchError || !goal) throw fetchError;

      // Check for milestone achievements
      const newMilestones = goal.milestones.filter(
        (milestone: number) => 
          currentValue >= milestone && 
          !goal.achieved_milestones.includes(milestone)
      );

      // Check if goal is completed
      const isCompleted = currentValue >= goal.target_value;
      const newStatus = isCompleted ? 'completed' : goal.status;

      // Update goal
      const { data, error } = await this.supabase
        .from('user_goals')
        .update({
          current_value: currentValue,
          achieved_milestones: [...goal.achieved_milestones, ...newMilestones],
          status: newStatus,
          completed_at: isCompleted ? new Date().toISOString() : goal.completed_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;

      // Log milestone achievements
      if (newMilestones.length > 0) {
        await this.logMilestoneAchievements(goalId, newMilestones);
      }

      return data;
    } catch (error) {
      console.error('Error updating goal progress:', error);
      return null;
    }
  }

  /**
   * Get user goals
   */
  async getUserGoals(userId: string, status?: Goal['status']): Promise<Goal[]> {
    try {
      let query = this.supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user goals:', error);
      return [];
    }
  }

  /**
   * Calculate goal progress
   */
  calculateProgress(goal: Goal): GoalProgress {
    const progressPercentage = Math.min(
      (goal.current_value / goal.target_value) * 100,
      100
    );

    const now = new Date();
    const deadline = new Date(goal.deadline);
    const daysRemaining = Math.max(
      Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      0
    );

    const totalDays = Math.ceil(
      (deadline.getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    const dailyTarget = daysRemaining > 0 
      ? (goal.target_value - goal.current_value) / daysRemaining
      : 0;

    const daysPassed = totalDays - daysRemaining;
    const currentPace = daysPassed > 0 
      ? (goal.current_value - goal.start_value) / daysPassed
      : 0;

    const projectedValue = goal.current_value + (currentPace * daysRemaining);
    const projectedCompletion = currentPace > 0 
      ? new Date(now.getTime() + ((goal.target_value - goal.current_value) / currentPace) * 24 * 60 * 60 * 1000)
      : deadline;

    const isOnTrack = projectedValue >= goal.target_value;

    const nextMilestone = goal.milestones
      .filter(m => m > goal.current_value)
      .sort((a, b) => a - b)[0] || null;

    return {
      goal_id: goal.id,
      progress_percentage: progressPercentage,
      days_remaining: daysRemaining,
      daily_target: dailyTarget,
      current_pace: currentPace,
      projected_completion: projectedCompletion.toISOString(),
      is_on_track: isOnTrack,
      next_milestone: nextMilestone
    };
  }

  /**
   * Get goal analytics
   */
  async getGoalAnalytics(userId: string): Promise<GoalAnalytics> {
    try {
      const goals = await this.getUserGoals(userId);
      
      const analytics: GoalAnalytics = {
        total_goals: goals.length,
        active_goals: goals.filter(g => g.status === 'active').length,
        completed_goals: goals.filter(g => g.status === 'completed').length,
        failed_goals: goals.filter(g => g.status === 'failed').length,
        average_completion_rate: 0,
        goals_by_platform: {},
        goals_by_metric: {},
        upcoming_deadlines: []
      };

      // Calculate completion rate
      if (goals.length > 0) {
        analytics.average_completion_rate = 
          (analytics.completed_goals / goals.length) * 100;
      }

      // Group by platform and metric
      goals.forEach(goal => {
        analytics.goals_by_platform[goal.platform] = 
          (analytics.goals_by_platform[goal.platform] || 0) + 1;
        
        analytics.goals_by_metric[goal.metric_type] = 
          (analytics.goals_by_metric[goal.metric_type] || 0) + 1;
      });

      // Get upcoming deadlines (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      analytics.upcoming_deadlines = goals
        .filter(g => 
          g.status === 'active' && 
          new Date(g.deadline) <= nextWeek
        )
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

      return analytics;
    } catch (error) {
      console.error('Error calculating goal analytics:', error);
      return {
        total_goals: 0,
        active_goals: 0,
        completed_goals: 0,
        failed_goals: 0,
        average_completion_rate: 0,
        goals_by_platform: {},
        goals_by_metric: {},
        upcoming_deadlines: []
      };
    }
  }

  /**
   * Log milestone achievements
   */
  private async logMilestoneAchievements(goalId: string, milestones: number[]): Promise<void> {
    try {
      const achievements = milestones.map(milestone => ({
        goal_id: goalId,
        milestone_value: milestone,
        achieved_at: new Date().toISOString()
      }));

      await this.supabase
        .from('goal_achievements')
        .insert(achievements);
    } catch (error) {
      console.error('Error logging milestone achievements:', error);
    }
  }

  /**
   * Delete a goal
   */
  async deleteGoal(goalId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting goal:', error);
      return false;
    }
  }

  /**
   * Update goal status
   */
  async updateGoalStatus(goalId: string, status: Goal['status']): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_goals')
        .update({ 
          status, 
          updated_at: new Date().toISOString(),
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', goalId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating goal status:', error);
      return false;
    }
  }
}
