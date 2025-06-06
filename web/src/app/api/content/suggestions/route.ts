import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

/**
 * @swagger
 * /api/content/suggestions:
 *   get:
 *     summary: Get AI content suggestions
 *     description: Retrieve AI-generated content suggestions for social media posts
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [twitter, instagram, linkedin]
 *         description: Target platform for content suggestions
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         description: Topic or theme for content suggestions
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of suggestions to return
 *     responses:
 *       200:
 *         description: Content suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContentSuggestion'
 *                 remaining_quota:
 *                   type: number
 *                   description: Remaining daily quota for free users
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: Request) {
  const cookieStore = cookies();
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') || 'twitter';
  const topic = searchParams.get('topic') || 'general';
  const limit = parseInt(searchParams.get('limit') || '10');
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return Response.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check user's subscription and usage limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single();

    const isFreeTier = !subscription || subscription.plan === 'free';
    
    // Mock content suggestions (will be replaced with OpenAI integration)
    const mockSuggestions = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: `suggestion-${i + 1}`,
      content: `AI-generated ${platform} content about ${topic} #${i + 1}. This is a mock suggestion that will be replaced with real AI-generated content.`,
      platform,
      hashtags: [`#${topic}`, '#AI', '#SocialMedia', '#Growth'],
      engagement_score: Math.floor(Math.random() * 100),
      created_at: new Date().toISOString(),
    }));

    return Response.json({
      suggestions: mockSuggestions,
      remaining_quota: isFreeTier ? Math.max(0, 5 - mockSuggestions.length) : null,
    });
  } catch (error) {
    return Response.json(
      { error: 'Internal server error', message: 'Failed to generate content suggestions' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/content/suggestions:
 *   post:
 *     summary: Generate custom content suggestion
 *     description: Generate a custom AI content suggestion based on user input
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *               - platform
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: User's content prompt or idea
 *               platform:
 *                 type: string
 *                 enum: [twitter, instagram, linkedin]
 *                 description: Target platform
 *               tone:
 *                 type: string
 *                 enum: [professional, casual, humorous, inspirational]
 *                 description: Desired tone for the content
 *     responses:
 *       200:
 *         description: Custom content suggestion generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContentSuggestion'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return Response.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { prompt, platform, tone = 'professional' } = body;

    if (!prompt || !platform) {
      return Response.json(
        { error: 'Bad request', message: 'Prompt and platform are required' },
        { status: 400 }
      );
    }

    // Mock custom content generation (will be replaced with OpenAI integration)
    const customSuggestion = {
      id: `custom-${Date.now()}`,
      content: `Custom AI-generated ${platform} content based on: "${prompt}" with ${tone} tone. This is a mock response that will be replaced with real AI generation.`,
      platform,
      hashtags: ['#Custom', '#AI', '#Content'],
      engagement_score: Math.floor(Math.random() * 100),
      created_at: new Date().toISOString(),
    };

    return Response.json(customSuggestion);
  } catch (error) {
    return Response.json(
      { error: 'Internal server error', message: 'Failed to generate custom content' },
      { status: 500 }
    );
  }
}