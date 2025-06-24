"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  Settings, 
  TrendingUp,
  Gift,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { TrialStatusBanner } from './TrialStatusBanner';
import { UsageLimitBanner } from './UsageLimitBanner';
import { Paywall } from './Paywall';
import { formatPrice, REVENUECAT_CONFIG } from '@/lib/revenuecat/config';

interface SubscriptionDashboardProps {
  userId: string;
  currentSubscription?: any;
}

export function SubscriptionDashboard({ userId, currentSubscription }: SubscriptionDashboardProps) {
  const { 
    subscription, 
    loading, 
    error, 
    refreshSubscription,
    showPaywall,
    isPaywallOpen,
    hidePaywall
  } = useSubscription();
  
  const [usageStats, setUsageStats] = useState<any>(null);
  const [managementOptions, setManagementOptions] = useState<any>(null);

  useEffect(() => {
    fetchUsageStats();
    fetchManagementOptions();
  }, []);

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/ai/usage-stats');
      if (response.ok) {
        const data = await response.json();
        setUsageStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    }
  };

  const fetchManagementOptions = async () => {
    try {
      const response = await fetch('/api/subscription/manage');
      if (response.ok) {
        const data = await response.json();
        setManagementOptions(data.options);
      }
    } catch (error) {
      console.error('Failed to fetch management options:', error);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (response.ok) {
        await refreshSubscription();
        await fetchManagementOptions();
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      });

      if (response.ok) {
        await refreshSubscription();
        await fetchManagementOptions();
      }
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white';
      case 'agency':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trial Status Banner */}
      <TrialStatusBanner userId={userId} />
      
      {/* Usage Limit Banner */}
      <UsageLimitBanner userId={userId} />

      {/* Current Plan Overview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className={getTierBadgeColor(subscription?.tier || 'free')}>
                {subscription?.tier?.toUpperCase() || 'FREE'}
              </Badge>
              
              {subscription?.isInFreeTrial && (
                <Badge variant="outline" className="text-emerald-500 border-emerald-500">
                  <Gift className="w-3 h-3 mr-1" />
                  Free Trial
                </Badge>
              )}
              
              {subscription?.tier !== 'free' && (
                <div className="text-sm text-text-secondary">
                  {subscription?.expirationDate && (
                    <>
                      {subscription?.willRenew ? 'Renews' : 'Expires'} on{' '}
                      {formatDate(subscription.expirationDate)}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {managementOptions?.canUpgrade && (
                <Button
                  onClick={() => showPaywall('Upgrade plan')}
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
                >
                  Upgrade
                </Button>
              )}
              
              {managementOptions?.canCancel && (
                <Button
                  variant="outline"
                  onClick={handleCancelSubscription}
                  className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                >
                  Cancel
                </Button>
              )}
              
              {managementOptions?.canReactivate && (
                <Button
                  onClick={handleReactivateSubscription}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Reactivate
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Plan Comparison */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(REVENUECAT_CONFIG.tiers).map(([tierKey, tierData]) => (
                  <div
                    key={tierKey}
                    className={`p-4 rounded-lg border ${
                      subscription?.tier === tierKey
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-border/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{tierData.name}</h3>
                      {subscription?.tier === tierKey && (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-2xl font-bold mb-2">
                      {tierKey === 'free' ? 'Free' : formatPrice(tierData.price.monthly)}
                      {tierKey !== 'free' && <span className="text-sm font-normal">/month</span>}
                    </p>
                    <ul className="text-sm space-y-1">
                      {tierData.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {/* Usage Statistics */}
          {usageStats && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Content Generation</h4>
                    <div className="text-2xl font-bold text-emerald-500">
                      {usageStats.daily_generations}
                    </div>
                    <div className="text-sm text-text-secondary">
                      of {usageStats.daily_limit === -1 ? 'unlimited' : usageStats.daily_limit} daily generations
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Cross-platform Adaptations</h4>
                    <div className="text-2xl font-bold text-blue-500">
                      {usageStats.daily_adaptations}
                    </div>
                    <div className="text-sm text-text-secondary">
                      of {usageStats.adaptation_limit === -1 ? 'unlimited' : usageStats.adaptation_limit} daily adaptations
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {/* Billing Information */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Billing Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscription?.tier === 'free' ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary mb-4">
                    You're currently on the free plan. No billing information required.
                  </p>
                  <Button
                    onClick={() => showPaywall('Upgrade from billing')}
                    className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Current Plan</span>
                    <span className="font-semibold">{subscription?.tier?.toUpperCase()}</span>
                  </div>
                  
                  {subscription?.expirationDate && (
                    <div className="flex justify-between items-center">
                      <span>Next Billing Date</span>
                      <span>{formatDate(subscription.expirationDate)}</span>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => showPaywall('Manage billing')}
                      className="w-full"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Billing
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Paywall */}
      <Paywall
        isOpen={isPaywallOpen}
        onClose={hidePaywall}
        currentTier={subscription?.tier || 'free'}
        onSubscriptionSuccess={refreshSubscription}
      />
    </div>
  );
}
