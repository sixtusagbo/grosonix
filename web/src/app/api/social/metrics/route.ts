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
        // Only handle Twitter for now
        if (account.platform === 'twitter') {
          console.log(`Fetching real-time metrics for ${account.platform}...`);
          console.log(`Token info:`, {
            platform: account.platform,
            token_length: account.access_token?.length || 0,
            token_start: account.access_token?.substring(0, 10) + '...',
            expires_at: account.expires_at,
            created_at: account.created_at,
            has_refresh_token: !!account.refresh_token
          });

          try {
            const platformMetrics = await SocialMediaManager.getMetrics(
              account.platform as any,
              account.access_token
            );
            console.log(`${account.platform} metrics:`, platformMetrics);
            metrics.push(platformMetrics);
          } catch (error) {
            // If we get a token invalid error and have a refresh token, try to refresh
            if (error.message === 'TWITTER_TOKEN_INVALID' && account.refresh_token) {
              console.log('Attempting to refresh Twitter token...');

              try {
                // Call our refresh token API
                const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/social/refresh-token`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Cookie': request.headers.get('cookie') || '',
                  },
                  body: JSON.stringify({ platform: 'twitter' }),
                });

                if (refreshResponse.ok) {
                  console.log('Token refreshed successfully, retrying metrics...');

                  // Get the updated account with new token
                  const { data: updatedAccount } = await supabase
                    .from('social_accounts')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('platform', 'twitter')
                    .single();

                  if (updatedAccount) {
                    const platformMetrics = await SocialMediaManager.getMetrics(
                      account.platform as any,
                      updatedAccount.access_token
                    );
                    console.log(`${account.platform} metrics after refresh:`, platformMetrics);
                    metrics.push(platformMetrics);
                  }
                } else {
                  throw error; // Fall through to error handling below
                }
              } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                throw error; // Fall through to error handling below
              }
            } else {
              throw error; // Fall through to error handling below
            }
          }
        } else {
          // Skip other platforms for now
          console.log(`Skipping ${account.platform} - temporarily disabled`);
          metrics.push({
            platform: account.platform,
            followers_count: 0,
            following_count: 0,
            posts_count: 0,
            engagement_rate: 0,
            growth_rate: 0,
            last_updated: new Date().toISOString(),
            error: 'Platform temporarily disabled',
          });
        }
      } catch (error) {
        console.error(`Error fetching ${account.platform} metrics:`, error);

        // Handle specific error types
        let errorMessage = 'Failed to fetch real-time data';
        if (error.message === 'TWITTER_TOKEN_INVALID') {
          errorMessage = 'Please reconnect Twitter account';
        }

        // Add placeholder metrics if API call fails
        metrics.push({
          platform: account.platform,
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
          engagement_rate: 0,
          growth_rate: 0,
          last_updated: new Date().toISOString(),
          error: errorMessage,
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
      platform_filter: platform || 'overview',
    };

    return Response.json({
      metrics,
      summary,
      platform_filter: platform || 'overview',
    });
  } catch (error) {
    console.error('Social metrics error:', error);
    return Response.json(
      { error: 'Internal server error', message: 'Failed to fetch social metrics' },
      { status: 500 }
    );
  }
}