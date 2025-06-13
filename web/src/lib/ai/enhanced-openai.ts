import OpenAI from "openai";
import { TrendingTopicsService } from "@/components/ai/TrendingTopicsService";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EnhancedContentGenerationOptions {
  prompt: string;
  platform: "twitter" | "instagram" | "linkedin";
  tone?:
    | "professional"
    | "casual"
    | "humorous"
    | "inspirational"
    | "educational";
  userStyle?: string;
  maxTokens?: number;
  subscriptionTier?: "free" | "pro" | "agency";
  priority?: "standard" | "high";
  useTrendingTopics?: boolean;
  targetHashtags?: string[];
}

export interface EnhancedGeneratedContent {
  content: string;
  hashtags: string[];
  engagement_score: number;
  platform_optimized: boolean;
  trending_score?: number;
  viral_potential?: number;
  hashtag_analysis?: {
    trending: string[];
    recommended: string[];
    volume_score: number;
  };
}

export class EnhancedOpenAIService {
  private static instance: EnhancedOpenAIService;
  private trendingService: TrendingTopicsService;

  constructor() {
    this.trendingService = TrendingTopicsService.getInstance();
  }

  static getInstance(): EnhancedOpenAIService {
    if (!EnhancedOpenAIService.instance) {
      EnhancedOpenAIService.instance = new EnhancedOpenAIService();
    }
    return EnhancedOpenAIService.instance;
  }

  async generateEnhancedContent(
    options: EnhancedContentGenerationOptions
  ): Promise<EnhancedGeneratedContent> {
    const {
      prompt,
      platform,
      tone = "professional",
      userStyle,
      maxTokens = 150,
      subscriptionTier = "free",
      priority = "standard",
      useTrendingTopics = false,
      targetHashtags = [],
    } = options;

    try {
      // Get trending topics if requested
      let trendingContext = "";
      let trendingHashtags: string[] = [];
      let trendingScore = 0;

      if (useTrendingTopics) {
        const trends = await this.trendingService.getTrendingTopics(platform);
        const topTrends = trends.slice(0, 5);
        
        trendingContext = `\n\nCurrent trending topics for ${platform}:\n${topTrends
          .map(
            (trend) =>
              `- ${trend.topic} (${trend.volume} mentions, ${trend.growth_rate}% growth)`
          )
          .join("\n")}`;

        // Extract trending hashtags
        trendingHashtags = topTrends.flatMap((trend) => trend.hashtags);
        
        // Calculate trending score based on topic relevance
        trendingScore = this.calculateTrendingScore(prompt, topTrends);
      }

      const systemPrompt = this.buildEnhancedSystemPrompt(
        platform,
        tone,
        userStyle,
        trendingContext,
        trendingHashtags
      );
      const userPrompt = this.buildEnhancedUserPrompt(prompt, platform, targetHashtags);

      const model = this.selectModel(subscriptionTier, priority);

      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: this.getTemperature(subscriptionTier),
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const generatedText = completion.choices[0]?.message?.content || "";
      const baseContent = this.parseGeneratedContent(generatedText, platform);

      // Enhance with trending analysis
      const hashtagAnalysis = await this.analyzeHashtags(
        baseContent.hashtags,
        platform,
        trendingHashtags
      );

      const viralPotential = this.calculateViralPotential(
        baseContent,
        trendingScore,
        hashtagAnalysis
      );

      return {
        ...baseContent,
        trending_score: trendingScore,
        viral_potential: viralPotential,
        hashtag_analysis: hashtagAnalysis,
        engagement_score: Math.min(
          100,
          baseContent.engagement_score + trendingScore * 0.2
        ),
      };
    } catch (error) {
      console.error("Enhanced OpenAI API error:", error);
      throw new Error("Failed to generate enhanced content with AI");
    }
  }

  private buildEnhancedSystemPrompt(
    platform: string,
    tone: string,
    userStyle?: string,
    trendingContext?: string,
    trendingHashtags?: string[]
  ): string {
    const platformSpecs = this.getPlatformSpecifications(platform);
    const styleContext = userStyle
      ? `\n\nUser's writing style: ${userStyle}`
      : "";

    const trendingInfo = trendingContext
      ? `\n\nTrending Information:${trendingContext}\n\nTrending hashtags to consider: ${trendingHashtags?.join(
          ", "
        )}`
      : "";

    return `You are an expert social media content creator and viral content strategist specializing in ${platform}. 
    
    Platform specifications:
    ${platformSpecs}
    
    Tone: ${tone}${styleContext}${trendingInfo}
    
    Generate engaging, platform-optimized content that:
    1. Follows the character limits and format requirements
    2. Incorporates trending topics and hashtags when relevant
    3. Maximizes viral potential and engagement
    4. Matches the specified tone and user style
    5. Uses current best practices for the platform
    6. Considers trending topics for maximum reach
    
    Format your response as:
    CONTENT: [the main post content]
    HASHTAGS: [comma-separated hashtags including trending ones]
    SCORE: [engagement prediction score 1-100]
    VIRAL_FACTORS: [factors that could make this content viral]`;
  }

  private buildEnhancedUserPrompt(
    prompt: string,
    platform: string,
    targetHashtags: string[]
  ): string {
    let enhancedPrompt = `Create a ${platform} post about: ${prompt}`;

    if (targetHashtags.length > 0) {
      enhancedPrompt += `\n\nInclude these specific hashtags: ${targetHashtags.join(
        ", "
      )}`;
    }

    enhancedPrompt += `\n\nFocus on creating content with high viral potential and engagement.`;

    return enhancedPrompt;
  }

  private calculateTrendingScore(prompt: string, trends: any[]): number {
    let score = 0;
    const promptLower = prompt.toLowerCase();

    trends.forEach((trend) => {
      const topicLower = trend.topic.toLowerCase();
      
      // Check for topic relevance
      if (promptLower.includes(topicLower) || topicLower.includes(promptLower)) {
        score += trend.growth_rate * 0.5;
      }

      // Check for hashtag relevance
      trend.hashtags.forEach((hashtag: string) => {
        const hashtagLower = hashtag.toLowerCase().replace("#", "");
        if (promptLower.includes(hashtagLower)) {
          score += 5;
        }
      });
    });

    return Math.min(50, score); // Cap at 50 points
  }

  private async analyzeHashtags(
    hashtags: string[],
    platform: string,
    trendingHashtags: string[]
  ): Promise<{
    trending: string[];
    recommended: string[];
    volume_score: number;
  }> {
    const trending = hashtags.filter((tag) =>
      trendingHashtags.some((trending) =>
        trending.toLowerCase().includes(tag.toLowerCase().replace("#", ""))
      )
    );

    const recommended = await this.getRecommendedHashtags(hashtags, platform);
    const volumeScore = this.calculateHashtagVolumeScore(hashtags, trending);

    return {
      trending,
      recommended,
      volume_score: volumeScore,
    };
  }

  private async getRecommendedHashtags(
    currentHashtags: string[],
    platform: string
  ): Promise<string[]> {
    // In a real implementation, this would use hashtag APIs
    // For now, return platform-specific recommendations
    const recommendations = {
      twitter: ["#Viral", "#Trending", "#Engagement", "#Growth"],
      instagram: ["#Explore", "#Viral", "#Trending", "#Community"],
      linkedin: ["#Professional", "#Industry", "#Insights", "#Growth"],
    };

    return recommendations[platform as keyof typeof recommendations] || [];
  }

  private calculateHashtagVolumeScore(
    hashtags: string[],
    trendingHashtags: string[]
  ): number {
    let score = 0;
    
    // Base score for having hashtags
    score += hashtags.length * 5;
    
    // Bonus for trending hashtags
    score += trendingHashtags.length * 15;
    
    // Penalty for too many hashtags (spam-like)
    if (hashtags.length > 10) {
      score -= (hashtags.length - 10) * 3;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateViralPotential(
    content: any,
    trendingScore: number,
    hashtagAnalysis: any
  ): number {
    let potential = 0;

    // Base engagement score
    potential += content.engagement_score * 0.4;

    // Trending topic bonus
    potential += trendingScore * 0.3;

    // Hashtag effectiveness
    potential += hashtagAnalysis.volume_score * 0.2;

    // Content length optimization
    const contentLength = content.content.length;
    if (contentLength > 50 && contentLength < 200) {
      potential += 10; // Optimal length
    }

    // Trending hashtag bonus
    potential += hashtagAnalysis.trending.length * 5;

    return Math.min(100, Math.max(0, potential));
  }

  // Reuse existing methods from OpenAIService
  private selectModel(subscriptionTier: string, priority: string): string {
    switch (subscriptionTier) {
      case "free":
        return "gpt-4o-mini";
      case "pro":
        return priority === "high" ? "gpt-4o" : "gpt-4o-mini";
      case "agency":
        return "gpt-4o";
      default:
        return "gpt-4o-mini";
    }
  }

  private getTemperature(subscriptionTier: string): number {
    switch (subscriptionTier) {
      case "free":
        return 0.7;
      case "pro":
        return 0.8;
      case "agency":
        return 0.9;
      default:
        return 0.7;
    }
  }

  private getPlatformSpecifications(platform: string): string {
    switch (platform) {
      case "twitter":
        return `- Character limit: 280 characters
        - Use 1-3 relevant hashtags (trending preferred)
        - Encourage retweets and replies
        - Consider viral content patterns
        - Include call-to-action when appropriate`;

      case "instagram":
        return `- Caption can be longer (up to 2,200 characters)
        - Use 5-10 relevant hashtags (mix trending and niche)
        - Focus on visual storytelling
        - Encourage comments and saves
        - Include emojis for visual appeal`;

      case "linkedin":
        return `- Professional tone is key
        - Longer form content (up to 3,000 characters)
        - Use 2-3 professional hashtags
        - Focus on industry insights and value
        - Encourage professional discussion`;

      default:
        return "General social media best practices apply.";
    }
  }

  private parseGeneratedContent(text: string, platform: string): any {
    const lines = text.split("\n");
    let content = "";
    let hashtags: string[] = [];
    let score = 75;
    let viralFactors: string[] = [];

    for (const line of lines) {
      if (line.startsWith("CONTENT:")) {
        content = line.replace("CONTENT:", "").trim();
      } else if (line.startsWith("HASHTAGS:")) {
        const hashtagText = line.replace("HASHTAGS:", "").trim();
        hashtags = hashtagText
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      } else if (line.startsWith("SCORE:")) {
        const scoreText = line.replace("SCORE:", "").trim();
        score = parseInt(scoreText) || 75;
      } else if (line.startsWith("VIRAL_FACTORS:")) {
        const factorsText = line.replace("VIRAL_FACTORS:", "").trim();
        viralFactors = factorsText.split(",").map((f) => f.trim());
      }
    }

    // Fallback: if parsing failed, use the entire text as content
    if (!content) {
      content = text.trim();
      hashtags = this.extractHashtagsFromText(content);
    }

    // Ensure hashtags have # prefix
    hashtags = hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

    return {
      content: this.optimizeForPlatform(content, platform),
      hashtags,
      engagement_score: Math.min(Math.max(score, 1), 100),
      platform_optimized: true,
      viral_factors: viralFactors,
    };
  }

  private extractHashtagsFromText(text: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    return text.match(hashtagRegex) || [];
  }

  private optimizeForPlatform(content: string, platform: string): string {
    switch (platform) {
      case "twitter":
        if (content.length > 280) {
          content = content.substring(0, 277) + "...";
        }
        break;
      case "instagram":
        // Instagram allows longer content, no truncation needed
        break;
      case "linkedin":
        // LinkedIn allows long content, but ensure professional tone
        break;
    }

    return content;
  }
}

export default EnhancedOpenAIService;