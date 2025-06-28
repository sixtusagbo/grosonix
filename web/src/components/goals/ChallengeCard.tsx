"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Calendar, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  ArrowUp,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useGamification } from '@/hooks/useGamification';

interface ChallengeCardProps {
  challenge: any;
  onUpdateProgress?: (challengeId: string, newValue: number) => Promise<void>;
  onComplete?: (challengeId: string) => Promise<void>;
  className?: string;
}

export function ChallengeCard({
  challenge,
  onUpdateProgress,
  onComplete,
  className = ""
}: ChallengeCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCompletionEffect, setShowCompletionEffect] = useState(false);
  
  const { actions } = useGamification();
  
  const progress = challenge.target_value > 0 
    ? Math.min((challenge.current_value / challenge.target_value) * 100, 100)
    : 0;
    
  const isCompleted = challenge.status === 'completed';
  const isOverdue = new Date(challenge.target_date) < new Date() && !isCompleted;
  
  const getChallengeTypeIcon = () => {
    switch (challenge.challenge_type) {
      case 'content_generation': return <Zap className="w-4 h-4 text-emerald-500" />;
      case 'style_analysis': return <Target className="w-4 h-4 text-blue-500" />;
      case 'adapt_content': return <ArrowUp className="w-4 h-4 text-purple-500" />;
      case 'schedule_post': return <Calendar className="w-4 h-4 text-orange-500" />;
      case 'engage_followers': return <Trophy className="w-4 h-4 text-yellow-500" />;
      default: return <Target className="w-4 h-4" />;
    }
  };
  
  const getChallengeTypeLabel = () => {
    switch (challenge.challenge_type) {
      case 'content_generation': return 'Content Creation';
      case 'style_analysis': return 'Style Analysis';
      case 'adapt_content': return 'Content Adaptation';
      case 'schedule_post': return 'Post Scheduling';
      case 'engage_followers': return 'Follower Engagement';
      default: return challenge.challenge_type?.replace('_', ' ') || 'Challenge';
    }
  };
  
  const getFrequencyBadgeColor = () => {
    switch (challenge.challenge_frequency) {
      case 'daily': return 'bg-emerald-500/20 text-emerald-500';
      case 'weekly': return 'bg-blue-500/20 text-blue-500';
      case 'one-time': return 'bg-purple-500/20 text-purple-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };
  
  const handleCompleteChallenge = async () => {
    if (isUpdating || isCompleted) return;
    
    setIsUpdating(true);
    try {
      if (onComplete) {
        await onComplete(challenge.id);
      } else if (onUpdateProgress) {
        await onUpdateProgress(challenge.id, challenge.target_value);
      }
      
      // Show completion effect
      setShowCompletionEffect(true);
      
      // Trigger XP reward
      if (challenge.challenge_reward_xp) {
        actions.addXP?.(challenge.challenge_reward_xp, 'challenge_completion');
      }
      
      toast.success(`Challenge completed! +${challenge.challenge_reward_xp || 50} XP`);
      
      // Reset completion effect after animation
      setTimeout(() => setShowCompletionEffect(false), 2000);
    } catch (error) {
      console.error('Error completing challenge:', error);
      toast.error('Failed to complete challenge');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleIncrementProgress = async () => {
    if (isUpdating || isCompleted) return;
    
    setIsUpdating(true);
    try {
      if (onUpdateProgress) {
        await onUpdateProgress(challenge.id, challenge.current_value + 1);
      }
      
      // If this increment completes the challenge
      if (challenge.current_value + 1 >= challenge.target_value) {
        // Show completion effect
        setShowCompletionEffect(true);
        
        // Trigger XP reward
        if (challenge.challenge_reward_xp) {
          actions.addXP?.(challenge.challenge_reward_xp, 'challenge_completion');
        }
        
        toast.success(`Challenge completed! +${challenge.challenge_reward_xp || 50} XP`);
        
        // Reset completion effect after animation
        setTimeout(() => setShowCompletionEffect(false), 2000);
      } else {
        toast.success('Progress updated!');
      }
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      toast.error('Failed to update progress');
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={className}
    >
      <Card className={`relative overflow-hidden border-2 ${
        isCompleted ? 'border-emerald-500 bg-emerald-500/5' :
        isOverdue ? 'border-red-500 bg-red-500/5' :
        'border-yellow-500 bg-yellow-500/5 hover:border-yellow-400'
      } transition-all duration-200`}>
        {/* Completion effect overlay */}
        {showCompletionEffect && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-emerald-500 z-10 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1] }}
              transition={{ duration: 1 }}
            >
              <CheckCircle className="w-16 h-16 text-white" />
            </motion.div>
          </motion.div>
        )}
        
        <CardContent className="p-3 sm:p-4">
          {/* Challenge Header */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-1 sm:gap-2">
              {getChallengeTypeIcon()}
              <span className="font-medium text-xs sm:text-sm">{getChallengeTypeLabel()}</span>
              <Badge className={`text-xs ${getFrequencyBadgeColor()}`}>
                {challenge.challenge_frequency}
              </Badge>
            </div>
            
            {challenge.challenge_reward_xp && (
              <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded-full text-xs font-medium">
                <Zap className="w-3 h-3" />
                {challenge.challenge_reward_xp} XP
              </div>
            )}
          </div>
          
          {/* Challenge Title */}
          <h3 className="font-semibold text-sm sm:text-base mb-2">{challenge.title}</h3>
          
          {/* Description */}
          {challenge.description && (
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">{challenge.description}</p>
          )}
          
          {/* Parent Goal Link */}
          {challenge.parent_goal_id && challenge.parent_goal_title && (
            <div className="mb-2 sm:mb-3 text-xs bg-blue-500/10 text-blue-600 p-1 sm:p-2 rounded-md">
              <span className="font-medium">Contributes to:</span> {challenge.parent_goal_title}
            </div>
          )}
          
          {/* Progress */}
          <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-3">
            <div className="flex items-center justify-between text-xs">
              <span>Progress</span>
              <span>{challenge.current_value} / {challenge.target_value}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center justify-between mb-2 sm:mb-3 text-xs">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Due: {new Date(challenge.target_date).toLocaleDateString()}</span>
            </div>
            
            {isCompleted ? (
              <div className="flex items-center gap-1 text-emerald-500">
                <CheckCircle className="w-3 h-3" />
                <span>Completed</span>
              </div>
            ) : isOverdue ? (
              <div className="flex items-center gap-1 text-red-500">
                <AlertTriangle className="w-3 h-3" />
                <span>Overdue</span>
              </div>
            ) : null}
          </div>
          
          {/* Action Buttons */}
          {!isCompleted && (
            <div className="flex gap-2">
              {challenge.target_value > 1 && challenge.current_value < challenge.target_value && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleIncrementProgress}
                  disabled={isUpdating}
                  className="flex-1 h-9"
                >
                  +1 Progress
                </Button>
              )}
              
              <Button 
                variant={challenge.current_value >= challenge.target_value ? "default" : "outline"}
                size="sm" 
                onClick={handleCompleteChallenge}
                disabled={isUpdating}
                className={`flex-1 h-9 ${challenge.current_value >= challenge.target_value ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
              >
                {challenge.current_value >= challenge.target_value ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete
                  </>
                ) : (
                  'Mark Complete'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}