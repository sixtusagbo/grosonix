"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Target,
  Calendar,
  TrendingUp,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Plus,
  Minus,
  Zap,
} from 'lucide-react';
import {
  Goal,
  GOAL_TYPE_LABELS,
  GOAL_TYPE_UNITS,
  PLATFORM_LABELS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  CHALLENGE_TYPE_LABELS
} from '@/types/goals';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  onUpdateProgress?: (goalId: string, newValue: number) => void;
  onStatusChange?: (goalId: string, status: 'active' | 'paused' | 'completed') => void;
  showActions?: boolean;
}

export function GoalCard({
  goal,
  onEdit,
  onDelete,
  onUpdateProgress,
  onStatusChange,
  showActions = true
}: GoalCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showProgressUpdate, setShowProgressUpdate] = useState(false);
  const [progressValue, setProgressValue] = useState(goal.current_value.toString());

  const getGoalTypeIcon = () => {
    switch (goal.goal_type) {
      case 'followers':
        return <Users className="w-4 h-4" />;
      case 'engagement_rate':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getStatusIcon = () => {
    switch (goal.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'active':
        return goal.is_overdue ? (
          <AlertTriangle className="w-4 h-4 text-red-500" />
        ) : (
          <Play className="w-4 h-4 text-blue-500" />
        );
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const formatValue = (value: number) => {
    if (goal.goal_type === 'engagement_rate') {
      return `${value.toFixed(2)}%`;
    }
    return value.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysRemainingText = () => {
    if (goal.days_remaining === undefined) return '';
    
    if (goal.days_remaining < 0) {
      return `${Math.abs(goal.days_remaining)} days overdue`;
    } else if (goal.days_remaining === 0) {
      return 'Due today';
    } else if (goal.days_remaining === 1) {
      return '1 day remaining';
    } else {
      return `${goal.days_remaining} days remaining`;
    }
  };

  const handleProgressUpdate = () => {
    const newValue = parseFloat(progressValue);
    if (!isNaN(newValue) && newValue >= 0 && onUpdateProgress) {
      onUpdateProgress(goal.id, newValue);
      setShowProgressUpdate(false);
    }
  };

  const handleQuickProgress = (increment: number) => {
    const newValue = goal.current_value + increment;
    if (newValue >= 0 && onUpdateProgress) {
      onUpdateProgress(goal.id, newValue);
    }
  };

  return (
    <>
      <Card className="glass-card hover:scale-[1.02] transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                {getGoalTypeIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-text-primary truncate">
                    {goal.title}
                  </h3>
                  {goal.is_public && (
                    <Badge variant="outline" className="text-xs">
                      Public
                    </Badge>
                  )}
                  {goal.is_challenge && (
                    <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                      <Zap className="w-3 h-3 mr-1" />
                      Challenge
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  {getStatusIcon()}
                  <span className="capitalize">{goal.status}</span>
                  {goal.platform && goal.platform !== 'all' && (
                    <>
                      <span>•</span>
                      <span>{PLATFORM_LABELS[goal.platform]}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(goal)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Goal
                    </DropdownMenuItem>
                  )}
                  {onStatusChange && goal.status === 'active' && (
                    <DropdownMenuItem onClick={() => onStatusChange(goal.id, 'paused')}>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause Goal
                    </DropdownMenuItem>
                  )}
                  {onStatusChange && goal.status === 'paused' && (
                    <DropdownMenuItem onClick={() => onStatusChange(goal.id, 'active')}>
                      <Play className="w-4 h-4 mr-2" />
                      Resume Goal
                    </DropdownMenuItem>
                  )}
                  {onStatusChange && goal.status !== 'completed' && (
                    <DropdownMenuItem onClick={() => onStatusChange(goal.id, 'completed')}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Goal
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {goal.description && (
            <p className="text-sm text-text-secondary mt-2 line-clamp-2">
              {goal.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Progress</span>
              <span className="font-medium">
                {formatValue(goal.current_value)} / {formatValue(goal.target_value)} 
                {' '}({goal.progress_percentage?.toFixed(1) || 0}%)
              </span>
            </div>
            <Progress 
              value={goal.progress_percentage || 0} 
              className="h-2"
            />
          </div>

          {/* Quick Progress Update */}
          {onUpdateProgress && goal.status === 'active' && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleQuickProgress(-1)}
                disabled={goal.current_value <= 0}
                className="h-9 w-9 p-0"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowProgressUpdate(true)}
                className="flex-1 text-sm"
              >
                Update Progress
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickProgress(1)}
                className="h-9 w-9 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Goal Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-text-secondary">Goal Type</div>
              <div className="font-medium">
                {goal.is_challenge && goal.challenge_type 
                  ? CHALLENGE_TYPE_LABELS[goal.challenge_type] || goal.challenge_type
                  : GOAL_TYPE_LABELS[goal.goal_type]
                }
              </div>
            </div>
            <div>
              <div className="text-text-secondary">Priority</div>
              <Badge 
                variant="secondary" 
                className={`${PRIORITY_COLORS[goal.priority]} text-white`}
              >
                {goal.priority}
              </Badge>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-text-secondary">
              <Calendar className="w-3 h-3" />
              <span>Due {formatDate(goal.target_date)}</span>
            </div>
            <div className={`font-medium ${goal.is_overdue ? 'text-red-500' : 'text-text-secondary'}`}>
              {getDaysRemainingText()}
            </div>
          </div>

          {/* Milestones */}
          {goal.total_milestones && goal.total_milestones > 0 && (
            <div className="text-sm">
              <div className="text-text-secondary">Milestones</div>
              <div className="font-medium">
                {goal.achieved_milestones || 0} of {goal.total_milestones} achieved
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Update Dialog */}
      {showProgressUpdate && (
        <AlertDialog open={showProgressUpdate} onOpenChange={setShowProgressUpdate}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Update Progress</AlertDialogTitle>
              <AlertDialogDescription>
                Enter the new value for "{goal.title}"
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                type="number"
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                placeholder={`Current: ${goal.current_value} ${GOAL_TYPE_UNITS[goal.goal_type]}`}
                min="0"
                step={goal.goal_type === 'engagement_rate' ? '0.01' : '1'}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleProgressUpdate}>
                Update
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{goal.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onDelete?.(goal.id);
                setShowDeleteDialog(false);
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}