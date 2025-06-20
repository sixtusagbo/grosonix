"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Target } from 'lucide-react';
import { GoalMilestone, GOAL_TYPE_UNITS } from '@/types/goals';

interface MilestoneIndicatorProps {
  milestones: GoalMilestone[];
  currentValue: number;
  targetValue: number;
  goalType: string;
  showDetails?: boolean;
}

export function MilestoneIndicator({
  milestones,
  currentValue,
  targetValue,
  goalType,
  showDetails = true
}: MilestoneIndicatorProps) {
  // Sort milestones by percentage
  const sortedMilestones = [...milestones].sort(
    (a, b) => a.milestone_percentage - b.milestone_percentage
  );

  const currentProgress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;

  const formatValue = (value: number) => {
    const unit = GOAL_TYPE_UNITS[goalType as keyof typeof GOAL_TYPE_UNITS] || 'units';
    if (goalType === 'engagement_rate') {
      return `${value.toFixed(2)}%`;
    }
    return `${value.toLocaleString()} ${unit}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (sortedMilestones.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm text-text-secondary">No milestones set for this goal</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-500" />
          Milestones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Overall Progress</span>
            <span className="font-medium">
              {formatValue(currentValue)} / {formatValue(targetValue)}
            </span>
          </div>
          <Progress value={currentProgress} className="h-2" />
          <div className="text-right text-sm text-text-secondary">
            {currentProgress.toFixed(1)}% complete
          </div>
        </div>

        {/* Milestone List */}
        <div className="space-y-3">
          {sortedMilestones.map((milestone, index) => {
            const isAchieved = milestone.is_achieved;
            const isNext = !isAchieved && currentProgress >= (sortedMilestones[index - 1]?.milestone_percentage || 0);
            const isCurrent = currentProgress >= milestone.milestone_percentage && !isAchieved;

            return (
              <div
                key={milestone.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  isAchieved
                    ? 'bg-green-500/10 border-green-500/30'
                    : isNext || isCurrent
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-gray-500/10 border-gray-500/20'
                }`}
              >
                <div className="flex-shrink-0">
                  {isAchieved ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className={`w-5 h-5 ${isNext || isCurrent ? 'text-blue-500' : 'text-gray-400'}`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text-primary">
                      {milestone.milestone_percentage}% Milestone
                    </span>
                    {isNext && !isAchieved && (
                      <Badge variant="secondary" className="text-xs">
                        Next
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400">
                        Ready
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-text-secondary">
                    Target: {formatValue(milestone.milestone_value)}
                  </div>

                  {isAchieved && milestone.achieved_at && showDetails && (
                    <div className="text-xs text-green-600 mt-1">
                      ✓ Achieved on {formatDate(milestone.achieved_at)}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="text-sm font-medium text-text-primary">
                    {milestone.milestone_percentage}%
                  </div>
                  {!isAchieved && (
                    <div className="text-xs text-text-secondary">
                      {milestone.milestone_value > currentValue
                        ? `${formatValue(milestone.milestone_value - currentValue)} to go`
                        : 'Ready to achieve!'
                      }
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Milestones Progress</span>
            <span className="font-medium">
              {milestones.filter(m => m.is_achieved).length} of {milestones.length} achieved
            </span>
          </div>
          <Progress 
            value={(milestones.filter(m => m.is_achieved).length / milestones.length) * 100} 
            className="h-1 mt-2" 
          />
        </div>
      </CardContent>
    </Card>
  );
}
