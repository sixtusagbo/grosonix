"use client";

import { createBrowserClient } from "@supabase/ssr";

export interface RealTimeMetric {
  id: string;
  platform: string;
  metric_type: 'followers' | 'engagement' | 'posts' | 'reach';
  current_value: number;
  previous_value: number;
  change_percentage: number;
  timestamp: string;
  user_id: string;
}

export interface MetricUpdate {
  metric_id: string;
  new_value: number;
  change: number;
  percentage_change: number;
  timestamp: string;
}

export class RealTimeUpdater {
  private supabase;
  private subscribers: Map<string, (update: MetricUpdate) => void> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isActive = false;

  constructor() {
    this.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Start real-time updates for a user
   */
  async startUpdates(userId: string, intervalMs: number = 30000): Promise<void> {
    if (this.isActive) {
      this.stopUpdates();
    }

    this.isActive = true;
    
    // Set up periodic updates
    this.updateInterval = setInterval(async () => {
      await this.fetchAndBroadcastUpdates(userId);
    }, intervalMs);

    // Initial fetch
    await this.fetchAndBroadcastUpdates(userId);

    // Set up real-time subscription for immediate updates
    this.setupRealtimeSubscription(userId);
  }

  /**
   * Stop real-time updates
   */
  stopUpdates(): void {
    this.isActive = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Unsubscribe from real-time updates
    this.supabase.removeAllChannels();
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(metricId: string, callback: (update: MetricUpdate) => void): () => void {
    this.subscribers.set(metricId, callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(metricId);
    };
  }

  /**
   * Fetch latest metrics and broadcast updates
   */
  private async fetchAndBroadcastUpdates(userId: string): Promise<void> {
    try {
      // Fetch current metrics
      const response = await fetch(`/api/social/metrics?refresh=true`);
      if (!response.ok) return;

      const data = await response.json();
      const metrics = data.metrics || [];

      // Process each metric and check for changes
      for (const metric of metrics) {
        const metricId = `${metric.platform}_${metric.metric_type || 'general'}`;
        
        // Calculate changes (this would normally compare with previous values from cache/db)
        const update: MetricUpdate = {
          metric_id: metricId,
          new_value: metric.followers_count || 0,
          change: metric.growth_rate || 0,
          percentage_change: metric.growth_rate || 0,
          timestamp: new Date().toISOString()
        };

        // Broadcast to subscribers
        const callback = this.subscribers.get(metricId);
        if (callback) {
          callback(update);
        }

        // Broadcast to all subscribers (for general updates)
        this.subscribers.forEach((cb, id) => {
          if (id.startsWith('all_')) {
            cb(update);
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch metric updates:', error);
    }
  }

  /**
   * Set up Supabase real-time subscription
   */
  private setupRealtimeSubscription(userId: string): void {
    const channel = this.supabase
      .channel('metrics_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'metrics_cache',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleRealtimeUpdate(payload);
        }
      )
      .subscribe();
  }

  /**
   * Handle real-time database updates
   */
  private handleRealtimeUpdate(payload: any): void {
    try {
      const { new: newRecord, old: oldRecord, eventType } = payload;
      
      if (eventType === 'UPDATE' || eventType === 'INSERT') {
        const metricData = newRecord.metrics_data;
        const metricId = `${newRecord.platform}_general`;
        
        const update: MetricUpdate = {
          metric_id: metricId,
          new_value: metricData.followers_count || 0,
          change: metricData.growth_rate || 0,
          percentage_change: metricData.growth_rate || 0,
          timestamp: newRecord.updated_at || new Date().toISOString()
        };

        // Broadcast to subscribers
        const callback = this.subscribers.get(metricId);
        if (callback) {
          callback(update);
        }
      }
    } catch (error) {
      console.error('Error handling real-time update:', error);
    }
  }

  /**
   * Manually trigger a metric update
   */
  async triggerUpdate(userId: string, platform: string): Promise<void> {
    try {
      const response = await fetch(`/api/social/metrics?platform=${platform}&refresh=true`);
      if (response.ok) {
        await this.fetchAndBroadcastUpdates(userId);
      }
    } catch (error) {
      console.error('Failed to trigger metric update:', error);
    }
  }

  /**
   * Get current connection status
   */
  isConnected(): boolean {
    return this.isActive;
  }

  /**
   * Get subscriber count
   */
  getSubscriberCount(): number {
    return this.subscribers.size;
  }
}

// Singleton instance
export const realTimeUpdater = new RealTimeUpdater();
