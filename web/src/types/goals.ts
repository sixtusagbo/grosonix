export type GoalType = 
  | 'followers' 
  | 'engagement_rate' 
  | 'posts_count' 
  | 'likes' 
  | 'comments' 
  | 'shares' 
  | 'impressions' 
  | 'custom';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export type GoalPriority = 'low' | 'medium' | 'high';

export type Platform = 'twitter' | 'linkedin' | 'instagram' | 'all';

export type ProgressSource = 'manual' | 'automatic' | 'api_sync' | 'challenge_completion';

export type ChallengeFrequency = 'daily' | 'weekly' | 'one-time';

export type ChallengeType = 
  | 'content_generation'
  | 'style_analysis'
  | 'adapt_content'
  | 'schedule_post'
  | 'engage_followers';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  goal_type: GoalType;
  platform?: Platform;
  target_value: number;
  current_value: number;
  start_date: string;
  target_date: string;
  status: GoalStatus;
  priority: GoalPriority;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Challenge fields
  is_challenge?: boolean;
  challenge_frequency?: ChallengeFrequency;
  challenge_type?: ChallengeType;
  challenge_reward_xp?: number;
  parent_goal_id?: string;
  parent_goal_title?: string;
  
  // Computed fields
  progress_percentage?: number;
  days_remaining?: number;
  is_overdue?: boolean;
  achieved_milestones?: number;
  total_milestones?: number;
  recent_progress?: GoalProgressLog[];
}

export interface GoalProgressLog {
  id: string;
  goal_id: string;
  previous_value: number;
  new_value: number;
  change_amount: number;
  progress_percentage: number;
  recorded_at: string;
  source: ProgressSource;
  notes?: string;
}

export interface GoalMilestone {
  id: string;
  goal_id: string;
  milestone_percentage: number;
  milestone_value: number;
  is_achieved: boolean;
  achieved_at?: string;
  created_at: string;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  goal_type: GoalType;
  platform?: Platform;
  target_value: number;
  target_date: string;
  priority?: GoalPriority;
  is_public?: boolean;
  milestones?: Array<{
    percentage: number;
    value: number;
  }>;
  is_challenge?: boolean;
  challenge_frequency?: ChallengeFrequency;
  challenge_type?: ChallengeType;
  challenge_reward_xp?: number;
  parent_goal_id?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  target_value?: number;
  target_date?: string;
  status?: GoalStatus;
  priority?: GoalPriority;
  is_public?: boolean;
  current_value?: number;
  is_challenge?: boolean;
  challenge_frequency?: ChallengeFrequency;
  challenge_type?: ChallengeType;
  challenge_reward_xp?: number;
  parent_goal_id?: string;
}

export interface UpdateProgressRequest {
  new_value: number;
  source?: ProgressSource;
  notes?: string;
}

export interface GoalSummary {
  total: number;
  active: number;
  completed: number;
  overdue: number;
}

export interface GoalAnalytics {
  overview: {
    total_goals: number;
    active_goals: number;
    completed_goals: number;
    paused_goals: number;
    cancelled_goals: number;
    overdue_goals: number;
    completion_rate: number;
    average_progress: number;
  };
  progress_trends: Array<{
    date: string;
    total_progress: number;
    goals_count: number;
    average_progress: number;
  }>;
  goal_types: Record<string, number>;
  platforms: Record<string, number>;
  milestones: {
    total_achieved: number;
    total_milestones: number;
    achievement_rate: number;
    recent_achievements: Array<{
      goal_title: string;
      milestone_percentage: number;
      achieved_at: string;
    }>;
  };
  performance: {
    goals_on_track: number;
    goals_behind: number;
    goals_ahead: number;
    average_days_to_completion: number;
  };
}

export interface GoalFilters {
  status?: GoalStatus;
  platform?: Platform;
  goal_type?: GoalType;
  priority?: GoalPriority;
  search?: string;
}

// API Response types
export interface GoalsResponse {
  success: boolean;
  goals: Goal[];
  summary: GoalSummary;
}

export interface GoalResponse {
  success: boolean;
  goal: Goal;
}

export interface ProgressResponse {
  success: boolean;
  progress_log: GoalProgressLog;
  achieved_milestones: GoalMilestone[];
  goal_completed: boolean;
  new_progress_percentage: number;
  change_amount: number;
}

export interface ProgressLogResponse {
  success: boolean;
  progress_log: GoalProgressLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface AnalyticsResponse {
  success: boolean;
  analytics: GoalAnalytics;
  timeframe: number;
  platform: string;
}

// UI Component Props
export interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  onUpdateProgress?: (goalId: string, newValue: number) => void;
  showActions?: boolean;
}

export interface GoalFormProps {
  goal?: Goal;
  onSubmit: (data: CreateGoalRequest | UpdateGoalRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface ProgressChartProps {
  goal: Goal;
  progressLog?: GoalProgressLog[];
  height?: number;
}

export interface MilestoneIndicatorProps {
  milestones: GoalMilestone[];
  currentValue: number;
  targetValue: number;
}

// Utility types
export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  followers: 'Followers',
  engagement_rate: 'Engagement Rate',
  posts_count: 'Posts Count',
  likes: 'Likes',
  comments: 'Comments',
  shares: 'Shares',
  impressions: 'Impressions',
  custom: 'Custom'
};

export const GOAL_TYPE_UNITS: Record<GoalType, string> = {
  followers: 'followers',
  engagement_rate: '%',
  posts_count: 'posts',
  likes: 'likes',
  comments: 'comments',
  shares: 'shares',
  impressions: 'impressions',
  custom: 'units'
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  all: 'All Platforms'
};

export const STATUS_COLORS: Record<GoalStatus, string> = {
  active: 'bg-blue-500',
  completed: 'bg-green-500',
  paused: 'bg-yellow-500',
  cancelled: 'bg-red-500'
};

export const PRIORITY_COLORS: Record<GoalPriority, string> = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-red-500'
};

export const CHALLENGE_TYPE_LABELS: Record<string, string> = {
  content_generation: 'Content Creation',
  style_analysis: 'Style Analysis',
  adapt_content: 'Content Adaptation',
  schedule_post: 'Post Scheduling',
  engage_followers: 'Follower Engagement'
};