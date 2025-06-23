"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Heart,
  X,
  Copy,
  Calendar,
  Target,
  Activity,
  Loader2,
} from "lucide-react";
import { aiApiClient, formatPlatformName, getPlatformColor, getPlatformIcon } from "@/lib/api/ai-client";
import { ContentAnalytics as ContentAnalyticsType } from "@/types/ai";
import { toast } from "sonner";

interface ContentAnalyticsProps {
  onUpgradeClick?: () => void;
}

export function ContentAnalytics({ onUpgradeClick }: ContentAnalyticsProps) {
  const [analytics, setAnalytics] = useState<ContentAnalyticsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod, selectedPlatform]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const result = await aiApiClient.getContentAnalytics(
        parseInt(selectedPeriod),
        selectedPlatform === "all" ? undefined : selectedPlatform
      );
      setAnalytics(result);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100) / 100}%`;
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getSaveRateColor = (rate: number) => {
    if (rate >= 50) return "text-green-400";
    if (rate >= 25) return "text-yellow-400";
    return "text-red-400";
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-emerald-500/20">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-theme-secondary">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="glass-card border-emerald-500/20">
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold text-theme-primary mb-2">
            No Analytics Data Yet
          </h3>
          <p className="text-theme-secondary">
            Start generating and interacting with content to see your analytics!
          </p>
        </CardContent>
      </Card>
    );
  }

  const { summary, platform_breakdown, daily_metrics, recent_activity } = analytics;

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card className="glass-card border-emerald-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-theme-primary">Content Analytics</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-32 glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-24 glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={loadAnalytics}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10">
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-theme-secondary">Generated</span>
            </div>
            <div className="text-2xl font-bold text-theme-primary">
              {summary.total_generated}
            </div>
            <div className="text-xs text-theme-muted">Total suggestions</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-green-400" />
              <span className="text-sm text-theme-secondary">Saved</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {summary.total_saved}
            </div>
            <div className="text-xs text-theme-muted">
              {formatPercentage(summary.overall_save_rate)} save rate
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <X className="w-4 h-4 text-red-400" />
              <span className="text-sm text-theme-secondary">Discarded</span>
            </div>
            <div className="text-2xl font-bold text-red-400">
              {summary.total_discarded}
            </div>
            <div className="text-xs text-theme-muted">
              {summary.total_generated > 0
                ? formatPercentage((summary.total_discarded / summary.total_generated) * 100)
                : "0%"} discard rate
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-theme-secondary">Avg. Score</span>
            </div>
            <div className={`text-2xl font-bold ${getEngagementColor(summary.avg_engagement_score)}`}>
              {Math.round(summary.avg_engagement_score)}
            </div>
            <div className="text-xs text-theme-muted">Engagement score</div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      {platform_breakdown.length > 0 && (
        <Card className="glass-card border-emerald-500/20">
          <CardHeader>
            <CardTitle className="text-theme-primary">Platform Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platform_breakdown.map((platform) => (
                <div
                  key={platform.platform}
                  className="p-4 bg-surface rounded-lg border border-emerald-500/20"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getPlatformIcon(platform.platform)}
                      </span>
                      <span className={`font-medium ${getPlatformColor(platform.platform)}`}>
                        {formatPlatformName(platform.platform)}
                      </span>
                      {summary.most_active_platform === platform.platform && (
                        <Badge variant="secondary" className="text-xs bg-emerald-500/20 text-emerald-400">
                          Most Active
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getSaveRateColor(platform.save_rate)}`}>
                        {formatPercentage(platform.save_rate)} save rate
                      </div>
                      <div className={`text-xs ${getEngagementColor(platform.avg_engagement_score)}`}>
                        {Math.round(platform.avg_engagement_score)} avg score
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-theme-primary">
                        {platform.generated}
                      </div>
                      <div className="text-xs text-theme-muted">Generated</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-400">
                        {platform.saved}
                      </div>
                      <div className="text-xs text-theme-muted">Saved</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-400">
                        {platform.discarded}
                      </div>
                      <div className="text-xs text-theme-muted">Discarded</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-emerald-400">
                        {platform.used}
                      </div>
                      <div className="text-xs text-theme-muted">Used</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recent_activity.length > 0 && (
        <Card className="glass-card border-emerald-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-theme-primary">
              <Activity className="w-5 h-5 text-emerald-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recent_activity.slice(0, 10).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-surface rounded-lg border border-emerald-500/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {getPlatformIcon(activity.platform)}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-theme-primary capitalize">
                        {activity.action_type.replace('_', ' ')}
                      </div>
                      <div className={`text-xs ${getPlatformColor(activity.platform)}`}>
                        {formatPlatformName(activity.platform)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-theme-muted">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights & Recommendations */}
      <Card className="glass-card border-emerald-500/20">
        <CardHeader>
          <CardTitle className="text-theme-primary">Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary.overall_save_rate < 20 && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-400">Low Save Rate</p>
                  <p className="text-xs text-theme-secondary mt-1">
                    Your save rate is {formatPercentage(summary.overall_save_rate)}. Try adjusting your content preferences or voice samples for more relevant suggestions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {summary.avg_engagement_score < 60 && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-orange-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-400">Engagement Opportunity</p>
                  <p className="text-xs text-theme-secondary mt-1">
                    Your average engagement score is {Math.round(summary.avg_engagement_score)}. Consider refining your style analysis for higher-scoring suggestions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {summary.overall_save_rate >= 50 && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Heart className="w-4 h-4 text-green-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-400">Great Performance!</p>
                  <p className="text-xs text-theme-secondary mt-1">
                    You're saving {formatPercentage(summary.overall_save_rate)} of generated content. Your AI is well-tuned to your preferences!
                  </p>
                </div>
              </div>
            </div>
          )}

          {summary.total_generated === 0 && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-emerald-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Get Started</p>
                  <p className="text-xs text-theme-secondary mt-1">
                    Start generating content to see your analytics! Use the Swipe tab to create your first suggestions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}