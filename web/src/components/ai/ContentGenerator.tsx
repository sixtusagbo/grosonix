"use client";

import { useState, useEffect } from "react";
import { ContentSuggestion, ContentGenerationRequest } from "@/types/ai";
import {
  aiApiClient,
  formatPlatformName,
  getPlatformColor,
  getPlatformIcon,
} from "@/lib/api/ai-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Sparkles,
  Copy,
  Heart,
  MessageCircle,
  Share,
} from "lucide-react";
import { toast } from "sonner";

interface ContentGeneratorProps {
  onContentGenerated?: (content: ContentSuggestion) => void;
}

export function ContentGenerator({
  onContentGenerated,
}: ContentGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");

  const [formData, setFormData] = useState<ContentGenerationRequest>({
    prompt: "",
    platform: "twitter",
    tone: "professional",
    topic: "",
    use_voice_style: true,
    ignore_tone: false,
  });

  const handleGenerate = async () => {
    if (!formData.prompt.trim()) {
      toast.error("Please enter a prompt for content generation");
      return;
    }

    setIsLoading(true);
    try {
      const result = await aiApiClient.generateCustomContent(formData);
      setSuggestions([result.suggestion]);
      setRemainingQuota(result.remaining_quota);
      setSubscriptionTier(result.subscription_tier);

      if (onContentGenerated) {
        onContentGenerated(result.suggestion);
      }

      toast.success("Content generated successfully!");
    } catch (error) {
      console.error("Content generation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate content"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    try {
      const result = await aiApiClient.generateContent({
        prompt: "", // Empty prompt for suggestions
        platform: formData.platform,
        tone: formData.tone,
        topic: formData.topic || undefined,
      });
      setSuggestions(result.suggestions);
      setRemainingQuota(result.remaining_quota);
      setSubscriptionTier(result.subscription_tier);

      toast.success(
        `Generated ${result.suggestions.length} content suggestions!`
      );
    } catch (error) {
      console.error("Content suggestions error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to get suggestions"
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

  const getEngagementColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <Card className="glass-card border-emerald-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-theme-primary">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            AI Content Generator
          </CardTitle>
          {remainingQuota !== null && (
            <div className="flex items-center gap-2 text-sm text-theme-secondary">
              <span>Remaining quota: {remainingQuota}</span>
              <Badge variant="outline" className="text-xs">
                {subscriptionTier}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-theme-primary">
                Platform
              </label>
              <Select
                value={formData.platform}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, platform: value })
                }>
                <SelectTrigger className="glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twitter">
                    <span className="flex items-center gap-2">
                      <span>𝕏</span> Twitter/X
                    </span>
                  </SelectItem>
                  <SelectItem value="instagram">
                    <span className="flex items-center gap-2">
                      <span>📷</span> Instagram
                    </span>
                  </SelectItem>
                  <SelectItem value="linkedin">
                    <span className="flex items-center gap-2">
                      <span>💼</span> LinkedIn
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-theme-primary">
                Tone
              </label>
              <Select
                value={formData.tone}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, tone: value })
                }>
                <SelectTrigger className="glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                  <SelectItem value="inspirational">Inspirational</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-theme-primary">
              Topic (Optional)
            </label>
            <Input
              placeholder="e.g., AI in marketing, productivity tips, industry trends..."
              value={formData.topic}
              onChange={(e) =>
                setFormData({ ...formData, topic: e.target.value })
              }
              className="glass-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-theme-primary">
              Custom Prompt
            </label>
            <Textarea
              placeholder="Describe the content you want to generate..."
              value={formData.prompt}
              onChange={(e) =>
                setFormData({ ...formData, prompt: e.target.value })
              }
              className="glass-input min-h-[100px]"
            />
          </div>

          {/* Voice & Style Options */}
          <div className="space-y-4 p-4 bg-theme-surface rounded-lg border border-emerald-500/20">
            <h4 className="font-medium text-theme-primary">
              Voice & Style Options
            </h4>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.use_voice_style}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      use_voice_style: e.target.checked,
                    })
                  }
                  className="rounded border-emerald-500/30 bg-theme-surface text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-theme-secondary">
                  Use my voice & style
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.ignore_tone}
                  onChange={(e) =>
                    setFormData({ ...formData, ignore_tone: e.target.checked })
                  }
                  className="rounded border-emerald-500/30 bg-theme-surface text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-theme-secondary">
                  Ignore tone setting (use only my voice)
                </span>
              </label>
            </div>

            <p className="text-xs text-theme-muted">
              {formData.use_voice_style
                ? formData.ignore_tone
                  ? "Content will be generated using only your personal voice and style, ignoring the tone setting above."
                  : "Content will be generated using your personal voice and style combined with the selected tone."
                : "Content will be generated using the selected tone without your personal voice and style."}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isLoading || !formData.prompt.trim()}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate Custom Content
            </Button>

            <Button
              onClick={handleGetSuggestions}
              disabled={isLoading}
              variant="outline"
              className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Get Suggestions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-theme-primary">
            Generated Content
          </h3>
          <div className="grid gap-4">
            {suggestions.map((suggestion) => (
              <Card
                key={suggestion.id}
                className="glass-card border-emerald-500/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getPlatformIcon(suggestion.platform || "twitter")}
                      </span>
                      <span
                        className={`font-medium ${getPlatformColor(
                          suggestion.platform || "twitter"
                        )}`}>
                        {formatPlatformName(suggestion.platform || "twitter")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${getEngagementColor(
                          suggestion.engagement_score
                        )}`}>
                        {suggestion.engagement_score}% engagement
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(suggestion.content)}
                        className="text-theme-secondary hover:text-theme-primary">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-theme-primary mb-4 leading-relaxed">
                    {suggestion.content}
                  </p>

                  {suggestion.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {suggestion.hashtags.map((hashtag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs">
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-theme-secondary">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      Predicted engagement
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {suggestion.platform === "twitter"
                        ? "Replies"
                        : "Comments"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share className="w-4 h-4" />
                      Shares
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
