'use client';

import { useState, useEffect } from 'react';
import { UsageStats as UsageStatsType, SUBSCRIPTION_FEATURES } from '@/types/ai';
import { aiApiClient } from '@/lib/api/ai-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, BarChart3, Crown, Zap, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface UsageStatsProps {
  onUpgradeClick?: () => void;
}

export function UsageStats({ onUpgradeClick }: UsageStatsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UsageStatsType | null>(null);

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    setIsLoading(true);
    try {
      const result = await aiApiClient.getUsageStats();
      setStats(result);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
      toast.error('Failed to load usage statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return limit > 0 ? (used / limit) * 100 : 0;
  };

  const getUsageColor = (used: number, limit: number) => {
    const percentage = getUsagePercentage(used, limit);
    if (percentage >= 100) return 'text-red-400';
    if (percentage >= 80) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getProgressColor = (used: number, limit: number) => {
    const percentage = getUsagePercentage(used, limit);
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free':
        return <Zap className="w-4 h-4" />;
      case 'pro':
        return <TrendingUp className="w-4 h-4" />;
      case 'agency':
        return <Crown className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'text-gray-400';
      case 'pro':
        return 'text-electric-purple';
      case 'agency':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatResetTime = (resetTime: string) => {
    const reset = new Date(resetTime);
    const now = new Date();
    const diff = reset.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-electric-purple/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-electric-purple" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="glass-card border-electric-purple/20">
        <CardContent className="text-center py-12">
          <p className="text-silver">Failed to load usage statistics</p>
          <Button 
            onClick={loadUsageStats} 
            variant="outline" 
            className="mt-4 border-electric-purple/50"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const tierFeatures = SUBSCRIPTION_FEATURES[stats.subscription_tier];
  const isNearLimit = getUsagePercentage(stats.daily_generations, stats.daily_limit) >= 80;
  const isAtLimit = stats.daily_generations >= stats.daily_limit;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="glass-card border-electric-purple/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5 text-electric-purple" />
            Usage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subscription Tier */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={getTierColor(stats.subscription_tier)}>
                {getTierIcon(stats.subscription_tier)}
              </div>
              <span className="font-semibold text-white capitalize">
                {stats.subscription_tier} Plan
              </span>
            </div>
            {stats.subscription_tier === 'free' && (
              <Button
                onClick={onUpgradeClick}
                size="sm"
                className="bg-electric-purple hover:bg-electric-purple/80"
              >
                <Crown className="w-4 h-4 mr-1" />
                Upgrade
              </Button>
            )}
          </div>

          {/* Daily Generations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Daily Content Generations</span>
              <span className={`text-sm font-medium ${getUsageColor(stats.daily_generations, stats.daily_limit)}`}>
                {stats.daily_generations} / {stats.daily_limit}
              </span>
            </div>
            <Progress
              value={getUsagePercentage(stats.daily_generations, stats.daily_limit)}
              className="h-2"
            />
            {isAtLimit && (
              <p className="text-xs text-red-400">
                Daily limit reached. {stats.subscription_tier === 'free' ? 'Upgrade to continue generating content.' : 'Resets in ' + formatResetTime(stats.reset_time)}
              </p>
            )}
            {isNearLimit && !isAtLimit && (
              <p className="text-xs text-yellow-400">
                Approaching daily limit. Consider upgrading for more generations.
              </p>
            )}
          </div>

          {/* Daily Adaptations */}
          {stats.subscription_tier !== 'free' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Daily Content Adaptations</span>
                <span className={`text-sm font-medium ${getUsageColor(stats.daily_adaptations, stats.adaptation_limit)}`}>
                  {stats.daily_adaptations} / {stats.adaptation_limit}
                </span>
              </div>
              <Progress
                value={getUsagePercentage(stats.daily_adaptations, stats.adaptation_limit)}
                className="h-2"
              />
            </div>
          )}

          {/* Reset Timer */}
          <div className="flex items-center gap-2 text-sm text-silver">
            <Clock className="w-4 h-4" />
            <span>Resets in {formatResetTime(stats.reset_time)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card className="glass-card border-electric-purple/20">
        <CardHeader>
          <CardTitle className="text-white">Plan Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tierFeatures.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-electric-purple rounded-full" />
                <span className="text-sm text-silver">{feature}</span>
              </div>
            ))}
          </div>

          {stats.subscription_tier === 'free' && (
            <div className="mt-6 p-4 bg-electric-purple/10 rounded-lg border border-electric-purple/20">
              <h4 className="font-semibold text-white mb-2">Upgrade to Pro</h4>
              <p className="text-sm text-silver mb-3">
                Get 10x more content generations, cross-platform adaptation, and advanced features.
              </p>
              <Button
                onClick={onUpgradeClick}
                className="w-full bg-electric-purple hover:bg-electric-purple/80"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card border-electric-purple/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-electric-purple">
              {stats.daily_generations}
            </div>
            <div className="text-xs text-silver">Generated Today</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-electric-purple/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-electric-purple">
              {stats.daily_adaptations}
            </div>
            <div className="text-xs text-silver">Adapted Today</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-electric-purple/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-electric-purple">
              {stats.daily_limit - stats.daily_generations}
            </div>
            <div className="text-xs text-silver">Remaining</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-electric-purple/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-electric-purple capitalize">
              {stats.subscription_tier}
            </div>
            <div className="text-xs text-silver">Current Plan</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
