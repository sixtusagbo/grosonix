import { useState, useEffect } from 'react';
import { OptimalPostingAnalysis, PostingTimeRecommendation } from '@/lib/analytics/optimal-posting-time';

interface OptimalPostingTimeResponse {
  success: boolean;
  analysis: OptimalPostingAnalysis;
  subscription_tier: string;
  next_optimal_time: PostingTimeRecommendation | null;
}

interface MultiPlatformResponse {
  success: boolean;
  analyses: OptimalPostingAnalysis[];
  best_overall_times: PostingTimeRecommendation[];
  subscription_tier: string;
  timezone: string;
}

export function useOptimalPostingTime() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeOptimalTimes = async (
    platform: 'twitter' | 'linkedin' | 'instagram',
    timezone?: string
  ): Promise<OptimalPostingTimeResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        platform,
        ...(timezone && { timezone }),
      });

      const response = await fetch(`/api/analytics/optimal-posting-time?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze optimal posting times');
      }

      const data: OptimalPostingTimeResponse = await response.json();
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze optimal posting times';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeMultiplePlatforms = async (
    platforms: ('twitter' | 'linkedin' | 'instagram')[],
    timezone?: string
  ): Promise<MultiPlatformResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analytics/optimal-posting-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          platforms,
          timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze optimal posting times');
      }

      const data: MultiPlatformResponse = await response.json();
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze optimal posting times';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analyzeOptimalTimes,
    analyzeMultiplePlatforms,
    isLoading,
    error,
  };
}

// Hook for getting user's timezone
export function useUserTimezone() {
  const [timezone, setTimezone] = useState<string>('UTC');

  useEffect(() => {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(userTimezone);
    } catch (error) {
      console.error('Error detecting timezone:', error);
      setTimezone('UTC');
    }
  }, []);

  return timezone;
}

// Hook for real-time optimal posting recommendations
export function useOptimalPostingRecommendations(
  platforms: ('twitter' | 'linkedin' | 'instagram')[]
) {
  const [recommendations, setRecommendations] = useState<OptimalPostingAnalysis[]>([]);
  const [nextOptimalTime, setNextOptimalTime] = useState<PostingTimeRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const timezone = useUserTimezone();
  const { analyzeMultiplePlatforms } = useOptimalPostingTime();

  const refreshRecommendations = async () => {
    if (platforms.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeMultiplePlatforms(platforms, timezone);
      
      if (result) {
        setRecommendations(result.analyses);
        
        // Find the next optimal time across all platforms
        const allRecommendations = result.analyses.flatMap(analysis => analysis.recommendations);
        const nextTime = getNextOptimalTime(allRecommendations);
        setNextOptimalTime(nextTime);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshRecommendations();
  }, [platforms.join(','), timezone]);

  return {
    recommendations,
    nextOptimalTime,
    isLoading,
    error,
    refreshRecommendations,
    timezone,
  };
}

// Utility function to get next optimal time
function getNextOptimalTime(recommendations: PostingTimeRecommendation[]): PostingTimeRecommendation | null {
  if (recommendations.length === 0) return null;

  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();

  // Find the next optimal time
  const sortedRecommendations = recommendations
    .map(rec => {
      const daysUntil = (rec.dayOfWeek - currentDay + 7) % 7;
      const hoursUntil = daysUntil * 24 + (rec.hour - currentHour);
      
      return {
        ...rec,
        hoursUntil: hoursUntil <= 0 ? hoursUntil + 168 : hoursUntil, // Add a week if time has passed
      };
    })
    .sort((a, b) => a.hoursUntil - b.hoursUntil);

  return sortedRecommendations[0] || null;
}
