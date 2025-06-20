import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { LinkedInService } from "@/lib/social/linkedin";

export async function POST(request: NextRequest) {
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
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { content, hashtags, visibility } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return Response.json(
        { error: "Bad request", message: "Content is required" },
        { status: 400 }
      );
    }

    // Get user's LinkedIn access token
    const { data: socialAccount, error: socialError } = await supabase
      .from("social_accounts")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user.id)
      .eq("platform", "linkedin")  // Changed from "provider" to "platform"
      .single();

    console.log('LinkedIn account lookup:', {
      user_id: user.id,
      error: socialError,
      account_found: !!socialAccount
    });

    if (socialError || !socialAccount) {
      console.error('LinkedIn account error:', socialError);
      return Response.json(
        {
          error: "LinkedIn not connected",
          message: "Please connect your LinkedIn account first",
          debug: { socialError, user_id: user.id }
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

    // Share content to LinkedIn
    const shareResult = await linkedinService.shareContent({
      content: content.trim(),
      hashtags: Array.isArray(hashtags) ? hashtags : [],
      visibility: visibility || 'PUBLIC'
    });

    if (!shareResult.success) {
      return Response.json(
        {
          error: "Share failed",
          message: shareResult.message || "Failed to share content to LinkedIn",
        },
        { status: 400 }
      );
    }

    // Log the share activity
    try {
      const { error: logError } = await supabase
        .from("social_activity_log")
        .insert({
          user_id: user.id,
          platform: "linkedin",
          activity_type: "post", // Updated to match new schema
          activity_data: {
            action: "share_content",
            content_preview: content.substring(0, 100),
            share_id: shareResult.id,
            share_url: shareResult.shareUrl,
            hashtags: hashtags || [],
            visibility: visibility || 'PUBLIC'
          },
        });

      if (logError) {
        console.error("Error logging share activity:", logError);
        // Don't fail the request if logging fails
      }
    } catch (error) {
      console.error("Failed to log activity (table may not exist):", error);
      // Continue without failing the share operation
    }

    return Response.json({
      success: true,
      message: "Content shared successfully to LinkedIn",
      share_id: shareResult.id,
      share_url: shareResult.shareUrl,
    });

  } catch (error) {
    console.error("LinkedIn share API error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to share content to LinkedIn",
      },
      { status: 500 }
    );
  }
}
