"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfettiExplosion from 'react-confetti-explosion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Target, 
  Star, 
  Zap, 
  Award, 
  Crown,
  Sparkles,
  CheckCircle,
  TrendingUp,
  X
} from 'lucide-react';
import { Goal } from '@/types/goals';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'goal_completed' | 'milestone_achieved' | 'streak_milestone' | 'level_up';
  goal?: Goal;
  milestone?: {
    percentage: number;
    value: number;
  };
  streak?: number;
  level?: number;
  title?: string;
  message?: string;
}

export function CelebrationModal({
  isOpen,
  onClose,
  type,
  goal,
  milestone,
  streak,
  level,
  title,
  message
}: CelebrationModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSecondaryConfetti, setShowSecondaryConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Trigger secondary confetti after a delay
      const timer = setTimeout(() => {
        setShowSecondaryConfetti(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
      setShowSecondaryConfetti(false);
    }
  }, [isOpen]);

  const getCelebrationConfig = () => {
    switch (type) {
      case 'goal_completed':
        return {
          icon: Trophy,
          iconColor: 'text-yellow-500',
          bgGradient: 'from-yellow-400 via-orange-500 to-red-500',
          title: title || '🎉 Goal Completed!',
          message: message || `Congratulations! You've achieved "${goal?.title}"`,
          emoji: '🏆',
          confettiConfig: {
            force: 0.8,
            duration: 3000,
            particleCount: 300,
            width: 1600,
            colors: ['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#1E90FF']
          }
        };
      
      case 'milestone_achieved':
        return {
          icon: Target,
          iconColor: 'text-emerald-500',
          bgGradient: 'from-emerald-400 via-teal-500 to-blue-500',
          title: title || '🎯 Milestone Achieved!',
          message: message || `You've reached ${milestone?.percentage}% of your goal!`,
          emoji: '🎯',
          confettiConfig: {
            force: 0.6,
            duration: 2500,
            particleCount: 200,
            width: 1200,
            colors: ['#10B981', '#06D6A0', '#118AB2', '#073B4C']
          }
        };
      
      case 'streak_milestone':
        return {
          icon: Zap,
          iconColor: 'text-purple-500',
          bgGradient: 'from-purple-400 via-pink-500 to-red-500',
          title: title || '⚡ Streak Milestone!',
          message: message || `Amazing! ${streak} days streak achieved!`,
          emoji: '⚡',
          confettiConfig: {
            force: 0.7,
            duration: 2800,
            particleCount: 250,
            width: 1400,
            colors: ['#8B5CF6', '#EC4899', '#F59E0B', '#EF4444']
          }
        };
      
      case 'level_up':
        return {
          icon: Crown,
          iconColor: 'text-amber-500',
          bgGradient: 'from-amber-400 via-yellow-500 to-orange-500',
          title: title || '👑 Level Up!',
          message: message || `Congratulations! You've reached Level ${level}!`,
          emoji: '👑',
          confettiConfig: {
            force: 0.9,
            duration: 3500,
            particleCount: 350,
            width: 1800,
            colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A']
          }
        };
      
      default:
        return {
          icon: Star,
          iconColor: 'text-blue-500',
          bgGradient: 'from-blue-400 via-purple-500 to-pink-500',
          title: title || '⭐ Achievement Unlocked!',
          message: message || 'Great job on your progress!',
          emoji: '⭐',
          confettiConfig: {
            force: 0.6,
            duration: 2500,
            particleCount: 200,
            width: 1200,
            colors: ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981']
          }
        };
    }
  };

  const config = getCelebrationConfig();
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent">
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 180, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                duration: 0.8
              }}
              className="relative"
            >
              {/* Confetti */}
              {showConfetti && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                  <ConfettiExplosion {...config.confettiConfig} />
                </div>
              )}
              
              {showSecondaryConfetti && (
                <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 z-50">
                  <ConfettiExplosion 
                    {...config.confettiConfig}
                    force={config.confettiConfig.force * 0.6}
                    particleCount={config.confettiConfig.particleCount * 0.5}
                  />
                </div>
              )}

              {/* Main Modal */}
              <div className={`relative bg-gradient-to-br ${config.bgGradient} p-8 rounded-2xl shadow-2xl text-white`}>
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
                >
                  <X className="w-4 h-4" />
                </Button>

                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                    className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/15 rounded-full"
                  />
                </div>

                {/* Content */}
                <div className="relative z-10 text-center">
                  {/* Main Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 15,
                      delay: 0.3
                    }}
                    className="mb-6"
                  >
                    <div className="relative inline-block">
                      <motion.div
                        animate={{
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="bg-white/20 p-6 rounded-full backdrop-blur-sm"
                      >
                        <IconComponent className={`w-16 h-16 ${config.iconColor}`} />
                      </motion.div>
                      
                      {/* Sparkles */}
                      <motion.div
                        animate={{
                          scale: [0, 1, 0],
                          rotate: [0, 180, 360],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.5
                        }}
                        className="absolute -top-2 -right-2"
                      >
                        <Sparkles className="w-6 h-6 text-yellow-300" />
                      </motion.div>
                      
                      <motion.div
                        animate={{
                          scale: [0, 1, 0],
                          rotate: [0, -180, -360],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 1
                        }}
                        className="absolute -bottom-1 -left-2"
                      >
                        <Star className="w-4 h-4 text-yellow-200" />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-3xl font-bold mb-4"
                  >
                    {config.title}
                  </motion.h2>

                  {/* Message */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-lg mb-6 text-white/90"
                  >
                    {config.message}
                  </motion.p>

                  {/* Goal Details */}
                  {goal && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 }}
                      className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <Badge variant="secondary" className="bg-white/30 text-white">
                          {goal.progress_percentage?.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="mt-2 bg-white/20 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.progress_percentage || 0}%` }}
                          transition={{ duration: 1, delay: 1 }}
                          className="bg-white h-full rounded-full"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Action Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                  >
                    <Button
                      onClick={onClose}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                      size="lg"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Awesome!
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
