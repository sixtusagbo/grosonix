"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentGenerator } from "@/components/ai/ContentGenerator";
import { StyleAnalyzer } from "@/components/ai/StyleAnalyzer";
import { ContentAdapter } from "@/components/ai/ContentAdapter";
import { UsageStats } from "@/components/ai/UsageStats";
import { AIDemo } from "@/components/ai/AIDemo";
import { Sparkles, Brain, Shuffle, BarChart3, Zap } from "lucide-react";

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState("generate");

  const handleUpgradeClick = () => {
    // TODO: Implement upgrade flow
    console.log("Upgrade clicked");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          AI Content Engine
        </h1>
        <p className="text-silver">
          Generate personalized content, analyze your writing style, and adapt
          content for multiple platforms.
        </p>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-dark-purple/50 border border-electric-purple/20">
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

        <TabsContent value="generate" className="space-y-6">
          <ContentGenerator />
        </TabsContent>

        <TabsContent value="style" className="space-y-6">
          <StyleAnalyzer />
        </TabsContent>

        <TabsContent value="adapt" className="space-y-6">
          <ContentAdapter />
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <UsageStats onUpgradeClick={handleUpgradeClick} />
        </TabsContent>

        <TabsContent value="demo" className="space-y-6">
          <AIDemo />
        </TabsContent>
      </Tabs>
    </div>
  );
}
