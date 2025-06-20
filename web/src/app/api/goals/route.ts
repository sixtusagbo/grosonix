import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const goalType = searchParams.get('goal_type');

    let query = supabase
      .from('user_goals')
      .select(`
        *,
        goal_progress_log (
          id,
          new_value,
          change_amount,
          progress_percentage,
          recorded_at,
          source
        ),
        goal_milestones (
          id,
          milestone_percentage,
          milestone_value,
          is_achieved,
          achieved_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (platform && platform !== 'all') {
      query = query.eq('platform', platform);
    }
    if (goalType) {
      query = query.eq('goal_type', goalType);
    }

    const { data: goals, error } = await query;

    if (error) {
      console.error('Error fetching goals:', error);
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }

    // Calculate progress and statistics for each goal
    const goalsWithStats = goals?.map(goal => {
      const progressPercentage = goal.target_value > 0 
        ? Math.min(100, (goal.current_value / goal.target_value) * 100)
        : 0;

      const daysRemaining = Math.ceil(
        (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      const recentProgress = goal.goal_progress_log
        ?.sort((a: any, b: any) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
        ?.slice(0, 7) || [];

      return {
        ...goal,
        progress_percentage: Math.round(progressPercentage * 100) / 100,
        days_remaining: daysRemaining,
        is_overdue: daysRemaining < 0 && goal.status === 'active',
        recent_progress: recentProgress,
        achieved_milestones: goal.goal_milestones?.filter((m: any) => m.is_achieved).length || 0,
        total_milestones: goal.goal_milestones?.length || 0,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      goals: goalsWithStats,
      summary: {
        total: goalsWithStats.length,
        active: goalsWithStats.filter(g => g.status === 'active').length,
        completed: goalsWithStats.filter(g => g.status === 'completed').length,
        overdue: goalsWithStats.filter(g => g.is_overdue).length,
      }
    });

  } catch (error) {
    console.error('Error in goals API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      goal_type,
      platform,
      target_value,
      target_date,
      priority = 'medium',
      is_public = false,
      milestones = []
    } = body;

    // Validate required fields
    if (!title || !goal_type || !target_value || !target_date) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, goal_type, target_value, target_date' 
      }, { status: 400 });
    }

    // Validate target_date is in the future
    if (new Date(target_date) <= new Date()) {
      return NextResponse.json({ 
        error: 'Target date must be in the future' 
      }, { status: 400 });
    }

    // Create the goal
    const { data: goal, error: goalError } = await supabase
      .from('user_goals')
      .insert({
        user_id: user.id,
        title,
        description,
        goal_type,
        platform,
        target_value: parseFloat(target_value),
        target_date,
        priority,
        is_public,
      })
      .select()
      .single();

    if (goalError) {
      console.error('Error creating goal:', goalError);
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }

    // Create default milestones if none provided
    const defaultMilestones = milestones.length > 0 ? milestones : [
      { percentage: 25, value: target_value * 0.25 },
      { percentage: 50, value: target_value * 0.50 },
      { percentage: 75, value: target_value * 0.75 },
      { percentage: 100, value: target_value }
    ];

    // Create milestones
    const milestonesToCreate = defaultMilestones.map((milestone: any) => ({
      goal_id: goal.id,
      milestone_percentage: milestone.percentage,
      milestone_value: milestone.value,
    }));

    const { error: milestonesError } = await supabase
      .from('goal_milestones')
      .insert(milestonesToCreate);

    if (milestonesError) {
      console.error('Error creating milestones:', milestonesError);
      // Don't fail the request, just log the error
    }

    // Log initial progress entry
    const { error: progressError } = await supabase
      .from('goal_progress_log')
      .insert({
        goal_id: goal.id,
        previous_value: 0,
        new_value: 0,
        change_amount: 0,
        progress_percentage: 0,
        source: 'manual',
        notes: 'Goal created'
      });

    if (progressError) {
      console.error('Error creating initial progress log:', progressError);
    }

    return NextResponse.json({
      success: true,
      goal: {
        ...goal,
        progress_percentage: 0,
        days_remaining: Math.ceil(
          (new Date(target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ),
        achieved_milestones: 0,
        total_milestones: defaultMilestones.length,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error in goals POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
