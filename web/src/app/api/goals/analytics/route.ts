import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const platform = searchParams.get('platform');

    const timeframeDate = new Date();
    timeframeDate.setDate(timeframeDate.getDate() - parseInt(timeframe));

    // Get all user goals with progress data
    let goalsQuery = supabase
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
      .eq('user_id', user.id);

    if (platform && platform !== 'all') {
      goalsQuery = goalsQuery.eq('platform', platform);
    }

    const { data: goals, error: goalsError } = await goalsQuery;

    if (goalsError) {
      console.error('Error fetching goals for analytics:', goalsError);
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }

    // Calculate analytics
    const analytics = {
      overview: {
        total_goals: goals?.length || 0,
        active_goals: goals?.filter(g => g.status === 'active').length || 0,
        completed_goals: goals?.filter(g => g.status === 'completed').length || 0,
        paused_goals: goals?.filter(g => g.status === 'paused').length || 0,
        cancelled_goals: goals?.filter(g => g.status === 'cancelled').length || 0,
        overdue_goals: 0,
        completion_rate: 0,
        average_progress: 0,
      },
      progress_trends: [] as any[],
      goal_types: {} as Record<string, number>,
      platforms: {} as Record<string, number>,
      milestones: {
        total_achieved: 0,
        total_milestones: 0,
        achievement_rate: 0,
        recent_achievements: [] as any[],
      },
      performance: {
        goals_on_track: 0,
        goals_behind: 0,
        goals_ahead: 0,
        average_days_to_completion: 0,
      }
    };

    if (!goals || goals.length === 0) {
      return NextResponse.json({
        success: true,
        analytics
      });
    }

    // Calculate overview metrics
    const now = new Date();
    let totalProgress = 0;
    let completedGoalsData: any[] = [];

    goals.forEach(goal => {
      // Progress calculation
      const progress = goal.target_value > 0 
        ? Math.min(100, (goal.current_value / goal.target_value) * 100)
        : 0;
      totalProgress += progress;

      // Overdue check
      const targetDate = new Date(goal.target_date);
      if (targetDate < now && goal.status === 'active') {
        analytics.overview.overdue_goals++;
      }

      // Goal types
      analytics.goal_types[goal.goal_type] = (analytics.goal_types[goal.goal_type] || 0) + 1;

      // Platforms
      if (goal.platform) {
        analytics.platforms[goal.platform] = (analytics.platforms[goal.platform] || 0) + 1;
      }

      // Completion data
      if (goal.status === 'completed' && goal.completed_at) {
        const startDate = new Date(goal.start_date);
        const completedDate = new Date(goal.completed_at);
        const daysToComplete = Math.ceil((completedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        completedGoalsData.push({ daysToComplete, completedDate });
      }

      // Performance tracking
      if (goal.status === 'active') {
        const targetDate = new Date(goal.target_date);
        const startDate = new Date(goal.start_date);
        const totalDays = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysPassed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const expectedProgress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

        if (progress >= expectedProgress + 10) {
          analytics.performance.goals_ahead++;
        } else if (progress < expectedProgress - 10) {
          analytics.performance.goals_behind++;
        } else {
          analytics.performance.goals_on_track++;
        }
      }

      // Milestones
      if (goal.goal_milestones) {
        analytics.milestones.total_milestones += goal.goal_milestones.length;
        const achieved = goal.goal_milestones.filter((m: any) => m.is_achieved);
        analytics.milestones.total_achieved += achieved.length;

        // Recent achievements (within timeframe)
        achieved.forEach((milestone: any) => {
          if (milestone.achieved_at && new Date(milestone.achieved_at) >= timeframeDate) {
            analytics.milestones.recent_achievements.push({
              goal_title: goal.title,
              milestone_percentage: milestone.milestone_percentage,
              achieved_at: milestone.achieved_at,
            });
          }
        });
      }
    });

    // Calculate derived metrics
    analytics.overview.completion_rate = analytics.overview.total_goals > 0
      ? Math.round((analytics.overview.completed_goals / analytics.overview.total_goals) * 100)
      : 0;

    analytics.overview.average_progress = analytics.overview.total_goals > 0
      ? Math.round(totalProgress / analytics.overview.total_goals)
      : 0;

    analytics.milestones.achievement_rate = analytics.milestones.total_milestones > 0
      ? Math.round((analytics.milestones.total_achieved / analytics.milestones.total_milestones) * 100)
      : 0;

    analytics.performance.average_days_to_completion = completedGoalsData.length > 0
      ? Math.round(completedGoalsData.reduce((sum, g) => sum + g.daysToComplete, 0) / completedGoalsData.length)
      : 0;

    // Generate progress trends (daily progress over timeframe)
    const progressTrends: Record<string, { date: string; total_progress: number; goals_count: number }> = {};
    
    goals.forEach(goal => {
      if (goal.goal_progress_log) {
        goal.goal_progress_log.forEach((log: any) => {
          const logDate = new Date(log.recorded_at);
          if (logDate >= timeframeDate) {
            const dateKey = logDate.toISOString().split('T')[0];
            if (!progressTrends[dateKey]) {
              progressTrends[dateKey] = { date: dateKey, total_progress: 0, goals_count: 0 };
            }
            progressTrends[dateKey].total_progress += log.progress_percentage;
            progressTrends[dateKey].goals_count++;
          }
        });
      }
    });

    analytics.progress_trends = Object.values(progressTrends)
      .map(trend => ({
        ...trend,
        average_progress: trend.goals_count > 0 ? Math.round(trend.total_progress / trend.goals_count) : 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Sort recent achievements by date
    analytics.milestones.recent_achievements.sort(
      (a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime()
    );

    return NextResponse.json({
      success: true,
      analytics,
      timeframe: parseInt(timeframe),
      platform: platform || 'all'
    });

  } catch (error) {
    console.error('Error in goals analytics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}