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
} from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { useGoalIntegration } from '@/hooks/useGoalIntegration';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
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

  const handleCreateGoal = async (data: CreateGoalRequest) => {
    const newGoal = await createGoal(data);
    if (newGoal) {
      setShowCreateForm(false);
    }
  };

  const handleUpdateGoal = async (data: UpdateGoalRequest) => {
    if (editingGoal) {
      const updatedGoal = await updateGoal(editingGoal.id, data);
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

  const getFilteredGoals = () => {
    switch (activeTab) {
      case 'active':
        return goals.filter(g => g.status === 'active');
      case 'completed':
        return goals.filter(g => g.status === 'completed');
      case 'overdue':
        return goals.filter(g => g.is_overdue);
      default:
        return goals;
    }
  };

  const filteredGoals = getFilteredGoals();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Goals</h1>
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
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Goals'}
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Goals</p>
                <p className="text-2xl font-bold text-text-primary">{summary.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Active Goals</p>
                <p className="text-2xl font-bold text-text-primary">{summary.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Completed</p>
                <p className="text-2xl font-bold text-text-primary">{summary.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Overdue</p>
                <p className="text-2xl font-bold text-text-primary">{summary.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
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
            
            <div className="flex gap-2">
              <Select
                value={filters.goal_type || 'all'}
                onValueChange={(value) => updateFilters({ 
                  goal_type: value === 'all' ? undefined : value as any 
                })}
              >
                <SelectTrigger className="w-40">
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
                <SelectTrigger className="w-40">
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
                <Button variant="outline" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All Goals ({summary.total})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({summary.active})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({summary.completed})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue ({summary.overdue})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredGoals.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {activeTab === 'all' ? 'No goals yet' : `No ${activeTab} goals`}
                </h3>
                <p className="text-text-secondary mb-4">
                  {activeTab === 'all' 
                    ? 'Create your first goal to start tracking your progress'
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
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Goal Form Modals */}
      <GoalForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateGoal}
      />

      <GoalForm
        goal={editingGoal || undefined}
        isOpen={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        onSubmit={handleUpdateGoal}
      />
    </div>
  );
}