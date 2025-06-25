"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentGenerator } from "@/components/ai/ContentGenerator";
import { SwipeableContentGenerator } from "@/components/ai/SwipeableContentGenerator";
import { VoiceStyleManager } from "@/components/ai/VoiceStyleManager";
import { ContentAdapter } from "@/components/ai/ContentAdapter";
import { UsageStats } from "@/components/ai/UsageStats";
import { AIDemo } from "@/components/ai/AIDemo";
import { ContentAnalytics } from "@/components/ai/ContentAnalytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, 
  Brain, 
  Shuffle, 
  BarChart3, 
  Zap, 
  Heart, 
} from "lucide-react";
import { ContentSuggestion } from "@/types/ai";
import { toast } from "sonner";

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState("swipe");

  const handleUpgradeClick = () => {
    // TODO: Implement upgrade flow
    console.log("Upgrade clicked");
  };

  const handleContentSaved = (content: ContentSuggestion) => {
    toast.success("Content saved to your library!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-theme-primary mb-2">
          AI Content Engine
        </h1>
        <p className="text-theme-secondary">
          Generate personalized content, analyze your writing style, and adapt
          content for multiple platforms with our enhanced AI engine.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content Tabs */}
        <div className="flex-1">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6">
            <TabsList className="grid w-full grid-cols-7 bg-dark-purple/50 border border-electric-purple/20">
              <TabsTrigger
                value="swipe"
                className="flex items-center gap-2 data-[state=active]:bg-electric-purple data-[state=active]:text-white">
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Swipe</span>
              </TabsTrigger>
              <TabsTrigger
                value="generate"
                className="flex items-center gap-2 data-[state=active]:bg-electric-purple data-[state=active]:text-white">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Generate</span>
              </TabsTrigger>
              <TabsTrigger
                value="style"
                className="flex items-center gap-2 data-[state=active]:bg-electric-purple data-[state=active]:text-white">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Style</span>
              </TabsTrigger>
              <TabsTrigger
                value="adapt"
                className="flex items-center gap-2 data-[state=active]:bg-electric-purple data-[state=active]:text-white">
                <Shuffle className="w-4 h-4" />
                <span className="hidden sm:inline">Adapt</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex items-center gap-2 data-[state=active]:bg-electric-purple data-[state=active]:text-white">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger
                value="usage"
                className="flex items-center gap-2 data-[state=active]:bg-electric-purple data-[state=active]:text-white">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Usage</span>
              </TabsTrigger>
              <TabsTrigger
                value="demo"
                className="flex items-center gap-2 data-[state=active]:bg-electric-purple data-[state=active]:text-white">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Demo</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="swipe" className="space-y-6">
              <SwipeableContentGenerator onContentSaved={handleContentSaved} />
            </TabsContent>

            <TabsContent value="generate" className="space-y-6">
              <ContentGenerator onContentSaved={handleContentSaved} />
            </TabsContent>

            <TabsContent value="style" className="space-y-6">
              <VoiceStyleManager />
            </TabsContent>

            <TabsContent value="adapt" className="space-y-6">
              <ContentAdapter />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <ContentAnalytics onUpgradeClick={handleUpgradeClick} />
            </TabsContent>

            <TabsContent value="usage" className="space-y-6">
              <UsageStats onUpgradeClick={handleUpgradeClick} />
            </TabsContent>

            <TabsContent value="demo" className="space-y-6">
              <AIDemo />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}