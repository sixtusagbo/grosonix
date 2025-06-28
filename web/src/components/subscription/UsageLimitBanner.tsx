"use client";

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Zap, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface UsageStats {
  daily_generations: number;
  daily_limit: number;
  daily_adaptations: number;
  adaptation_limit: number;
  remaining_generations: number;
  remaining_adaptations: number;
  subscription_tier: 'free' | 'pro' | 'agency';
  reset_time: string;
}

interface UsageLimitBannerProps {
  userId: string;
}

export function UsageLimitBanner({ userId }: UsageLimitBannerProps) {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { showPaywall, subscription } = useSubscription();

  useEffect(() => {
    fetchUsageStats();
  }, [userId]);

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/ai/usage-stats');
      if (response.ok) {
        const data = await response.json();
        setUsageStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usageStats) {
    return null;
  }

  // Don't show banner for unlimited tiers
  if (usageStats.subscription_tier === 'agency' || 
      (usageStats.subscription_tier === 'pro' && usageStats.daily_limit === -1)) {
    return null;
  }

  const generationUsagePercent = (usageStats.daily_generations / usageStats.daily_limit) * 100;
  const adaptationUsagePercent = usageStats.adaptation_limit > 0 
    ? (usageStats.daily_adaptations / usageStats.adaptation_limit) * 100 
    : 0;

  // Show warning when usage is above 80%
  const showGenerationWarning = generationUsagePercent >= 80;
  const showAdaptationWarning = adaptationUsagePercent >= 80 && usageStats.adaptation_limit > 0;
  const showAnyWarning = showGenerationWarning || showAdaptationWarning;

  // Show limit reached when at 100%
  const generationLimitReached = usageStats.remaining_generations <= 0;
  const adaptationLimitReached = usageStats.remaining_adaptations <= 0 && usageStats.adaptation_limit > 0;

  if (!showAnyWarning && !generationLimitReached && !adaptationLimitReached) {
    return null;
  }

  const getAlertVariant = () => {
    if (generationLimitReached || adaptationLimitReached) {
      return 'destructive';
    }
    return 'default';
  };

  const getIcon = () => {
    if (generationLimitReached || adaptationLimitReached) {
      return <AlertTriangle className="w-5 h-5" />;
    }
    return <Zap className="w-5 h-5" />;
  };

  const getTitle = () => {
    if (generationLimitReached) {
      return 'Daily Generation Limit Reached';
    }
    if (adaptationLimitReached) {
      return 'Daily Adaptation Limit Reached';
    }
    if (showGenerationWarning) {
      return 'Approaching Daily Limit';
    }
    return 'Usage Warning';
  };

  const getDescription = () => {
    if (generationLimitReached) {
      return `You've used all ${usageStats.daily_limit} daily content generations. Upgrade to Pro for 50 generations per day or Agency for unlimited access.`;
    }
    if (adaptationLimitReached) {
      return `You've used all ${usageStats.adaptation_limit} daily cross-platform adaptations. Upgrade to continue adapting content for multiple platforms.`;
    }
    if (showGenerationWarning) {
      return `You've used ${usageStats.daily_generations} of ${usageStats.daily_limit} daily generations. Consider upgrading for more capacity.`;
    }
    return 'You\'re approaching your daily usage limits.';
  };

  const getResetTime = () => {
    const resetDate = new Date(usageStats.reset_time);
    const now = new Date();
    const hoursUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursUntilReset <= 1) {
      return 'in less than 1 hour';
    }
    return `in ${hoursUntilReset} hours`;
  };

  return (
    <Alert variant={getAlertVariant()} className="mb-6">
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 space-y-3">
          <div>
            <h4 className="font-semibold">{getTitle()}</h4>
            <AlertDescription className="mt-1">
              {getDescription()}
            </AlertDescription>
          </div>

          {/* Usage Progress Bars */}
          <div className="space-y-3">
            {/* Content Generation Usage */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Content Generations</span>
                <span>{usageStats.daily_generations} / {usageStats.daily_limit}</span>
              </div>
              <Progress 
                value={generationUsagePercent} 
                className="h-2"
              />
            </div>

            {/* Cross-platform Adaptation Usage */}
            {usageStats.adaptation_limit > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Cross-platform Adaptations</span>
                  <span>{usageStats.daily_adaptations} / {usageStats.adaptation_limit}</span>
                </div>
                <Progress 
                  value={adaptationUsagePercent} 
                  className="h-2"
                />
              </div>
            )}
          </div>

          {/* Reset Time */}
          <p className="text-sm text-muted-foreground">
            Limits reset {getResetTime()}
          </p>

          {/* Upgrade CTA */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={() => showPaywall('Usage limit reached')}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
            
            {usageStats.subscription_tier === 'free' && (
              <Button
                onClick={() => showPaywall('Start free trial')}
                variant="outline"
                size="sm"
              >
                Try Pro Free
              </Button>
            )}
          </div>
        </div>
      </div>
    </Alert>
  );
}
