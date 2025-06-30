import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Goal,
  GoalFilters,
  CreateGoalRequest,
  UpdateGoalRequest,
  UpdateProgressRequest,
  GoalsResponse,
  GoalResponse,
  ProgressResponse,
  AnalyticsResponse,
  GoalAnalytics,
  ErrorResponse
} from '@/types/goals';

export function useGoals(initialFilters?: GoalFilters) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GoalFilters>(initialFilters || {});

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.platform) params.append('platform', filters.platform);
      if (filters.goal_type) params.append('goal_type', filters.goal_type);

      const response = await fetch(`/api/goals?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponse;
        throw new Error(errorData.error || errorData.message || 'Failed to fetch goals');
      }

      const successData = data as GoalsResponse;
      setGoals(successData.goals);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch goals';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createGoal = useCallback(async (goalData: CreateGoalRequest): Promise<Goal | null> => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponse;
        throw new Error(errorData.error || errorData.message || 'Failed to create goal');
      }

      const successData = data as GoalResponse;
      setGoals(prev => [successData.goal, ...prev]);
      toast.success('Goal created successfully!');
      return successData.goal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create goal';
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const updateGoal = useCallback(async (goalId: string, updates: UpdateGoalRequest): Promise<Goal | null> => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponse;
        throw new Error(errorData.error || errorData.message || 'Failed to update goal');
      }

      const successData = data as GoalResponse;
      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? { ...goal, ...successData.goal } : goal
      ));
      
      toast.success('Goal updated successfully!');
      return successData.goal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update goal';
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const deleteGoal = useCallback(async (goalId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponse;
        throw new Error(errorData.error || errorData.message || 'Failed to delete goal');
      }

      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      toast.success('Goal deleted successfully!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete goal';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const updateProgress = useCallback(async (
    goalId: string, 
    progressData: UpdateProgressRequest
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/goals/${goalId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponse;
        throw new Error(errorData.error || errorData.message || 'Failed to update progress');
      }

      const successData = data as ProgressResponse;

      // Update the goal in the local state
      setGoals(prev => prev.map(goal => {
        if (goal.id === goalId) {
          return {
            ...goal,
            current_value: progressData.new_value,
            progress_percentage: successData.new_progress_percentage,
            status: successData.goal_completed ? 'completed' : goal.status,
            completed_at: successData.goal_completed ? new Date().toISOString() : goal.completed_at,
          };
        }
        return goal;
      }));

      // Show appropriate success message
      if (successData.goal_completed) {
        toast.success('🎉 Congratulations! Goal completed!');
      } else if (successData.achieved_milestones.length > 0) {
        toast.success(`🎯 Milestone achieved! ${successData.achieved_milestones.length} milestone(s) reached.`);
      } else {
        toast.success('Progress updated successfully!');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update progress';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const updateFilters = useCallback((newFilters: Partial<GoalFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Filter goals locally for search
  const filteredGoals = goals.filter(goal => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        goal.title.toLowerCase().includes(searchLower) ||
        goal.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Calculate summary statistics
  const summary = {
    total: filteredGoals.length,
    active: filteredGoals.filter(g => g.status === 'active').length,
    completed: filteredGoals.filter(g => g.status === 'completed').length,
    overdue: filteredGoals.filter(g => g.is_overdue).length,
  };

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals: filteredGoals,
    loading,
    error,
    summary,
    filters,
    createGoal,
    updateGoal,
    deleteGoal,
    updateProgress,
    updateFilters,
    clearFilters,
    refetch: fetchGoals,
  };
}

export function useGoalAnalytics(timeframe: number = 30, platform?: string) {
  const [analytics, setAnalytics] = useState<GoalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('timeframe', timeframe.toString());
      if (platform) params.append('platform', platform);

      const response = await fetch(`/api/goals/analytics?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponse;
        throw new Error(errorData.error || errorData.message || 'Failed to fetch analytics');
      }

      const successData = data as AnalyticsResponse;
      setAnalytics(successData.analytics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [timeframe, platform]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}

export function useGoal(goalId: string) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoal = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/goals/${goalId}`);
      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponse;
        throw new Error(errorData.error || errorData.message || 'Failed to fetch goal');
      }

      const successData = data as GoalResponse;
      setGoal(successData.goal);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch goal';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    if (goalId) {
      fetchGoal();
    }
  }, [fetchGoal, goalId]);

  return {
    goal,
    loading,
    error,
    refetch: fetchGoal,
  };
}