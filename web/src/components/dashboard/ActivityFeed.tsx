"use client";

import { useState, useEffect } from "react";
import {
  CalendarDaysIcon,
  ChartBarIcon,
  UserPlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platform: string;
  scheduled_at: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  created_at: string;
}

interface ActivityFeedData {
  posts: ScheduledPost[];
  counts: {
    total: number;
    scheduled: number;
    draft: number;
    published: number;
    failed: number;
  };
}

export function ActivityFeed() {
  const [data, setData] = useState<ActivityFeedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityData();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchActivityData, 30000);

    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchActivityData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchActivityData = async () => {
    try {
      console.log('ActivityFeed: Fetching scheduled posts...');
      const response = await fetch('/api/scheduled-posts?limit=5');
      console.log('ActivityFeed: Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('ActivityFeed: Fetched data:', result);
        setData(result);
      } else {
        const errorData = await response.json();
        console.error('ActivityFeed: API error:', errorData);
      }
    } catch (error) {
      console.error('ActivityFeed: Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((date.getTime() - now.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) return `in ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `in ${Math.floor(diffInMinutes / 60)}h`;
    return `in ${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return '𝕏';
      case 'linkedin': return '💼';
      case 'instagram': return '📷';
      default: return '📱';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return ClockIcon;
      case 'published': return CheckCircleIcon;
      case 'failed': return XCircleIcon;
      default: return CalendarDaysIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-400';
      case 'published': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-neon-cyan-400';
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-6 text-text-primary">
          Recent Activity
        </h2>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start space-x-4 animate-pulse">
              <div className="bg-surface p-2 rounded-lg w-9 h-9"></div>
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-surface rounded mb-2"></div>
                <div className="h-3 bg-surface rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activities = [];

  // Add scheduled posts activity
  console.log('ActivityFeed: Processing data for activities:', data);

  if (data?.counts?.scheduled && data.counts.scheduled > 0) {
    const nextPost = data.posts.find(p => p.status === 'scheduled');
    console.log('ActivityFeed: Found scheduled posts:', data.counts.scheduled, 'Next post:', nextPost);

    activities.push({
      id: 'scheduled',
      type: 'scheduled',
      description: `${data.counts.scheduled} scheduled post${data.counts.scheduled > 1 ? 's' : ''}`,
      icon: getStatusIcon('scheduled'),
      iconColor: getStatusColor('scheduled'),
      timestamp: nextPost ? formatTimeAgo(nextPost.created_at) : 'Recently scheduled',
      platform: nextPost?.platform,
    });
  } else {
    console.log('ActivityFeed: No scheduled posts found, counts:', data?.counts);
    activities.push({
      id: 'no-scheduled',
      type: 'scheduled',
      description: 'No scheduled posts',
      icon: CalendarDaysIcon,
      iconColor: 'text-text-muted',
      timestamp: 'Schedule your first post',
    });
  }

  // Add follower activity
  activities.push({
    id: 'followers',
    type: 'follower',
    description: 'No new followers yet',
    icon: UserPlusIcon,
    iconColor: 'text-neon-cyan-400',
    timestamp: 'Just now',
  });

  // Add engagement placeholder (for future implementation)
  activities.push({
    id: 'engagement',
    type: 'engagement',
    description: 'Waiting for engagement data',
    icon: ChartBarIcon,
    iconColor: 'text-neon-cyan-400',
    timestamp: '1h ago',
  });

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">
          Recent Activity
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchActivityData}
            disabled={loading}
            className="p-1 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            title="Refresh activity"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      <div className="space-y-6">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-4">
            <div className="bg-surface p-2 rounded-lg">
              <activity.icon className={`w-5 h-5 ${activity.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-secondary font-semibold text-md leading-relaxed">
                {activity.description}
              </p>
              <p className="text-xs text-text-muted mt-0">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}