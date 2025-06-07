import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { refreshTwitterToken } from '@/lib/social/twitter';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const { platform } = await request.json();

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

    // Get the social account with refresh token
    const { data: account, error: accountError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .single();

    if (accountError || !account) {
      return Response.json(
        { error: 'Not found', message: 'Social account not found' },
        { status: 404 }
      );
    }

    if (!account.refresh_token) {
      return Response.json(
        { error: 'No refresh token', message: 'No refresh token available. Please reconnect account.' },
        { status: 400 }
      );
    }

    // Refresh the token based on platform
    let newTokens;
    switch (platform) {
      case 'twitter':
        newTokens = await refreshTwitterToken(account.refresh_token);
        break;
      default:
        return Response.json(
          { error: 'Unsupported platform', message: `Token refresh not supported for ${platform}` },
          { status: 400 }
        );
    }

    // Update the database with new tokens
    const { error: updateError } = await supabase
      .from('social_accounts')
      .update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || account.refresh_token,
        expires_at: new Date(Date.now() + 7200000).toISOString(), // 2 hours
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('platform', platform);

    if (updateError) {
      console.error('Error updating tokens:', updateError);
      return Response.json(
        { error: 'Database error', message: 'Failed to update tokens' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Token refreshed successfully',
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return Response.json(
      { error: 'Internal server error', message: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
