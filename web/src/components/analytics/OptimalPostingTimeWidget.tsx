"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Clock,
  Calendar,
  TrendingUp,
  RefreshCw,
  Info,
  Zap,
} from 'lucide-react';
import { useOptimalPostingTime, useUserTimezone } from '@/hooks/useOptimalPostingTime';
import { OptimalPostingTimeAnalyzer, PostingTimeRecommendation } from '@/lib/analytics/optimal-posting-time';

interface OptimalPostingTimeWidgetProps {
  defaultPlatform?: 'twitter' | 'linkedin' | 'instagram';
  showPlatformSelector?: boolean;
  compact?: boolean;
}

export function OptimalPostingTimeWidget({
  defaultPlatform = 'twitter',
  showPlatformSelector = true,
  compact = false,
}: OptimalPostingTimeWidgetProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<'twitter' | 'linkedin' | 'instagram'>(defaultPlatform);
  const [analysis, setAnalysis] = useState<any>(null);
  const [nextOptimalTime, setNextOptimalTime] = useState<PostingTimeRecommendation | null>(null);

  const { analyzeOptimalTimes, isLoading, error } = useOptimalPostingTime();
  const timezone = useUserTimezone();

  const loadAnalysis = async () => {
    const result = await analyzeOptimalTimes(selectedPlatform, timezone);
    if (result) {
      setAnalysis(result.analysis);
      setNextOptimalTime(result.next_optimal_time);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [selectedPlatform, timezone]);

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

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800',
    };
    return colors[confidence as keyof typeof colors] || colors.low;
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

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : nextOptimalTime ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Next optimal time:</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">
                  {OptimalPostingTimeAnalyzer.getDayName(nextOptimalTime.dayOfWeek)} at{' '}
                  {OptimalPostingTimeAnalyzer.formatHour(nextOptimalTime.hour)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeUntilNext(nextOptimalTime)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No recommendations available</div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Optimal Posting Times
          </CardTitle>
          <div className="flex items-center gap-2">
            {showPlatformSelector && (
              <Select value={selectedPlatform} onValueChange={(value: any) => setSelectedPlatform(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twitter">
                    <span className="flex items-center gap-2">
                      <span>𝕏</span> Twitter
                    </span>
                  </SelectItem>
                  <SelectItem value="linkedin">
                    <span className="flex items-center gap-2">
                      <span>💼</span> LinkedIn
                    </span>
                  </SelectItem>
                  <SelectItem value="instagram">
                    <span className="flex items-center gap-2">
                      <span>📷</span> Instagram
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalysis}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">
            <Info className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : analysis ? (
          <>
            {/* Analysis Summary */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <span className={`text-lg ${getPlatformColor(selectedPlatform)}`}>
                  {getPlatformIcon(selectedPlatform)}
                </span>
                <div>
                  <div className="font-medium capitalize">{selectedPlatform} Analysis</div>
                  <div className="text-sm text-muted-foreground">
                    Based on {analysis.dataPoints} data points
                  </div>
                </div>
              </div>
              <Badge className={getConfidenceBadge(analysis.confidence)}>
                {analysis.confidence} confidence
              </Badge>
            </div>

            {/* Next Optimal Time */}
            {nextOptimalTime && (
              <div className="p-4 border-2 border-dashed border-yellow-200 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Next Optimal Time</span>
                </div>
                <div className="text-lg font-bold text-yellow-900">
                  {OptimalPostingTimeAnalyzer.getDayName(nextOptimalTime.dayOfWeek)} at{' '}
                  {OptimalPostingTimeAnalyzer.formatHour(nextOptimalTime.hour)}
                </div>
                <div className="text-sm text-yellow-700">
                  {formatTimeUntilNext(nextOptimalTime)} • Score: {nextOptimalTime.score}/100
                </div>
              </div>
            )}

            {/* Recommendations List */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Top Recommendations
              </h4>
              {analysis.recommendations.map((rec: PostingTimeRecommendation, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {OptimalPostingTimeAnalyzer.getDayName(rec.dayOfWeek)} at{' '}
                        {OptimalPostingTimeAnalyzer.formatHour(rec.hour)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {rec.reason}
                      </div>
                    </div>
                  </div>
                  <Badge className={getScoreColor(rec.score)}>
                    {rec.score}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Timezone Info */}
            <div className="text-xs text-muted-foreground text-center">
              Times shown in {analysis.userTimezone} • Updated {new Date(analysis.analysisDate).toLocaleDateString()}
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2" />
            <p>No analysis available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
