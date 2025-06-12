// Test file for AI services - for development/testing only
import { OpenAIService, ContentAdapter, StyleAnalyzer } from './index';

export async function testAIServices() {
  console.log('🧪 Testing AI Services...');
  
  try {
    // Test OpenAI Service
    console.log('1. Testing OpenAI Content Generation...');
    const openaiService = OpenAIService.getInstance();
    
    const testContent = await openaiService.generateContent({
      prompt: 'Create a post about the benefits of AI in social media marketing',
      platform: 'twitter',
      tone: 'professional',
      maxTokens: 100,
    });
    
    console.log('✅ OpenAI Content Generated:', {
      content: testContent.content.substring(0, 100) + '...',
      hashtags: testContent.hashtags,
      score: testContent.engagement_score,
    });

    // Test Content Adapter
    console.log('2. Testing Content Adaptation...');
    const contentAdapter = new ContentAdapter();
    
    const adaptedContent = await contentAdapter.adaptContentForAllPlatforms(
      'AI is revolutionizing how we create and share content on social media!'
    );
    
    console.log('✅ Content Adapted for platforms:', 
      adaptedContent.adaptations.map(a => `${a.platform}: ${a.content.substring(0, 50)}...`)
    );

    // Test Style Analyzer (with mock data)
    console.log('3. Testing Style Analysis...');
    const styleAnalyzer = new StyleAnalyzer();
    
    const mockPosts = [
      {
        content: 'Just launched our new AI feature! Excited to see how it helps creators grow their audience. #AI #SocialMedia #Growth',
        platform: 'twitter',
        created_at: new Date().toISOString(),
      },
      {
        content: 'Building in public has been an incredible journey. Here are 5 lessons I learned while developing our AI platform...',
        platform: 'linkedin',
        created_at: new Date().toISOString(),
      },
    ];

    const styleProfile = await styleAnalyzer.analyzeUserStyle(
      'test-user-id',
      mockPosts,
      'pro'
    );
    
    console.log('✅ Style Analysis Complete:', {
      tone: styleProfile.tone,
      topics: styleProfile.topics.slice(0, 3),
      confidence: styleProfile.confidence_score,
    });

    console.log('🎉 All AI services working correctly!');
    return true;

  } catch (error) {
    console.error('❌ AI Services Test Failed:', error);
    return false;
  }
}

// Platform limits reference
export const PLATFORM_LIMITS = {
  twitter: {
    maxCharacters: 280,
    recommendedHashtags: { min: 1, max: 3 },
    maxHashtags: 10,
  },
  instagram: {
    maxCharacters: 2200,
    recommendedHashtags: { min: 5, max: 10 },
    maxHashtags: 30,
  },
  linkedin: {
    maxCharacters: 3000,
    recommendedHashtags: { min: 2, max: 3 },
    maxHashtags: 5,
  },
};

// Usage limits by subscription tier
export const SUBSCRIPTION_LIMITS = {
  free: {
    content_generation: 5,
    style_analysis: 1,
    cross_platform_adaptation: 0,
  },
  pro: {
    content_generation: -1, // Unlimited
    style_analysis: -1,
    cross_platform_adaptation: -1,
  },
  agency: {
    content_generation: -1,
    style_analysis: -1,
    cross_platform_adaptation: -1,
  },
};
