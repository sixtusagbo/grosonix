"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  CheckCircle, 
  X,
  Loader2
} from 'lucide-react';
import { formatPrice, REVENUECAT_CONFIG, getYearlySavingsPercentage } from '@/lib/revenuecat/config';

interface SubscriptionChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  changeType: 'upgrade' | 'downgrade' | 'change-billing';
  currentTier: 'free' | 'pro' | 'agency';
  onChangeSubscription: (newPlan: string, billingPeriod: 'monthly' | 'yearly') => Promise<void>;
}

export function SubscriptionChangeModal({
  isOpen,
  onClose,
  changeType,
  currentTier,
  onChangeSubscription,
}: SubscriptionChangeModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  // Determine which plans to show based on change type and current tier
  const getPlansToShow = () => {
    if (changeType === 'upgrade') {
      if (currentTier === 'free') {
        return ['pro', 'agency'];
      } else if (currentTier === 'pro') {
        return ['agency'];
      }
    } else if (changeType === 'downgrade') {
      if (currentTier === 'agency') {
        return ['pro', 'free'];
      } else if (currentTier === 'pro') {
        return ['free'];
      }
    } else if (changeType === 'change-billing') {
      return [currentTier];
    }
    return [];
  };

  const plansToShow = getPlansToShow();

  const getModalTitle = () => {
    switch (changeType) {
      case 'upgrade':
        return 'Upgrade Your Subscription';
      case 'downgrade':
        return 'Downgrade Your Subscription';
      case 'change-billing':
        return 'Change Billing Period';
      default:
        return 'Modify Subscription';
    }
  };

  const handleSelectPlan = async (tier: string) => {
    if (tier === 'free') {
      // For free tier, we just cancel the subscription
      onClose();
      return;
    }

    setLoading(true);
    try {
      await onChangeSubscription(tier, billingPeriod);
    } catch (error) {
      console.error('Error changing subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            {getModalTitle()}
          </DialogTitle>

          {changeType === 'change-billing' && (
            <p className="text-text-secondary text-center mb-6">
              Choose your preferred billing period
            </p>
          )}
        </DialogHeader>

        {/* Billing Toggle (only for change-billing or when showing multiple plans) */}
        {(changeType === 'change-billing' || plansToShow.length > 0) && (
          <div className="flex items-center justify-center gap-4 mb-8">
            <span
              className={`text-sm ${
                billingPeriod === 'monthly'
                  ? 'text-text-primary font-medium'
                  : 'text-text-secondary'
              }`}>
              Monthly
            </span>
            <Switch
              checked={billingPeriod === 'yearly'}
              onCheckedChange={(checked) =>
                setBillingPeriod(checked ? 'yearly' : 'monthly')
              }
            />
            <span
              className={`text-sm ${
                billingPeriod === 'yearly'
                  ? 'text-text-primary font-medium'
                  : 'text-text-secondary'
              }`}>
              Yearly
            </span>
            {billingPeriod === 'yearly' && (
              <span className="text-xs bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-full">
                Save up to 17%
              </span>
            )}
          </div>
        )}

        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plansToShow.map((tierKey) => {
            const tierData = REVENUECAT_CONFIG.tiers[tierKey as keyof typeof REVENUECAT_CONFIG.tiers];
            const price = billingPeriod === 'yearly' ? tierData.price.yearly : tierData.price.monthly;
            const monthlyPrice = billingPeriod === 'yearly' ? tierData.price.yearly / 12 : tierData.price.monthly;
            const savings = billingPeriod === 'yearly' ? getYearlySavingsPercentage(tierData) : 0;
            
            return (
              <div 
                key={tierKey}
                className="border rounded-lg p-6 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{tierData.name}</h3>
                  {tierKey === currentTier && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                      Current Plan
                    </Badge>
                  )}
                </div>
                
                <div className="mb-6">
                  {tierKey === 'free' ? (
                    <div className="text-3xl font-bold">Free</div>
                  ) : (
                    <>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">
                          {formatPrice(monthlyPrice)}
                        </span>
                        <span className="text-text-secondary text-sm ml-1">
                          /month
                        </span>
                      </div>
                      
                      {billingPeriod === 'yearly' && savings > 0 && (
                        <div className="text-sm text-emerald-500 font-medium mt-1">
                          Save {savings}% annually
                        </div>
                      )}
                      
                      {billingPeriod === 'yearly' && (
                        <div className="text-xs text-text-secondary mt-1">
                          Billed {formatPrice(price)} yearly
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <ul className="space-y-3 mb-6">
                  {tierData.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleSelectPlan(tierKey)}
                  disabled={loading || tierKey === currentTier}
                  className="w-full"
                  variant={tierKey === 'free' ? 'outline' : 'default'}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : changeType === 'upgrade' ? (
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                  ) : changeType === 'downgrade' ? (
                    <ArrowDownRight className="w-4 h-4 mr-2" />
                  ) : (
                    <Calendar className="w-4 h-4 mr-2" />
                  )}
                  
                  {tierKey === currentTier ? 'Current Plan' : 
                   tierKey === 'free' ? 'Downgrade to Free' :
                   changeType === 'upgrade' ? `Upgrade to ${tierData.name}` :
                   changeType === 'downgrade' ? `Downgrade to ${tierData.name}` :
                   `Switch to ${billingPeriod}`}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Change Billing Period (when current tier is selected) */}
        {changeType === 'change-billing' && (
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold text-lg">Change Billing Period</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`border rounded-lg p-4 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200 ${
                  billingPeriod === 'monthly' ? 'border-emerald-500 bg-emerald-500/10' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Monthly</h4>
                  {billingPeriod === 'monthly' && (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  Flexible monthly payments
                </p>
                <Button
                  onClick={() => setBillingPeriod('monthly')}
                  disabled={billingPeriod === 'monthly' || loading}
                  variant="outline"
                  className="w-full"
                >
                  Select Monthly
                </Button>
              </div>
              
              <div 
                className={`border rounded-lg p-4 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200 ${
                  billingPeriod === 'yearly' ? 'border-emerald-500 bg-emerald-500/10' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Yearly</h4>
                  {billingPeriod === 'yearly' && (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  Save up to 17% with annual billing
                </p>
                <Button
                  onClick={() => setBillingPeriod('yearly')}
                  disabled={billingPeriod === 'yearly' || loading}
                  variant="outline"
                  className="w-full"
                >
                  Select Yearly
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={onClose} variant="outline" disabled={loading}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              
              <Button 
                onClick={() => handleSelectPlan(currentTier)}
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4 mr-2" />
                )}
                Confirm Change
              </Button>
            </div>
          </div>
        )}

        {/* Downgrade Warning */}
        {changeType === 'downgrade' && (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-500">Important Note About Downgrading</h4>
                <p className="text-sm text-text-secondary mt-1">
                  When you downgrade your subscription:
                </p>
                <ul className="text-sm text-text-secondary mt-2 space-y-1 list-disc pl-4">
                  <li>You'll continue to have access to your current plan until the end of your billing period</li>
                  <li>Your new plan will take effect at the next billing cycle</li>
                  <li>No refunds are provided for unused time on your current plan</li>
                  {currentTier === 'agency' && (
                    <li>Team collaboration features will no longer be available</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Policy */}
        {changeType !== 'change-billing' && (
          <div className="text-center text-xs text-text-secondary pt-4 border-t border-border/30 mt-6">
            <p>🔒 Secure payment • 💳 Cancel anytime • 📞 24/7 support</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}