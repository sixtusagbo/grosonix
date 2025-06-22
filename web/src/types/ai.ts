export interface ContentSuggestion {
  id: string;
  content: string;
  platform: "twitter" | "instagram" | "linkedin";
  hashtags: string[];
  engagement_score: number;
  created_at: string;
  is_saved?: boolean;
  is_used?: boolean;
  // New trending features
  trending_score?: number;
  viral_potential?: number;
  hashtag_analysis?: {
    trending: string[];
    recommended: string[];
    volume_score: number;
  };
}

export interface StyleProfile {
  id?: string;
  user_id: string;
  tone: string;
  default_tone?: string;
  topics: string[];
  writing_patterns: string[];
  engagement_strategies: string[];
  vocabulary_level: "simple" | "intermediate" | "advanced" | "mixed";
  emoji_usage: "minimal" | "moderate" | "heavy";
  hashtag_style: string;
  content_length_preference: "short" | "medium" | "long" | "mixed";
  analyzed_posts_count: number;
  confidence_score: number;
  last_analyzed: string;
  created_at?: string;
  updated_at?: string;
}

export interface VoiceSample {
  id?: string;
  user_id: string;
  platform: "twitter" | "instagram" | "linkedin";
  content: string;
  additional_instructions?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlatformContent {
  platform: "twitter" | "instagram" | "linkedin";
  content: string;
  hashtags: string[];
  character_count: number;
  optimized: boolean;
}

export interface CrossPlatformContent {
  original_content: string;
  adaptations: PlatformContent[];
  created_at: string;
}

export interface UsageStats {
  daily_generations: number;
  daily_limit: number;
  daily_adaptations: number;
  adaptation_limit: number;
  remaining_generations?: number;
  remaining_adaptations?: number;
  subscription_tier: "free" | "pro" | "agency";
  is_unlimited?: boolean;
  reset_time: string;
}

export interface ContentGenerationRequest {
  prompt: string;
  platform: "twitter" | "instagram" | "linkedin";
  tone?:
    | "professional"
    | "casual"
    | "humorous"
    | "inspirational"
    | "educational";
  topic?: string;
  use_voice_style?: boolean;
  ignore_tone?: boolean;
  // New trending features
  use_trending_topics?: boolean;
  target_hashtags?: string[];
}

export interface StyleAnalysisRequest {
  voice_samples?: VoiceSample[];
  default_tone?: string;
  force_refresh?: boolean;
}

export interface VoiceSampleRequest {
  platform: "twitter" | "instagram" | "linkedin";
  content: string;
  additional_instructions?: string;
}

export interface ContentAdaptationRequest {
  content: string;
  target_platforms: ("twitter" | "instagram" | "linkedin")[];
}

// New interfaces for trending topics
export interface TrendingTopic {
  topic: string;
  platform: string;
  volume: number;
  growth_rate: number;
  hashtags: string[];
  category: string;
  relevance_score?: number;
}

export interface HashtagSuggestion {
  hashtag: string;
  category: 'trending' | 'industry' | 'skill' | 'career' | 'general';
  relevance_score: number;
  volume_estimate: number;
  description: string;
}

export interface TrendingAnalysis {
  trending_topics: TrendingTopic[];
  recommended_hashtags: HashtagSuggestion[];
  viral_potential_score: number;
  optimization_suggestions: string[];
}

export const PLATFORM_LIMITS = {
  twitter: {
    maxCharacters: 280,
    recommendedHashtags: 3,
    maxHashtags: 5,
  },
  instagram: {
    maxCharacters: 2200,
    recommendedHashtags: 10,
    maxHashtags: 30,
  },
  linkedin: {
    maxCharacters: 3000,
    recommendedHashtags: 3,
    maxHashtags: 5,
  },
} as const;

export const SUBSCRIPTION_FEATURES = {
  free: {
    daily_generations: 5,
    daily_adaptations: 0,
    style_analysis: 1,
    trending_analysis: 1,
    features: ["Basic content generation", "Limited style analysis", "Basic trending topics"],
  },
  pro: {
    daily_generations: 50,
    daily_adaptations: 25,
    style_analysis: 10,
    trending_analysis: 25,
    features: [
      "Advanced content generation",
      "Cross-platform adaptation",
      "Detailed style analysis",
      "Advanced trending topics analysis",
      "Hashtag optimization",
      "Priority support",
    ],
  },
  agency: {
    daily_generations: 200,
    daily_adaptations: 100,
    style_analysis: 50,
    trending_analysis: 100,
    features: [
      "Unlimited content generation",
      "Advanced cross-platform adaptation",
      "Team collaboration",
      "Custom AI training",
      "Priority processing",
      "Advanced trending analysis",
      "Custom hashtag strategies",
    ],
  },
} as const;