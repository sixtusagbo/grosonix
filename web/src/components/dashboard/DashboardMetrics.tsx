"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceOptimizer } from "@/lib/analytics/performance-optimizer";
import { realTimeUpdater } from "@/lib/analytics/real-time-updater";
import { PlatformFilter } from "@/lib/social";
import {
  Activity,
  BarChart3,
  RefreshCw,
  Settings,
  Zap
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GoalSetting } from "./GoalSetting";
import { GrowthChart } from "./GrowthChart";
import { PlatformSelector } from "./PlatformSelector";
import { StatsGrid } from "./StatsGrid";

interface DashboardMetricsProps {
  socialAccounts: any[] | null;
}

export function DashboardMetrics({ socialAccounts }: DashboardMetricsProps) {
  const [selectedPlatform, setSelectedPlatform] =
    useState<PlatformFilter>("overview");
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    averageRenderTime: number;
    averageDataFetchTime: number;
    cacheHitRate: number;
    memoryUsage: number;
    slowComponents: string[];
  } | null>(null);

  const performanceOptimizerRef = useRef<PerformanceOptimizer | null>(null);

  const connectedPlatforms =
    socialAccounts?.map((account) => account.platform) || [];

  // Initialize performance optimizer
  useEffect(() => {
    performanceOptimizerRef.current = new PerformanceOptimizer({
      enableCaching: true,
      cacheSize: 100,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    });

    return () => {
      performanceOptimizerRef.current?.dispose();
    };
  }, []);

  // Function to refresh metrics manually
  const refreshMetrics = useCallback(async () => {
    try {
      // Trigger a refresh of the StatsGrid component
      // This will be handled by the StatsGrid component itself
      console.log('Refreshing metrics...');
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    }
  }, []);

  // Function to start real-time updates
  const startRealTimeUpdates = useCallback(async () => {
    try {
      // For now, we'll use a mock user ID. In a real app, this would come from auth
      const userId = 'current-user-id';
      await realTimeUpdater.startUpdates(userId, 30000); // 30 second intervals
      setIsRealTimeActive(true);
      console.log('Real-time updates started');
    } catch (error) {
      console.error('Failed to start real-time updates:', error);
    }
  }, []);

  // Function to stop real-time updates
  const stopRealTimeUpdates = useCallback(() => {
    try {
      realTimeUpdater.stopUpdates();
      setIsRealTimeActive(false);
      console.log('Real-time updates stopped');
    } catch (error) {
      console.error('Failed to stop real-time updates:', error);
    }
  }, []);

  // Function to get performance report
  const getPerformanceReport = useCallback(() => {
    try {
      if (performanceOptimizerRef.current) {
        const report = performanceOptimizerRef.current.getPerformanceReport();
        setPerformanceMetrics(report);
        console.log('Performance report:', report);
      }
    } catch (error) {
      console.error('Failed to get performance report:', error);
    }
  }, []);

  // Check real-time connection status
  useEffect(() => {
    const checkConnectionStatus = () => {
      setIsRealTimeActive(realTimeUpdater.isConnected());
    };

    // Check status every 5 seconds
    const interval = setInterval(checkConnectionStatus, 5000);

    // Initial check
    checkConnectionStatus();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Real-time Controls */}
      <Card className="glass-card border-emerald-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-theme-primary">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                Analytics Dashboard
                {isRealTimeActive && (
                  <div className="flex items-center gap-1 text-sm text-emerald-500">
                    <Activity className="w-3 h-3 animate-pulse" />
                    Live
                  </div>
                )}
              </CardTitle>
              <p className="text-theme-secondary text-sm">
                Real-time metrics from your connected social media accounts
              </p>
            </div>

            <div className="flex items-center gap-2">
              <PlatformSelector
                selectedPlatform={selectedPlatform}
                onPlatformChange={setSelectedPlatform}
                connectedPlatforms={connectedPlatforms}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={refreshMetrics}
                className="border-emerald-500/20 hover:border-emerald-500/40"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={isRealTimeActive ? stopRealTimeUpdates : startRealTimeUpdates}
                className={`border-emerald-500/20 hover:border-emerald-500/40 ${isRealTimeActive ? 'bg-emerald-500/10' : ''
                  }`}
              >
                <Zap className="w-4 h-4" />
                {isRealTimeActive ? 'Stop' : 'Start'} Live
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={getPerformanceReport}
                className="border-emerald-500/20 hover:border-emerald-500/40"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Performance Metrics (if available) */}
      {performanceMetrics && (
        <Card className="glass-card border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-sm text-orange-500">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-theme-secondary">Avg Render:</span>
                <span className="ml-2 font-mono text-theme-primary">
                  {performanceMetrics.averageRenderTime.toFixed(1)}ms
                </span>
              </div>
              <div>
                <span className="text-theme-secondary">Cache Hit:</span>
                <span className="ml-2 font-mono text-emerald-500">
                  {performanceMetrics.cacheHitRate.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-theme-secondary">Memory:</span>
                <span className="ml-2 font-mono text-theme-primary">
                  {performanceMetrics.memoryUsage.toFixed(1)}MB
                </span>
              </div>
              <div>
                <span className="text-theme-secondary">Status:</span>
                <span className="ml-2 font-mono text-emerald-500">
                  {realTimeUpdater.isConnected() ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Metrics Grid */}
      <StatsGrid
        socialAccounts={socialAccounts}
        selectedPlatform={selectedPlatform}
      />

      {/* Enhanced Growth Chart */}
      <GrowthChart socialAccounts={socialAccounts} />

      {/* Goal Setting & Tracking */}
      <GoalSetting socialAccounts={socialAccounts} />
    </div>
  );
}
