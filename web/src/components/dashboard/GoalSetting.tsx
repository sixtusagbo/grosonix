"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Goal, GoalTracker } from "@/lib/analytics/goal-tracker";
import {
  AlertTriangle,
  Calendar,
  Check,
  Edit3,
  Plus,
  Star,
  Target,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface GoalSettingProps {
  socialAccounts: any[] | null;
}

export function GoalSetting({ socialAccounts }: GoalSettingProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    metric_type: "followers",
    target_value: 0,
    start_value: 0,
    platform: "",
    deadline: "",
    priority: "medium",
    milestones: [] as number[]
  });

  // Enhanced goal form state for better UX
  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    metric_type: "followers" as Goal['metric_type'],
    target_value: "",
    start_value: "",
    platform: "",
    deadline: "",
    priority: "medium" as Goal['priority'],
    milestones: [] as number[]
  });

  const goalTracker = new GoalTracker();

  useEffect(() => {
    fetchGoals();
  }, []);

  // Validation function
  const validateGoalForm = (form: typeof goalForm): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!form.title.trim()) {
      errors.title = "Title is required";
    }

    if (!form.platform) {
      errors.platform = "Platform is required";
    }

    const targetValue = parseInt(form.target_value);
    const startValue = parseInt(form.start_value);

    if (!form.target_value || targetValue <= 0) {
      errors.target_value = "Target value must be greater than 0";
    }

    if (form.start_value && startValue < 0) {
      errors.start_value = "Start value cannot be negative";
    }

    if (targetValue && startValue && targetValue <= startValue) {
      errors.target_value = "Target value must be greater than start value";
    }

    if (!form.deadline) {
      errors.deadline = "Deadline is required";
    } else {
      const deadlineDate = new Date(form.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadlineDate <= today) {
        errors.deadline = "Deadline must be in the future";
      }
    }

    return errors;
  };

  // Reset form function
  const resetGoalForm = () => {
    setGoalForm({
      title: "",
      description: "",
      metric_type: "followers",
      target_value: "",
      start_value: "",
      platform: "",
      deadline: "",
      priority: "medium",
      milestones: []
    });
    setValidationErrors({});
  };

  // Add milestone function
  const addMilestone = () => {
    const targetValue = parseInt(goalForm.target_value);
    const startValue = parseInt(goalForm.start_value) || 0;

    if (!targetValue) {
      toast.error("Please set a target value first");
      return;
    }

    // Suggest milestone at 25%, 50%, 75% of target
    const suggestedMilestone = Math.round(startValue + (targetValue - startValue) * 0.5);

    if (!goalForm.milestones.includes(suggestedMilestone)) {
      setGoalForm({
        ...goalForm,
        milestones: [...goalForm.milestones, suggestedMilestone].sort((a, b) => a - b)
      });
    }
  };

  // Remove milestone function
  const removeMilestone = (milestone: number) => {
    setGoalForm({
      ...goalForm,
      milestones: goalForm.milestones.filter(m => m !== milestone)
    });
  };

  // Create demo goals for when API is not available
  const createDemoGoals = (): Goal[] => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    const farFutureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

    return [
      {
        id: 'demo-1',
        user_id: 'demo-user',
        title: 'Reach 10K Twitter Followers',
        description: 'Grow Twitter following through consistent content and engagement',
        metric_type: 'followers',
        target_value: 10000,
        start_value: 7500,
        current_value: 8200,
        platform: 'twitter',
        deadline: futureDate.toISOString().split('T')[0],
        priority: 'high',
        milestones: [8000, 9000, 9500],
        achieved_milestones: [8000],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'demo-2',
        user_id: 'demo-user',
        title: 'Improve Instagram Engagement',
        description: 'Increase engagement rate through better content strategy',
        metric_type: 'engagement',
        target_value: 5,
        start_value: 2,
        current_value: 3.2,
        platform: 'instagram',
        deadline: farFutureDate.toISOString().split('T')[0],
        priority: 'medium',
        milestones: [3, 4, 4.5],
        achieved_milestones: [3],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/goals");
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
        setIsDemoMode(false);
      } else {
        // Handle API errors gracefully - load demo goals instead
        console.log("Goals API not available, loading demo goals");
        setGoals(createDemoGoals());
        setIsDemoMode(true);
      }
    } catch (error) {
      // Network errors are expected in demo mode - load demo goals
      console.log("Goals API not available, loading demo goals");
      setGoals(createDemoGoals());
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    // Validate form
    const errors = validateGoalForm(goalForm);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the form errors");
      return;
    }

    try {
      const goalData = {
        title: goalForm.title,
        description: goalForm.description,
        metric_type: goalForm.metric_type,
        target_value: parseInt(goalForm.target_value),
        start_value: parseInt(goalForm.start_value) || 0,
        platform: goalForm.platform,
        deadline: goalForm.deadline,
        priority: goalForm.priority,
        milestones: goalForm.milestones
      };

      const goal = await goalTracker.createGoal(goalData);
      if (goal) {
        setGoals([...goals, goal]);
        setShowNewGoalForm(false);
        resetGoalForm();
        toast.success("Goal created successfully");
      } else {
        // If API fails, create a mock goal for demo purposes
        const mockGoal: Goal = {
          id: `mock-${Date.now()}`,
          user_id: 'demo-user',
          title: goalData.title,
          description: goalData.description,
          metric_type: goalData.metric_type,
          target_value: goalData.target_value,
          start_value: goalData.start_value,
          current_value: goalData.start_value,
          platform: goalData.platform,
          deadline: goalData.deadline,
          priority: goalData.priority,
          milestones: goalData.milestones,
          achieved_milestones: [],
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setGoals([...goals, mockGoal]);
        setShowNewGoalForm(false);
        resetGoalForm();
        toast.success("Goal created successfully (demo mode)");
      }
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("Failed to create goal");
    }
  };

  // Edit goal function
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalForm({
      title: goal.title,
      description: goal.description || "",
      metric_type: goal.metric_type,
      target_value: goal.target_value.toString(),
      start_value: goal.start_value.toString(),
      platform: goal.platform,
      deadline: goal.deadline,
      priority: goal.priority,
      milestones: goal.milestones
    });
    setShowNewGoalForm(true);
  };

  // Update goal function
  const handleUpdateGoal = async () => {
    if (!editingGoal) return;

    const errors = validateGoalForm(goalForm);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the form errors");
      return;
    }

    try {
      const updatedGoalData = {
        ...editingGoal,
        title: goalForm.title,
        description: goalForm.description,
        metric_type: goalForm.metric_type,
        target_value: parseInt(goalForm.target_value),
        start_value: parseInt(goalForm.start_value) || 0,
        platform: goalForm.platform,
        deadline: goalForm.deadline,
        priority: goalForm.priority,
        milestones: goalForm.milestones
      };

      // Update in local state (in real app, would call API)
      setGoals(goals.map(g => g.id === editingGoal.id ? updatedGoalData : g));
      setShowNewGoalForm(false);
      setEditingGoal(null);
      resetGoalForm();
      toast.success("Goal updated successfully");
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error("Failed to update goal");
    }
  };

  // Cancel edit function
  const handleCancelEdit = () => {
    setEditingGoal(null);
    setShowNewGoalForm(false);
    resetGoalForm();
  };

  const handleUpdateGoalStatus = async (goalId: string, status: Goal['status']) => {
    try {
      const success = await goalTracker.updateGoalStatus(goalId, status);
      if (success) {
        setGoals(goals.map(g => g.id === goalId ? { ...g, status } : g));
        toast.success(`Goal ${status === 'completed' ? 'completed' : 'updated'}`);
      }
    } catch (error) {
      console.error("Error updating goal status:", error);
      toast.error("Failed to update goal");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const success = await goalTracker.deleteGoal(goalId);
      if (success) {
        setGoals(goals.filter(g => g.id !== goalId));
        toast.success("Goal deleted");
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal");
    }
  };

  return (
    <Card className="glass-card border-purple-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Goals & Targets
            </CardTitle>
            {isDemoMode && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-500 rounded-full text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                Demo Mode
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewGoalForm(!showNewGoalForm)}
            className="border-purple-500/20 hover:border-purple-500/40"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Goal
          </Button>
        </div>
        {isDemoMode && (
          <p className="text-sm text-orange-500 mt-2">
            Running in demo mode with sample goals. Goals are stored locally and will reset on page refresh.
          </p>
        )}
      </CardHeader>
      <CardContent>
        {showNewGoalForm && (
          <Card className="mb-6 border-emerald-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-500" />
                  {editingGoal ? "Edit Goal" : "Create New Goal"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="text-theme-secondary hover:text-theme-primary"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-theme-primary">
                    Goal Title *
                  </label>
                  <Input
                    value={goalForm.title}
                    onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                    placeholder="e.g., Reach 10K followers"
                    className={validationErrors.title ? "border-red-500" : ""}
                  />
                  {validationErrors.title && (
                    <p className="text-xs text-red-500">{validationErrors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-theme-primary">
                    Platform *
                  </label>
                  <Select
                    value={goalForm.platform}
                    onValueChange={(value) => setGoalForm({ ...goalForm, platform: value })}
                  >
                    <SelectTrigger className={validationErrors.platform ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.platform && (
                    <p className="text-xs text-red-500">{validationErrors.platform}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-theme-primary">
                  Description
                </label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  placeholder="Describe your goal and strategy..."
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-theme-primary placeholder:text-theme-secondary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Metrics and Values */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-theme-primary">
                    Metric Type
                  </label>
                  <Select
                    value={goalForm.metric_type}
                    onValueChange={(value: Goal['metric_type']) => setGoalForm({ ...goalForm, metric_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="followers">Followers</SelectItem>
                      <SelectItem value="engagement">Engagement Rate</SelectItem>
                      <SelectItem value="posts">Posts Count</SelectItem>
                      <SelectItem value="likes">Likes</SelectItem>
                      <SelectItem value="comments">Comments</SelectItem>
                      <SelectItem value="shares">Shares</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-theme-primary">
                    Start Value
                  </label>
                  <Input
                    type="number"
                    value={goalForm.start_value}
                    onChange={(e) => setGoalForm({ ...goalForm, start_value: e.target.value })}
                    placeholder="Current value"
                    className={validationErrors.start_value ? "border-red-500" : ""}
                  />
                  {validationErrors.start_value && (
                    <p className="text-xs text-red-500">{validationErrors.start_value}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-theme-primary">
                    Target Value *
                  </label>
                  <Input
                    type="number"
                    value={goalForm.target_value}
                    onChange={(e) => setGoalForm({ ...goalForm, target_value: e.target.value })}
                    placeholder="Goal target"
                    className={validationErrors.target_value ? "border-red-500" : ""}
                  />
                  {validationErrors.target_value && (
                    <p className="text-xs text-red-500">{validationErrors.target_value}</p>
                  )}
                </div>
              </div>

              {/* Priority and Deadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-theme-primary">
                    Priority
                  </label>
                  <Select
                    value={goalForm.priority}
                    onValueChange={(value: Goal['priority']) => setGoalForm({ ...goalForm, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          Low Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          Medium Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          High Priority
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-theme-primary">
                    Deadline *
                  </label>
                  <Input
                    type="date"
                    value={goalForm.deadline}
                    onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                    className={validationErrors.deadline ? "border-red-500" : ""}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {validationErrors.deadline && (
                    <p className="text-xs text-red-500">{validationErrors.deadline}</p>
                  )}
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-theme-primary">
                    Milestones
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMilestone}
                    className="border-emerald-500/20 hover:border-emerald-500/40"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Milestone
                  </Button>
                </div>

                {goalForm.milestones.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {goalForm.milestones.map((milestone, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-sm"
                      >
                        <span>{milestone.toLocaleString()}</span>
                        <button
                          type="button"
                          onClick={() => removeMilestone(milestone)}
                          className="text-emerald-500 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border/50">
                <Button
                  onClick={editingGoal ? handleUpdateGoal : handleCreateGoal}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Target className="w-4 h-4 mr-2" />
                  {editingGoal ? "Update Goal" : "Create Goal"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="border-border/50"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goals List */}
        <div className="space-y-6">
          {goals.length === 0 ? (
            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="text-center py-12">
                <Target className="w-12 h-12 mx-auto mb-4 text-theme-secondary/50" />
                <h3 className="text-lg font-medium text-theme-primary mb-2">
                  No goals set yet
                </h3>
                <p className="text-theme-secondary mb-4">
                  Create your first goal to start tracking your social media growth
                </p>
                <Button
                  onClick={() => setShowNewGoalForm(true)}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            goals.map((goal) => {
              const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
              const isCompleted = goal.status === 'completed' || progress >= 100;
              const isOverdue = new Date(goal.deadline) < new Date() && !isCompleted;
              const daysUntilDeadline = Math.ceil(
                (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Card key={goal.id} className={`border transition-all duration-200 ${isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' :
                  isOverdue ? 'border-red-500/30 bg-red-500/5' :
                    'border-border/50 hover:border-emerald-500/30'
                  }`}>
                  <CardContent className="p-6">
                    {/* Goal Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-theme-primary">
                            {goal.title}
                          </h3>
                          {isCompleted && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-500 rounded-full text-xs font-medium">
                              <Check className="w-3 h-3" />
                              Completed
                            </div>
                          )}
                          {isOverdue && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-500 rounded-full text-xs font-medium">
                              <AlertTriangle className="w-3 h-3" />
                              Overdue
                            </div>
                          )}
                        </div>

                        {goal.description && (
                          <p className="text-sm text-theme-secondary mb-3">
                            {goal.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="capitalize">
                            {goal.platform}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {goal.metric_type}
                          </Badge>
                          <Badge variant="outline" className={
                            goal.priority === 'high' ? 'border-red-500/20 text-red-500' :
                              goal.priority === 'medium' ? 'border-orange-500/20 text-orange-500' :
                                'border-blue-500/20 text-blue-500'
                          }>
                            <Star className="w-3 h-3 mr-1" />
                            {goal.priority}
                          </Badge>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGoal(goal)}
                          className="border-emerald-500/20 hover:border-emerald-500/40"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        {goal.status !== 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateGoalStatus(goal.id, 'completed')}
                            className="border-emerald-500/20 hover:border-emerald-500/40"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="border-red-500/20 hover:border-red-500/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Enhanced Progress Display */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-theme-primary">Progress</span>
                          <span className="text-theme-secondary">
                            {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()} {goal.metric_type}
                          </span>
                        </div>

                        {/* Use the animated progress component */}
                        <div className="relative">
                          <Progress
                            value={progress}
                            className={`h-3 transition-all duration-500 ${isCompleted ? 'bg-emerald-500/20' :
                              isOverdue ? 'bg-red-500/20' : 'bg-emerald-500/10'
                              }`}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-theme-primary">
                              {progress.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Milestones */}
                      {goal.milestones.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-theme-primary">Milestones</span>
                          <div className="flex flex-wrap gap-2">
                            {goal.milestones.map((milestone, index) => {
                              const achieved = goal.current_value >= milestone;
                              return (
                                <div
                                  key={index}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${achieved
                                    ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                                    : 'bg-theme-secondary/10 text-theme-secondary border border-border/30'
                                    }`}
                                >
                                  {achieved && <Check className="w-3 h-3" />}
                                  {milestone.toLocaleString()}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Goal Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/30">
                        <div className="text-center">
                          <div className="text-xs text-theme-secondary">Remaining</div>
                          <div className="text-sm font-semibold text-theme-primary">
                            {Math.max(0, goal.target_value - goal.current_value).toLocaleString()}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-xs text-theme-secondary">Progress</div>
                          <div className="text-sm font-semibold text-emerald-500">
                            {progress.toFixed(1)}%
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-xs text-theme-secondary">Deadline</div>
                          <div className={`text-sm font-semibold flex items-center justify-center gap-1 ${isOverdue ? 'text-red-500' : daysUntilDeadline <= 7 ? 'text-orange-500' : 'text-theme-primary'
                            }`}>
                            <Calendar className="w-3 h-3" />
                            {isOverdue ? 'Overdue' : `${daysUntilDeadline}d left`}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-xs text-theme-secondary">Status</div>
                          <div className={`text-sm font-semibold ${isCompleted ? 'text-emerald-500' :
                            isOverdue ? 'text-red-500' : 'text-orange-500'
                            }`}>
                            {isCompleted ? 'Complete' : isOverdue ? 'Overdue' : 'Active'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}