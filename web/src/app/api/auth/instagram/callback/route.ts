import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { exchangeInstagramCode, checkInstagramBusinessAccount } from '@/lib/social/instagram';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  if (error) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=instagram_auth_failed`);
  }

  if (!code || state !== 'instagram_auth') {
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

    // Ensure user profile exists before creating social account
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      console.log('Creating profile for user:', user.id);
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=profile_creation_failed`);
      }
    }

    // Exchange code for access token
    const tokens = await exchangeInstagramCode(code);

    // Check if user has Instagram Business account
    const hasBusinessAccount = await checkInstagramBusinessAccount(tokens.access_token);
    
    if (!hasBusinessAccount) {
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=instagram_business_required`);
    }

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