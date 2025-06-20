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
import { Calendar, Target, TrendingUp, Users, Lightbulb, Loader2 } from 'lucide-react';
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
}

export function GoalForm({ goal, isOpen, onClose, onSubmit, isLoading = false }: GoalFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_type: 'followers' as GoalType,
    platform: 'all' as Platform,
    target_value: '',
    target_date: '',
    priority: 'medium' as GoalPriority,
    is_public: false,
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      goal_type: formData.goal_type,
      platform: formData.platform === 'all' ? undefined : formData.platform,
      target_value: parseFloat(formData.target_value),
      target_date: formData.target_date,
      priority: formData.priority,
      is_public: formData.is_public,
    };

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
