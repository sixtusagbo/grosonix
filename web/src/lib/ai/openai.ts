import OpenAI from "openai";
import { PLATFORM_LIMITS } from "../../types/ai";
import { ContentFormatter } from "./content-formatter";

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
    6. Uses proper formatting with line breaks between paragraphs for readability
    7. For longer content (LinkedIn), structure with clear paragraphs separated by double line breaks

    Formatting guidelines:
    - Use double line breaks (\\n\\n) between distinct paragraphs or sections
    - For LinkedIn: Structure content with introduction, main points, and conclusion/call-to-action
    - For Twitter: Keep concise but use line breaks for clarity when needed
    - For Instagram: Use line breaks to create visual appeal and readability

    Format your response as:
    CONTENT: [the main post content with proper line breaks and formatting]
    [Additional content paragraphs should be on separate lines]
    [Use actual line breaks in your response for paragraph separation]
    HASHTAGS: [comma-separated hashtags]
    SCORE: [engagement prediction score 1-100]

    IMPORTANT: For LinkedIn content, structure your response like this example:
    CONTENT: Opening hook or attention-grabbing statement.

    Main value proposition or insight with detailed explanation.

    Call to action or engaging question to drive comments.
    HASHTAGS: #RelevantTag1, #RelevantTag2, #RelevantTag3
    SCORE: 85`;
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
        - Include call-to-action when appropriate
        - Use line breaks for clarity and readability
        - Keep paragraphs short and punchy`;

      case "instagram":
        return `- Caption can be longer (up to 2,200 characters)
        - Use 5-10 relevant hashtags
        - Focus on visual storytelling
        - Encourage comments and saves
        - Include emojis for visual appeal
        - Use line breaks to create visual hierarchy
        - Structure with engaging opening, story/value, and call-to-action
        - Use double line breaks between distinct sections`;

      case "linkedin":
        return `- Professional, business-focused tone is essential
        - Longer form content (up to 3,000 characters) - use this space wisely
        - Use 2-3 strategic professional hashtags that are:
          * Industry-specific (e.g., #TechLeadership, #DigitalMarketing, #DataScience)
          * Skill-focused (e.g., #ProjectManagement, #Innovation, #Strategy)
          * Career-oriented (e.g., #ProfessionalDevelopment, #Leadership, #Networking)
          * Trending business topics (e.g., #AI, #Sustainability, #RemoteWork)
        - Focus on industry insights, thought leadership, and actionable value
        - Encourage meaningful professional discussion and engagement
        - Include questions to drive comments and connections
        - Share personal experiences and lessons learned
        - Use professional emojis sparingly (💼 📈 🎯 💡)
        - CRITICAL: Structure content with clear paragraphs separated by double line breaks (\\n\\n)
        - Format structure: Hook/Opening → Main Content/Value → Call-to-Action/Question
        - Use single line breaks within paragraphs, double line breaks between sections
        - Hashtags should be relevant to the content topic and target professional audience`;

      default:
        return "General social media best practices apply.";
    }
  }

  private parseGeneratedContent(
    text: string,
    platform: string
  ): GeneratedContent {
    // Try to parse structured response first
    const structuredContent = this.parseStructuredResponse(text, platform);
    if (structuredContent) {
      return {
        content: structuredContent.content,
        hashtags: structuredContent.hashtags,
        engagement_score: structuredContent.score,
        platform_optimized: true,
      };
    }

    // Fallback: treat entire text as content
    const content = text.trim();
    const hashtags = this.extractHashtagsFromText(content);
    
    // Format the content using ContentFormatter
    const platformType = platform as 'twitter' | 'instagram' | 'linkedin';
    const maxLength = PLATFORM_LIMITS[platformType]?.maxCharacters;
    const formattedContent = ContentFormatter.formatForPlatform(content, {
      platform: platformType,
      maxLength,
      preserveLineBreaks: true
    });

    return {
      content: formattedContent,
      hashtags,
      engagement_score: 75,
      platform_optimized: true,
    };
  }

  private parseStructuredResponse(text: string, platform: string): {
    content: string;
    hashtags: string[];
    score: number;
  } | null {
    const contentMatch = text.match(/CONTENT:\s*([\s\S]*?)(?=HASHTAGS:|SCORE:|$)/i);
    const hashtagsMatch = text.match(/HASHTAGS:\s*([^\n]*)/i);
    const scoreMatch = text.match(/SCORE:\s*(\d+)/i);

    if (!contentMatch) return null;

    let content = contentMatch[1].trim();

    // Clean up content - remove any trailing HASHTAGS or SCORE lines
    content = content.replace(/\s*(HASHTAGS:|SCORE:)[\s\S]*$/i, '').trim();

    // Format the content using ContentFormatter
    const platformType = platform as 'twitter' | 'instagram' | 'linkedin';
    const maxLength = PLATFORM_LIMITS[platformType]?.maxCharacters;
    const formattedContent = ContentFormatter.formatForPlatform(content, {
      platform: platformType,
      maxLength,
      preserveLineBreaks: true
    });

    const hashtags = hashtagsMatch
      ? hashtagsMatch[1]
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
          .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
      : [];

    const score = scoreMatch ? parseInt(scoreMatch[1]) : 75;

    return {
      content: formattedContent,
      hashtags,
      score: Math.min(Math.max(score, 1), 100)
    };
  }

  private extractHashtagsFromText(text: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    return text.match(hashtagRegex) || [];
  }
}

export default OpenAIService;