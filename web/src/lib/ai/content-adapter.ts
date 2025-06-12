import { OpenAIService, GeneratedContent } from "./openai";

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

export class ContentAdapter {
  private openaiService: OpenAIService;

  constructor() {
    this.openaiService = OpenAIService.getInstance();
  }

  async adaptContentForAllPlatforms(
    originalContent: string,
    userStyle?: string,
    subscriptionTier: "free" | "pro" | "agency" = "pro"
  ): Promise<CrossPlatformContent> {
    const platforms: ("twitter" | "instagram" | "linkedin")[] = [
      "twitter",
      "instagram",
      "linkedin",
    ];
    const adaptations: PlatformContent[] = [];

    for (const platform of platforms) {
      try {
        const adapted = await this.adaptContentForPlatform(
          originalContent,
          platform,
          userStyle,
          subscriptionTier
        );
        adaptations.push(adapted);
      } catch (error) {
        console.error(`Failed to adapt content for ${platform}:`, error);
        // Fallback to basic adaptation
        adaptations.push(
          this.createFallbackAdaptation(originalContent, platform)
        );
      }
    }

    return {
      original_content: originalContent,
      adaptations,
      created_at: new Date().toISOString(),
    };
  }

  async adaptContentForPlatform(
    content: string,
    platform: "twitter" | "instagram" | "linkedin",
    userStyle?: string,
    subscriptionTier: "free" | "pro" | "agency" = "pro"
  ): Promise<PlatformContent> {
    const adaptationPrompt = this.buildAdaptationPrompt(content, platform);

    const generatedContent = await this.openaiService.generateContent({
      prompt: adaptationPrompt,
      platform,
      tone: this.getPlatformTone(platform),
      userStyle,
      maxTokens: this.getPlatformMaxTokens(platform),
      subscriptionTier,
      priority: subscriptionTier === "agency" ? "high" : "standard",
    });

    return {
      platform,
      content: generatedContent.content,
      hashtags: generatedContent.hashtags,
      character_count: generatedContent.content.length,
      optimized: true,
    };
  }

  private buildAdaptationPrompt(content: string, platform: string): string {
    const platformInstructions =
      this.getPlatformAdaptationInstructions(platform);

    return `Adapt this content for ${platform}: "${content}"
    
    ${platformInstructions}
    
    Maintain the core message while optimizing for the platform's audience and format requirements.`;
  }

  private getPlatformAdaptationInstructions(platform: string): string {
    switch (platform) {
      case "twitter":
        return `Twitter adaptation requirements:
        - Keep it concise and punchy (under 280 characters)
        - Use 1-3 relevant hashtags
        - Make it shareable and conversation-starting
        - Consider adding a call-to-action
        - Use Twitter-style language (more casual, direct)`;

      case "instagram":
        return `Instagram adaptation requirements:
        - Create engaging, visual-friendly content
        - Use 5-10 relevant hashtags
        - Include emojis for visual appeal
        - Focus on storytelling and personal connection
        - Encourage engagement (comments, saves, shares)
        - Can be longer and more descriptive`;

      case "linkedin":
        return `LinkedIn adaptation requirements:
        - Professional, business-focused tone
        - Provide value and insights
        - Use 2-3 professional hashtags
        - Include industry-relevant context
        - Encourage professional discussion
        - Can be longer with detailed explanations`;

      default:
        return "Optimize for general social media best practices.";
    }
  }

  private getPlatformTone(
    platform: string
  ): "professional" | "casual" | "humorous" | "inspirational" | "educational" {
    switch (platform) {
      case "twitter":
        return "casual";
      case "instagram":
        return "inspirational";
      case "linkedin":
        return "professional";
      default:
        return "professional";
    }
  }

  private getPlatformMaxTokens(platform: string): number {
    switch (platform) {
      case "twitter":
        return 100; // Shorter content for Twitter
      case "instagram":
        return 200; // Medium length for Instagram
      case "linkedin":
        return 300; // Longer content for LinkedIn
      default:
        return 150;
    }
  }

  public createFallbackAdaptation(
    content: string,
    platform: "twitter" | "instagram" | "linkedin"
  ): PlatformContent {
    let adaptedContent = content;
    let hashtags: string[] = [];

    // Basic platform-specific adaptations
    switch (platform) {
      case "twitter":
        // Truncate for Twitter if too long
        if (content.length > 250) {
          adaptedContent = content.substring(0, 247) + "...";
        }
        hashtags = ["#Twitter", "#SocialMedia"];
        break;

      case "instagram":
        // Add some basic Instagram elements
        adaptedContent = content + " ✨";
        hashtags = [
          "#Instagram",
          "#Content",
          "#SocialMedia",
          "#Inspiration",
          "#Growth",
        ];
        break;

      case "linkedin":
        // Make it more professional
        adaptedContent = `Professional insight: ${content}`;
        hashtags = ["#LinkedIn", "#Professional"];
        break;
    }

    return {
      platform,
      content: adaptedContent,
      hashtags,
      character_count: adaptedContent.length,
      optimized: false, // Mark as not fully optimized since it's a fallback
    };
  }

  validatePlatformContent(content: PlatformContent): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    switch (content.platform) {
      case "twitter":
        if (content.character_count > 280) {
          issues.push("Content exceeds Twitter character limit (280)");
        }
        if (content.hashtags.length > 3) {
          issues.push("Too many hashtags for Twitter (recommended: 1-3)");
        }
        break;

      case "instagram":
        if (content.character_count > 2200) {
          issues.push("Content exceeds Instagram character limit (2200)");
        }
        if (content.hashtags.length > 30) {
          issues.push("Too many hashtags for Instagram (max: 30)");
        }
        break;

      case "linkedin":
        if (content.character_count > 3000) {
          issues.push("Content exceeds LinkedIn character limit (3000)");
        }
        if (content.hashtags.length > 5) {
          issues.push("Too many hashtags for LinkedIn (recommended: 2-3)");
        }
        break;
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  getPlatformLimits(platform: string) {
    switch (platform) {
      case "twitter":
        return {
          maxCharacters: 280,
          recommendedHashtags: { min: 1, max: 3 },
          maxHashtags: 10,
        };
      case "instagram":
        return {
          maxCharacters: 2200,
          recommendedHashtags: { min: 5, max: 10 },
          maxHashtags: 30,
        };
      case "linkedin":
        return {
          maxCharacters: 3000,
          recommendedHashtags: { min: 2, max: 3 },
          maxHashtags: 5,
        };
      default:
        return {
          maxCharacters: 280,
          recommendedHashtags: { min: 1, max: 3 },
          maxHashtags: 5,
        };
    }
  }
}

export default ContentAdapter;
