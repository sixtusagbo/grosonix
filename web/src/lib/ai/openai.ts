import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ContentGenerationOptions {
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
}

export interface GeneratedContent {
  content: string;
  hashtags: string[];
  engagement_score: number;
  platform_optimized: boolean;
}

export class OpenAIService {
  private static instance: OpenAIService;

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  async generateContent(
    options: ContentGenerationOptions
  ): Promise<GeneratedContent> {
    const {
      prompt,
      platform,
      tone = "professional",
      userStyle,
      maxTokens = 150,
      subscriptionTier = "free",
      priority = "standard",
    } = options;

    try {
      const systemPrompt = this.buildSystemPrompt(platform, tone, userStyle);
      const userPrompt = this.buildUserPrompt(prompt, platform);

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

      return this.parseGeneratedContent(generatedText, platform);
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Failed to generate content with AI");
    }
  }

  async analyzeUserStyle(posts: string[]): Promise<string> {
    if (posts.length === 0) {
      return "No previous posts available for style analysis.";
    }

    try {
      const systemPrompt = `You are an expert content analyst. Analyze the writing style, tone, and patterns from the provided social media posts. 
      Provide a concise summary of the user's unique voice, including:
      - Tone and personality
      - Common themes or topics
      - Writing style patterns
      - Engagement strategies used
      
      Keep the analysis under 200 words and focus on actionable insights for content generation.`;

      const userPrompt = `Analyze these posts and describe the user's unique writing style:\n\n${posts.join(
        "\n\n---\n\n"
      )}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use mini for style analysis - it's sufficient and cost-effective
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      return (
        completion.choices[0]?.message?.content ||
        "Unable to analyze style from provided posts."
      );
    } catch (error) {
      console.error("Style analysis error:", error);
      throw new Error("Failed to analyze user style");
    }
  }

  async analyzeContentStructure(prompt: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert content analyst. Analyze the provided content and return your analysis in the exact JSON format requested. Ensure the response is valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      return (
        completion.choices[0]?.message?.content ||
        '{"error": "Unable to analyze content structure"}'
      );
    } catch (error) {
      console.error("Content structure analysis error:", error);
      throw new Error("Failed to analyze content structure");
    }
  }

  private buildSystemPrompt(
    platform: string,
    tone: string,
    userStyle?: string
  ): string {
    const platformSpecs = this.getPlatformSpecifications(platform);
    const styleContext = userStyle
      ? `\n\nUser's writing style: ${userStyle}`
      : "";

    return `You are an expert social media content creator specializing in ${platform}. 
    
    Platform specifications:
    ${platformSpecs}
    
    Tone: ${tone}${styleContext}
    
    Generate engaging, platform-optimized content that:
    1. Follows the character limits and format requirements
    2. Includes relevant hashtags (3-5 for Twitter, 5-10 for Instagram, 2-3 for LinkedIn)
    3. Matches the specified tone
    4. Is likely to drive engagement
    5. Follows current best practices for the platform
    
    Format your response as:
    CONTENT: [the main post content]
    HASHTAGS: [comma-separated hashtags]
    SCORE: [engagement prediction score 1-100]`;
  }

  private buildUserPrompt(prompt: string, platform: string): string {
    return `Create a ${platform} post about: ${prompt}`;
  }

  private selectModel(subscriptionTier: string, priority: string): string {
    // Model selection strategy based on subscription tier and priority
    switch (subscriptionTier) {
      case "free":
        return "gpt-4o-mini"; // Cost-effective for free users

      case "pro":
        return priority === "high" ? "gpt-4o" : "gpt-4o-mini";

      case "agency":
        return "gpt-4o"; // Premium model for agency tier

      default:
        return "gpt-4o-mini";
    }
  }

  private getTemperature(subscriptionTier: string): number {
    // Adjust creativity based on subscription tier
    switch (subscriptionTier) {
      case "free":
        return 0.7; // Standard creativity

      case "pro":
        return 0.8; // Slightly more creative

      case "agency":
        return 0.9; // Maximum creativity for premium users

      default:
        return 0.7;
    }
  }

  private getPlatformSpecifications(platform: string): string {
    switch (platform) {
      case "twitter":
        return `- Character limit: 280 characters
        - Use 1-3 relevant hashtags
        - Encourage retweets and replies
        - Consider using threads for longer content
        - Include call-to-action when appropriate`;

      case "instagram":
        return `- Caption can be longer (up to 2,200 characters)
        - Use 5-10 relevant hashtags
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

  private parseGeneratedContent(
    text: string,
    platform: string
  ): GeneratedContent {
    const lines = text.split("\n");
    let content = "";
    let hashtags: string[] = [];
    let score = 75; // Default score

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
    };
  }

  private extractHashtagsFromText(text: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    return text.match(hashtagRegex) || [];
  }

  private optimizeForPlatform(content: string, platform: string): string {
    switch (platform) {
      case "twitter":
        // Ensure Twitter character limit
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

export default OpenAIService;
