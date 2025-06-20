"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  Target,
  Calendar,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { useGoalAnalytics } from '@/hooks/useGoals';
import { GOAL_TYPE_LABELS, PLATFORM_LABELS } from '@/types/goals';

interface GoalAnalyticsProps {
  userId: string;
}

export function GoalAnalytics({ userId }: GoalAnalyticsProps) {
  const [timeframe, setTimeframe] = useState(30);
  const [platform, setPlatform] = useState('all');

  const { analytics, loading, error } = useGoalAnalytics(timeframe, platform);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <p className="text-text-secondary">Failed to load analytics</p>
        </CardContent>
      </Card>
    );
  }

  const getPerformanceColor = (value: number, total: number) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    if (percentage >= 70) return 'text-green-500';
    if (percentage >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Goal Analytics</h2>
          <p className="text-text-secondary">Insights into your goal performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeframe.toString()} onValueChange={(value) => setTimeframe(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Goals</p>
                <p className="text-2xl font-bold text-text-primary">
                  {analytics.overview.total_goals}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Completion Rate</p>
                <p className="text-2xl font-bold text-text-primary">
                  {analytics.overview.completion_rate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Avg Progress</p>
                <p className="text-2xl font-bold text-text-primary">
                  {analytics.overview.average_progress}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Award className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Milestones</p>
                <p className="text-2xl font-bold text-text-primary">
                  {analytics.milestones.achievement_rate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Goal Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">On Track</span>
                <span className={`font-medium ${getPerformanceColor(
                  analytics.performance.goals_on_track,
                  analytics.overview.active_goals
                )}`}>
                  {analytics.performance.goals_on_track}
                </span>
              </div>
              <Progress 
                value={analytics.overview.active_goals > 0 
                  ? (analytics.performance.goals_on_track / analytics.overview.active_goals) * 100 
                  : 0
                } 
                className="h-2" 
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Behind Schedule</span>
                <span className="font-medium text-red-500">
                  {analytics.performance.goals_behind}
                </span>
              </div>
              <Progress 
                value={analytics.overview.active_goals > 0 
                  ? (analytics.performance.goals_behind / analytics.overview.active_goals) * 100 
                  : 0
                } 
                className="h-2" 
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Ahead of Schedule</span>
                <span className="font-medium text-green-500">
                  {analytics.performance.goals_ahead}
                </span>
              </div>
              <Progress 
                value={analytics.overview.active_goals > 0 
                  ? (analytics.performance.goals_ahead / analytics.overview.active_goals) * 100 
                  : 0
                } 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              Goal Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.goal_types).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">
                    {GOAL_TYPE_LABELS[type as keyof typeof GOAL_TYPE_LABELS] || type}
                  </span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
              {Object.keys(analytics.goal_types).length === 0 && (
                <p className="text-sm text-text-secondary text-center py-4">
                  No goals created yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      {analytics.milestones.recent_achievements.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.milestones.recent_achievements.slice(0, 5).map((achievement, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">
                      {achievement.milestone_percentage}% milestone achieved
                    </p>
                    <p className="text-sm text-text-secondary">
                      {achievement.goal_title}
                    </p>
                  </div>
                  <div className="text-sm text-text-secondary">
                    {new Date(achievement.achieved_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-text-primary">
              {analytics.performance.average_days_to_completion}
            </p>
            <p className="text-sm text-text-secondary">Avg Days to Complete</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <Award className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold text-text-primary">
              {analytics.milestones.total_achieved}
            </p>
            <p className="text-sm text-text-secondary">Total Milestones Achieved</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold text-text-primary">
              {analytics.overview.overdue_goals}
            </p>
            <p className="text-sm text-text-secondary">Overdue Goals</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
