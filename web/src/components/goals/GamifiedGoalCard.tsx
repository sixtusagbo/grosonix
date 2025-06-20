"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Star,
  Zap,
  Trophy,
  Edit,
  Trash2
} from 'lucide-react';
import { Goal } from '@/types/goals';
import {
  AnimatedProgressBar,
  MilestoneProgress,
  AnimatedCounter,
  AnimatedButton,
  HoverCard,
  SuccessCheckmark,
  CelebrationModal,
  useRewardNotifications
} from '@/components/animations';
import { useGamification } from '@/hooks/useGamification';

interface GamifiedGoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  onUpdateProgress?: (goalId: string, newValue: number) => void;
  className?: string;
}

export function GamifiedGoalCard({
  goal,
  onEdit,
  onDelete,
  onUpdateProgress,
  className = ""
}: GamifiedGoalCardProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'goal_completed' | 'milestone_achieved'>('goal_completed');
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  
  const { actions } = useGamification();
  const rewardNotifications = useRewardNotifications();

  const progress = goal.progress_percentage || 0;
  const isCompleted = goal.status === 'completed';
  const isOverdue = goal.is_overdue;
  const daysRemaining = goal.days_remaining || 0;

  const handleProgressUpdate = async (increment: number) => {
    if (isCompleted || isUpdatingProgress) return;
    
    setIsUpdatingProgress(true);
    const newValue = Math.min(goal.target_value, (goal.current_value || 0) + increment);
    const newProgress = (newValue / goal.target_value) * 100;
    
    // Check for milestone achievements
    const milestones = [25, 50, 75, 100];
    const currentMilestone = milestones.find(m => progress < m && newProgress >= m);
    
    if (currentMilestone) {
      if (currentMilestone === 100) {
        // Goal completed
        setCelebrationType('goal_completed');
        setShowCelebration(true);
        actions.triggerGoalCompletion(goal);
      } else {
        // Milestone achieved
        setCelebrationType('milestone_achieved');
        setShowCelebration(true);
        actions.triggerMilestoneAchievement(goal, {
          percentage: currentMilestone,
          value: (goal.target_value * currentMilestone) / 100
        });
      }
    }
    
    onUpdateProgress?.(goal.id, newValue);
    setIsUpdatingProgress(false);
  };

  const getStatusColor = () => {
    if (isCompleted) return 'text-green-500';
    if (isOverdue) return 'text-red-500';
    if (progress >= 75) return 'text-yellow-500';
    return 'text-blue-500';
  };

  const getStatusBadge = () => {
    if (isCompleted) return { text: 'Completed', variant: 'default' as const, color: 'bg-green-500' };
    if (isOverdue) return { text: 'Overdue', variant: 'destructive' as const, color: 'bg-red-500' };
    if (progress >= 75) return { text: 'Almost There!', variant: 'secondary' as const, color: 'bg-yellow-500' };
    return { text: 'In Progress', variant: 'outline' as const, color: 'bg-blue-500' };
  };

  const statusBadge = getStatusBadge();

  return (
    <>
      <HoverCard className={className}>
        <motion.div
          layout
          className="relative overflow-hidden"
        >
          {/* Completion Overlay */}
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-green-500/10 backdrop-blur-sm z-10 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              >
                <CheckCircle className="w-16 h-16 text-green-500" />
              </motion.div>
            </motion.div>
          )}

          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold truncate">
                  {goal.title}
                </CardTitle>
                {goal.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {goal.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Badge 
                  variant={statusBadge.variant}
                  className={isCompleted ? statusBadge.color : ''}
                >
                  {statusBadge.text}
                </Badge>
                
                {goal.priority === 'high' && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  </motion.div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Progress Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress</span>
                <div className="flex items-center gap-2">
                  <AnimatedCounter
                    value={goal.current_value || 0}
                    className="font-semibold"
                  />
                  <span className="text-muted-foreground">
                    / {goal.target_value.toLocaleString()}
                  </span>
                </div>
              </div>
              
              <AnimatedProgressBar
                value={progress}
                showGlow={progress >= 75}
                showPulse={progress >= 90}
                color={isCompleted ? 'emerald' : progress >= 75 ? 'yellow' : 'blue'}
                className="h-3"
              />
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progress.toFixed(1)}% Complete</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {daysRemaining > 0 
                      ? `${daysRemaining} days left`
                      : isOverdue 
                        ? `${Math.abs(daysRemaining)} days overdue`
                        : 'Due today'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Goal Type and Platform */}
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="capitalize">{goal.goal_type.replace('_', ' ')}</span>
              {goal.platform && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="capitalize">{goal.platform}</span>
                </>
              )}
            </div>

            {/* Quick Actions */}
            {!isCompleted && (
              <div className="flex items-center gap-2">
                <AnimatedButton
                  variant="success"
                  size="sm"
                  onClick={() => handleProgressUpdate(Math.ceil(goal.target_value * 0.1))}
                  disabled={isUpdatingProgress}
                  loading={isUpdatingProgress}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +10% Progress
                </AnimatedButton>
                
                <AnimatedButton
                  variant="pulse"
                  size="sm"
                  onClick={() => handleProgressUpdate(goal.target_value)}
                  disabled={isUpdatingProgress}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Trophy className="w-4 h-4" />
                  Complete
                </AnimatedButton>
              </div>
            )}

            {/* Management Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(goal)}
                  className="h-8 px-2"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete?.(goal.id)}
                  className="h-8 px-2 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              
              {/* XP Indicator */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span>
                  {actions.calculateXPReward(goal.goal_type, goal.target_value, 'medium')} XP
                </span>
              </div>
            </div>
          </CardContent>
        </motion.div>
      </HoverCard>

      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        type={celebrationType}
        goal={goal}
        milestone={celebrationType === 'milestone_achieved' ? { percentage: 75, value: goal.target_value * 0.75 } : undefined}
      />
    </>
  );
}
