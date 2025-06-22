"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentGenerator } from "@/components/ai/ContentGenerator";
import { SwipeableContentGenerator } from "@/components/ai/SwipeableContentGenerator";
import { VoiceStyleManager } from "@/components/ai/VoiceStyleManager";
import { ContentAdapter } from "@/components/ai/ContentAdapter";
import { UsageStats } from "@/components/ai/UsageStats";
import { AIDemo } from "@/components/ai/AIDemo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, 
  Brain, 
  Shuffle, 
  BarChart3, 
  Zap, 
  Heart, 
  Copy, 
  Trash2,
  BookOpen,
  Filter
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { aiApiClient, getPlatformIcon, getPlatformColor, formatPlatformName } from "@/lib/api/ai-client";
import { ContentSuggestion } from "@/types/ai";
import { toast } from "sonner";

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState("swipe");
  const [savedContent, setSavedContent] = useState<ContentSuggestion[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [savedContentFilter, setSavedContentFilter] = useState<string>("all");

  useEffect(() => {
    if (activeTab === "swipe") {
      loadSavedContent();
    }
  }, [activeTab]);

  const loadSavedContent = async () => {
    setIsLoadingSaved(true);
    try {
      const result = await aiApiClient.getSavedContent(
        savedContentFilter === "all" ? undefined : savedContentFilter
      );
      setSavedContent(result.suggestions);
    } catch (error) {
      console.error("Error loading saved content:", error);
      toast.error("Failed to load saved content");
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleUpgradeClick = () => {
    // TODO: Implement upgrade flow
    console.log("Upgrade clicked");
  };

  const handleContentSaved = (content: ContentSuggestion) => {
    // Add to saved content if not already present
    setSavedContent(prev => {
      const exists = prev.some(item => item.id === content.id);
      if (!exists) {
        return [content, ...prev];
      }
      return prev;
    });
  };

  const handleUnsaveContent = async (contentId: string) => {
    try {
      await aiApiClient.unsaveContentSuggestion(contentId);
      setSavedContent(prev => prev.filter(item => item.id !== contentId));
      toast.success("Content removed from saved library");
    } catch (error) {
      console.error("Error unsaving content:", error);
      toast.error("Failed to remove content");
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Content copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy content");
    }
  };

  const filteredSavedContent = savedContent.filter(content => 
    savedContentFilter === "all" || content.platform === savedContentFilter
  );

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

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-dark-purple/50 border border-electric-purple/20">
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
          
          {/* Saved Content Library */}
          <Card className="glass-card border-emerald-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-theme-primary">
                    Saved Content Library ({filteredSavedContent.length})
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-theme-secondary" />
                  <Select value={savedContentFilter} onValueChange={setSavedContentFilter}>
                    <SelectTrigger className="w-32 glass-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={loadSavedContent}
                    variant="outline"
                    size="sm"
                    disabled={isLoadingSaved}
                    className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10">
                    {isLoadingSaved ? "Loading..." : "Refresh"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSaved ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                  <p className="text-theme-secondary mt-2">Loading saved content...</p>
                </div>
              ) : filteredSavedContent.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredSavedContent.map((content) => (
                    <div 
                      key={content.id} 
                      className="p-4 bg-surface rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {getPlatformIcon(content.platform)}
                          </span>
                          <span className={`font-medium text-sm ${getPlatformColor(content.platform)}`}>
                            {formatPlatformName(content.platform)}
                          </span>
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                            Saved
                          </Badge>
                          <span className="text-xs text-theme-muted">
                            {content.engagement_score}% engagement
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(content.content)}
                            className="text-theme-secondary hover:text-theme-primary h-8 w-8 p-0">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUnsaveContent(content.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 w-8 p-0">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-theme-primary text-sm leading-relaxed mb-3 line-clamp-3">
                        {content.content}
                      </p>
                      
                      {content.hashtags && content.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {content.hashtags.slice(0, 5).map((hashtag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {hashtag}
                            </Badge>
                          ))}
                          {content.hashtags.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{content.hashtags.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="text-xs text-theme-muted">
                        Saved: {new Date(content.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-theme-primary mb-2">
                    No Saved Content Yet
                  </h3>
                  <p className="text-theme-secondary">
                    Start swiping right on content suggestions to build your personal library!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <ContentGenerator />
        </TabsContent>

        <TabsContent value="style" className="space-y-6">
          <VoiceStyleManager />
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