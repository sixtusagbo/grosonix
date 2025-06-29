"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Users,
  BarChart3,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { useGoalIntegration } from '@/hooks/useGoalIntegration';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import { ChallengesList } from './ChallengesList';
import { toast } from 'sonner';
import {
  Goal,
  GoalFilters,
  CreateGoalRequest,
  UpdateGoalRequest,
  GOAL_TYPE_LABELS,
  PLATFORM_LABELS
} from '@/types/goals';

interface GoalsDashboardProps {
  userId: string;
}

export function GoalsDashboard({ userId }: GoalsDashboardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const { syncGoals, syncing } = useGoalIntegration();

  const {
    goals,
    loading,
    error,
    summary,
    filters,
    createGoal,
    updateGoal,
    deleteGoal,
    updateProgress,
    updateFilters,
    clearFilters,
    refetch
  } = useGoals();

  const handleCreateGoal = async (data: CreateGoalRequest | UpdateGoalRequest) => {
    const createData = data as CreateGoalRequest;
    const newGoal = await createGoal(createData);
    if (newGoal) {
      setShowCreateForm(false);
    }
  };

  const handleUpdateGoal = async (data: CreateGoalRequest | UpdateGoalRequest) => {
    if (editingGoal) {
      const updateData = data as UpdateGoalRequest;
      const updatedGoal = await updateGoal(editingGoal.id, updateData);
      if (updatedGoal) {
        setEditingGoal(null);
      }
    }
  };

  const handleStatusChange = async (goalId: string, status: 'active' | 'paused' | 'completed') => {
    await updateGoal(goalId, { status });
  };

  const handleProgressUpdate = async (goalId: string, newValue: number) => {
    await updateProgress(goalId, { new_value: newValue, source: 'manual' });
  };

  const handleGenerateChallenge = async (parentGoalId?: string, frequency: string = 'daily') => {
    try {
      const response = await fetch('/api/goals/challenges/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          parent_goal_id: parentGoalId,
          frequency 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate challenge');
      }
      
      const data = await response.json();
      toast.success('New challenge generated!');
      
      // Refresh goals list to show the new challenge
      refetch();
      
      return data.challenge;
    } catch (error) {
      console.error('Error generating challenge:', error);
      toast.error('Failed to generate challenge');
      throw error;
    }
  };

  const getFilteredGoals = () => {
    switch (activeTab) {
      case 'active':
        return goals.filter(g => g.status === 'active' && !g.is_challenge);
      case 'completed':
        return goals.filter(g => g.status === 'completed' && !g.is_challenge);
      case 'overdue':
        return goals.filter(g => g.is_overdue && !g.is_challenge);
      case 'challenges':
        return goals.filter(g => g.is_challenge);
      default:
        return goals.filter(g => !g.is_challenge); // 'all' tab excludes challenges
    }
  };

  const filteredGoals = getFilteredGoals();
  const nonChallengeGoals = goals.filter(g => !g.is_challenge);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">Goals</h1>
          <p className="text-text-secondary">
            Set, track, and achieve your social media growth goals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={syncGoals}
            disabled={syncing}
            className="flex items-center gap-2"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync'}
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-emerald-500 hover:bg-emerald-600"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Total Goals</p>
                <p className="text-xl font-bold text-text-primary">{summary.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Active</p>
                <p className="text-xl font-bold text-text-primary">{summary.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Completed</p>
                <p className="text-xl font-bold text-text-primary">{summary.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Overdue</p>
                <p className="text-xl font-bold text-text-primary">{summary.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
                <Input
                  placeholder="Search goals..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select
                value={filters.goal_type || 'all'}
                onValueChange={(value) => updateFilters({ 
                  goal_type: value === 'all' ? undefined : value as any 
                })}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Goal Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(GOAL_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.platform || 'all'}
                onValueChange={(value) => updateFilters({ 
                  platform: value === 'all' ? undefined : value as any 
                })}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(filters.search || filters.goal_type || filters.platform) && (
                <Button variant="outline" onClick={clearFilters} size="sm">
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Goals Section */}
        <div className="lg:col-span-2">
          {/* Goals Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 overflow-x-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                All ({nonChallengeGoals.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="text-xs sm:text-sm">
                Active ({summary.active})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm">
                Done ({summary.completed})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="text-xs sm:text-sm">
                Overdue ({summary.overdue})
              </TabsTrigger>
              <TabsTrigger value="challenges" className="flex items-center gap-1 text-xs sm:text-sm">
                <Zap className="w-3 h-3" />
                Challenges
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredGoals.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="p-6 sm:p-12 text-center">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      {activeTab === 'all' ? 'No goals yet' : `No ${activeTab} goals`}
                    </h3>
                    <p className="text-text-secondary mb-4">
                      {activeTab === 'all' 
                        ? 'Create your first goal to start tracking your progress'
                        : activeTab === 'challenges'
                        ? 'Generate your first challenge to start earning XP'
                        : `You don't have any ${activeTab} goals at the moment`
                      }
                    </p>
                    {activeTab === 'all' && (
                      <Button 
                        onClick={() => setShowCreateForm(true)}
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Goal
                      </Button>
                    )}
                    {activeTab === 'challenges' && (
                      <Button 
                        onClick={() => handleGenerateChallenge(undefined, 'daily')}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Generate Challenge
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={setEditingGoal}
                      onDelete={deleteGoal}
                      onUpdateProgress={handleProgressUpdate}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Challenges Section */}
        <div className="lg:col-span-1">
          <ChallengesList 
            userId={userId}
            onUpdateProgress={handleProgressUpdate}
            onGenerateChallenge={handleGenerateChallenge}
          />
        </div>
      </div>

      {/* Goal Form Modals */}
      <GoalForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateGoal}
        parentGoals={nonChallengeGoals}
      />

      <GoalForm
        goal={editingGoal || undefined}
        isOpen={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        onSubmit={handleUpdateGoal}
        parentGoals={nonChallengeGoals}
      />
    </div>
  );
}