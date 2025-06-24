"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Users } from "lucide-react";
import { SubscriptionTier, formatPrice, getYearlySavingsPercentage } from "@/lib/revenuecat/config";
import { motion } from "framer-motion";

interface PricingCardProps {
  tier: 'free' | 'pro' | 'agency';
  tierData: SubscriptionTier;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  onSelectPlan: (tier: string, billing: 'monthly' | 'yearly') => void;
  loading?: boolean;
  billingPeriod: 'monthly' | 'yearly';
}

export function PricingCard({
  tier,
  tierData,
  isCurrentPlan = false,
  isPopular = false,
  onSelectPlan,
  loading = false,
  billingPeriod,
}: PricingCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const price = billingPeriod === 'yearly' ? tierData.price.yearly : tierData.price.monthly;
  const monthlyPrice = billingPeriod === 'yearly' ? tierData.price.yearly / 12 : tierData.price.monthly;
  const savings = billingPeriod === 'yearly' ? getYearlySavingsPercentage(tierData) : 0;

  const getIcon = () => {
    switch (tier) {
      case 'free':
        return <Zap className="w-6 h-6 text-emerald-500" />;
      case 'pro':
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 'agency':
        return <Users className="w-6 h-6 text-purple-500" />;
      default:
        return <Zap className="w-6 h-6 text-emerald-500" />;
    }
  };

  const getCardStyle = () => {
    if (isPopular || tier === 'pro') {
      return "border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 shadow-xl";
    }
    if (tier === 'agency') {
      return "border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10 shadow-xl";
    }
    return "border border-border/50 bg-surface/30";
  };

  const getButtonStyle = () => {
    if (isCurrentPlan) {
      return "bg-gray-500 hover:bg-gray-600 text-white cursor-not-allowed";
    }
    if (tier === 'free') {
      return "bg-emerald-500 hover:bg-emerald-600 text-white";
    }
    if (tier === 'pro') {
      return "bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white";
    }
    return "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white";
  };

  const getButtonText = () => {
    if (isCurrentPlan) return "Current Plan";
    if (tier === 'free') return "Get Started";
    if (tier === 'pro' && billingPeriod === 'monthly') return "Start Free Trial";
    return "Upgrade Now";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative"
    >
      {/* Popular Badge */}
      {(isPopular || tierData.badge) && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-3 py-1 text-xs font-semibold">
            {tierData.badge || 'Most Popular'}
          </Badge>
        </div>
      )}

      <Card className={`relative h-full transition-all duration-300 ${getCardStyle()} ${
        isHovered ? 'scale-105 shadow-2xl' : ''
      }`}>
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-3">
            {getIcon()}
          </div>
          
          <h3 className="text-2xl font-bold text-text-primary mb-2">
            {tierData.name}
          </h3>
          
          <p className="text-text-secondary text-sm mb-4">
            {tierData.description}
          </p>

          {/* Pricing */}
          <div className="space-y-2">
            {tier === 'free' ? (
              <div className="text-4xl font-bold text-text-primary">
                Free
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-text-primary">
                    {formatPrice(monthlyPrice)}
                  </span>
                  <span className="text-text-secondary text-sm">
                    /month
                  </span>
                </div>
                
                {billingPeriod === 'yearly' && savings > 0 && (
                  <div className="text-sm text-emerald-500 font-medium">
                    Save {savings}% annually
                  </div>
                )}
                
                {billingPeriod === 'yearly' && (
                  <div className="text-xs text-text-secondary">
                    Billed {formatPrice(price)} yearly
                  </div>
                )}
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Features List */}
          <ul className="space-y-3">
            {tierData.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-text-secondary text-sm leading-relaxed">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {/* Usage Limits */}
          <div className="pt-4 border-t border-border/30">
            <h4 className="text-sm font-semibold text-text-primary mb-3">
              Usage Limits
            </h4>
            <div className="space-y-2 text-xs text-text-secondary">
              <div className="flex justify-between">
                <span>Daily Generations:</span>
                <span className="font-medium">
                  {tierData.limits.daily_generations === -1 ? 'Unlimited' : tierData.limits.daily_generations}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cross-platform Adaptations:</span>
                <span className="font-medium">
                  {tierData.limits.daily_adaptations === -1 ? 'Unlimited' : tierData.limits.daily_adaptations}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Style Analysis:</span>
                <span className="font-medium">
                  {tierData.limits.style_analysis === -1 ? 'Unlimited' : tierData.limits.style_analysis}
                </span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => onSelectPlan(tier, billingPeriod)}
            disabled={isCurrentPlan || loading}
            className={`w-full py-3 font-semibold transition-all duration-200 ${getButtonStyle()}`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              getButtonText()
            )}
          </Button>

          {/* Free Trial Note */}
          {tier === 'pro' && !isCurrentPlan && (
            <p className="text-xs text-center text-text-secondary">
              7-day free trial • Cancel anytime
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
