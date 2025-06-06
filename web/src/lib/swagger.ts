import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Grosonix API',
        version: '1.0.0',
        description: 'AI-powered social media growth platform API',
        contact: {
          name: 'Grosonix Team',
          email: 'support@grosonix.com',
        },
      },
      servers: [
        {
          url: process.env.NODE_ENV === 'production' 
            ? 'https://grosonix.vercel.app' 
            : 'http://localhost:4001',
          description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              full_name: { type: 'string', nullable: true },
              avatar_url: { type: 'string', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
          Profile: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              full_name: { type: 'string', nullable: true },
              avatar_url: { type: 'string', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
          SocialAccount: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              user_id: { type: 'string', format: 'uuid' },
              platform: { 
                type: 'string', 
                enum: ['twitter', 'instagram', 'linkedin'],
                description: 'Social media platform'
              },
              access_token: { type: 'string' },
              refresh_token: { type: 'string', nullable: true },
              expires_at: { type: 'string', format: 'date-time', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
          Subscription: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              user_id: { type: 'string', format: 'uuid' },
              plan: { 
                type: 'string', 
                enum: ['free', 'pro', 'agency'],
                description: 'Subscription plan type'
              },
              status: { 
                type: 'string', 
                enum: ['active', 'canceled', 'past_due', 'trialing'],
                description: 'Subscription status'
              },
              current_period_end: { type: 'string', format: 'date-time' },
              cancel_at: { type: 'string', format: 'date-time', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
          ContentSuggestion: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              platform: { 
                type: 'string', 
                enum: ['twitter', 'instagram', 'linkedin'] 
              },
              hashtags: { 
                type: 'array', 
                items: { type: 'string' } 
              },
              engagement_score: { type: 'number', minimum: 0, maximum: 100 },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          Analytics: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              followers_count: { type: 'number' },
              following_count: { type: 'number' },
              posts_count: { type: 'number' },
              engagement_rate: { type: 'number' },
              growth_rate: { type: 'number' },
              last_updated: { type: 'string', format: 'date-time' },
            },
          },
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              code: { type: 'number' },
            },
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