"use client";

import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Paywall } from './Paywall';

interface PaywallTriggerProps {
  children: ReactNode;
  feature: 'content_generation' | 'cross_platform_adaptation' | 'style_analysis' | 'premium_feature';
  fallback?: ReactNode;
  title?: string;
  description?: string;
  highlightTier?: 'pro' | 'agency';
}

export function PaywallTrigger({
  children,
  feature,
  fallback,
  title,
  description,
  highlightTier = 'pro',
}: PaywallTriggerProps) {
  const { 
    subscription, 
    loading, 
    isPaywallOpen, 
    showPaywall, 
    hidePaywall, 
    refreshSubscription 
  } = useSubscription();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Check if user has access to the feature
  const hasAccess = () => {
    if (!subscription) return false;

    switch (feature) {
      case 'content_generation':
        return subscription.tier !== 'free' || subscription.isActive;
      
      case 'cross_platform_adaptation':
        return subscription.tier === 'pro' || subscription.tier === 'agency';
      
      case 'style_analysis':
        return true; // All tiers have some level of style analysis
      
      case 'premium_feature':
        return subscription.tier === 'pro' || subscription.tier === 'agency';
      
      default:
        return false;
    }
  };

  const getPaywallTitle = () => {
    if (title) return title;
    
    switch (feature) {
      case 'content_generation':
        return 'Unlock Unlimited Content Generation';
      case 'cross_platform_adaptation':
        return 'Upgrade for Cross-Platform Magic';
      case 'style_analysis':
        return 'Advanced Style Analysis';
      case 'premium_feature':
        return 'Premium Feature Access';
      default:
        return 'Upgrade Your Plan';
    }
  };

  const getPaywallDescription = () => {
    if (description) return description;
    
    switch (feature) {
      case 'content_generation':
        return 'Generate unlimited AI-powered content for all your social media platforms';
      case 'cross_platform_adaptation':
        return 'Automatically adapt your content for Twitter, Instagram, and LinkedIn with AI optimization';
      case 'style_analysis':
        return 'Get detailed insights into your writing style and tone preferences';
      case 'premium_feature':
        return 'Access premium features designed for serious content creators';
      default:
        return 'Choose the perfect plan for your social media growth needs';
    }
  };

  // If user has access, render children
  if (hasAccess()) {
    return (
      <>
        {children}
        <Paywall
          isOpen={isPaywallOpen}
          onClose={hidePaywall}
          title={getPaywallTitle()}
          description={getPaywallDescription()}
          currentTier={subscription?.tier || 'free'}
          highlightTier={highlightTier}
          onSubscriptionSuccess={refreshSubscription}
        />
      </>
    );
  }

  // If no access, show fallback or trigger paywall
  return (
    <>
      {fallback || (
        <div className="glass-card p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              {getPaywallTitle()}
            </h3>
            <p className="text-text-secondary mb-6">
              {getPaywallDescription()}
            </p>
            <button
              onClick={() => showPaywall(`Access ${feature.replace('_', ' ')}`)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}
      
      <Paywall
        isOpen={isPaywallOpen}
        onClose={hidePaywall}
        title={getPaywallTitle()}
        description={getPaywallDescription()}
        currentTier={subscription?.tier || 'free'}
        highlightTier={highlightTier}
        onSubscriptionSuccess={refreshSubscription}
      />
    </>
  );
}
