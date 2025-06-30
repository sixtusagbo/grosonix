export interface SubscriptionTier {
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limits: {
    daily_generations: number;
    daily_adaptations: number;
    style_analysis: number;
  };
  popular?: boolean;
  badge?: string;
}

export interface RevenueCatConfig {
  apiKey: string;
  products: {
    pro_monthly: string;
    pro_yearly: string;
    agency_monthly: string;
    agency_yearly: string;
  };
  tiers: {
    free: SubscriptionTier;
    pro: SubscriptionTier;
    agency: SubscriptionTier;
  };
  freeTrial: {
    duration: number; // days
    productId: string;
  };
}

export const REVENUECAT_CONFIG: RevenueCatConfig = {
  // RevenueCat public API key (replace with your actual key)
  apiKey: process.env.NEXT_PUBLIC_REVENUECAT_API_KEY || '',
  
  // Product IDs from RevenueCat dashboard
  products: {
    pro_monthly: 'grosonix_pro_monthly',
    pro_yearly: 'grosonix_pro_yearly',
    agency_monthly: 'grosonix_agency_monthly',
    agency_yearly: 'grosonix_agency_yearly',
  },

  // Subscription tier configurations
  tiers: {
    free: {
      name: 'Free',
      description: 'Perfect for getting started',
      price: {
        monthly: 0,
        yearly: 0,
      },
      features: [
        '5 AI content generations per day',
        'Basic style analysis',
        'Single platform posting',
        'Community support',
      ],
      limits: {
        daily_generations: 5,
        daily_adaptations: 0,
        style_analysis: 1,
      },
    },
    pro: {
      name: 'Pro',
      description: 'For serious content creators',
      price: {
        monthly: 5,
        yearly: 50, // ~$24/month when billed yearly
      },
      features: [
        '50 AI content generations per day',
        'Cross-platform adaptation',
        'Advanced style analysis',
        'Optimal posting time recommendations',
        'Content calendar',
        'Priority support',
        '7-day free trial',
      ],
      limits: {
        daily_generations: 50,
        daily_adaptations: 25,
        style_analysis: 10,
      },
      popular: true,
      badge: 'Most Popular',
    },
    agency: {
      name: 'Agency',
      description: 'For teams and agencies',
      price: {
        monthly: 8,
        yearly: 80, // ~$82.50/month when billed yearly
      },
      features: [
        '200 AI content generations per day',
        'Unlimited cross-platform adaptation',
        'Advanced team collaboration',
        'Custom AI training',
        'White-label options',
        'Dedicated account manager',
        'Priority processing',
        'Advanced analytics',
      ],
      limits: {
        daily_generations: 200,
        daily_adaptations: 100,
        style_analysis: 50,
      },
      badge: 'Best Value',
    },
  },

  // Free trial configuration
  freeTrial: {
    duration: 7, // 7 days
    productId: 'grosonix_pro_monthly', // Free trial converts to Pro monthly
  },
};

// Helper functions
export const getSubscriptionTier = (tierName: string): SubscriptionTier | null => {
  const tier = REVENUECAT_CONFIG.tiers[tierName as keyof typeof REVENUECAT_CONFIG.tiers];
  return tier || null;
};

export const calculateYearlySavings = (tier: SubscriptionTier): number => {
  const monthlyTotal = tier.price.monthly * 12;
  const yearlyPrice = tier.price.yearly;
  return monthlyTotal - yearlyPrice;
};

export const getYearlySavingsPercentage = (tier: SubscriptionTier): number => {
  const monthlyTotal = tier.price.monthly * 12;
  const savings = calculateYearlySavings(tier);
  return Math.round((savings / monthlyTotal) * 100);
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);
};