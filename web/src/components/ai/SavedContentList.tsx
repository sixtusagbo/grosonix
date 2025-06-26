"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Copy,
  Filter,
  Trash2,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { aiApiClient, getPlatformIcon, getPlatformColor, formatPlatformName } from "@/lib/api/ai-client";
import { ContentSuggestion } from "@/types/ai";
import { toast } from "sonner";
import { useLinkedInShare } from "@/hooks/useLinkedInShare";
import { ContentScheduler } from "./ContentScheduler";

interface SavedContentListProps {
  className?: string;
  showHeader?: boolean;
  limit?: number;
}

export function SavedContentList({
  className = "",
  showHeader = true,
  limit = 50,
}: SavedContentListProps) {
  const [savedContent, setSavedContent] = useState<ContentSuggestion[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [savedContentFilter, setSavedContentFilter] = useState<string>("all");
  const [showScheduler, setShowScheduler] = useState(false);
  const [contentToSchedule, setContentToSchedule] = useState<ContentSuggestion | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // LinkedIn sharing hook
  const { shareToLinkedIn, isSharing, checkLinkedInConnection } = useLinkedInShare();

  useEffect(() => {
    loadSavedContent();
    getUserId();
  }, [savedContentFilter]);

  const getUserId = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserId(data.user?.id || null);
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
  };

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

  const handleShareToLinkedIn = async (content: ContentSuggestion) => {
    // Check if LinkedIn is connected
    const isConnected = await checkLinkedInConnection();
    if (!isConnected) {
      toast.error("Please connect your LinkedIn account first in Settings");
      return;
    }

    // Share the content
    const result = await shareToLinkedIn({
      content: content.content,
      hashtags: content.hashtags,
      visibility: 'PUBLIC'
    });

    if (result.success && result.share_url) {
      // Optionally open the shared post in a new tab
      window.open(result.share_url, '_blank');
    }
  };

  const handleScheduleContent = (content: ContentSuggestion) => {
    if (!userId) {
      toast.error("Please log in to schedule content");
      return;
    }

    setContentToSchedule(content);
    setShowScheduler(true);
  };

  const handleCloseScheduler = () => {
    setShowScheduler(false);
    setContentToSchedule(null);
  };

  return (
    <div className={className}>
      {showHeader && (
        <Card className="glass-card border-emerald-500/20 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                <CardTitle className="text-theme-primary">
                  Saved Content ({savedContent.length})
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
                  {isLoadingSaved ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card className="glass-card border-emerald-500/20">
        <CardContent className="p-6">
          {isLoadingSaved ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="text-theme-secondary mt-2">Loading saved content...</p>
            </div>
          ) : savedContent.length > 0 ? (
            <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {savedContent.slice(0, limit).map((content) => (
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
                      {content.is_used && (
                        <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400">
                          Used
                        </Badge>
                      )}
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
                        onClick={() => handleScheduleContent(content)}
                        className="text-theme-secondary hover:text-theme-primary h-8 w-8 p-0">
                        <Calendar className="w-4 h-4" />
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
                Save content from the Content Generator or Swipe tabs to build your personal library!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Scheduler Modal */}
      {showScheduler && contentToSchedule && userId && (
        <ContentScheduler
          isOpen={showScheduler}
          onClose={handleCloseScheduler}
          content={contentToSchedule}
          userId={userId}
        />
      )}
    </div>
  );
}