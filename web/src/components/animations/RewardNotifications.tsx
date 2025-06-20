"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Star, 
  Zap, 
  Award, 
  Crown, 
  Target,
  TrendingUp,
  CheckCircle,
  Gift,
  Sparkles,
  Medal,
  X
} from 'lucide-react';

interface RewardNotification {
  id: string;
  type: 'achievement' | 'milestone' | 'streak' | 'level_up' | 'bonus';
  title: string;
  message: string;
  points?: number;
  badge?: string;
  icon?: string;
  color?: string;
  duration?: number;
}

interface RewardNotificationProps {
  notification: RewardNotification;
  onDismiss: (id: string) => void;
}

function RewardNotificationItem({ notification, onDismiss }: RewardNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(notification.id), 300);
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.id, onDismiss]);

  const getIcon = () => {
    switch (notification.type) {
      case 'achievement':
        return Trophy;
      case 'milestone':
        return Target;
      case 'streak':
        return Zap;
      case 'level_up':
        return Crown;
      case 'bonus':
        return Gift;
      default:
        return Star;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'achievement':
        return {
          bg: 'from-yellow-400 to-orange-500',
          icon: 'text-yellow-600',
          border: 'border-yellow-300'
        };
      case 'milestone':
        return {
          bg: 'from-emerald-400 to-teal-500',
          icon: 'text-emerald-600',
          border: 'border-emerald-300'
        };
      case 'streak':
        return {
          bg: 'from-purple-400 to-pink-500',
          icon: 'text-purple-600',
          border: 'border-purple-300'
        };
      case 'level_up':
        return {
          bg: 'from-amber-400 to-yellow-500',
          icon: 'text-amber-600',
          border: 'border-amber-300'
        };
      case 'bonus':
        return {
          bg: 'from-blue-400 to-indigo-500',
          icon: 'text-blue-600',
          border: 'border-blue-300'
        };
      default:
        return {
          bg: 'from-gray-400 to-gray-500',
          icon: 'text-gray-600',
          border: 'border-gray-300'
        };
    }
  };

  const IconComponent = getIcon();
  const colors = getColors();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
          className={`relative bg-gradient-to-r ${colors.bg} p-4 rounded-lg shadow-lg border-2 ${colors.border} max-w-sm`}
        >
          {/* Sparkle Effects */}
          <motion.div
            animate={{
              scale: [0, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-1 -right-1"
          >
            <Sparkles className="w-4 h-4 text-white" />
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
              delay: 0.5
            }}
            className="absolute -bottom-1 -left-1"
          >
            <Star className="w-3 h-3 text-white" />
          </motion.div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onDismiss(notification.id), 300);
            }}
            className="absolute top-2 right-2 text-white hover:bg-white/20 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>

          <div className="flex items-start gap-3 text-white">
            {/* Icon */}
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="bg-white/20 p-2 rounded-full backdrop-blur-sm"
            >
              <IconComponent className="w-6 h-6" />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <motion.h4
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-semibold text-sm"
              >
                {notification.title}
              </motion.h4>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xs text-white/90 mt-1"
              >
                {notification.message}
              </motion.p>

              {/* Points/Badge */}
              {(notification.points || notification.badge) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-2 mt-2"
                >
                  {notification.points && (
                    <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                      +{notification.points} XP
                    </Badge>
                  )}
                  {notification.badge && (
                    <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                      {notification.badge}
                    </Badge>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface RewardNotificationManagerProps {
  notifications: RewardNotification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function RewardNotificationManager({
  notifications,
  onDismiss,
  position = 'top-right'
}: RewardNotificationManagerProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-3 max-w-sm`}>
      <AnimatePresence>
        {notifications.map((notification) => (
          <RewardNotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing reward notifications
export function useRewardNotifications() {
  const [notifications, setNotifications] = useState<RewardNotification[]>([]);

  const addNotification = (notification: Omit<RewardNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: RewardNotification = {
      ...notification,
      id,
      duration: notification.duration || 5000
    };

    setNotifications(prev => [...prev, newNotification]);

    // Also show a toast for important achievements
    if (notification.type === 'achievement' || notification.type === 'level_up') {
      toast.success(notification.title, {
        description: notification.message,
        duration: 4000,
      });
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Predefined notification creators
  const showAchievement = (title: string, message: string, points?: number) => {
    addNotification({
      type: 'achievement',
      title,
      message,
      points,
      duration: 6000
    });
  };

  const showMilestone = (title: string, message: string, percentage: number) => {
    addNotification({
      type: 'milestone',
      title,
      message,
      badge: `${percentage}% Complete`,
      duration: 5000
    });
  };

  const showStreak = (days: number) => {
    addNotification({
      type: 'streak',
      title: '🔥 Streak Milestone!',
      message: `${days} days in a row! Keep it up!`,
      points: days * 10,
      duration: 5000
    });
  };

  const showLevelUp = (level: number) => {
    addNotification({
      type: 'level_up',
      title: '🎉 Level Up!',
      message: `Congratulations! You've reached Level ${level}!`,
      points: level * 100,
      duration: 7000
    });
  };

  const showBonus = (title: string, message: string, points: number) => {
    addNotification({
      type: 'bonus',
      title,
      message,
      points,
      duration: 4000
    });
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
    showAchievement,
    showMilestone,
    showStreak,
    showLevelUp,
    showBonus
  };
}

// Achievement Badge Component
interface AchievementBadgeProps {
  type: 'new' | 'rare' | 'epic' | 'legendary';
  title: string;
  description?: string;
  icon?: React.ComponentType<any>;
  className?: string;
}

export function AchievementBadge({
  type,
  title,
  description,
  icon: IconComponent = Medal,
  className = ""
}: AchievementBadgeProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'rare':
        return {
          bg: 'from-blue-500 to-blue-600',
          border: 'border-blue-400',
          glow: 'shadow-blue-500/50'
        };
      case 'epic':
        return {
          bg: 'from-purple-500 to-purple-600',
          border: 'border-purple-400',
          glow: 'shadow-purple-500/50'
        };
      case 'legendary':
        return {
          bg: 'from-yellow-500 to-orange-500',
          border: 'border-yellow-400',
          glow: 'shadow-yellow-500/50'
        };
      default:
        return {
          bg: 'from-gray-500 to-gray-600',
          border: 'border-gray-400',
          glow: 'shadow-gray-500/50'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.05 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 15
      }}
      className={`relative bg-gradient-to-br ${styles.bg} p-4 rounded-lg border-2 ${styles.border} shadow-lg ${styles.glow} ${className}`}
    >
      <div className="text-center text-white">
        <motion.div
          animate={{
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mb-2"
        >
          <IconComponent className="w-8 h-8 mx-auto" />
        </motion.div>
        
        <h3 className="font-bold text-sm">{title}</h3>
        {description && (
          <p className="text-xs text-white/80 mt-1">{description}</p>
        )}
        
        <Badge 
          variant="secondary" 
          className="mt-2 bg-white/20 text-white text-xs capitalize"
        >
          {type}
        </Badge>
      </div>

      {/* Sparkle Effect */}
      <motion.div
        animate={{
          scale: [0, 1, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-1 -right-1"
      >
        <Sparkles className="w-4 h-4 text-white" />
      </motion.div>
    </motion.div>
  );
}
