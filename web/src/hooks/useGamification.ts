"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRewardNotifications } from '@/components/animations/RewardNotifications';
import { Goal } from '@/types/goals';

interface GamificationData {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  stats: {
    totalGoals: number;
    completedGoals: number;
    activeGoals: number;
    completionRate: number;
  };
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: string;
  isNew?: boolean;
  xpReward: number;
}

interface GamificationActions {
  triggerGoalCompletion: (goal: Goal) => void;
  triggerMilestoneAchievement: (goal: Goal, milestone: { percentage: number; value: number }) => void;
  updateStreak: (newStreak: number) => void;
  markAchievementAsSeen: (achievementId: string) => void;
  calculateXPReward: (goalType: string, targetValue: number, difficulty: 'easy' | 'medium' | 'hard') => number;
}

export function useGamification(userId?: string): {
  data: GamificationData;
  actions: GamificationActions;
  isLoading: boolean;
  showCelebration: (type: 'goal_completed' | 'milestone_achieved' | 'streak_milestone' | 'level_up', data?: any) => void;
} {
  const [data, setData] = useState<GamificationData>({
    level: 1,
    currentXP: 0,
    xpToNextLevel: 1000,
    totalXP: 0,
    currentStreak: 0,
    longestStreak: 0,
    achievements: [],
    stats: {
      totalGoals: 0,
      completedGoals: 0,
      activeGoals: 0,
      completionRate: 0
    }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [celebrationQueue, setCelebrationQueue] = useState<Array<{
    type: 'goal_completed' | 'milestone_achieved' | 'streak_milestone' | 'level_up';
    data: any;
  }>>([]);
  
  const rewardNotifications = useRewardNotifications();

  // Load gamification data
  const loadGamificationData = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      // Fetch user's gamification data
      const response = await fetch(`/api/gamification/${userId}`);
      if (response.ok) {
        const gamificationData = await response.json();
        setData(gamificationData);
      } else {
        // Initialize default data for new users
        setData(prev => ({ ...prev }));
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadGamificationData();
  }, [loadGamificationData]);

  // Calculate XP reward based on goal difficulty and type
  const calculateXPReward = useCallback((
    goalType: string, 
    targetValue: number, 
    difficulty: 'easy' | 'medium' | 'hard'
  ): number => {
    const baseXP = {
      easy: 100,
      medium: 250,
      hard: 500
    };
    
    const typeMultiplier = {
      followers: 1.2,
      engagement_rate: 1.5,
      posts_count: 1.0,
      custom: 1.3
    };
    
    const base = baseXP[difficulty];
    const multiplier = typeMultiplier[goalType as keyof typeof typeMultiplier] || 1.0;
    const valueBonus = Math.min(targetValue / 1000, 2); // Cap bonus at 2x
    
    return Math.round(base * multiplier * (1 + valueBonus));
  }, []);

  // Add XP and check for level ups
  const addXP = useCallback(async (amount: number, source: string) => {
    setData(prev => {
      const newTotalXP = prev.totalXP + amount;
      const newCurrentXP = prev.currentXP + amount;
      
      // Check for level up
      if (newCurrentXP >= prev.xpToNextLevel) {
        const newLevel = prev.level + 1;
        const remainingXP = newCurrentXP - prev.xpToNextLevel;
        const newXPToNext = Math.round(prev.xpToNextLevel * 1.5); // Increase XP requirement
        
        // Trigger level up celebration
        setCelebrationQueue(queue => [...queue, {
          type: 'level_up',
          data: { level: newLevel, xpGained: amount }
        }]);
        
        rewardNotifications.showLevelUp(newLevel);
        
        return {
          ...prev,
          level: newLevel,
          currentXP: remainingXP,
          xpToNextLevel: newXPToNext,
          totalXP: newTotalXP
        };
      }
      
      return {
        ...prev,
        currentXP: newCurrentXP,
        totalXP: newTotalXP
      };
    });
  }, [rewardNotifications]);

  // Trigger goal completion
  const triggerGoalCompletion = useCallback(async (goal: Goal) => {
    const xpReward = calculateXPReward(goal.goal_type, goal.target_value, 'medium');
    
    // Add XP
    await addXP(xpReward, 'goal_completion');
    
    // Show notifications
    rewardNotifications.showAchievement(
      '🎉 Goal Completed!',
      `Congratulations on completing "${goal.title}"!`,
      xpReward
    );
    
    // Check for achievements
    checkForAchievements('goal_completed', goal);
    
    // Update stats
    setData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        completedGoals: prev.stats.completedGoals + 1,
        completionRate: ((prev.stats.completedGoals + 1) / prev.stats.totalGoals) * 100
      }
    }));
  }, [calculateXPReward, addXP, rewardNotifications]);

  // Trigger milestone achievement
  const triggerMilestoneAchievement = useCallback(async (
    goal: Goal, 
    milestone: { percentage: number; value: number }
  ) => {
    const xpReward = Math.round(calculateXPReward(goal.goal_type, goal.target_value, 'easy') * (milestone.percentage / 100));
    
    // Add XP
    await addXP(xpReward, 'milestone');
    
    // Show notifications
    rewardNotifications.showMilestone(
      '🎯 Milestone Achieved!',
      `${milestone.percentage}% progress on "${goal.title}"`,
      milestone.percentage
    );
    
    // Check for achievements
    checkForAchievements('milestone_achieved', { goal, milestone });
  }, [calculateXPReward, addXP, rewardNotifications]);

  // Update streak
  const updateStreak = useCallback(async (newStreak: number) => {
    setData(prev => {
      const isNewRecord = newStreak > prev.longestStreak;
      
      // Check for streak milestones
      if (newStreak > 0 && newStreak % 7 === 0) {
        rewardNotifications.showStreak(newStreak);
        setCelebrationQueue(queue => [...queue, {
          type: 'streak_milestone',
          data: { streak: newStreak }
        }]);
      }
      
      return {
        ...prev,
        currentStreak: newStreak,
        longestStreak: isNewRecord ? newStreak : prev.longestStreak
      };
    });
  }, [rewardNotifications]);

  // Check for achievements
  const checkForAchievements = useCallback((trigger: string, data: any) => {
    // Define achievement conditions
    const achievementConditions = [
      {
        id: 'first_goal',
        title: 'Getting Started',
        description: 'Complete your first goal',
        icon: '🎯',
        rarity: 'common' as const,
        condition: (trigger: string, data: any, gameData: GamificationData) => 
          trigger === 'goal_completed' && gameData.stats.completedGoals === 0,
        xpReward: 100
      },
      {
        id: 'goal_master',
        title: 'Goal Master',
        description: 'Complete 10 goals',
        icon: '🏆',
        rarity: 'rare' as const,
        condition: (trigger: string, data: any, gameData: GamificationData) => 
          trigger === 'goal_completed' && gameData.stats.completedGoals === 9, // Will be 10 after this completion
        xpReward: 500
      },
      {
        id: 'streak_warrior',
        title: 'Streak Warrior',
        description: 'Maintain a 30-day streak',
        icon: '⚡',
        rarity: 'epic' as const,
        condition: (trigger: string, data: any, gameData: GamificationData) => 
          trigger === 'streak_update' && data.streak === 30,
        xpReward: 1000
      },
      {
        id: 'perfectionist',
        title: 'Perfectionist',
        description: 'Achieve 100% completion rate with 5+ goals',
        icon: '💎',
        rarity: 'legendary' as const,
        condition: (trigger: string, data: any, gameData: GamificationData) => 
          gameData.stats.completionRate === 100 && gameData.stats.totalGoals >= 5,
        xpReward: 2000
      }
    ];

    // Check each achievement condition
    achievementConditions.forEach(achievement => {
      const alreadyUnlocked = data.achievements.some((a: Achievement) => a.id === achievement.id);
      
      if (!alreadyUnlocked && achievement.condition(trigger, data, data)) {
        const newAchievement: Achievement = {
          ...achievement,
          unlockedAt: new Date().toISOString(),
          isNew: true
        };
        
        setData(prev => ({
          ...prev,
          achievements: [...prev.achievements, newAchievement]
        }));
        
        // Add XP for achievement
        addXP(achievement.xpReward, 'achievement');
        
        // Show notification
        rewardNotifications.showAchievement(
          `🏆 ${achievement.title}`,
          achievement.description,
          achievement.xpReward
        );
      }
    });
  }, [addXP, rewardNotifications]);

  // Mark achievement as seen
  const markAchievementAsSeen = useCallback((achievementId: string) => {
    setData(prev => ({
      ...prev,
      achievements: prev.achievements.map(achievement =>
        achievement.id === achievementId
          ? { ...achievement, isNew: false }
          : achievement
      )
    }));
  }, []);

  // Show celebration modal
  const showCelebration = useCallback((
    type: 'goal_completed' | 'milestone_achieved' | 'streak_milestone' | 'level_up',
    celebrationData?: any
  ) => {
    setCelebrationQueue(prev => [...prev, { type, data: celebrationData }]);
  }, []);

  return {
    data,
    actions: {
      triggerGoalCompletion,
      triggerMilestoneAchievement,
      updateStreak,
      markAchievementAsSeen,
      calculateXPReward
    },
    isLoading,
    showCelebration
  };
}
