import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

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

    // Get user goals
    const { data: goals, error } = await supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching goals:", error);
      return Response.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    // Calculate analytics
    const analytics = {
      total_goals: goals?.length || 0,
      active_goals: goals?.filter(g => g.status === 'active').length || 0,
      completed_goals: goals?.filter(g => g.status === 'completed').length || 0,
      failed_goals: goals?.filter(g => g.status === 'failed').length || 0,
      average_completion_rate: 0,
      goals_by_platform: {} as Record<string, number>,
      goals_by_metric: {} as Record<string, number>,
    };

    if (goals && goals.length > 0) {
      analytics.average_completion_rate = 
        (analytics.completed_goals / goals.length) * 100;

      // Group by platform and metric
      goals.forEach(goal => {
        analytics.goals_by_platform[goal.platform] = 
          (analytics.goals_by_platform[goal.platform] || 0) + 1;
        
        analytics.goals_by_metric[goal.metric_type] = 
          (analytics.goals_by_metric[goal.metric_type] || 0) + 1;
      });
    }

    return Response.json({
      goals: goals || [],
      analytics
    });
  } catch (error) {
    console.error("Goals API error:", error);
    return Response.json(
      { error: "Internal server error", message: "Failed to fetch goals" },
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
      description,
      metric_type,
      target_value,
      start_value,
      platform,
      deadline,
      priority = 'medium',
      milestones = []
    } = body;

    // Validate required fields
    if (!title || !metric_type || !target_value || !platform || !deadline) {
      return Response.json(
        { error: "Validation error", message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create goal
    const { data: goal, error } = await supabase
      .from("user_goals")
      .insert({
        user_id: user.id,
        title,
        description,
        metric_type,
        target_value: parseFloat(target_value),
        start_value: parseFloat(start_value) || 0,
        current_value: parseFloat(start_value) || 0,
        platform,
        deadline,
        priority,
        milestones: milestones || [],
        achieved_milestones: [],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating goal:", error);
      return Response.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      goal,
      message: "Goal created successfully"
    });
  } catch (error) {
    console.error("Goals API error:", error);
    return Response.json(
      { error: "Internal server error", message: "Failed to create goal" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { goal_id, current_value, status } = body;

    if (!goal_id) {
      return Response.json(
        { error: "Validation error", message: "Goal ID is required" },
        { status: 400 }
      );
    }

    // Get current goal
    const { data: existingGoal, error: fetchError } = await supabase
      .from("user_goals")
      .select("*")
      .eq("id", goal_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingGoal) {
      return Response.json(
        { error: "Not found", message: "Goal not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (current_value !== undefined) {
      updateData.current_value = parseFloat(current_value);
      
      // Check for milestone achievements
      const newMilestones = existingGoal.milestones.filter(
        (milestone: number) => 
          updateData.current_value >= milestone && 
          !existingGoal.achieved_milestones.includes(milestone)
      );

      if (newMilestones.length > 0) {
        updateData.achieved_milestones = [...existingGoal.achieved_milestones, ...newMilestones];
      }

      // Check if goal is completed
      if (updateData.current_value >= existingGoal.target_value) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }

    // Update goal
    const { data: updatedGoal, error } = await supabase
      .from("user_goals")
      .update(updateData)
      .eq("id", goal_id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating goal:", error);
      return Response.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      goal: updatedGoal,
      message: "Goal updated successfully"
    });
  } catch (error) {
    console.error("Goals API error:", error);
    return Response.json(
      { error: "Internal server error", message: "Failed to update goal" },
      { status: 500 }
    );
  }
}
