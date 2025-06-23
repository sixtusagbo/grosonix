import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const status = searchParams.get("status"); // optional filter by status
  
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

    // Build query
    let query = supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: scheduledPosts, error } = await query;

    if (error) {
      console.error('Error fetching scheduled posts:', error);
      return Response.json(
        { error: "Database error", message: "Failed to fetch scheduled posts" },
        { status: 500 }
      );
    }

    // Get counts for different statuses
    const { data: statusCounts, error: countError } = await supabase
      .from('scheduled_posts')
      .select('status')
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error fetching status counts:', countError);
    }

    const counts = {
      total: statusCounts?.length || 0,
      scheduled: statusCounts?.filter(p => p.status === 'scheduled').length || 0,
      draft: statusCounts?.filter(p => p.status === 'draft').length || 0,
      published: statusCounts?.filter(p => p.status === 'published').length || 0,
      failed: statusCounts?.filter(p => p.status === 'failed').length || 0,
    };

    return Response.json({
      success: true,
      posts: scheduledPosts || [],
      counts,
    });

  } catch (error) {
    console.error("Scheduled posts API error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const {
      title,
      content,
      platform,
      scheduled_at,
      status = 'scheduled',
      hashtags = [],
      media_urls = [],
      is_optimal_time = false,
      optimal_time_score,
    } = body;

    // Validate required fields
    if (!title || !content || !platform || !scheduled_at) {
      return Response.json(
        { error: "Bad request", message: "Missing required fields: title, content, platform, scheduled_at" },
        { status: 400 }
      );
    }

    // Validate platform
    if (!['twitter', 'linkedin', 'instagram'].includes(platform)) {
      return Response.json(
        { error: "Bad request", message: "Invalid platform. Must be twitter, linkedin, or instagram" },
        { status: 400 }
      );
    }

    // Validate scheduled_at is in the future (unless it's a draft)
    const scheduledDate = new Date(scheduled_at);
    if (status !== 'draft' && scheduledDate <= new Date()) {
      return Response.json(
        { error: "Bad request", message: "Scheduled time must be in the future" },
        { status: 400 }
      );
    }

    // Create the scheduled post
    const postData = {
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      platform,
      scheduled_at: scheduledDate.toISOString(),
      status,
      hashtags: hashtags || [],
      media_urls: media_urls || [],
      is_optimal_time: !!is_optimal_time,
      optimal_time_score: optimal_time_score || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newPost, error } = await supabase
      .from('scheduled_posts')
      .insert(postData)
      .select()
      .single();

    if (error) {
      console.error('Error creating scheduled post:', error);
      return Response.json(
        { error: "Database error", message: "Failed to create scheduled post" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      post: newPost,
    });

  } catch (error) {
    console.error("Create scheduled post API error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
