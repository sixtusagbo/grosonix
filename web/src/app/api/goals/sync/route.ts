import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoalIntegrationService } from '@/lib/goals/goal-integration-service';

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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goalIntegrationService = new GoalIntegrationService(supabase);
    
    // Sync goals with current metrics
    await goalIntegrationService.syncGoalsWithMetrics(user.id);

    return NextResponse.json({
      success: true,
      message: 'Goals synchronized with social media metrics'
    });

  } catch (error) {
    console.error('Error in goals sync API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const goalType = searchParams.get('goal_type');
    const platform = searchParams.get('platform');
    const targetMultiplier = parseFloat(searchParams.get('target_multiplier') || '1.5');

    if (!goalType || !platform) {
      return NextResponse.json({ 
        error: 'goal_type and platform parameters are required' 
      }, { status: 400 });
    }

    const goalIntegrationService = new GoalIntegrationService(supabase);
    
    // Get goal suggestion based on current metrics
    const suggestion = await goalIntegrationService.suggestGoalFromMetrics(
      user.id,
      goalType as any,
      platform as any,
      targetMultiplier
    );

    if (!suggestion) {
      return NextResponse.json({ 
        error: 'Unable to generate goal suggestion. Please check your connected accounts and metrics.' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      suggestion
    });

  } catch (error) {
    console.error('Error in goals suggestion API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}