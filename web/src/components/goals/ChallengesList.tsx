"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  Plus, 
  Zap, 
  RefreshCw,
  Calendar,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { ChallengeCard } from './ChallengeCard';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface ChallengesListProps {
  userId: string;
  onUpdateProgress?: (challengeId: string, newValue: number) => Promise<void>;
  onGenerateChallenge?: (parentGoalId?: string, frequency?: string) => Promise<void>;
  className?: string;
}

export function ChallengesList({
  userId,
  onUpdateProgress,
  onGenerateChallenge,
  className = ""
}: ChallengesListProps) {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, [userId]);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/goals/challenges/generate');
      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }
      
      const data = await response.json();
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateChallenge = async (frequency: string) => {
    if (generating) return;
    
    setGenerating(true);
    try {
      if (onGenerateChallenge) {
        await onGenerateChallenge(undefined, frequency);
      } else {
        const response = await fetch('/api/goals/challenges/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ frequency }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate challenge');
        }
        
        const data = await response.json();
        setChallenges(prev => [data.challenge, ...prev]);
        toast.success('New challenge generated!');
      }
    } catch (error) {
      console.error('Error generating challenge:', error);
      toast.error('Failed to generate challenge');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateProgress = async (challengeId: string, newValue: number) => {
    try {
      if (onUpdateProgress) {
        await onUpdateProgress(challengeId, newValue);
      } else {
        // Default implementation if no handler provided
        const response = await fetch(`/api/goals/${challengeId}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ new_value: newValue }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update progress');
        }
        
        // Update local state
        setChallenges(prev => 
          prev.map(challenge => 
            challenge.id === challengeId 
              ? { 
                  ...challenge, 
                  current_value: newValue,
                  status: newValue >= challenge.target_value ? 'completed' : challenge.status 
                } 
              : challenge
          )
        );
      }
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      toast.error('Failed to update challenge progress');
    }
  };

  const filteredChallenges = challenges.filter(challenge => 
    challenge.challenge_frequency === activeTab || 
    (activeTab === 'all' && challenge.challenge_frequency)
  );

  const activeChallenges = filteredChallenges.filter(c => c.status === 'active');
  const completedChallenges = filteredChallenges.filter(c => c.status === 'completed');

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-yellow-500" />
            Challenges
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchChallenges}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Challenge Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="one-time">One-time</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {/* Generate Challenge Button */}
            <Button
              onClick={() => handleGenerateChallenge(activeTab === 'all' ? 'daily' : activeTab)}
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Generate New {activeTab === 'all' ? '' : activeTab} Challenge
            </Button>
            
            {/* Active Challenges */}
            {activeChallenges.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Active Challenges ({activeChallenges.length})
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {activeChallenges.map(challenge => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onUpdateProgress={handleUpdateProgress}
                    />
                  ))}
                </div>
              </div>
            ) : loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading challenges...</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-2">No active challenges</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a new challenge to start earning XP and making progress on your goals!
                </p>
              </div>
            )}
            
            {/* Completed Challenges */}
            {completedChallenges.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Completed Challenges ({completedChallenges.length})
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {completedChallenges.slice(0, 3).map(challenge => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                    />
                  ))}
                  
                  {completedChallenges.length > 3 && (
                    <Button variant="outline" size="sm" className="mt-2">
                      View All Completed Challenges
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* XP Explanation */}
        <div className="text-xs text-muted-foreground bg-yellow-500/10 p-3 rounded-md">
          <div className="flex items-center gap-1 font-medium mb-1">
            <Zap className="w-3 h-3 text-yellow-500" />
            <span>Challenge Rewards</span>
          </div>
          <p>Complete challenges to earn XP and make progress on your goals. Daily challenges refresh every 24 hours.</p>
        </div>
      </CardContent>
    </Card>
  );
}