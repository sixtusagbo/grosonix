import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get today's date for daily usage calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count today's AI generations
    const { data: generations, error } = await supabase
      .from('ai_generations')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (error) {
      console.error('Error fetching usage stats:', error);
      // Return default values if table doesn't exist or other error
      return NextResponse.json({
        total_generations: 0,
        daily_generations: 0,
        remaining_generations: 10, // Free tier daily limit
        daily_limit: 10,
        reset_time: tomorrow.toISOString(),
      });
    }

    const dailyGenerations = generations?.length || 0;
    const dailyLimit = 10; // Free tier limit
    const remainingGenerations = Math.max(0, dailyLimit - dailyGenerations);

    return NextResponse.json({
      total_generations: dailyGenerations, // For now, just show daily
      daily_generations: dailyGenerations,
      remaining_generations: remainingGenerations,
      daily_limit: dailyLimit,
      reset_time: tomorrow.toISOString(),
    });

  } catch (error) {
    console.error('Usage stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
