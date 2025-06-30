"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Calendar, Target, TrendingUp, Users, Lightbulb, Loader2, Zap } from 'lucide-react';
import { useGoalIntegration } from '@/hooks/useGoalIntegration';
import {
  Goal,
  GoalType,
  Platform,
  GoalPriority,
  CreateGoalRequest,
  UpdateGoalRequest,
  GOAL_TYPE_LABELS,
  GOAL_TYPE_UNITS,
  PLATFORM_LABELS
} from '@/types/goals';

interface GoalFormProps {
  goal?: Goal;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGoalRequest | UpdateGoalRequest) => Promise<void>;
  isLoading?: boolean;
  parentGoals?: Goal[];
}

export function GoalForm({ 
  goal, 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false,
  parentGoals = []
}: GoalFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_type: 'followers' as GoalType,
    platform: 'all' as Platform,
    target_value: '',
    target_date: '',
    priority: 'medium' as GoalPriority,
    is_public: false,
    is_challenge: false,
    challenge_frequency: 'daily' as 'daily' | 'weekly' | 'one-time',
    challenge_type: 'content_generation' as string,
    challenge_reward_xp: '50',
    parent_goal_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { suggestGoal, suggesting } = useGoalIntegration();

  // Initialize form data when goal changes
  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description || '',
        goal_type: goal.goal_type,
        platform: goal.platform || 'all',
        target_value: goal.target_value.toString(),
        target_date: goal.target_date.split('T')[0], // Convert to YYYY-MM-DD format
        priority: goal.priority,
        is_public: goal.is_public,
        is_challenge: goal.is_challenge || false,
        challenge_frequency: (goal.challenge_frequency as any) || 'daily',
        challenge_type: goal.challenge_type || 'content_generation',
        challenge_reward_xp: goal.challenge_reward_xp?.toString() || '50',
        parent_goal_id: goal.parent_goal_id || '',
      });
    } else {
      // Reset form for new goal
      setFormData({
        title: '',
        description: '',
        goal_type: 'followers',
        platform: 'all',
        target_value: '',
        target_date: '',
        priority: 'medium',
        is_public: false,
        is_challenge: false,
        challenge_frequency: 'daily',
        challenge_type: 'content_generation',
        challenge_reward_xp: '50',
        parent_goal_id: '',
      });
    }
    setErrors({});
  }, [goal, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.target_value || parseFloat(formData.target_value) <= 0) {
      newErrors.target_value = 'Target value must be greater than 0';
    }

    if (!formData.target_date) {
      newErrors.target_date = 'Target date is required';
    } else {
      const targetDate = new Date(formData.target_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (targetDate <= today) {
        newErrors.target_date = 'Target date must be in the future';
      }
    }

    if (formData.is_challenge) {
      if (!formData.challenge_frequency) {
        newErrors.challenge_frequency = 'Challenge frequency is required';
      }
      
      if (!formData.challenge_type) {
        newErrors.challenge_type = 'Challenge type is required';
      }
      
      if (!formData.challenge_reward_xp || parseInt(formData.challenge_reward_xp) <= 0) {
        newErrors.challenge_reward_xp = 'Reward XP must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: any = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      goal_type: formData.goal_type,
      platform: formData.platform === 'all' ? undefined : formData.platform,
      target_value: parseFloat(formData.target_value),
      target_date: formData.target_date,
      priority: formData.priority,
      is_public: formData.is_public,
    };

    // Add challenge fields if this is a challenge
    if (formData.is_challenge) {
      submitData.is_challenge = true;
      submitData.challenge_frequency = formData.challenge_frequency;
      submitData.challenge_type = formData.challenge_type;
      submitData.challenge_reward_xp = parseInt(formData.challenge_reward_xp);
      
      if (formData.parent_goal_id) {
        submitData.parent_goal_id = formData.parent_goal_id;
      }
    }

    try {
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSuggestGoal = async () => {
    if (!formData.goal_type || !formData.platform) {
      return;
    }

    const suggestion = await suggestGoal(
      formData.goal_type,
      formData.platform === 'all' ? 'all' : formData.platform,
      1.5 // 50% increase from current
    );

    if (suggestion) {
      setFormData(prev => ({
        ...prev,
        target_value: suggestion.suggested_target.toString()
      }));
    }
  };

  const getGoalTypeIcon = (type: GoalType) => {
    switch (type) {
      case 'followers':
        return <Users className="w-4 h-4" />;
      case 'engagement_rate':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getChallengeTypeOptions = () => {
    return [
      { value: 'content_generation', label: 'Content Creation' },
      { value: 'style_analysis', label: 'Style Analysis' },
      { value: 'adapt_content', label: 'Content Adaptation' },
      { value: 'schedule_post', label: 'Post Scheduling' },
      { value: 'engage_followers', label: 'Follower Engagement' }
    ];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Goal Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Reach 10K followers on Twitter"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your goal and why it's important to you..."
                  rows={3}
                />
              </div>
              
              {/* Challenge Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_challenge"
                  checked={formData.is_challenge}
                  onCheckedChange={(checked) => handleInputChange('is_challenge', checked)}
                />
                <Label htmlFor="is_challenge" className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  This is a challenge
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Goal Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Goal Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goal_type">Goal Type *</Label>
                  <Select
                    value={formData.goal_type}
                    onValueChange={(value) => handleInputChange('goal_type', value as GoalType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GOAL_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            {getGoalTypeIcon(value as GoalType)}
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => handleInputChange('platform', value as Platform)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="target_value">
                      Target Value * ({GOAL_TYPE_UNITS[formData.goal_type]})
                    </Label>
                    {!goal && formData.goal_type !== 'custom' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSuggestGoal}
                        disabled={suggesting || !formData.goal_type || !formData.platform}
                        className="text-xs"
                      >
                        {suggesting ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Lightbulb className="w-3 h-3 mr-1" />
                        )}
                        Suggest
                      </Button>
                    )}
                  </div>
                  <Input
                    id="target_value"
                    type="number"
                    min="0"
                    step={formData.goal_type === 'engagement_rate' ? '0.01' : '1'}
                    value={formData.target_value}
                    onChange={(e) => handleInputChange('target_value', e.target.value)}
                    placeholder="Enter target value"
                    className={errors.target_value ? 'border-red-500' : ''}
                  />
                  {errors.target_value && (
                    <p className="text-sm text-red-500 mt-1">{errors.target_value}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="target_date">Target Date *</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => handleInputChange('target_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={errors.target_date ? 'border-red-500' : ''}
                  />
                  {errors.target_date && (
                    <p className="text-sm text-red-500 mt-1">{errors.target_date}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value as GoalPriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => handleInputChange('is_public', checked)}
                />
                <Label htmlFor="is_public">Make this goal public</Label>
              </div>
            </CardContent>
          </Card>

          {/* Challenge Configuration (only shown if is_challenge is true) */}
          {formData.is_challenge && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Challenge Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="challenge_frequency">Challenge Frequency *</Label>
                    <Select
                      value={formData.challenge_frequency}
                      onValueChange={(value) => handleInputChange('challenge_frequency', value)}
                    >
                      <SelectTrigger className={errors.challenge_frequency ? 'border-red-500' : ''}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="one-time">One-time</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.challenge_frequency && (
                      <p className="text-sm text-red-500 mt-1">{errors.challenge_frequency}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="challenge_type">Challenge Type *</Label>
                    <Select
                      value={formData.challenge_type}
                      onValueChange={(value) => handleInputChange('challenge_type', value)}
                    >
                      <SelectTrigger className={errors.challenge_type ? 'border-red-500' : ''}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getChallengeTypeOptions().map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.challenge_type && (
                      <p className="text-sm text-red-500 mt-1">{errors.challenge_type}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="challenge_reward_xp">Reward XP *</Label>
                    <Input
                      id="challenge_reward_xp"
                      type="number"
                      min="1"
                      value={formData.challenge_reward_xp}
                      onChange={(e) => handleInputChange('challenge_reward_xp', e.target.value)}
                      className={errors.challenge_reward_xp ? 'border-red-500' : ''}
                    />
                    {errors.challenge_reward_xp && (
                      <p className="text-sm text-red-500 mt-1">{errors.challenge_reward_xp}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="parent_goal_id">Parent Goal (Optional)</Label>
                    <Select
                      value={formData.parent_goal_id}
                      onValueChange={(value) => handleInputChange('parent_goal_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {parentGoals
                          .filter(pg => !pg.is_challenge) // Only non-challenge goals can be parents
                          .map(pg => (
                            <SelectItem key={pg.id} value={pg.id}>
                              {pg.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Completing this challenge will contribute to the selected goal's progress
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isLoading ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}