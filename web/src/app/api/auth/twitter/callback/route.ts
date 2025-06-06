import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { exchangeTwitterCode } from '@/lib/social/twitter';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=twitter_auth_failed`);
  }

  if (!code || state !== 'twitter_auth') {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=invalid_twitter_callback`);
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
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`);
    }

    // Check if profile exists first
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      console.log('Creating profile for user:', user.id);
      
      // Create profile using authenticated client (now that we have INSERT policy)
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
    const tokens = await exchangeTwitterCode(code);

    // Store the social account connection
    const { error: insertError } = await supabase
      .from('social_accounts')
      .upsert({
        user_id: user.id,
        platform: 'twitter',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.refresh_token ? null : new Date(Date.now() + 7200000).toISOString(), // 2 hours
      }, {
        onConflict: 'user_id,platform'
      });

    if (insertError) {
      console.error('Error storing Twitter connection:', insertError);
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=twitter_storage_failed`);
    }

    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=twitter_connected`);
  } catch (error) {
    console.error('Twitter OAuth error:', error);
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=twitter_oauth_failed`);
  }
}