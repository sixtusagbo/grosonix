import { OpenAIService } from "./openai";
import { SocialMediaManager } from "../social";

export interface UserStyleProfile {
  user_id: string;
  tone: string;
  topics: string[];
  writing_patterns: string[];
  engagement_strategies: string[];
  vocabulary_level: "casual" | "professional" | "academic" | "mixed";
  emoji_usage: "none" | "minimal" | "moderate" | "heavy";
  hashtag_style: string;
  content_length_preference: "short" | "medium" | "long" | "mixed";
  analyzed_posts_count: number;
  last_analyzed: string;
  confidence_score: number;
}

export interface PostAnalysis {
  content: string;
  platform: string;
  engagement_metrics?: {
    likes: number;
    comments: number;
    shares: number;
  };
  created_at: string;
}

export class StyleAnalyzer {
  private openaiService: OpenAIService;

  constructor() {
    this.openaiService = OpenAIService.getInstance();
  }

  async analyzeUserStyle(
    userId: string,
    posts: PostAnalysis[],
    subscription_tier: "free" | "pro" | "agency" = "free"
  ): Promise<UserStyleProfile> {
    // Limit posts based on subscription tier
    const maxPosts = this.getMaxPostsForTier(subscription_tier);
    const postsToAnalyze = posts.slice(0, maxPosts);

    if (postsToAnalyze.length === 0) {
      return this.createDefaultStyleProfile(userId);
    }

    try {
      const styleAnalysis = await this.performDeepStyleAnalysis(postsToAnalyze);
      const engagementPatterns = this.analyzeEngagementPatterns(postsToAnalyze);

      return {
        user_id: userId,
        tone: styleAnalysis.tone,
        topics: styleAnalysis.topics,
        writing_patterns: styleAnalysis.writing_patterns,
        engagement_strategies: engagementPatterns.strategies,
        vocabulary_level: styleAnalysis.vocabulary_level,
        emoji_usage: styleAnalysis.emoji_usage,
        hashtag_style: styleAnalysis.hashtag_style,
        content_length_preference: styleAnalysis.content_length_preference,
        analyzed_posts_count: postsToAnalyze.length,
        last_analyzed: new Date().toISOString(),
        confidence_score: this.calculateConfidenceScore(
          postsToAnalyze.length,
          styleAnalysis
        ),
      };
    } catch (error) {
      console.error("Style analysis failed:", error);
      return this.createDefaultStyleProfile(userId);
    }
  }

  async fetchUserPostsForAnalysis(
    userId: string,
    platforms: string[],
    accessTokens: Record<string, string>
  ): Promise<PostAnalysis[]> {
    const allPosts: PostAnalysis[] = [];

    console.log(
      `[StyleAnalyzer] Fetching posts for user ${userId} from platforms:`,
      platforms
    );

    for (const platform of platforms) {
      if (!accessTokens[platform]) {
        console.log(
          `[StyleAnalyzer] No access token for platform: ${platform}`
        );
        continue;
      }

      try {
        console.log(`[StyleAnalyzer] Fetching content from ${platform}...`);
        const posts = await SocialMediaManager.getRecentContent(
          platform as any,
          accessTokens[platform],
          20 // Fetch up to 20 recent posts per platform
        );

        console.log(
          `[StyleAnalyzer] Fetched ${posts.length} posts from ${platform}`
        );

        const formattedPosts: PostAnalysis[] = posts.map((post: any) => ({
          content: post.text || post.content || "",
          platform,
          engagement_metrics: {
            likes: post.public_metrics?.like_count || 0,
            comments: post.public_metrics?.reply_count || 0,
            shares: post.public_metrics?.retweet_count || 0,
          },
          created_at: post.created_at || new Date().toISOString(),
        }));

        console.log(
          `[StyleAnalyzer] Formatted ${formattedPosts.length} posts from ${platform}`
        );
        allPosts.push(...formattedPosts);
      } catch (error) {
        console.error(
          `[StyleAnalyzer] Failed to fetch posts from ${platform}:`,
          error
        );
      }
    }

    console.log(`[StyleAnalyzer] Total posts collected: ${allPosts.length}`);
    return allPosts.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  private async performDeepStyleAnalysis(posts: PostAnalysis[]) {
    const postTexts = posts
      .map((p) => p.content)
      .filter((content) => content.length > 0);

    if (postTexts.length === 0) {
      throw new Error("No valid post content to analyze");
    }

    const analysisPrompt = `Analyze the following social media posts and provide a detailed style profile:

Posts to analyze:
${postTexts.map((text, i) => `${i + 1}. ${text}`).join("\n\n")}

Please analyze and respond in this exact format:
TONE: [dominant tone - professional/casual/humorous/inspirational/educational/mixed]
TOPICS: [comma-separated list of main topics/themes]
PATTERNS: [comma-separated list of writing patterns observed]
VOCABULARY: [casual/professional/academic/mixed]
EMOJIS: [none/minimal/moderate/heavy]
HASHTAGS: [describe hashtag usage style]
LENGTH: [short/medium/long/mixed - based on typical post length]

Focus on identifying unique characteristics that can be replicated in future content generation.`;

    const response = await this.openaiService.generateContent({
      prompt: analysisPrompt,
      platform: "twitter", // Use twitter as default for analysis
      tone: "professional",
      maxTokens: 400,
    });

    return this.parseStyleAnalysis(response.content);
  }

  private parseStyleAnalysis(analysisText: string) {
    const lines = analysisText.split("\n");
    const result = {
      tone: "mixed",
      topics: [] as string[],
      writing_patterns: [] as string[],
      vocabulary_level: "mixed" as const,
      emoji_usage: "minimal" as const,
      hashtag_style: "moderate usage",
      content_length_preference: "mixed" as const,
    };

    for (const line of lines) {
      const [key, value] = line.split(":").map((s) => s.trim());

      switch (key?.toUpperCase()) {
        case "TONE":
          result.tone = value || "mixed";
          break;
        case "TOPICS":
          result.topics = value ? value.split(",").map((t) => t.trim()) : [];
          break;
        case "PATTERNS":
          result.writing_patterns = value
            ? value.split(",").map((p) => p.trim())
            : [];
          break;
        case "VOCABULARY":
          result.vocabulary_level = (value as any) || "mixed";
          break;
        case "EMOJIS":
          result.emoji_usage = (value as any) || "minimal";
          break;
        case "HASHTAGS":
          result.hashtag_style = value || "moderate usage";
          break;
        case "LENGTH":
          result.content_length_preference = (value as any) || "mixed";
          break;
      }
    }

    return result;
  }

  private analyzeEngagementPatterns(posts: PostAnalysis[]) {
    const strategies: string[] = [];

    // Analyze posts with engagement metrics
    const postsWithMetrics = posts.filter((p) => p.engagement_metrics);

    if (postsWithMetrics.length > 0) {
      const avgEngagement =
        postsWithMetrics.reduce((sum, post) => {
          const total =
            (post.engagement_metrics?.likes || 0) +
            (post.engagement_metrics?.comments || 0) +
            (post.engagement_metrics?.shares || 0);
          return sum + total;
        }, 0) / postsWithMetrics.length;

      // Find high-performing posts (above average engagement)
      const highPerformingPosts = postsWithMetrics.filter((post) => {
        const total =
          (post.engagement_metrics?.likes || 0) +
          (post.engagement_metrics?.comments || 0) +
          (post.engagement_metrics?.shares || 0);
        return total > avgEngagement;
      });

      // Analyze patterns in high-performing content
      if (highPerformingPosts.length > 0) {
        const hasQuestions = highPerformingPosts.some((p) =>
          p.content.includes("?")
        );
        const hasCallToAction = highPerformingPosts.some((p) =>
          /\b(share|comment|like|follow|click|visit|check out)\b/i.test(
            p.content
          )
        );
        const hasEmojis = highPerformingPosts.some((p) =>
          /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(
            p.content
          )
        );

        if (hasQuestions) strategies.push("Uses engaging questions");
        if (hasCallToAction) strategies.push("Includes call-to-action");
        if (hasEmojis) strategies.push("Strategic emoji usage");
      }
    }

    return { strategies };
  }

  private getMaxPostsForTier(tier: string): number {
    switch (tier) {
      case "free":
        return 10;
      case "pro":
        return 50;
      case "agency":
        return 100;
      default:
        return 10;
    }
  }

  private calculateConfidenceScore(postCount: number, analysis: any): number {
    let score = 0;

    // Base score from post count
    score += Math.min(postCount * 5, 50); // Max 50 points from post count

    // Additional points for detailed analysis
    if (analysis.topics.length > 0) score += 10;
    if (analysis.writing_patterns.length > 0) score += 10;
    if (analysis.tone !== "mixed") score += 10;
    if (analysis.vocabulary_level !== "mixed") score += 10;
    if (analysis.content_length_preference !== "mixed") score += 10;

    return Math.min(score, 100);
  }

  private createDefaultStyleProfile(userId: string): UserStyleProfile {
    return {
      user_id: userId,
      tone: "professional",
      topics: ["general"],
      writing_patterns: ["standard"],
      engagement_strategies: ["basic"],
      vocabulary_level: "professional",
      emoji_usage: "minimal",
      hashtag_style: "moderate usage",
      content_length_preference: "medium",
      analyzed_posts_count: 0,
      last_analyzed: new Date().toISOString(),
      confidence_score: 25, // Low confidence for default profile
    };
  }

  async analyzeUserStyleFromSamples(
    userId: string,
    voiceSamples: Array<{
      content: string;
      platform: string;
      additional_instructions?: string;
    }>,
    subscriptionTier: string = "free",
    defaultTone?: string
  ): Promise<UserStyleProfile> {
    if (voiceSamples.length === 0) {
      return this.createDefaultStyleProfile(userId);
    }

    try {
      // Prepare content for analysis
      const contentForAnalysis = voiceSamples
        .map((sample, index) => {
          let content = `Post ${index + 1} (${sample.platform}):\n${
            sample.content
          }`;
          if (sample.additional_instructions) {
            content += `\nAdditional context: ${sample.additional_instructions}`;
          }
          return content;
        })
        .join("\n\n---\n\n");

      // Create analysis prompt
      const analysisPrompt = `Analyze the writing style from these ${
        voiceSamples.length
      } social media posts.
      ${defaultTone ? `The user prefers a ${defaultTone} tone by default.` : ""}

      Content to analyze:
      ${contentForAnalysis}

      Please provide a detailed analysis in the following JSON format:
      {
        "tone": "primary tone (professional/casual/humorous/inspirational/educational)",
        "topics": ["main topics discussed"],
        "writing_patterns": ["key writing patterns observed"],
        "engagement_strategies": ["how they engage with audience"],
        "vocabulary_level": "simple/intermediate/advanced/mixed",
        "emoji_usage": "minimal/moderate/heavy",
        "hashtag_style": "description of hashtag usage",
        "content_length_preference": "short/medium/long/mixed"
      }`;

      const analysis = await this.openaiService.analyzeContentStructure(
        analysisPrompt
      );

      let parsedAnalysis;
      try {
        parsedAnalysis = JSON.parse(analysis);
      } catch (parseError) {
        console.error(
          "Failed to parse AI analysis, using fallback:",
          parseError
        );
        parsedAnalysis = this.createFallbackAnalysis(voiceSamples, defaultTone);
      }

      const confidenceScore = this.calculateConfidenceScore(
        voiceSamples.length,
        parsedAnalysis
      );

      const styleProfile: UserStyleProfile = {
        user_id: userId,
        tone: parsedAnalysis.tone || defaultTone || "professional",
        topics: Array.isArray(parsedAnalysis.topics)
          ? parsedAnalysis.topics
          : ["general"],
        writing_patterns: Array.isArray(parsedAnalysis.writing_patterns)
          ? parsedAnalysis.writing_patterns
          : ["standard"],
        engagement_strategies: Array.isArray(
          parsedAnalysis.engagement_strategies
        )
          ? parsedAnalysis.engagement_strategies
          : ["basic"],
        vocabulary_level: parsedAnalysis.vocabulary_level || "professional",
        emoji_usage: parsedAnalysis.emoji_usage || "minimal",
        hashtag_style: parsedAnalysis.hashtag_style || "moderate usage",
        content_length_preference:
          parsedAnalysis.content_length_preference || "medium",
        analyzed_posts_count: voiceSamples.length,
        confidence_score: confidenceScore,
        last_analyzed: new Date().toISOString(),
      };

      return styleProfile;
    } catch (error) {
      console.error("Error analyzing style from voice samples:", error);
      return this.createDefaultStyleProfile(userId);
    }
  }

  private createFallbackAnalysis(voiceSamples: any[], defaultTone?: string) {
    return {
      tone: defaultTone || "professional",
      topics: ["general"],
      writing_patterns: ["clear communication"],
      engagement_strategies: ["direct approach"],
      vocabulary_level: "professional",
      emoji_usage: "minimal",
      hashtag_style: "moderate usage",
      content_length_preference: "medium",
    };
  }

  generateStyleSummary(profile: UserStyleProfile): string {
    return `Writing Style: ${profile.tone} tone with ${
      profile.vocabulary_level
    } vocabulary.
    Focuses on: ${profile.topics.slice(0, 3).join(", ")}.
    Patterns: ${profile.writing_patterns.slice(0, 2).join(", ")}.
    Prefers ${profile.content_length_preference} content with ${
      profile.emoji_usage
    } emoji usage.`;
  }
}

export default StyleAnalyzer;
