import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { EnhancedOpenAIService } from '@/lib/ai/enhanced-openai';

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

    const body = await request.json();
    const { parent_goal_id, frequency = 'daily' } = body;

    // Validate frequency
    if (!['daily', 'weekly', 'one-time'].includes(frequency)) {
      return NextResponse.json({ 
        error: 'Invalid frequency. Must be daily, weekly, or one-time' 
      }, { status: 400 });
    }

    // Get parent goal if provided
    let parentGoal = null;
    if (parent_goal_id) {
      const { data: goal, error: goalError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('id', parent_goal_id)
        .eq('user_id', user.id)
        .single();

      if (goalError) {
        return NextResponse.json({ error: 'Parent goal not found' }, { status: 404 });
      }
      parentGoal = goal;
    }

    // Get user's subscription tier to determine challenge complexity and rewards
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const subscriptionTier = subscription?.plan || 'free';

    // Generate challenge using AI
    const challenge = await generateChallenge(
      parentGoal, 
      frequency, 
      subscriptionTier,
      user.id
    );

    // Create the challenge in the database
    const { data: newChallenge, error: insertError } = await supabase
      .from('user_goals')
      .insert({
        user_id: user.id,
        title: challenge.title,
        description: challenge.description,
        goal_type: parentGoal ? parentGoal.goal_type : challenge.goal_type,
        platform: parentGoal ? parentGoal.platform : challenge.platform,
        target_value: challenge.target_value,
        current_value: 0,
        start_date: new Date().toISOString().split('T')[0],
        target_date: challenge.target_date,
        status: 'active',
        priority: 'medium',
        is_public: false,
        is_challenge: true,
        challenge_frequency: frequency,
        challenge_type: challenge.challenge_type,
        challenge_reward_xp: challenge.reward_xp,
        parent_goal_id: parent_goal_id || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating challenge:', insertError);
      return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
    }

    // Create default milestones for the challenge
    if (challenge.target_value > 1) {
      const milestonesToCreate = [
        { percentage: 50, value: challenge.target_value * 0.5 },
        { percentage: 100, value: challenge.target_value }
      ];

      const { error: milestonesError } = await supabase
        .from('goal_milestones')
        .insert(milestonesToCreate.map(milestone => ({
          goal_id: newChallenge.id,
          milestone_percentage: milestone.percentage,
          milestone_value: milestone.value
        })));

      if (milestonesError) {
        console.error('Error creating challenge milestones:', milestonesError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      challenge: newChallenge
    });

  } catch (error) {
    console.error('Error in challenge generation API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateChallenge(
  parentGoal: any | null,
  frequency: string,
  subscriptionTier: string,
  userId: string
): Promise<{
  title: string;
  description: string;
  goal_type: string;
  platform: string;
  target_value: number;
  target_date: string;
  challenge_type: string;
  reward_xp: number;
}> {
  try {
    // Set target date based on frequency
    const targetDate = new Date();
    if (frequency === 'daily') {
      // End of today
      targetDate.setHours(23, 59, 59, 999);
    } else if (frequency === 'weekly') {
      // End of the week (next Sunday)
      const daysUntilSunday = 7 - targetDate.getDay();
      targetDate.setDate(targetDate.getDate() + daysUntilSunday);
      targetDate.setHours(23, 59, 59, 999);
    } else {
      // One-time: 3 days from now
      targetDate.setDate(targetDate.getDate() + 3);
      targetDate.setHours(23, 59, 59, 999);
    }

    // Determine challenge type and complexity based on parent goal and subscription
    let challengeType = '';
    let targetValue = 1;
    let rewardXp = 50; // Base XP reward

    // If parent goal exists, align challenge with parent goal
    if (parentGoal) {
      // Determine challenge type based on parent goal type
      switch (parentGoal.goal_type) {
        case 'followers':
          challengeType = ['content_generation', 'schedule_post', 'engage_followers'][Math.floor(Math.random() * 3)];
          break;
        case 'engagement_rate':
          challengeType = ['adapt_content', 'engage_followers'][Math.floor(Math.random() * 2)];
          break;
        case 'posts_count':
          challengeType = ['content_generation', 'schedule_post'][Math.floor(Math.random() * 2)];
          break;
        default:
          challengeType = ['content_generation', 'style_analysis', 'adapt_content', 'schedule_post', 'engage_followers'][Math.floor(Math.random() * 5)];
      }
    } else {
      // Random challenge type if no parent goal
      challengeType = ['content_generation', 'style_analysis', 'adapt_content', 'schedule_post', 'engage_followers'][Math.floor(Math.random() * 5)];
    }

    // Set target value and XP based on subscription tier and challenge type
    if (subscriptionTier === 'pro') {
      rewardXp = 100;
      if (frequency === 'daily') {
        if (challengeType === 'content_generation') targetValue = 3;
        if (challengeType === 'adapt_content') targetValue = 2;
      }
    } else if (subscriptionTier === 'agency') {
      rewardXp = 150;
      if (frequency === 'daily') {
        if (challengeType === 'content_generation') targetValue = 5;
        if (challengeType === 'adapt_content') targetValue = 3;
      }
    }

    // Adjust XP based on frequency
    if (frequency === 'weekly') rewardXp *= 3;
    if (frequency === 'one-time') rewardXp *= 2;

    // Generate challenge title and description using AI
    const openAIService = EnhancedOpenAIService.getInstance();
    const prompt = `Generate a social media ${frequency} challenge for a user${parentGoal ? ` that contributes to their goal of increasing ${parentGoal.goal_type} on ${parentGoal.platform}` : ''}. 
    
    Challenge type: ${challengeType}
    Target value: ${targetValue}
    
    Format your response as:
    TITLE: [short, motivating challenge title]
    DESCRIPTION: [brief description explaining what the user needs to do]`;

    const aiResponse = await openAIService.generateEnhancedContent({
      prompt,
      platform: 'twitter', // Doesn't matter for this use case
      tone: 'inspirational',
      maxTokens: 150,
      subscriptionTier: subscriptionTier as any,
    });

    // Parse AI response
    const lines = aiResponse.content.split('\n');
    let title = '';
    let description = '';

    for (const line of lines) {
      if (line.startsWith('TITLE:')) {
        title = line.replace('TITLE:', '').trim();
      } else if (line.startsWith('DESCRIPTION:')) {
        description = line.replace('DESCRIPTION:', '').trim();
      }
    }

    // Fallback if AI parsing fails
    if (!title) {
      const challengeTypeNames = {
        'content_generation': 'Content Creation',
        'style_analysis': 'Style Analysis',
        'adapt_content': 'Content Adaptation',
        'schedule_post': 'Post Scheduling',
        'engage_followers': 'Follower Engagement'
      };
      
      title = `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} ${challengeTypeNames[challengeType as keyof typeof challengeTypeNames]} Challenge`;
      description = `Complete ${targetValue} ${challengeType.replace('_', ' ')} ${targetValue === 1 ? 'task' : 'tasks'} to earn ${rewardXp} XP.`;
    }

    // Determine platform (use parent goal's platform or default to 'all')
    const platform = parentGoal ? parentGoal.platform : 'all';
    
    // Determine goal type (use parent goal's type or default based on challenge type)
    let goalType = parentGoal ? parentGoal.goal_type : 'custom';
    if (!parentGoal) {
      if (challengeType === 'content_generation' || challengeType === 'schedule_post') {
        goalType = 'posts_count';
      } else if (challengeType === 'engage_followers') {
        goalType = 'engagement_rate';
      }
    }

    return {
      title,
      description,
      goal_type: goalType,
      platform,
      target_value: targetValue,
      target_date: targetDate.toISOString().split('T')[0],
      challenge_type: challengeType,
      reward_xp: rewardXp
    };
  } catch (error) {
    console.error('Error generating challenge:', error);
    
    // Fallback to basic challenge if AI fails
    const targetDate = new Date();
    if (frequency === 'daily') {
      targetDate.setHours(23, 59, 59, 999);
    } else if (frequency === 'weekly') {
      targetDate.setDate(targetDate.getDate() + 7);
    } else {
      targetDate.setDate(targetDate.getDate() + 3);
    }
    
    return {
      title: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Challenge`,
      description: 'Complete this challenge to make progress on your goals.',
      goal_type: parentGoal ? parentGoal.goal_type : 'custom',
      platform: parentGoal ? parentGoal.platform : 'all',
      target_value: 1,
      target_date: targetDate.toISOString().split('T')[0],
      challenge_type: 'content_generation',
      reward_xp: 50
    };
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

    // Get active challenges for the user
    const { data: challenges, error: challengesError } = await supabase.rpc(
      'get_active_challenges_for_user',
      { user_uuid: user.id }
    );

    if (challengesError) {
      console.error('Error fetching challenges:', challengesError);
      return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      challenges: challenges || []
    });

  } catch (error) {
    console.error('Error in challenges GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}