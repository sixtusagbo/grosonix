import { OpenAIService, GeneratedContent } from "./openai";
import { LinkedInHashtagGenerator } from "./linkedin-hashtag-generator";
import { ContentFormatter } from "./content-formatter";

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
  private linkedinHashtagGenerator: LinkedInHashtagGenerator;

  constructor() {
    this.openaiService = OpenAIService.getInstance();
    this.linkedinHashtagGenerator = new LinkedInHashtagGenerator();
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

    // Format content properly for the platform
    let formattedContent = ContentFormatter.formatForPlatform(generatedContent.content, {
      platform,
      preserveLineBreaks: true,
    });

    // Debug logging to see formatting
    console.log('Original content:', JSON.stringify(generatedContent.content));
    console.log('Formatted content:', JSON.stringify(formattedContent));

    // Add call-to-action for LinkedIn if appropriate
    if (platform === "linkedin" && !formattedContent.includes('?')) {
      formattedContent = ContentFormatter.addLinkedInCallToAction(formattedContent, 'question');
      console.log('Content with CTA:', JSON.stringify(formattedContent));
    }

    // Enhance LinkedIn hashtags with intelligent generation
    let finalHashtags = generatedContent.hashtags;
    if (platform === "linkedin") {
      try {
        const enhancedHashtags = await this.linkedinHashtagGenerator.generateHashtags(
          formattedContent,
          undefined, // Could be enhanced to detect industry from content
          3
        );

        // Use enhanced hashtags if available, otherwise fall back to generated ones
        if (enhancedHashtags.length > 0) {
          finalHashtags = enhancedHashtags.map(h => h.hashtag);
        }
      } catch (error) {
        console.error('LinkedIn hashtag enhancement failed:', error);
        // Keep original hashtags on error
      }
    }

    return {
      platform,
      content: formattedContent,
      hashtags: finalHashtags,
      character_count: formattedContent.length,
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
        - Can be longer with detailed explanations
        - IMPORTANT: Structure with clear paragraphs separated by double line breaks (\\n\\n)
        - Format: Opening hook → Main value/insight → Call-to-action/question
        - Use professional formatting with proper spacing for readability`;

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
        // Make it more professional and add value with proper formatting
        if (content.length > 2500) {
          adaptedContent = content.substring(0, 2497) + "...";
        } else {
          // Ensure proper LinkedIn formatting with paragraph breaks
          const formattedContent = this.formatLinkedInContent(content);
          adaptedContent = `💼 Professional insight:\n\n${formattedContent}\n\nWhat are your thoughts on this? Share your experience in the comments.`;
        }

        // Generate intelligent hashtags for LinkedIn
        hashtags = this.generateLinkedInFallbackHashtags(content);
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

  /**
   * Generate intelligent fallback hashtags for LinkedIn
   */
  private generateLinkedInFallbackHashtags(content: string): string[] {
    const contentLower = content.toLowerCase();
    const hashtags: string[] = [];

    // Business and professional hashtags based on content keywords
    const keywordHashtagMap = {
      'leadership': '#Leadership',
      'management': '#Management',
      'strategy': '#Strategy',
      'innovation': '#Innovation',
      'technology': '#Technology',
      'digital': '#DigitalTransformation',
      'ai': '#AI',
      'artificial intelligence': '#AI',
      'data': '#DataScience',
      'marketing': '#Marketing',
      'sales': '#Sales',
      'business': '#Business',
      'entrepreneur': '#Entrepreneurship',
      'startup': '#StartupLife',
      'career': '#CareerDevelopment',
      'professional': '#ProfessionalDevelopment',
      'team': '#TeamBuilding',
      'project': '#ProjectManagement',
      'finance': '#Finance',
      'investment': '#Investment',
      'consulting': '#Consulting',
      'remote': '#RemoteWork',
      'work from home': '#RemoteWork',
      'networking': '#Networking',
      'growth': '#Growth',
      'success': '#Success',
      'productivity': '#Productivity',
      'communication': '#Communication',
      'collaboration': '#Collaboration'
    };

    // Find relevant hashtags based on content
    for (const [keyword, hashtag] of Object.entries(keywordHashtagMap)) {
      if (contentLower.includes(keyword) && hashtags.length < 3) {
        hashtags.push(hashtag);
      }
    }

    // If no specific hashtags found, use general professional ones
    if (hashtags.length === 0) {
      hashtags.push('#ProfessionalDevelopment', '#Leadership', '#BusinessInsights');
    } else if (hashtags.length === 1) {
      hashtags.push('#ProfessionalDevelopment', '#Leadership');
    } else if (hashtags.length === 2) {
      hashtags.push('#ProfessionalDevelopment');
    }

    return hashtags.slice(0, 3); // LinkedIn recommends 2-3 hashtags
  }

  /**
   * Format content specifically for LinkedIn with proper paragraph structure
   */
  private formatLinkedInContent(content: string): string {
    // If content already has proper formatting, return as is
    if (content.includes('\n\n')) {
      return content;
    }

    // Split content into sentences for intelligent paragraph creation
    const sentences = content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);

    if (sentences.length <= 1) {
      return content; // Single sentence, no formatting needed
    }

    // For 2 sentences, split them into paragraphs
    if (sentences.length === 2) {
      return sentences.join('\n\n');
    }

    const paragraphs = [];

    // Create structured paragraphs for LinkedIn
    if (sentences.length >= 3) {
      // First paragraph: Hook/Opening (1 sentence for short content, 2 for longer)
      const hookSize = sentences.length > 5 ? 2 : 1;
      paragraphs.push(sentences.slice(0, hookSize).join(' '));

      // Middle paragraph(s): Main content
      const middleStart = hookSize;
      const middleEnd = sentences.length - 1;

      if (middleEnd > middleStart) {
        const middleSentences = sentences.slice(middleStart, middleEnd);
        // Split middle content into smaller paragraphs if it's long
        if (middleSentences.length > 2) {
          const midPoint = Math.ceil(middleSentences.length / 2);
          paragraphs.push(middleSentences.slice(0, midPoint).join(' '));
          if (middleSentences.length > midPoint) {
            paragraphs.push(middleSentences.slice(midPoint).join(' '));
          }
        } else {
          paragraphs.push(middleSentences.join(' '));
        }
      }

      // Last paragraph: Conclusion/Call-to-action
      paragraphs.push(sentences[sentences.length - 1]);
    }

    // Join paragraphs with double line breaks
    return paragraphs.filter(p => p.trim().length > 0).join('\n\n');
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
