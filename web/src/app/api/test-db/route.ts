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
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // Test database connection and table existence
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['scheduled_posts', 'notification_preferences', 'posting_reminders']);

    if (tablesError) {
      console.error('Error checking tables:', tablesError);
    }

    // Test inserting a simple scheduled post
    const testPost = {
      title: 'Test Post',
      content: 'This is a test post',
      platform: 'twitter',
      scheduled_at: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      status: 'draft',
      user_id: user.id,
      hashtags: [],
      media_urls: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('scheduled_posts')
      .insert(testPost)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return Response.json({
        success: false,
        user: { id: user.id, email: user.email },
        tables: tables?.map(t => t.table_name) || [],
        insertError: insertError.message,
        testPost,
      });
    }

    // Clean up test post
    await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', insertResult.id);

    return Response.json({
      success: true,
      user: { id: user.id, email: user.email },
      tables: tables?.map(t => t.table_name) || [],
      testInsert: 'success',
    });

  } catch (error) {
    console.error("Test DB API error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
