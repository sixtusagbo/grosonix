import { Goal, GoalProgress } from '@/types/goals';

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
  /**
   * Calculate goal progress
   */
  calculateProgress(goal: Goal): GoalProgress {
    const progressPercentage = Math.min(
      (goal.current_value / goal.target_value) * 100,
      100
    );

    const now = new Date();
    const deadline = new Date(goal.target_date);
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
      ? (goal.current_value - (goal.start_value || 0)) / daysPassed
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
}