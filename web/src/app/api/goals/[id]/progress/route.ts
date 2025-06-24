import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(
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
    const { new_value, source = 'manual', notes } = body;

    if (new_value === undefined || new_value === null) {
      return NextResponse.json({ 
        error: 'new_value is required' 
      }, { status: 400 });
    }

    // Get the current goal
    const { data: goal, error: goalError } = await supabase
      .from('user_goals')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (goalError) {
      if (goalError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
    }

    const newValue = parseFloat(new_value);
    const changeAmount = newValue - goal.current_value;
    const newProgressPercentage = goal.target_value > 0
      ? Math.min(100, (newValue / goal.target_value) * 100)
      : 0;

    // Update the goal's current value
    const { error: updateError } = await supabase
      .from('user_goals')
      .update({ 
        current_value: newValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating goal current value:', updateError);
      return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }

    // Log the progress change
    const { data: progressLog, error: progressError } = await supabase
      .from('goal_progress_log')
      .insert({
        goal_id: params.id,
        previous_value: goal.current_value,
        new_value: newValue,
        change_amount: changeAmount,
        progress_percentage: newProgressPercentage,
        source,
        notes
      })
      .select()
      .single();

    if (progressError) {
      console.error('Error logging progress:', progressError);
      return NextResponse.json({ error: 'Failed to log progress' }, { status: 500 });
    }

    // Check for newly achieved milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from('goal_milestones')
      .select('*')
      .eq('goal_id', params.id)
      .eq('is_achieved', false)
      .lte('milestone_value', newValue);

    let achievedMilestones: any[] = [];
    if (!milestonesError && milestones && milestones.length > 0) {
      const { data: updatedMilestones, error: updateMilestonesError } = await supabase
        .from('goal_milestones')
        .update({ 
          is_achieved: true, 
          achieved_at: new Date().toISOString() 
        })
        .in('id', milestones.map(m => m.id))
        .select();

      if (!updateMilestonesError) {
        achievedMilestones = updatedMilestones || [];
      }
    }

    // Check if goal should be auto-completed
    let goalCompleted = false;
    if (newValue >= goal.target_value && goal.status === 'active') {
      const { error: completeError } = await supabase
        .from('user_goals')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('user_id', user.id);

      if (!completeError) {
        goalCompleted = true;
      }
    }

    return NextResponse.json({
      success: true,
      progress_log: progressLog,
      achieved_milestones: achievedMilestones,
      goal_completed: goalCompleted,
      new_progress_percentage: Math.round(newProgressPercentage * 100) / 100,
      change_amount: changeAmount
    });

  } catch (error) {
    console.error('Error in goal progress API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify goal ownership
    const { data: goal, error: goalError } = await supabase
      .from('user_goals')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (goalError) {
      if (goalError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to verify goal' }, { status: 500 });
    }

    // Get progress log
    const { data: progressLog, error: progressError } = await supabase
      .from('goal_progress_log')
      .select('*')
      .eq('goal_id', params.id)
      .order('recorded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (progressError) {
      console.error('Error fetching progress log:', progressError);
      return NextResponse.json({ error: 'Failed to fetch progress log' }, { status: 500 });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('goal_progress_log')
      .select('*', { count: 'exact', head: true })
      .eq('goal_id', params.id);

    return NextResponse.json({
      success: true,
      progress_log: progressLog || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Error in goal progress GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
