"use client";

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Crown, Gift, AlertTriangle } from 'lucide-react';
import { trialManager, TrialStatus } from '@/lib/subscription/trial-manager';
import { useSubscription } from '@/hooks/useSubscription';

interface TrialStatusBannerProps {
  userId: string;
}

export function TrialStatusBanner({ userId }: TrialStatusBannerProps) {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { showPaywall, refreshSubscription } = useSubscription();

  useEffect(() => {
    fetchTrialStatus();
  }, [userId]);

  const fetchTrialStatus = async () => {
    try {
      const status = await trialManager.getTrialStatus(userId);
      setTrialStatus(status);
    } catch (error) {
      console.error('Failed to fetch trial status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    try {
      const result = await trialManager.startFreeTrial(userId);
      if (result.success) {
        await refreshSubscription();
        await fetchTrialStatus();
      } else {
        console.error('Failed to start trial:', result.error);
      }
    } catch (error) {
      console.error('Trial start error:', error);
    }
  };

  if (loading || !trialStatus) {
    return null;
  }

  // Show trial eligibility banner
  if (trialStatus.isEligible && !trialStatus.isInTrial && !trialStatus.hasTrialExpired) {
    return (
      <Alert className="mb-6 border-emerald-500/50 bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
        <Gift className="w-5 h-5 text-emerald-500" />
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <h4 className="font-semibold text-emerald-700 dark:text-emerald-300">
              🎉 Free Pro Trial Available!
            </h4>
            <AlertDescription className="text-emerald-600 dark:text-emerald-400">
              Try all Pro features free for 7 days. No credit card required.
            </AlertDescription>
          </div>
          <Button
            onClick={handleStartTrial}
            className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white ml-4"
          >
            <Crown className="w-4 h-4 mr-2" />
            Start Free Trial
          </Button>
        </div>
      </Alert>
    );
  }

  // Show active trial status
  if (trialStatus.isInTrial && trialStatus.daysRemaining !== undefined) {
    const isExpiringSoon = trialStatus.daysRemaining <= 2;
    
    return (
      <Alert className={`mb-6 ${
        isExpiringSoon 
          ? 'border-yellow-500/50 bg-yellow-500/10' 
          : 'border-emerald-500/50 bg-emerald-500/10'
      }`}>
        <div className="flex items-center gap-2">
          {isExpiringSoon ? (
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          ) : (
            <Clock className="w-5 h-5 text-emerald-500" />
          )}
          <Badge variant="outline" className="text-xs">
            Pro Trial
          </Badge>
        </div>
        
        <div className="flex items-center justify-between w-full mt-2">
          <div className="flex-1">
            <h4 className={`font-semibold ${
              isExpiringSoon 
                ? 'text-yellow-700 dark:text-yellow-300' 
                : 'text-emerald-700 dark:text-emerald-300'
            }`}>
              {isExpiringSoon 
                ? `Trial expires in ${trialStatus.daysRemaining} day${trialStatus.daysRemaining === 1 ? '' : 's'}!`
                : `Pro Trial Active - ${trialStatus.daysRemaining} day${trialStatus.daysRemaining === 1 ? '' : 's'} remaining`
              }
            </h4>
            <AlertDescription className={
              isExpiringSoon 
                ? 'text-yellow-600 dark:text-yellow-400' 
                : 'text-emerald-600 dark:text-emerald-400'
            }>
              {isExpiringSoon 
                ? 'Upgrade now to continue enjoying Pro features without interruption.'
                : 'Enjoying unlimited content generation and cross-platform adaptation.'
              }
            </AlertDescription>
          </div>
          
          <div className="flex gap-2 ml-4">
            {isExpiringSoon && (
              <Button
                onClick={() => showPaywall('Trial expiring soon')}
                className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => showPaywall('Manage trial')}
            >
              View Plans
            </Button>
          </div>
        </div>
      </Alert>
    );
  }

  // Show trial expired message
  if (trialStatus.hasTrialExpired) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="w-5 h-5" />
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <h4 className="font-semibold">
              Your Pro Trial Has Expired
            </h4>
            <AlertDescription>
              Your account has been downgraded to the Free plan. Upgrade to continue using Pro features.
            </AlertDescription>
          </div>
          <Button
            onClick={() => showPaywall('Trial expired')}
            className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white ml-4"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        </div>
      </Alert>
    );
  }

  return null;
}
