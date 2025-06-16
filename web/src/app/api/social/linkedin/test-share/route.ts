import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { LinkedInService } from "@/lib/social/linkedin";

export async function POST(request: NextRequest) {
  try {
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

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's LinkedIn access token
    const { data: socialAccount, error: socialError } = await supabase
      .from("social_accounts")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user.id)
      .eq("provider", "linkedin")
      .single();

    if (socialError || !socialAccount) {
      return Response.json(
        {
          error: "LinkedIn not connected",
          message: "Please connect your LinkedIn account first",
        },
        { status: 400 }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(socialAccount.expires_at);
    
    if (now >= expiresAt) {
      return Response.json(
        {
          error: "Token expired",
          message: "LinkedIn token has expired. Please reconnect your account.",
        },
        { status: 401 }
      );
    }

    // Initialize LinkedIn service
    const linkedinService = new LinkedInService(socialAccount.access_token);

    // Test content
    const testContent = "🚀 Testing LinkedIn sharing integration from Grosonix!\n\nThis is a test post to verify our LinkedIn sharing functionality is working correctly.\n\n#LinkedInAPI #SocialMediaManagement #Grosonix";

    // Share test content to LinkedIn
    const shareResult = await linkedinService.shareContent({
      content: testContent,
      hashtags: ['#LinkedInAPI', '#SocialMediaManagement', '#Grosonix'],
      visibility: 'PUBLIC'
    });

    return Response.json({
      success: shareResult.success,
      message: shareResult.message,
      share_id: shareResult.id,
      share_url: shareResult.shareUrl,
      test_content: testContent,
    });

  } catch (error) {
    console.error("LinkedIn test share API error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to test LinkedIn sharing",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
