"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { CalendarStats as CalendarStatsType } from '@/types/calendar';

interface CalendarStatsProps {
  stats: CalendarStatsType;
}

export function CalendarStats({ stats }: CalendarStatsProps) {
  const {
    totalScheduled,
    totalPublished,
    totalDrafts,
    upcomingToday,
    optimalTimeUsage,
    platformBreakdown,
  } = stats;

  const totalPosts = totalScheduled + totalPublished + totalDrafts;

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return '𝕏';
      case 'linkedin': return '💼';
      case 'instagram': return '📷';
      default: return '📱';
    }
  };

  const statCards = [
    {
      title: 'Total Posts',
      value: totalPosts,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Published',
      value: totalPublished,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Scheduled',
      value: totalScheduled,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Drafts',
      value: totalDrafts,
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      title: 'Today',
      value: upcomingToday,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Main stats */}
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Platform breakdown */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Platform Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(platformBreakdown).map(([platform, count]) => (
            <div key={platform} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {getPlatformIcon(platform)}
                </span>
                <span className="text-sm font-medium capitalize">
                  {platform}
                </span>
              </div>
              <Badge variant="secondary">{count}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Optimal time usage */}
      <Card className="md:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Optimal Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {optimalTimeUsage}%
            </div>
            <p className="text-xs text-muted-foreground">
              Posts using optimal times
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick insights */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            {totalScheduled > 0 && (
              <p className="text-muted-foreground">
                📅 You have <span className="font-medium">{totalScheduled}</span> posts scheduled
              </p>
            )}
            {upcomingToday > 0 && (
              <p className="text-muted-foreground">
                🚀 <span className="font-medium">{upcomingToday}</span> posts going live today
              </p>
            )}
            {totalDrafts > 0 && (
              <p className="text-muted-foreground">
                ✏️ <span className="font-medium">{totalDrafts}</span> drafts ready to schedule
              </p>
            )}
            {totalPosts === 0 && (
              <p className="text-muted-foreground">
                🎯 Start by creating your first post!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
