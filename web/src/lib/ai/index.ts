// AI Services Export Index
export { OpenAIService } from './openai';
export type { ContentGenerationOptions, GeneratedContent } from './openai';

export { ContentAdapter } from './content-adapter';
export type { PlatformContent, CrossPlatformContent } from './content-adapter';

export { StyleAnalyzer } from './style-analyzer';
export type { UserStyleProfile, PostAnalysis } from './style-analyzer';

export { RateLimiter } from './rate-limiter';
export type { UsageLimits, UsageQuota } from './rate-limiter';

// Re-export commonly used types
export type SocialPlatform = 'twitter' | 'instagram' | 'linkedin';
export type ContentTone = 'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational';
export type SubscriptionTier = 'free' | 'pro' | 'agency';
