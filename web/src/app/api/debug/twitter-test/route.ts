import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { TwitterService } from '@/lib/social/twitter';

export async function GET(request: NextRequest) {
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

    // Get user's Twitter account
    const { data: socialAccounts } = await supabase
      .from('social_accounts')
      .select('platform, access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('platform', 'twitter');

    if (!socialAccounts || socialAccounts.length === 0) {
      return Response.json({
        status: 'no_account',
        message: 'No Twitter account connected',
      });
    }

    const twitterAccount = socialAccounts[0];
    console.log('[DEBUG] Twitter account found:', {
      platform: twitterAccount.platform,
      hasAccessToken: !!twitterAccount.access_token,
      hasRefreshToken: !!twitterAccount.refresh_token,
      expiresAt: twitterAccount.expires_at,
    });

    // Test Twitter API connection
    try {
      const twitterService = new TwitterService(twitterAccount.access_token);
      
      console.log('[DEBUG] Testing Twitter user data...');
      const userData = await twitterService.getUserData();
      console.log('[DEBUG] User data success:', {
        id: userData.id,
        username: userData.username,
        followers: userData.followers_count,
        tweets: userData.tweet_count,
      });

      console.log('[DEBUG] Testing Twitter timeline...');
      const tweets = await twitterService.getRecentTweets(5);
      console.log('[DEBUG] Timeline success:', {
        tweetCount: tweets.length,
        tweets: tweets.map(t => ({
          id: t.id,
          text: t.text?.substring(0, 50) + '...',
          created_at: t.created_at,
        })),
      });

      return Response.json({
        status: 'success',
        message: 'Twitter API connection working',
        userData: {
          id: userData.id,
          username: userData.username,
          followers: userData.followers_count,
          tweets: userData.tweet_count,
        },
        timeline: {
          count: tweets.length,
          tweets: tweets.map(t => ({
            id: t.id,
            text: t.text?.substring(0, 100),
            created_at: t.created_at,
          })),
        },
      });

    } catch (twitterError: any) {
      console.error('[DEBUG] Twitter API error:', twitterError);
      
      return Response.json({
        status: 'twitter_error',
        message: 'Twitter API call failed',
        error: {
          message: twitterError.message,
          code: twitterError.code,
          data: twitterError.data,
        },
      });
    }

  } catch (error) {
    console.error('[DEBUG] General error:', error);
    return Response.json(
      {
        status: 'error',
        message: 'Debug test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
