"use client";

import { useState, useRef } from "react";
import { PlatformContent, PLATFORM_LIMITS } from "@/types/ai";
import {
  aiApiClient,
  formatPlatformName,
  getPlatformColor,
  getPlatformIcon,
} from "@/lib/api/ai-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Shuffle,
  Copy,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useLinkedInShare } from "@/hooks/useLinkedInShare";

interface ContentAdapterProps {
  initialContent?: string;
  onContentAdapted?: (adaptations: PlatformContent[]) => void;
}

export function ContentAdapter({
  initialContent = "",
  onContentAdapted,
}: ContentAdapterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [originalContent, setOriginalContent] = useState(initialContent);
  const [adaptations, setAdaptations] = useState<PlatformContent[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "twitter",
    "instagram",
    "linkedin",
  ]);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);

  // Ref for scrolling to adapted content
  const adaptedContentRef = useRef<HTMLDivElement>(null);

  // LinkedIn sharing hook
  const { shareToLinkedIn, isSharing, checkLinkedInConnection } = useLinkedInShare();

  const platforms = [
    { id: "twitter", name: "Twitter/X", icon: "𝕏", color: "text-blue-400" },
    { id: "instagram", name: "Instagram", icon: "📷", color: "text-pink-400" },
    { id: "linkedin", name: "LinkedIn", icon: "💼", color: "text-blue-600" },
  ];

  // Utility function to scroll to adapted content
  const scrollToAdaptedContent = () => {
    if (adaptedContentRef.current) {
      adaptedContentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  const handleAdaptContent = async () => {
    if (!originalContent.trim()) {
      toast.error("Please enter content to adapt");
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    setIsLoading(true);
    try {
      const result = await aiApiClient.adaptContent({
        content: originalContent,
        target_platforms: selectedPlatforms as (
          | "twitter"
          | "instagram"
          | "linkedin"
        )[],
      });

      setAdaptations(result.adaptation.adaptations);
      setRemainingQuota(result.remaining_quota);

      if (onContentAdapted) {
        onContentAdapted(result.adaptation.adaptations);
      }

      toast.success(
        `Content adapted for ${selectedPlatforms.length} platforms!`
      );

      // Scroll to adapted content after a short delay to ensure DOM is updated
      setTimeout(() => {
        scrollToAdaptedContent();
      }, 100);
    } catch (error) {
      console.error("Content adaptation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to adapt content"
      );
    } finally {
      setIsLoading(false);
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

  const getCharacterProgress = (platform: string, count: number) => {
    const limit =
      PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS]
        ?.maxCharacters || 280;
    return (count / limit) * 100;
  };

  const getCharacterColor = (platform: string, count: number) => {
    const limit =
      PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS]
        ?.maxCharacters || 280;
    const percentage = (count / limit) * 100;

    if (percentage > 100) return "text-red-400";
    if (percentage > 80) return "text-yellow-400";
    return "text-green-400";
  };

  const validateContent = (adaptation: PlatformContent) => {
    const limits = PLATFORM_LIMITS[adaptation.platform];
    const issues = [];

    if (adaptation.character_count > limits.maxCharacters) {
      issues.push(`Exceeds ${limits.maxCharacters} character limit`);
    }

    if (adaptation.hashtags.length > limits.maxHashtags) {
      issues.push(`Too many hashtags (max: ${limits.maxHashtags})`);
    }

    return issues;
  };

  const handleShareToLinkedIn = async (adaptation: PlatformContent) => {
    // Check if LinkedIn is connected
    const isConnected = await checkLinkedInConnection();
    if (!isConnected) {
      toast.error("Please connect your LinkedIn account first in Settings");
      return;
    }

    // Share the content
    const result = await shareToLinkedIn({
      content: adaptation.content,
      hashtags: adaptation.hashtags,
      visibility: 'PUBLIC'
    });

    if (result.success && result.share_url) {
      // Optionally open the shared post in a new tab
      window.open(result.share_url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="glass-card border-emerald-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-theme-primary">
            <Shuffle className="w-5 h-5 text-emerald-500" />
            Cross-Platform Content Adapter
          </CardTitle>
          {remainingQuota !== null && (
            <div className="text-sm text-theme-secondary">
              Remaining adaptations: {remainingQuota}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-theme-primary">
              Original Content
            </label>
            <Textarea
              placeholder="Enter your content to adapt for different platforms..."
              value={originalContent}
              onChange={(e) => setOriginalContent(e.target.value)}
              className="glass-input min-h-[120px]"
            />
            <div className="text-xs text-theme-secondary">
              {originalContent.length} characters
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-theme-primary">
              Target Platforms
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {platforms.map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.id}
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        setSelectedPlatforms([
                          ...selectedPlatforms,
                          platform.id,
                        ]);
                      } else {
                        setSelectedPlatforms(
                          selectedPlatforms.filter((p) => p !== platform.id)
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={platform.id}
                    className={`text-sm font-medium cursor-pointer flex items-center gap-2 ${platform.color}`}>
                    <span>{platform.icon}</span>
                    {platform.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleAdaptContent}
            disabled={
              isLoading ||
              !originalContent.trim() ||
              selectedPlatforms.length === 0
            }
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Shuffle className="w-4 h-4 mr-2" />
            )}
            Adapt Content
          </Button>
        </CardContent>
      </Card>

      {/* Adaptations */}
      {adaptations.length > 0 && (
        <div ref={adaptedContentRef} className="space-y-4">
          <h3 className="text-lg font-semibold text-theme-primary">
            Platform Adaptations
          </h3>
          <div className="grid gap-4">
            {adaptations.map((adaptation, index) => {
              const issues = validateContent(adaptation);
              const limits = PLATFORM_LIMITS[adaptation.platform];

              return (
                <Card key={index} className="glass-card border-emerald-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getPlatformIcon(adaptation.platform)}
                        </span>
                        <span
                          className={`font-medium ${getPlatformColor(
                            adaptation.platform
                          )}`}>
                          {formatPlatformName(adaptation.platform)}
                        </span>
                        {adaptation.optimized && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-500/20 text-green-400">
                            Optimized
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(adaptation.content)}
                          className="text-theme-secondary hover:text-theme-primary">
                          <Copy className="w-4 h-4" />
                        </Button>
                        {adaptation.platform === "linkedin" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleShareToLinkedIn(adaptation)}
                            disabled={isSharing}
                            title="Share to LinkedIn"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                            {isSharing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ExternalLink className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="text-theme-primary mb-4 leading-relaxed whitespace-pre-line">
                      {adaptation.content}
                    </div>

                    {adaptation.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {adaptation.hashtags.map((hashtag, hashIndex) => (
                          <Badge
                            key={hashIndex}
                            variant="secondary"
                            className="text-xs">
                            {hashtag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* LinkedIn Share Button */}
                    {adaptation.platform === "linkedin" && (
                      <div className="mb-4">
                        <Button
                          onClick={() => handleShareToLinkedIn(adaptation)}
                          disabled={isSharing}
                          className="bg-blue-600 hover:bg-blue-700 text-white">
                          {isSharing ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <ExternalLink className="w-4 h-4 mr-2" />
                          )}
                          Share on LinkedIn
                        </Button>
                      </div>
                    )}

                    {/* Character Count & Validation */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-theme-secondary">
                          Character Count
                        </span>
                        <span
                          className={getCharacterColor(
                            adaptation.platform,
                            adaptation.character_count
                          )}>
                          {adaptation.character_count} / {limits.maxCharacters}
                        </span>
                      </div>
                      <Progress
                        value={getCharacterProgress(
                          adaptation.platform,
                          adaptation.character_count
                        )}
                        className="h-2"
                      />

                      {/* Validation Issues */}
                      {issues.length > 0 && (
                        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="space-y-1">
                            {issues.map((issue, issueIndex) => (
                              <p
                                key={issueIndex}
                                className="text-sm text-red-400">
                                {issue}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {issues.length === 0 && (
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          Content meets platform requirements
                        </div>
                      )}

                      {/* Platform Guidelines */}
                      <div className="text-xs text-theme-muted space-y-1">
                        <p>
                          • Recommended hashtags: {limits.recommendedHashtags}
                        </p>
                        <p>• Max hashtags: {limits.maxHashtags}</p>
                        <p>• Character limit: {limits.maxCharacters}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
