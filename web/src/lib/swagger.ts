import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Grosonix API",
        version: "1.0.0",
        description: "AI-powered social media growth platform API",
        contact: {
          name: "Grosonix Team",
          email: "support@grosonix.com",
        },
      },
      servers: [
        {
          url:
            process.env.NODE_ENV === "production"
              ? "https://grosonix.vercel.app"
              : "http://localhost:4001",
          description:
            process.env.NODE_ENV === "production"
              ? "Production"
              : "Development",
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
        schemas: {
          User: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              email: { type: "string", format: "email" },
              full_name: { type: "string", nullable: true },
              avatar_url: { type: "string", nullable: true },
              created_at: { type: "string", format: "date-time" },
              updated_at: { type: "string", format: "date-time" },
            },
          },
          Profile: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              email: { type: "string", format: "email" },
              full_name: { type: "string", nullable: true },
              avatar_url: { type: "string", nullable: true },
              created_at: { type: "string", format: "date-time" },
              updated_at: { type: "string", format: "date-time" },
            },
          },
          SocialAccount: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              user_id: { type: "string", format: "uuid" },
              platform: {
                type: "string",
                enum: ["twitter", "instagram", "linkedin"],
                description: "Social media platform",
              },
              access_token: { type: "string" },
              refresh_token: { type: "string", nullable: true },
              expires_at: {
                type: "string",
                format: "date-time",
                nullable: true,
              },
              created_at: { type: "string", format: "date-time" },
              updated_at: { type: "string", format: "date-time" },
            },
          },
          Subscription: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              user_id: { type: "string", format: "uuid" },
              plan: {
                type: "string",
                enum: ["free", "pro", "agency"],
                description: "Subscription plan type",
              },
              status: {
                type: "string",
                enum: ["active", "canceled", "past_due", "trialing"],
                description: "Subscription status",
              },
              current_period_end: { type: "string", format: "date-time" },
              cancel_at: {
                type: "string",
                format: "date-time",
                nullable: true,
              },
              created_at: { type: "string", format: "date-time" },
              updated_at: { type: "string", format: "date-time" },
            },
          },
          ContentSuggestion: {
            type: "object",
            properties: {
              id: { type: "string" },
              content: { type: "string" },
              platform: {
                type: "string",
                enum: ["twitter", "instagram", "linkedin"],
              },
              hashtags: {
                type: "array",
                items: { type: "string" },
              },
              engagement_score: { type: "number", minimum: 0, maximum: 100 },
              created_at: { type: "string", format: "date-time" },
            },
          },
          Analytics: {
            type: "object",
            properties: {
              platform: { type: "string" },
              followers_count: { type: "number" },
              following_count: { type: "number" },
              posts_count: { type: "number" },
              engagement_rate: { type: "number" },
              growth_rate: { type: "number" },
              last_updated: { type: "string", format: "date-time" },
            },
          },
          Error: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
              code: { type: "number" },
            },
          },
          PlatformContent: {
            type: "object",
            properties: {
              platform: {
                type: "string",
                enum: ["twitter", "instagram", "linkedin"],
                description: "Social media platform",
              },
              content: {
                type: "string",
                description: "Adapted content for the platform",
              },
              hashtags: {
                type: "array",
                items: { type: "string" },
                description: "Platform-optimized hashtags",
              },
              character_count: {
                type: "number",
                description: "Character count of the content",
              },
              optimized: {
                type: "boolean",
                description: "Whether content is optimized for the platform",
              },
            },
            required: [
              "platform",
              "content",
              "hashtags",
              "character_count",
              "optimized",
            ],
          },
          CrossPlatformContent: {
            type: "object",
            properties: {
              original_content: {
                type: "string",
                description: "Original content before adaptation",
              },
              adaptations: {
                type: "array",
                items: { $ref: "#/components/schemas/PlatformContent" },
                description: "Platform-specific adaptations",
              },
              created_at: {
                type: "string",
                format: "date-time",
                description: "When the adaptation was created",
              },
            },
            required: ["original_content", "adaptations", "created_at"],
          },
          UserStyleProfile: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              user_id: { type: "string", format: "uuid" },
              tone: {
                type: "string",
                enum: [
                  "professional",
                  "casual",
                  "humorous",
                  "inspirational",
                  "educational",
                ],
                description: "User's preferred tone",
              },
              topics: {
                type: "array",
                items: { type: "string" },
                description: "User's preferred topics",
              },
              writing_patterns: {
                type: "array",
                items: { type: "string" },
                description: "Identified writing patterns",
              },
              engagement_strategies: {
                type: "array",
                items: { type: "string" },
                description: "Preferred engagement strategies",
              },
              vocabulary_level: {
                type: "string",
                enum: ["simple", "intermediate", "advanced"],
                description: "Vocabulary complexity level",
              },
              emoji_usage: {
                type: "string",
                enum: ["none", "minimal", "moderate", "frequent"],
                description: "Emoji usage preference",
              },
              hashtag_style: {
                type: "string",
                enum: ["none", "minimal", "moderate", "extensive"],
                description: "Hashtag usage style",
              },
              content_length_preference: {
                type: "string",
                enum: ["short", "medium", "long"],
                description: "Preferred content length",
              },
              analyzed_posts_count: {
                type: "number",
                description: "Number of posts analyzed for this profile",
              },
              confidence_score: {
                type: "number",
                minimum: 0,
                maximum: 100,
                description: "Confidence score of the analysis",
              },
              last_analyzed: {
                type: "string",
                format: "date-time",
                description: "When the profile was last analyzed",
              },
              created_at: { type: "string", format: "date-time" },
              updated_at: { type: "string", format: "date-time" },
            },
            required: [
              "id",
              "user_id",
              "tone",
              "vocabulary_level",
              "emoji_usage",
              "hashtag_style",
              "content_length_preference",
            ],
          },
          UsageQuota: {
            type: "object",
            properties: {
              action_type: {
                type: "string",
                enum: [
                  "content_generation",
                  "style_analysis",
                  "cross_platform_adaptation",
                ],
                description: "Type of AI action",
              },
              limit: {
                type: "number",
                description: "Maximum allowed usage per period",
              },
              used: {
                type: "number",
                description: "Current usage count",
              },
              remaining: {
                type: "number",
                description: "Remaining usage count",
              },
              reset_date: {
                type: "string",
                format: "date-time",
                description: "When the quota resets",
              },
              subscription_tier: {
                type: "string",
                enum: ["free", "pro", "agency"],
                description: "User subscription tier",
              },
            },
            required: [
              "action_type",
              "limit",
              "used",
              "remaining",
              "subscription_tier",
            ],
          },
          VoiceSample: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              user_id: { type: "string", format: "uuid" },
              platform: {
                type: "string",
                enum: ["twitter", "instagram", "linkedin"],
                description: "Social media platform",
              },
              content: {
                type: "string",
                description: "Sample content text",
              },
              analysis_data: {
                type: "object",
                description: "Analyzed voice characteristics",
                additionalProperties: true,
              },
              confidence_score: {
                type: "number",
                minimum: 0,
                maximum: 100,
                description: "Analysis confidence score",
              },
              created_at: { type: "string", format: "date-time" },
              updated_at: { type: "string", format: "date-time" },
            },
            required: ["id", "user_id", "platform", "content", "created_at"],
          },
        },
      },
      security: [
        {
          BearerAuth: [],
        },
      ],
    },
  });
  return spec;
};
