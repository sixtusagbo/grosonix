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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (type === 'preferences') {
      // Get notification preferences
      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error);
        return Response.json(
          { error: "Database error", message: "Failed to fetch preferences" },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        preferences: preferences || null,
      });
    }

    if (type === 'in-app') {
      // Get in-app notifications
      const { data: notifications, error } = await supabase
        .from('in_app_notifications')
        .select('*')
        .eq('user_id', user.id)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        return Response.json(
          { error: "Database error", message: "Failed to fetch notifications" },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        notifications: notifications || [],
      });
    }

    if (type === 'reminders') {
      // Get pending reminders
      const { data: reminders, error } = await supabase
        .from('posting_reminders')
        .select(`
          *,
          scheduled_posts (
            title,
            content,
            platform,
            scheduled_at
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .lte('reminder_time', new Date().toISOString())
        .order('reminder_time', { ascending: true });

      if (error) {
        console.error('Error fetching reminders:', error);
        return Response.json(
          { error: "Database error", message: "Failed to fetch reminders" },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        reminders: reminders || [],
      });
    }

    return Response.json(
      { error: "Bad request", message: "Invalid type parameter" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Notifications API error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to process request",
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
    const { action, ...data } = body;

    if (action === 'update-preferences') {
      // Update notification preferences
      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...data,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating preferences:', error);
        return Response.json(
          { error: "Database error", message: "Failed to update preferences" },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        preferences,
      });
    }

    if (action === 'create-notification') {
      // Create in-app notification
      const { data: notification, error } = await supabase
        .from('in_app_notifications')
        .insert({
          user_id: user.id,
          ...data,
          is_read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return Response.json(
          { error: "Database error", message: "Failed to create notification" },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        notification,
      });
    }

    if (action === 'mark-read') {
      // Mark notification as read
      const { notificationId } = data;
      
      const { error } = await supabase
        .from('in_app_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return Response.json(
          { error: "Database error", message: "Failed to mark notification as read" },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
      });
    }

    if (action === 'mark-reminder-sent') {
      // Mark reminder as sent
      const { reminderId } = data;
      
      const { error } = await supabase
        .from('posting_reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', reminderId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking reminder as sent:', error);
        return Response.json(
          { error: "Database error", message: "Failed to mark reminder as sent" },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
      });
    }

    return Response.json(
      { error: "Bad request", message: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Notifications API error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to process request",
      },
      { status: 500 }
    );
  }
}
