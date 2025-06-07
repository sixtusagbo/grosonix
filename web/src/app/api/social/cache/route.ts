import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MetricsCache } from '@/lib/cache/MetricsCache';
import { TwitterServiceWithCache } from '@/lib/social/TwitterServiceWithCache';

/**
 * @swagger
 * /api/social/cache:
 *   get:
 *     summary: Get cache and rate limit status
 *     description: Retrieve cache status and rate limit information for social media platforms
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [twitter, instagram, linkedin]
 *         description: Platform to check (optional, returns all if not specified)
 *     responses:
 *       200:
 *         description: Cache and rate limit status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cache_status:
 *                   type: object
 *                   description: Cache status for each platform
 *                 rate_limits:
 *                   type: object
 *                   description: Rate limit status for each platform
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  
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

    const cache = new MetricsCache();
    const cacheStatus: any = {};
    const rateLimits: any = {};

    const platforms = platform ? [platform] : ['twitter', 'instagram', 'linkedin'];

    for (const plt of platforms) {
      // Get cache status
      const cachedMetrics = await cache.getCachedMetrics(user.id, plt);
      cacheStatus[plt] = {
        has_cache: !!cachedMetrics,
        cached_at: cachedMetrics?.cached_at || null,
        expires_at: cachedMetrics?.expires_at || null,
        is_expired: cachedMetrics ? new Date() > new Date(cachedMetrics.expires_at) : null,
      };

      // Get rate limit status for Twitter (only platform with detailed rate limiting)
      if (plt === 'twitter') {
        const { data: account } = await supabase
          .from('social_accounts')
          .select('access_token')
          .eq('user_id', user.id)
          .eq('platform', 'twitter')
          .single();

        if (account) {
          const twitterService = new TwitterServiceWithCache(account.access_token, user.id);
          rateLimits[plt] = await twitterService.getRateLimitStatus();
        } else {
          rateLimits[plt] = { error: 'No account connected' };
        }
      } else {
        rateLimits[plt] = { status: 'Not implemented' };
      }
    }

    return Response.json({
      cache_status: cacheStatus,
      rate_limits: rateLimits,
    });
  } catch (error) {
    console.error('Error getting cache status:', error);
    return Response.json(
      { error: 'Internal server error', message: 'Failed to get cache status' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/social/cache:
 *   delete:
 *     summary: Clear cache for platforms
 *     description: Clear cached metrics for specified platforms
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [twitter, instagram, linkedin]
 *                 description: Platforms to clear cache for (optional, clears all if not specified)
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 cleared_platforms:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
export async function DELETE(request: Request) {
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

    const body = await request.json().catch(() => ({}));
    const platforms = body.platforms || ['twitter', 'instagram', 'linkedin'];

    const cache = new MetricsCache();
    const clearedPlatforms = [];

    for (const platform of platforms) {
      await cache.deleteCachedMetrics(user.id, platform);
      clearedPlatforms.push(platform);
    }

    return Response.json({
      message: 'Cache cleared successfully',
      cleared_platforms: clearedPlatforms,
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return Response.json(
      { error: 'Internal server error', message: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/social/cache:
 *   post:
 *     summary: Warm up cache
 *     description: Pre-fetch and cache metrics for connected platforms
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [twitter, instagram, linkedin]
 *                 description: Platforms to warm up (optional, warms all connected if not specified)
 *     responses:
 *       200:
 *         description: Cache warmed up successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 warmed_platforms:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: Request) {
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

    const body = await request.json().catch(() => ({}));
    const requestedPlatforms = body.platforms;

    // Get connected accounts
    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('platform, access_token')
      .eq('user_id', user.id);

    const warmedPlatforms = [];

    for (const account of accounts || []) {
      if (requestedPlatforms && !requestedPlatforms.includes(account.platform)) {
        continue;
      }

      if (account.platform === 'twitter') {
        try {
          const twitterService = new TwitterServiceWithCache(account.access_token, user.id);
          await twitterService.getMetrics(true); // Force refresh to warm cache
          warmedPlatforms.push(account.platform);
        } catch (error) {
          console.error(`Failed to warm cache for ${account.platform}:`, error);
        }
      }
    }

    return Response.json({
      message: 'Cache warmed up successfully',
      warmed_platforms: warmedPlatforms,
    });
  } catch (error) {
    console.error('Error warming cache:', error);
    return Response.json(
      { error: 'Internal server error', message: 'Failed to warm cache' },
      { status: 500 }
    );
  }
}
