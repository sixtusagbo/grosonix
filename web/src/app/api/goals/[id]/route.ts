import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: goal, error } = await supabase
      .from('user_goals')
      .select(`
        *,
        goal_progress_log (
          id,
          previous_value,
          new_value,
          change_amount,
          progress_percentage,
          recorded_at,
          source,
          notes
        ),
        goal_milestones (
          id,
          milestone_percentage,
          milestone_value,
          is_achieved,
          achieved_at
        )
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
      }
      console.error('Error fetching goal:', error);
      return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
    }

    // Calculate additional statistics
    const progressPercentage = goal.target_value > 0 
      ? Math.min(100, (goal.current_value / goal.target_value) * 100)
      : 0;

    const daysRemaining = Math.ceil(
      (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const sortedProgress = goal.goal_progress_log
      ?.sort((a: any, b: any) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()) || [];

    const goalWithStats = {
      ...goal,
      progress_percentage: Math.round(progressPercentage * 100) / 100,
      days_remaining: daysRemaining,
      is_overdue: daysRemaining < 0 && goal.status === 'active',
      achieved_milestones: goal.goal_milestones?.filter((m: any) => m.is_achieved).length || 0,
      total_milestones: goal.goal_milestones?.length || 0,
      goal_progress_log: sortedProgress,
    };

    return NextResponse.json({
      success: true,
      goal: goalWithStats
    });

  } catch (error) {
    console.error('Error in goal GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      target_value,
      target_date,
      status,
      priority,
      is_public,
      current_value
    } = body;

    // First, get the current goal to check ownership and get current values
    const { data: currentGoal, error: fetchError } = await supabase
      .from('user_goals')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
    }

    // Prepare update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (target_value !== undefined) updateData.target_value = parseFloat(target_value);
    if (target_date !== undefined) updateData.target_date = target_date;
    if (priority !== undefined) updateData.priority = priority;
    if (is_public !== undefined) updateData.is_public = is_public;

    // Handle status changes
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed' && currentGoal.status !== 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status !== 'completed') {
        updateData.completed_at = null;
      }
    }

    // Handle current_value updates
    if (current_value !== undefined && current_value !== currentGoal.current_value) {
      updateData.current_value = parseFloat(current_value);
      
      // Log progress change
      const changeAmount = parseFloat(current_value) - currentGoal.current_value;
      const newProgressPercentage = updateData.target_value || currentGoal.target_value > 0
        ? Math.min(100, (parseFloat(current_value) / (updateData.target_value || currentGoal.target_value)) * 100)
        : 0;

      const { error: progressError } = await supabase
        .from('goal_progress_log')
        .insert({
          goal_id: params.id,
          previous_value: currentGoal.current_value,
          new_value: parseFloat(current_value),
          change_amount: changeAmount,
          progress_percentage: newProgressPercentage,
          source: 'manual',
          notes: 'Manual update'
        });

      if (progressError) {
        console.error('Error logging progress:', progressError);
      }

      // Check and update milestones
      const { data: milestones } = await supabase
        .from('goal_milestones')
        .select('*')
        .eq('goal_id', params.id)
        .eq('is_achieved', false);

      if (milestones) {
        const achievedMilestones = milestones.filter(
          m => parseFloat(current_value) >= m.milestone_value
        );

        if (achievedMilestones.length > 0) {
          const { error: milestoneError } = await supabase
            .from('goal_milestones')
            .update({ 
              is_achieved: true, 
              achieved_at: new Date().toISOString() 
            })
            .in('id', achievedMilestones.map(m => m.id));

          if (milestoneError) {
            console.error('Error updating milestones:', milestoneError);
          }
        }
      }

      // Auto-complete goal if target reached
      if (parseFloat(current_value) >= (updateData.target_value || currentGoal.target_value) && 
          currentGoal.status === 'active') {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      }
    }

    // Update the goal
    const { data: updatedGoal, error: updateError } = await supabase
      .from('user_goals')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating goal:', updateError);
      return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      goal: updatedGoal
    });

  } catch (error) {
    console.error('Error in goal PUT API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the goal (cascading deletes will handle related records)
    const { error } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting goal:', error);
      return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully'
    });

  } catch (error) {
    console.error('Error in goal DELETE API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
