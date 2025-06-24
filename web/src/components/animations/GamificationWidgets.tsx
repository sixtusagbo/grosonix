"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  Zap, 
  Star, 
  Crown, 
  Award,
  TrendingUp,
  Calendar,
  CheckCircle,
  Medal,
  Flame,
  Gift,
  Sparkles
} from 'lucide-react';
import { AnimatedCounter, CircularProgress } from './AnimatedProgress';
import { AnimatedContainer, StaggeredList, StaggeredItem } from './AnimationUtils';

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  streakGoal?: number;
  className?: string;
}

export function StreakWidget({
  currentStreak,
  longestStreak,
  streakGoal = 30,
  className = ""
}: StreakWidgetProps) {
  const progress = (currentStreak / streakGoal) * 100;
  const isOnFire = currentStreak >= 7;

  return (
    <AnimatedContainer className={className}>
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <motion.div
              animate={isOnFire ? {
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Flame className={`w-5 h-5 ${isOnFire ? 'text-orange-500' : 'text-gray-400'}`} />
            </motion.div>
            Daily Streak
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current Streak */}
          <div className="text-center">
            <motion.div
              key={currentStreak}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-bold text-emerald-500"
            >
              {currentStreak}
            </motion.div>
            <p className="text-sm text-muted-foreground">
              {currentStreak === 1 ? 'day' : 'days'} in a row
            </p>
          </div>

          {/* Progress to Goal */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Goal: {streakGoal} days</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progress)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </motion.div>
          </div>

          {/* Longest Streak Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Best streak:</span>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              <Trophy className="w-3 h-3 mr-1" />
              {longestStreak} days
            </Badge>
          </div>

          {/* Fire Effect for Hot Streaks */}
          {isOnFire && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-2 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 rounded-lg"
            >
              <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-medium">You're on fire! 🔥</span>
                <Flame className="w-4 h-4" />
              </div>
            </motion.div>
          )}
        </CardContent>

        {/* Background Sparkles */}
        {isOnFire && (
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-4 right-4"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </motion.div>
          </div>
        )}
      </Card>
    </AnimatedContainer>
  );
}

interface LevelProgressWidgetProps {
  currentLevel: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  className?: string;
}

export function LevelProgressWidget({
  currentLevel,
  currentXP,
  xpToNextLevel,
  totalXP,
  className = ""
}: LevelProgressWidgetProps) {
  const progress = (currentXP / xpToNextLevel) * 100;
  const xpNeeded = xpToNextLevel - currentXP;

  return (
    <AnimatedContainer className={className}>
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="w-5 h-5 text-yellow-500" />
            Level Progress
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current Level */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">Level {currentLevel}</div>
              <p className="text-sm text-muted-foreground">
                {totalXP.toLocaleString()} total XP
              </p>
            </div>
            
            <CircularProgress
              value={progress}
              size={60}
              strokeWidth={6}
              color="#F59E0B"
              showValue={true}
              className="text-yellow-500"
            />
          </div>

          {/* XP Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>XP to Level {currentLevel + 1}</span>
              <span>{xpNeeded.toLocaleString()} needed</span>
            </div>
            
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full relative overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progress)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </motion.div>
            </motion.div>
          </div>

          {/* Current XP */}
          <div className="text-center">
            <AnimatedCounter
              value={currentXP}
              suffix=" XP"
              className="text-lg font-semibold text-yellow-600 dark:text-yellow-400"
            />
          </div>
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
}

interface AchievementShowcaseProps {
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    unlockedAt: string;
    isNew?: boolean;
  }>;
  className?: string;
}

export function AchievementShowcase({
  achievements,
  className = ""
}: AchievementShowcaseProps) {
  const recentAchievements = achievements
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, 3);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 to-orange-500';
      case 'epic':
        return 'from-purple-400 to-pink-500';
      case 'rare':
        return 'from-blue-400 to-indigo-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <AnimatedContainer className={className}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="w-5 h-5 text-purple-500" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <StaggeredList className="space-y-3">
            {recentAchievements.map((achievement) => (
              <StaggeredItem key={achievement.id}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`relative p-3 rounded-lg bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white`}
                >
                  {achievement.isNew && (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -top-1 -right-1"
                    >
                      <Badge className="bg-red-500 text-white text-xs">NEW</Badge>
                    </motion.div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="text-2xl"
                    >
                      {achievement.icon}
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{achievement.title}</h4>
                      <p className="text-xs text-white/80 truncate">
                        {achievement.description}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className="mt-1 bg-white/20 text-white text-xs capitalize"
                      >
                        {achievement.rarity}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              </StaggeredItem>
            ))}
          </StaggeredList>
          
          {achievements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Medal className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No achievements yet</p>
              <p className="text-sm">Complete goals to unlock achievements!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
}

interface GoalStatsWidgetProps {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  completionRate: number;
  className?: string;
}

export function GoalStatsWidget({
  totalGoals,
  completedGoals,
  activeGoals,
  completionRate,
  className = ""
}: GoalStatsWidgetProps) {
  const stats = [
    {
      label: 'Total Goals',
      value: totalGoals,
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900'
    },
    {
      label: 'Completed',
      value: completedGoals,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900'
    },
    {
      label: 'Active',
      value: activeGoals,
      icon: Zap,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900'
    }
  ];

  return (
    <AnimatedContainer className={className}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Goal Statistics
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Completion Rate */}
          <div className="text-center">
            <CircularProgress
              value={completionRate}
              size={80}
              strokeWidth={8}
              color="#10B981"
              showValue={true}
              label="Success Rate"
              className="mx-auto mb-2"
            />
          </div>

          {/* Stats Grid */}
          <StaggeredList className="grid grid-cols-3 gap-3">
            {stats.map((stat, index) => (
              <StaggeredItem key={stat.label}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`p-3 rounded-lg ${stat.bgColor} text-center`}
                >
                  <stat.icon className={`w-6 h-6 mx-auto mb-1 ${stat.color}`} />
                  <AnimatedCounter
                    value={stat.value}
                    className="text-lg font-bold"
                  />
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              </StaggeredItem>
            ))}
          </StaggeredList>
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
}

interface MotivationalQuoteWidgetProps {
  quotes: string[];
  className?: string;
}

export function MotivationalQuoteWidget({
  quotes,
  className = ""
}: MotivationalQuoteWidgetProps) {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  useEffect(() => {
    if (quotes.length > 1) {
      const interval = setInterval(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
      }, 10000); // Change quote every 10 seconds

      return () => clearInterval(interval);
    }
  }, [quotes.length]);

  if (quotes.length === 0) return null;

  return (
    <AnimatedContainer className={className}>
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="text-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="mb-4"
            >
              <Star className="w-8 h-8 mx-auto text-yellow-500" />
            </motion.div>
            
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={currentQuoteIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-lg font-medium text-center italic text-muted-foreground"
              >
                "{quotes[currentQuoteIndex]}"
              </motion.blockquote>
            </AnimatePresence>
            
            {quotes.length > 1 && (
              <div className="flex justify-center gap-1 mt-4">
                {quotes.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentQuoteIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentQuoteIndex 
                        ? 'bg-emerald-500' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
        
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500 rounded-full"
          />
        </div>
      </Card>
    </AnimatedContainer>
  );
}
