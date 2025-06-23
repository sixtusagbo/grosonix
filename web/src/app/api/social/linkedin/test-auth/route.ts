import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { 
          error: "Unauthorized", 
          message: "Authentication required",
          debug: {
            authError: authError?.message,
            hasUser: !!user,
            cookies: cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
          }
        },
        { status: 401 }
      );
    }

    // Get user's LinkedIn account
    const { data: socialAccount, error: socialError } = await supabase
      .from("social_accounts")
      .select("platform, expires_at, created_at")
      .eq("user_id", user.id)
      .eq("platform", "linkedin")
      .single();

    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      linkedin_account: {
        found: !!socialAccount,
        expires_at: socialAccount?.expires_at,
        created_at: socialAccount?.created_at,
        is_expired: socialAccount?.expires_at ? new Date() >= new Date(socialAccount.expires_at) : false,
      },
      error: socialError?.message,
    });

  } catch (error) {
    console.error("LinkedIn auth test error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to test authentication",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
