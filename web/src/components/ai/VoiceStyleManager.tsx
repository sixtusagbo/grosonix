"use client";

import { useState, useEffect } from "react";
import { VoiceSample, StyleProfile } from "@/types/ai";
import { aiApiClient } from "@/lib/api/ai-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Brain,
  Plus,
  Trash2,
  MessageSquare,
  Settings,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface VoiceStyleManagerProps {
  onStyleAnalyzed?: (profile: StyleProfile) => void;
}

export function VoiceStyleManager({ onStyleAnalyzed }: VoiceStyleManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [voiceSamples, setVoiceSamples] = useState<VoiceSample[]>([]);
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<string>("");
  const [defaultTone, setDefaultTone] = useState<string>("professional");

  // New voice sample form
  const [newSample, setNewSample] = useState({
    platform: "twitter" as "twitter" | "instagram" | "linkedin",
    content: "",
    additional_instructions: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load existing style profile
      try {
        const profileResult = await aiApiClient.getStyleProfile();
        setStyleProfile(profileResult.style_profile);
        setAnalysisSummary(profileResult.analysis_summary);
        setDefaultTone(
          profileResult.style_profile.default_tone || "professional"
        );
      } catch (error) {
        console.log("No existing style profile found");
      }

      // Load voice samples
      const samplesResult = await aiApiClient.getVoiceSamples();
      setVoiceSamples(samplesResult.voice_samples);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load voice samples");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSample = async () => {
    if (!newSample.content.trim()) {
      toast.error("Please enter post content");
      return;
    }

    if (voiceSamples.length >= 3) {
      toast.error("Maximum of 3 voice samples allowed");
      return;
    }

    try {
      const result = await aiApiClient.addVoiceSample({
        platform: newSample.platform,
        content: newSample.content.trim(),
        additional_instructions:
          newSample.additional_instructions.trim() || undefined,
      });

      setVoiceSamples([result.voice_sample, ...voiceSamples]);
      setNewSample({
        platform: "twitter",
        content: "",
        additional_instructions: "",
      });
      toast.success("Voice sample added successfully");
    } catch (error) {
      console.error("Error adding voice sample:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add voice sample"
      );
    }
  };

  const handleDeleteSample = async (sampleId: string) => {
    try {
      await aiApiClient.deleteVoiceSample(sampleId);
      setVoiceSamples(voiceSamples.filter((sample) => sample.id !== sampleId));
      toast.success("Voice sample deleted");
    } catch (error) {
      console.error("Error deleting voice sample:", error);
      toast.error("Failed to delete voice sample");
    }
  };

  const handleAnalyzeStyle = async () => {
    if (voiceSamples.length === 0) {
      toast.error("Please add at least one voice sample to analyze your style");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await aiApiClient.analyzeStyle({
        voice_samples: voiceSamples,
        default_tone: defaultTone,
        force_refresh: true,
      });

      setStyleProfile(result.style_profile);
      setAnalysisSummary(result.analysis_summary);

      if (onStyleAnalyzed) {
        onStyleAnalyzed(result.style_profile);
      }

      toast.success(
        `Style analysis completed! Analyzed ${voiceSamples.length} voice samples.`
      );
    } catch (error) {
      console.error("Style analysis error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to analyze style"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateDefaultTone = async (tone: string) => {
    try {
      await aiApiClient.updateDefaultTone(tone);
      setDefaultTone(tone);
      toast.success("Default tone updated");
    } catch (error) {
      console.error("Error updating default tone:", error);
      toast.error("Failed to update default tone");
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
        return "𝕏";
      case "instagram":
        return "📷";
      case "linkedin":
        return "💼";
      default:
        return "📱";
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "twitter":
        return "text-blue-400";
      case "instagram":
        return "text-pink-400";
      case "linkedin":
        return "text-blue-600";
      default:
        return "text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-electric-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Default Tone Settings */}
      <Card className="glass-card border-electric-purple/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="w-5 h-5 text-electric-purple" />
            Default Tone Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-silver mb-2 block">
                Choose your default tone for content generation
              </label>
              <Select
                value={defaultTone}
                onValueChange={handleUpdateDefaultTone}>
                <SelectTrigger className="bg-dark-purple/50 border-electric-purple/30">
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
        </CardContent>
      </Card>

      {/* Voice Samples Management */}
      <Card className="glass-card border-electric-purple/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <MessageSquare className="w-5 h-5 text-electric-purple" />
            Voice & Style Samples
            <Badge variant="outline" className="ml-auto">
              {voiceSamples.length}/3
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-silver text-sm">
            Add up to 3 of your favorite posts to help AI understand your unique
            voice and writing style.
          </p>

          {/* Add New Sample Form */}
          {voiceSamples.length < 3 && (
            <div className="space-y-4 p-4 bg-dark-purple/30 rounded-lg border border-electric-purple/20">
              <h4 className="font-medium text-white">Add New Voice Sample</h4>

              <div>
                <label className="text-sm text-silver mb-2 block">
                  Platform
                </label>
                <Select
                  value={newSample.platform}
                  onValueChange={(
                    value: "twitter" | "instagram" | "linkedin"
                  ) => setNewSample({ ...newSample, platform: value })}>
                  <SelectTrigger className="bg-dark-purple/50 border-electric-purple/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-silver mb-2 block">
                  Post Content
                </label>
                <Textarea
                  placeholder="Paste your favorite post content here..."
                  value={newSample.content}
                  onChange={(e) =>
                    setNewSample({ ...newSample, content: e.target.value })
                  }
                  className="bg-dark-purple/50 border-electric-purple/30 min-h-[100px]"
                />
              </div>

              <div>
                <label className="text-sm text-silver mb-2 block">
                  Additional Instructions (Optional)
                </label>
                <Textarea
                  placeholder="Any specific notes about this post's style or context..."
                  value={newSample.additional_instructions}
                  onChange={(e) =>
                    setNewSample({
                      ...newSample,
                      additional_instructions: e.target.value,
                    })
                  }
                  className="bg-dark-purple/50 border-electric-purple/30"
                />
              </div>

              <Button
                onClick={handleAddSample}
                className="bg-electric-purple hover:bg-electric-purple/80">
                <Plus className="w-4 h-4 mr-2" />
                Add Voice Sample
              </Button>
            </div>
          )}

          {/* Existing Samples */}
          {voiceSamples.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-white">Your Voice Samples</h4>
              {voiceSamples.map((sample) => (
                <div
                  key={sample.id}
                  className="p-4 bg-dark-purple/30 rounded-lg border border-electric-purple/20">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getPlatformIcon(sample.platform)}
                      </span>
                      <span
                        className={`font-medium ${getPlatformColor(
                          sample.platform
                        )}`}>
                        {sample.platform.charAt(0).toUpperCase() +
                          sample.platform.slice(1)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSample(sample.id!)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-silver text-sm mb-2 line-clamp-3">
                    {sample.content}
                  </p>

                  {sample.additional_instructions && (
                    <p className="text-xs text-silver/70 italic">
                      Note: {sample.additional_instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Analyze Button */}
          {voiceSamples.length > 0 && (
            <Button
              onClick={handleAnalyzeStyle}
              disabled={isAnalyzing}
              className="w-full bg-electric-purple hover:bg-electric-purple/80">
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              Analyze My Voice & Style
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Style Analysis Results */}
      {styleProfile && (
        <Card className="glass-card border-electric-purple/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-electric-purple" />
              Your Writing Style Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Analysis Summary */}
            <div className="p-4 bg-electric-purple/10 rounded-lg border border-electric-purple/20">
              <p className="text-silver">{analysisSummary}</p>
            </div>

            {/* Style Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-electric-purple" />
                  Tone & Voice
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-silver">Primary Tone</label>
                    <Badge variant="secondary" className="ml-2 capitalize">
                      {styleProfile.tone}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm text-silver">Default Tone</label>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {styleProfile.default_tone || "Not set"}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm text-silver">
                      Vocabulary Level
                    </label>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {styleProfile.vocabulary_level}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-white">
                  Content Preferences
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-silver">
                      Content Length
                    </label>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {styleProfile.content_length_preference}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm text-silver">Emoji Usage</label>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {styleProfile.emoji_usage}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm text-silver">Hashtag Style</label>
                    <Badge variant="outline" className="ml-2">
                      {styleProfile.hashtag_style}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Topics and Patterns */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">Main Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {styleProfile.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">
                  Writing Patterns
                </h4>
                <div className="flex flex-wrap gap-2">
                  {styleProfile.writing_patterns.map((pattern, index) => (
                    <Badge key={index} variant="outline">
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">
                  Engagement Strategies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {styleProfile.engagement_strategies.map((strategy, index) => (
                    <Badge key={index} variant="outline">
                      {strategy}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Analysis Stats */}
            <div className="pt-4 border-t border-electric-purple/20">
              <div className="flex items-center justify-between text-sm text-silver">
                <span>
                  Analyzed {styleProfile.analyzed_posts_count} voice samples
                </span>
                <span>Confidence: {styleProfile.confidence_score}%</span>
                <span>
                  Last updated:{" "}
                  {new Date(styleProfile.last_analyzed).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
