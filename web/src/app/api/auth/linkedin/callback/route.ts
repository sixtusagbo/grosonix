import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { exchangeLinkedInCode } from '@/lib/social/linkedin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=linkedin_auth_failed`);
  }

  if (!code || state !== 'linkedin_auth') {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=invalid_linkedin_callback`);
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
    const tokens = await exchangeLinkedInCode(code);

    // Store the social account connection
    const { error: insertError } = await supabase
      .from('social_accounts')
      .upsert({
        user_id: user.id,
        platform: 'linkedin',
        access_token: tokens.access_token,
        expires_at: new Date(Date.now() + 5184000000).toISOString(), // 60 days
      }, {
        onConflict: 'user_id,platform'
      });

    if (insertError) {
      console.error('Error storing LinkedIn connection:', insertError);
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=linkedin_storage_failed`);
    }

    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=linkedin_connected`);
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=linkedin_oauth_failed`);
  }
}