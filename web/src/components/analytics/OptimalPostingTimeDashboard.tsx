"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  Calendar,
  TrendingUp,
  Zap,
  BarChart3,
  Users,
  Target,
  Info,
} from 'lucide-react';
import { useOptimalPostingRecommendations } from '@/hooks/useOptimalPostingTime';
import { OptimalPostingTimeAnalyzer, PostingTimeRecommendation } from '@/lib/analytics/optimal-posting-time';
import { OptimalPostingTimeWidget } from './OptimalPostingTimeWidget';

export function OptimalPostingTimeDashboard() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<('twitter' | 'linkedin' | 'instagram')[]>([
    'twitter',
    'linkedin',
    'instagram',
  ]);

  const {
    recommendations,
    nextOptimalTime,
    isLoading,
    error,
    refreshRecommendations,
    timezone,
  } = useOptimalPostingRecommendations(selectedPlatforms);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return '𝕏';
      case 'linkedin': return '💼';
      case 'instagram': return '📷';
      default: return '📱';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'twitter': return 'text-blue-400';
      case 'linkedin': return 'text-blue-600';
      case 'instagram': return 'text-pink-400';
      default: return 'text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-500 bg-red-50';
  };

  const formatTimeUntilNext = (recommendation: PostingTimeRecommendation) => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    
    const daysUntil = (recommendation.dayOfWeek - currentDay + 7) % 7;
    const hoursUntil = daysUntil * 24 + (recommendation.hour - currentHour);
    const adjustedHours = hoursUntil <= 0 ? hoursUntil + 168 : hoursUntil;
    
    if (adjustedHours < 24) {
      return `in ${adjustedHours} hours`;
    } else {
      const days = Math.floor(adjustedHours / 24);
      const hours = adjustedHours % 24;
      return `in ${days}d ${hours}h`;
    }
  };

  // Get best times across all platforms
  const bestOverallTimes = recommendations
    .flatMap(analysis => analysis.recommendations)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Optimal Posting Times</h2>
          <p className="text-muted-foreground">
            Maximize your engagement with data-driven posting recommendations
          </p>
        </div>
        <Button onClick={refreshRecommendations} disabled={isLoading}>
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Next Optimal Time Card */}
      {nextOptimalTime && (
        <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Zap className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900">Next Optimal Time</h3>
                  <p className="text-yellow-700">
                    {OptimalPostingTimeAnalyzer.getDayName(nextOptimalTime.dayOfWeek)} at{' '}
                    {OptimalPostingTimeAnalyzer.formatHour(nextOptimalTime.hour)}
                  </p>
                  <p className="text-sm text-yellow-600">
                    {formatTimeUntilNext(nextOptimalTime)} • {nextOptimalTime.platform} • Score: {nextOptimalTime.score}/100
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-yellow-100 text-yellow-800">
                  {nextOptimalTime.reason.includes('Based on your') ? 'Personalized' : 'Industry Best Practice'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="twitter">𝕏 Twitter</TabsTrigger>
          <TabsTrigger value="linkedin">💼 LinkedIn</TabsTrigger>
          <TabsTrigger value="instagram">📷 Instagram</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Best Overall Times */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Best Times Across All Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                    </div>
                  ))}
                </div>
              ) : bestOverallTimes.length > 0 ? (
                <div className="space-y-2">
                  {bestOverallTimes.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg ${getPlatformColor(rec.platform)}`}>
                          {getPlatformIcon(rec.platform)}
                        </span>
                        <div>
                          <div className="font-medium">
                            {OptimalPostingTimeAnalyzer.getDayName(rec.dayOfWeek)} at{' '}
                            {OptimalPostingTimeAnalyzer.formatHour(rec.hour)}
                          </div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {rec.platform} • {rec.reason}
                          </div>
                        </div>
                      </div>
                      <Badge className={getScoreColor(rec.score)}>
                        {rec.score}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recommendations available</p>
                  <p className="text-sm">Connect your social accounts to get personalized recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((analysis) => (
              <Card key={analysis.platform}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className={`text-lg ${getPlatformColor(analysis.platform)}`}>
                      {getPlatformIcon(analysis.platform)}
                    </span>
                    <span className="capitalize">{analysis.platform}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Data Points</span>
                    <span className="font-medium">{analysis.dataPoints}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Confidence</span>
                    <Badge variant={analysis.confidence === 'high' ? 'default' : 'secondary'}>
                      {analysis.confidence}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Top Score</span>
                    <span className="font-medium">
                      {analysis.recommendations[0]?.score || 0}/100
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="twitter">
          <OptimalPostingTimeWidget defaultPlatform="twitter" showPlatformSelector={false} />
        </TabsContent>

        <TabsContent value="linkedin">
          <OptimalPostingTimeWidget defaultPlatform="linkedin" showPlatformSelector={false} />
        </TabsContent>

        <TabsContent value="instagram">
          <OptimalPostingTimeWidget defaultPlatform="instagram" showPlatformSelector={false} />
        </TabsContent>
      </Tabs>

      {/* Info Footer */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <p>
                Our algorithm analyzes your historical posting data and engagement patterns to recommend optimal posting times.
                For new accounts, we use industry best practices. Recommendations improve as you post more content.
              </p>
              <p className="mt-2 text-xs text-blue-600">
                Times shown in {timezone} • Analysis updates automatically as you post more content
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
