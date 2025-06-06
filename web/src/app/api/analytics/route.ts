import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get user analytics
 *     description: Retrieve analytics data for all connected social media accounts
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [twitter, instagram, linkedin]
 *         description: Filter analytics by platform
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Number of days to include in analytics
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_followers:
 *                       type: number
 *                     total_following:
 *                       type: number
 *                     total_posts:
 *                       type: number
 *                     avg_engagement_rate:
 *                       type: number
 *                 platforms:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Analytics'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: Request) {
  const cookieStore = cookies();
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const days = parseInt(searchParams.get('days') || '30');
  
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

    // Get user's connected social accounts
    let query = supabase
      .from('social_accounts')
      .select('platform')
      .eq('user_id', user.id);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data: accounts, error } = await query;

    if (error) {
      return Response.json(
        { error: 'Fetch failed', message: error.message },
        { status: 400 }
      );
    }

    // Mock analytics data for now (will be replaced with real API calls)
    const mockAnalytics = accounts?.map(account => ({
      platform: account.platform,
      followers_count: Math.floor(Math.random() * 10000),
      following_count: Math.floor(Math.random() * 1000),
      posts_count: Math.floor(Math.random() * 500),
      engagement_rate: Math.random() * 10,
      growth_rate: (Math.random() - 0.5) * 20,
      last_updated: new Date().toISOString(),
    })) || [];

    const summary = {
      total_followers: mockAnalytics.reduce((sum, a) => sum + a.followers_count, 0),
      total_following: mockAnalytics.reduce((sum, a) => sum + a.following_count, 0),
      total_posts: mockAnalytics.reduce((sum, a) => sum + a.posts_count, 0),
      avg_engagement_rate: mockAnalytics.length > 0 
        ? mockAnalytics.reduce((sum, a) => sum + a.engagement_rate, 0) / mockAnalytics.length 
        : 0,
    };

    return Response.json({
      summary,
      platforms: mockAnalytics,
    });
  } catch (error) {
    return Response.json(
      { error: 'Internal server error', message: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}