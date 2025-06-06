import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { exchangeInstagramCode } from '@/lib/social/instagram';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=instagram_auth_failed`);
  }

  if (!code) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=invalid_instagram_callback`);
  }

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
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`);
    }

    // Exchange code for access token
    const tokens = await exchangeInstagramCode(code);

    // Store the social account connection
    const { error: insertError } = await supabase
      .from('social_accounts')
      .upsert({
        user_id: user.id,
        platform: 'instagram',
        access_token: tokens.access_token,
        expires_at: new Date(Date.now() + 5184000000).toISOString(), // 60 days
      }, {
        onConflict: 'user_id,platform'
      });

    if (insertError) {
      console.error('Error storing Instagram connection:', insertError);
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=instagram_storage_failed`);
    }

    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=instagram_connected`);
  } catch (error) {
    console.error('Instagram OAuth error:', error);
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=instagram_oauth_failed`);
  }
}