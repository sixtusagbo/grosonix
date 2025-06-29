"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useGoals } from "@/hooks/useGoals";
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
import { toast } from "sonner";

interface GoalSettingProps {
  socialAccounts: any[] | null;
}

export function GoalSetting({ socialAccounts }: GoalSettingProps) {
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const {
    goals,
    loading,
    error,
    summary,
    createGoal,
    updateGoal,
    deleteGoal,
    updateProgress,
    refetch
  } = useGoals();

  // Enhanced goal form state for better UX
  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    goal_type: "followers" as any,
    target_value: "",
    start_value: "",
    platform: "",
    deadline: "",
    priority: "medium" as any,
    milestones: [] as number[]
  });

  // Reset form function
  const resetGoalForm = () => {
    setGoalForm({
      title: "",
      description: "",
      goal_type: "followers",
      target_value: "",
      start_value: "",
      platform: "",
      deadline: "",
      priority: "medium",
      milestones: []
    });
    setValidationErrors({});
  };

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

  // Initialize form data when goal changes
  useEffect(() => {
    if (editingGoal) {
      setGoalForm({
        title: editingGoal.title,
        description: editingGoal.description || "",
        goal_type: editingGoal.goal_type,
        target_value: editingGoal.target_value.toString(),
        start_value: (editingGoal.start_value || 0).toString(),
        platform: editingGoal.platform || "",
        deadline: editingGoal.target_date,
        priority: editingGoal.priority,
        milestones: editingGoal.milestones || []
      });
    }
  }, [editingGoal]);

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
        goal_type: goalForm.goal_type,
        target_value: parseInt(goalForm.target_value),
        start_value: parseInt(goalForm.start_value) || 0,
        platform: goalForm.platform,
        target_date: goalForm.deadline,
        priority: goalForm.priority,
        is_public: false,
        milestones: goalForm.milestones
      };

      await createGoal(goalData);
      setShowNewGoalForm(false);
      resetGoalForm();
      toast.success("Goal created successfully");
    } catch (err) {
      console.error("Error creating goal:", err);
      toast.error("Failed to create goal");
    }
  };

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
        title: goalForm.title,
        description: goalForm.description,
        goal_type: goalForm.goal_type,
        target_value: parseInt(goalForm.target_value),
        start_value: parseInt(goalForm.start_value) || 0,
        platform: goalForm.platform,
        target_date: goalForm.deadline,
        priority: goalForm.priority,
        is_public: false,
        milestones: goalForm.milestones
      };

      await updateGoal(editingGoal.id, updatedGoalData);
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

  const handleUpdateGoalStatus = async (goalId: string, status: 'active' | 'paused' | 'completed') => {
    try {
      await updateGoal(goalId, { status });
      toast.success(`Goal ${status === 'completed' ? 'completed' : 'updated'}`);
    } catch (error) {
      console.error("Error updating goal status:", error);
      toast.error("Failed to update goal");
    }
  };

  const handleProgressUpdate = async (goalId: string, newValue: number) => {
    try {
      await updateProgress(goalId, { new_value: newValue, source: 'manual' });
      toast.success("Progress updated successfully");
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    }
  };

  return (
    <Card className="glass-card border-purple-500/20">
    <Card className="glass-card border-purple-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Goals & Targets
            </CardTitle>
            {error && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-500 rounded-full text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                Error loading goals
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Goals & Targets
            </CardTitle>
            {error && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-500 rounded-full text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                Error loading goals
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewGoalForm(!showNewGoalForm)}
            className="border-purple-500/20 hover:border-purple-500/40"
            className="border-purple-500/20 hover:border-purple-500/40"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Goal
          </Button>
        </div>
        {error && (
          <p className="text-sm text-orange-500 mt-2">
            {typeof error === 'string' ? error : 'Failed to load goals. Please try again.'}
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
                    value={goalForm.goal_type}
                    onValueChange={(value) => setGoalForm({ ...goalForm, goal_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="followers">Followers</SelectItem>
                      <SelectItem value="engagement_rate">Engagement Rate</SelectItem>
                      <SelectItem value="posts_count">Posts Count</SelectItem>
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
                    onValueChange={(value) => setGoalForm({ ...goalForm, priority: value })}
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
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-theme-secondary">Loading goals...</p>
            </div>
          ) : goals.length === 0 ? (
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
              const isCompleted = goal.status === 'completed';
              const isOverdue = goal.is_overdue;
              const daysRemaining = goal.days_remaining || 0;

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
                            {goal.goal_type}
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
                          onClick={() => setEditingGoal(goal)}
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
                          onClick={() => deleteGoal(goal.id)}
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
                            {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()} {goal.goal_type}
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
                      {goal.milestones && goal.milestones.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-theme-primary">Milestones</span>
                          <div className="flex flex-wrap gap-2">
                            {goal.milestones.map((milestone: number, index: number) => {
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
                          <div className={`text-sm font-semibold flex items-center justify-center gap-1 ${isOverdue ? 'text-red-500' : daysRemaining <= 7 ? 'text-orange-500' : 'text-theme-primary'
                            }`}>
                            <Calendar className="w-3 h-3" />
                            {isOverdue ? 'Overdue' : `${daysRemaining}d left`}
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