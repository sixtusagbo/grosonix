import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SocialMediaManager } from '@/lib/social';

/**
 * @swagger
 * /api/social/metrics:
 *   get:
 *     summary: Get social media metrics
 *     description: Retrieve real-time metrics from connected social media accounts
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [twitter, instagram, linkedin]
 *         description: Filter metrics by specific platform
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force refresh metrics from social APIs
 *     responses:
 *       200:
 *         description: Social media metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metrics:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Analytics'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_followers:
 *                       type: number
 *                     total_posts:
 *                       type: number
 *                     avg_engagement_rate:
 *                       type: number
 *                     connected_platforms:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const refresh = searchParams.get('refresh') === 'true';
  
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

    // Get user's connected social accounts
    let query = supabase
      .from('social_accounts')
      .select('*')
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

    const metrics = [];
    
    // Fetch metrics for each connected account
    for (const account of accounts || []) {
      try {
        const platformMetrics = await SocialMediaManager.getMetrics(
          account.platform as any,
          account.access_token
        );
        metrics.push(platformMetrics);
      } catch (error) {
        console.error(`Error fetching ${account.platform} metrics:`, error);
        // Add placeholder metrics if API call fails
        metrics.push({
          platform: account.platform,
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
          engagement_rate: 0,
          growth_rate: 0,
          last_updated: new Date().toISOString(),
          error: 'Failed to fetch real-time data',
        });
      }
    }

    // Calculate summary statistics
    const summary = {
      total_followers: metrics.reduce((sum, m) => sum + m.followers_count, 0),
      total_posts: metrics.reduce((sum, m) => sum + m.posts_count, 0),
      avg_engagement_rate: metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + m.engagement_rate, 0) / metrics.length 
        : 0,
      connected_platforms: metrics.length,
    };

    return Response.json({
      metrics,
      summary,
    });
  } catch (error) {
    console.error('Social metrics error:', error);
    return Response.json(
      { error: 'Internal server error', message: 'Failed to fetch social metrics' },
      { status: 500 }
    );
  }
}