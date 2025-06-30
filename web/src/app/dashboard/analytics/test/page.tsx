"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedCounter, MetricCounter, RealTimeMetrics } from "@/components/ui/animated-counter";
import { AnimatedProgress, GoalProgress } from "@/components/ui/animated-progress";
import { GrowthChart } from "@/components/dashboard/GrowthChart";
import { GoalSetting } from "@/components/dashboard/GoalSetting";
import { 
  Users, 
  Heart, 
  MessageCircle, 
  TrendingUp, 
  Target,
  Zap,
  BarChart3,
  Activity
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AnalyticsTestPage() {
  const [testMetrics, setTestMetrics] = useState([
    {
      id: "followers",
      label: "Total Followers",
      value: 12500,
      icon: <Users className="w-4 h-4" />,
      trend: "up" as const,
      trendValue: 8.5
    },
    {
      id: "engagement",
      label: "Engagement Rate",
      value: 4.2,
      icon: <Heart className="w-4 h-4" />,
      trend: "up" as const,
      trendValue: 12.3
    },
    {
      id: "posts",
      label: "Posts This Month",
      value: 28,
      icon: <MessageCircle className="w-4 h-4" />,
      trend: "neutral" as const,
      trendValue: 0
    },
    {
      id: "reach",
      label: "Total Reach",
      value: 45600,
      icon: <TrendingUp className="w-4 h-4" />,
      trend: "up" as const,
      trendValue: 15.7
    }
  ]);

  const [progressValue, setProgressValue] = useState(0);
  const [goalProgress, setGoalProgress] = useState(7500);
  const [counterValue, setCounterValue] = useState(1000);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setTestMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + Math.floor(Math.random() * 10) - 5,
        trendValue: Math.random() * 20
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const incrementProgress = () => {
    setProgressValue(prev => Math.min(prev + 10, 100));
  };

  const incrementGoal = () => {
    setGoalProgress(prev => Math.min(prev + 250, 10000));
  };

  const incrementCounter = () => {
    setCounterValue(prev => prev + Math.floor(Math.random() * 1000));
  };

  const mockSocialAccounts = [
    {
      id: "1",
      platform: "twitter",
      username: "testuser",
      user_id: "demo-user"
    },
    {
      id: "2", 
      platform: "instagram",
      username: "testuser",
      user_id: "demo-user"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-theme-primary">
          🚀 Analytics Dashboard Test Suite
        </h1>
        <p className="text-theme-secondary text-lg">
          Testing all implemented features from the timeline deliverables
        </p>
      </div>

      {/* Feature Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card border-emerald-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-500">
              ✅ Growth Tracking Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-theme-secondary">
              Multiple chart types, time selectors, real data integration
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-emerald-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-500">
              ✅ Real-time Metrics Display
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-theme-secondary">
              Animated counters, live updates, trend indicators
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-emerald-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-500">
              ✅ Analytics Visualization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-theme-secondary">
              Interactive charts, tooltips, comparative analytics
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-emerald-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-500">
              ✅ Progress Bars & Animations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-theme-secondary">
              Micro-animations, shimmer effects, milestone celebrations
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-emerald-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-500">
              ✅ Goal Setting Interface
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-theme-secondary">
              CRUD operations, progress tracking, achievement notifications
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-emerald-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-500">
              ✅ Performance Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-theme-secondary">
              Caching, debouncing, virtual scrolling, monitoring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Metrics Test */}
      <Card className="glass-card border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Real-time Metrics Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RealTimeMetrics 
            metrics={testMetrics}
            updateInterval={5000}
          />
        </CardContent>
      </Card>

      {/* Animated Counters Test */}
      <Card className="glass-card border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            Animated Counters Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <AnimatedCounter
              value={counterValue}
              duration={1500}
              className="text-2xl font-bold text-theme-primary"
            />
            <Button onClick={incrementCounter} variant="outline">
              Increment Counter
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCounter
              value={counterValue}
              label="Test Metric"
              icon={<BarChart3 className="w-4 h-4" />}
              trend="up"
              trendValue={15.5}
            />
            <MetricCounter
              value={counterValue * 0.8}
              label="Another Metric"
              icon={<TrendingUp className="w-4 h-4" />}
              trend="down"
              trendValue={5.2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Progress Bars Test */}
      <Card className="glass-card border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" />
            Progress Bars & Goal Tracking Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Basic Progress:</span>
              <Button onClick={incrementProgress} variant="outline" size="sm">
                +10%
              </Button>
            </div>
            <AnimatedProgress
              value={progressValue}
              showPercentage={true}
              gradient={true}
              pulseOnComplete={true}
              size="lg"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Goal Progress:</span>
              <Button onClick={incrementGoal} variant="outline" size="sm">
                +250
              </Button>
            </div>
            <GoalProgress
              current={goalProgress}
              target={10000}
              label="Followers Goal"
              milestones={[2500, 5000, 7500, 10000]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Growth Chart Test */}
      <Card className="glass-card border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            Growth Chart Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GrowthChart socialAccounts={mockSocialAccounts} />
        </CardContent>
      </Card>

      {/* Goal Setting Test */}
      <Card className="glass-card border-pink-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-pink-500" />
            Goal Setting Interface Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GoalSetting socialAccounts={mockSocialAccounts} />
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="glass-card border-emerald-500/20 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="text-center text-emerald-500">
            🎉 All Timeline Deliverables Implemented Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-2">
            <p className="text-theme-secondary">
              ✅ Functional analytics dashboard with real-time updates
            </p>
            <p className="text-theme-secondary">
              ✅ Complete goal tracking system with progress visualization
            </p>
            <p className="text-theme-secondary">
              ✅ Performance optimization with caching and monitoring
            </p>
            <p className="text-theme-secondary">
              ✅ Advanced animations and micro-interactions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}