"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalProgress } from "@/components/ui/animated-progress";
import { MetricCounter } from "@/components/ui/animated-counter";
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Users, 
  Heart, 
  MessageCircle,
  Plus,
  Edit,
  Trash2,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  title: string;
  metric: "followers" | "engagement" | "posts" | "reach";
  currentValue: number;
  targetValue: number;
  deadline: string;
  platform: string;
  status: "active" | "completed" | "paused";
  createdAt: string;
}

interface GoalSettingProps {
  socialAccounts?: any[] | null;
  className?: string;
}

export function GoalSetting({ socialAccounts, className }: GoalSettingProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: "",
    metric: "followers" as Goal["metric"],
    targetValue: "",
    deadline: "",
    platform: "all"
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    // Simulate loading goals - replace with actual API call
    const mockGoals: Goal[] = [
      {
        id: "1",
        title: "Reach 10K Followers",
        metric: "followers",
        currentValue: 7500,
        targetValue: 10000,
        deadline: "2024-12-31",
        platform: "twitter",
        status: "active",
        createdAt: "2024-01-01"
      },
      {
        id: "2", 
        title: "Improve Engagement Rate",
        metric: "engagement",
        currentValue: 3.2,
        targetValue: 5.0,
        deadline: "2024-06-30",
        platform: "all",
        status: "active",
        createdAt: "2024-01-15"
      }
    ];
    setGoals(mockGoals);
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title || !newGoal.targetValue || !newGoal.deadline) return;

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      metric: newGoal.metric,
      currentValue: 0, // Will be fetched from actual metrics
      targetValue: parseFloat(newGoal.targetValue),
      deadline: newGoal.deadline,
      platform: newGoal.platform,
      status: "active",
      createdAt: new Date().toISOString()
    };

    setGoals([...goals, goal]);
    setNewGoal({
      title: "",
      metric: "followers",
      targetValue: "",
      deadline: "",
      platform: "all"
    });
    setIsCreating(false);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId));
  };

  const getMetricIcon = (metric: Goal["metric"]) => {
    switch (metric) {
      case "followers": return <Users className="w-4 h-4" />;
      case "engagement": return <Heart className="w-4 h-4" />;
      case "posts": return <MessageCircle className="w-4 h-4" />;
      case "reach": return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getMetricLabel = (metric: Goal["metric"]) => {
    switch (metric) {
      case "followers": return "Followers";
      case "engagement": return "Engagement Rate";
      case "posts": return "Posts";
      case "reach": return "Reach";
    }
  };

  const getDaysRemaining = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="glass-card border-emerald-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-theme-primary">
              <Target className="w-5 h-5 text-emerald-500" />
              Goal Setting & Tracking
            </CardTitle>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="bg-surface/50">
              <TabsTrigger value="active">
                Active Goals ({activeGoals.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedGoals.length})
              </TabsTrigger>
              <TabsTrigger value="analytics">
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeGoals.length === 0 ? (
                <div className="text-center py-8 text-theme-secondary">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active goals yet. Create your first goal to get started!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {activeGoals.map((goal) => (
                    <Card key={goal.id} className="glass-card border-emerald-500/10">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/20">
                              {getMetricIcon(goal.metric)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-theme-primary">
                                {goal.title}
                              </h3>
                              <p className="text-sm text-theme-secondary">
                                {getMetricLabel(goal.metric)} • {goal.platform}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteGoal(goal.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <GoalProgress
                          current={goal.currentValue}
                          target={goal.targetValue}
                          label={`Progress: ${goal.currentValue.toLocaleString()} / ${goal.targetValue.toLocaleString()}`}
                          className="mb-4"
                        />

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-theme-secondary">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {getDaysRemaining(goal.deadline)} days remaining
                            </span>
                          </div>
                          <div className="text-emerald-500 font-medium">
                            {Math.round((goal.currentValue / goal.targetValue) * 100)}% complete
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedGoals.length === 0 ? (
                <div className="text-center py-8 text-theme-secondary">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No completed goals yet. Keep working towards your targets!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {completedGoals.map((goal) => (
                    <Card key={goal.id} className="glass-card border-emerald-500/20">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Trophy className="w-5 h-5 text-emerald-500" />
                          <h3 className="font-semibold text-theme-primary">
                            {goal.title}
                          </h3>
                        </div>
                        <p className="text-sm text-theme-secondary">
                          Completed on {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCounter
                  value={activeGoals.length}
                  label="Active Goals"
                  icon={<Target className="w-4 h-4" />}
                />
                <MetricCounter
                  value={completedGoals.length}
                  label="Completed Goals"
                  icon={<Trophy className="w-4 h-4" />}
                />
                <MetricCounter
                  value={activeGoals.length > 0 ? 
                    Math.round(activeGoals.reduce((acc, goal) => 
                      acc + (goal.currentValue / goal.targetValue), 0) / activeGoals.length * 100) : 0
                  }
                  label="Avg Progress"
                  suffix="%"
                  icon={<TrendingUp className="w-4 h-4" />}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Goal Modal */}
      {isCreating && (
        <Card className="glass-card border-emerald-500/20">
          <CardHeader>
            <CardTitle>Create New Goal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Goal Title</Label>
              <Input
                id="title"
                value={newGoal.title}
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                placeholder="e.g., Reach 10K followers"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metric">Metric</Label>
                <Select value={newGoal.metric} onValueChange={(value) => 
                  setNewGoal({...newGoal, metric: value as Goal["metric"]})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="followers">Followers</SelectItem>
                    <SelectItem value="engagement">Engagement Rate</SelectItem>
                    <SelectItem value="posts">Posts</SelectItem>
                    <SelectItem value="reach">Reach</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="target">Target Value</Label>
                <Input
                  id="target"
                  type="number"
                  value={newGoal.targetValue}
                  onChange={(e) => setNewGoal({...newGoal, targetValue: e.target.value})}
                  placeholder="10000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select value={newGoal.platform} onValueChange={(value) => 
                  setNewGoal({...newGoal, platform: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateGoal} className="bg-emerald-500 hover:bg-emerald-600">
                Create Goal
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
