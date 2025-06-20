"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoalsDashboard } from './GoalsDashboard';
import { GoalAnalytics } from './GoalAnalytics';
import { Target, BarChart3 } from 'lucide-react';

interface GoalsPageClientProps {
  userId: string;
}

export function GoalsPageClient({ userId }: GoalsPageClientProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="container mx-auto px-6 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Goals Dashboard
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <GoalsDashboard userId={userId} />
        </TabsContent>

        <TabsContent value="analytics">
          <GoalAnalytics userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
