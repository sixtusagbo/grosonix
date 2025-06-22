"use client";

import { useState, useEffect, useRef } from "react";
import { ContentSuggestion, ContentGenerationRequest } from "@/types/ai";
import { aiApiClient } from "@/lib/api/ai-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Sparkles,
  Heart,
  X,
  TrendingUp,
  Hash,
  Copy,
  RotateCcw,
  Flame,
} from "lucide-react";
import { toast } from "sonner";

interface SwipeableContentGeneratorProps {
  onContentSaved?: (content: ContentSuggestion) => void;
}

export function SwipeableContentGenerator({
  onContentSaved,
}: SwipeableContentGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  
  const [formData, setFormData] = useState<ContentGenerationRequest>({
    prompt: "",
    platform: "twitter",
    tone: "professional",
    topic: "",
    use_voice_style: true,
    ignore_tone: false,
  });

  // Swipe animation refs
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadTrendingTopics();
  }, [formData.platform]);

  const loadTrendingTopics = async () => {
    // Simulate trending topics based on platform
    const topics = {
      twitter: [
        "AI Revolution",
        "Remote Work",
        "Sustainability",
        "Web3",
        "Mental Health",
        "Productivity Hacks",
        "Tech Innovation",
        "Digital Marketing",
      ],
      instagram: [
        "Lifestyle Tips",
        "Wellness Journey",
        "Creative Process",
        "Behind the Scenes",
        "Inspiration Monday",
        "Self Care",
        "Travel Stories",
        "Food Photography",
      ],
      linkedin: [
        "Leadership Insights",
        "Career Growth",
        "Industry Trends",
        "Professional Development",
        "Networking Tips",
        "Business Strategy",
        "Innovation",
        "Team Building",
      ],
    };

    setTrendingTopics(topics[formData.platform] || topics.twitter);
  };

  const generateSuggestions = async (useTrending: boolean = false) => {
    setIsLoading(true);
    try {
      const topic = useTrending && selectedTopic ? selectedTopic : formData.topic;
      
      const result = await aiApiClient.generateContent({
        ...formData,
        topic,
        prompt: topic ? `Create engaging content about ${topic}` : formData.prompt || "Create engaging social media content",
      });

      setSuggestions(result.suggestions);
      setCurrentIndex(0);
      setRemainingQuota(result.remaining_quota);
      setSubscriptionTier(result.subscription_tier);

      // Track content generation for analytics
      if (result.suggestions.length > 0) {
        try {
          await Promise.all(result.suggestions.map(suggestion => 
            aiApiClient.trackContentInteraction(
              suggestion.id,
              "generated",
              suggestion.platform,
              suggestion.engagement_score
            )
          ));
        } catch (error) {
          console.error("Error tracking content generation:", error);
        }
      }

      toast.success(`Generated ${result.suggestions.length} content suggestions!`);
    } catch (error) {
      console.error("Content generation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate content"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipeLeft = async () => {
    const currentSuggestion = suggestions[currentIndex];
    
    if (currentSuggestion) {
      try {
        // Track the discard action for analytics
        await aiApiClient.trackContentInteraction(
          currentSuggestion.id,
          "discarded",
          currentSuggestion.platform,
          currentSuggestion.engagement_score
        );
      } catch (error) {
        console.error("Error tracking discard:", error);
      }
    }
    
    if (currentIndex < suggestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      animateSwipe("left");
    } else {
      // Generate more suggestions when reaching the end
      generateSuggestions();
    }
  };

  const handleSwipeRight = async () => {
    const currentSuggestion = suggestions[currentIndex];
    if (currentSuggestion) {
      try {
        // Save the content suggestion to the database
        await aiApiClient.saveContentSuggestion(currentSuggestion.id);
        
        // Track the save action for analytics
        await aiApiClient.trackContentInteraction(
          currentSuggestion.id,
          "saved",
          currentSuggestion.platform,
          currentSuggestion.engagement_score
        );
        
        // Update the local state to mark as saved
        const updatedSuggestions = [...suggestions];
        updatedSuggestions[currentIndex] = {
          ...currentSuggestion,
          is_saved: true,
        };
        setSuggestions(updatedSuggestions);

        // Notify parent component
        if (onContentSaved) {
          onContentSaved({
            ...currentSuggestion,
            is_saved: true,
          });
        }
        
        toast.success("Content saved to your library!");
      } catch (error) {
        console.error("Error saving content:", error);
        toast.error("Failed to save content. Please try again.");
        return; // Don't proceed to next suggestion if save failed
      }
    }
    
    if (currentIndex < suggestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      animateSwipe("right");
    } else {
      generateSuggestions();
    }
  };

  const animateSwipe = (direction: "left" | "right") => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const translateX = direction === "left" ? -100 : 100;
    
    card.style.transform = `translateX(${translateX}%) rotate(${direction === "left" ? -15 : 15}deg)`;
    card.style.opacity = "0";
    
    setTimeout(() => {
      card.style.transform = "translateX(0) rotate(0deg)";
      card.style.opacity = "1";
    }, 300);
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      
      // Track the copy action for analytics
      const currentSuggestion = suggestions[currentIndex];
      if (currentSuggestion) {
        try {
          await aiApiClient.trackContentInteraction(
            currentSuggestion.id,
            "copied",
            currentSuggestion.platform,
            currentSuggestion.engagement_score
          );
        } catch (error) {
          console.error("Error tracking copy:", error);
        }
      }
      
      toast.success("Content copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy content");
    }
  };

  // Mouse/Touch event handlers for swipe gestures
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
    
    if (cardRef.current) {
      const rotation = deltaX * 0.1;
      cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (Math.abs(dragOffset.x) > 100) {
      if (dragOffset.x > 0) {
        handleSwipeRight();
      } else {
        handleSwipeLeft();
      }
    } else {
      // Snap back to center
      if (cardRef.current) {
        cardRef.current.style.transform = "translateX(0) rotate(0deg)";
      }
    }
    
    setDragOffset({ x: 0, y: 0 });
  };

  const currentSuggestion = suggestions[currentIndex];
  const hasMoreSuggestions = currentIndex < suggestions.length - 1;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="glass-card border-emerald-500/20">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-semibold text-theme-primary">
              Swipeable Content Generator
            </h3>
            {remainingQuota !== null && (
              <Badge variant="outline" className="ml-auto">
                {remainingQuota} remaining
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-theme-secondary mb-2 block">
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
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-theme-secondary mb-2 block">
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

          {/* Trending Topics */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-electric-orange-500" />
              <span className="text-sm font-medium text-theme-secondary">
                Trending Topics
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedTopic(topic);
                    setFormData({ ...formData, topic });
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedTopic === topic
                      ? "bg-electric-orange-500 text-white"
                      : "bg-surface hover:bg-surface-hover text-theme-secondary"
                  }`}>
                  <Hash className="w-3 h-3 inline mr-1" />
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => generateSuggestions(false)}
              disabled={isLoading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate Content
            </Button>

            <Button
              onClick={() => generateSuggestions(true)}
              disabled={isLoading || !selectedTopic}
              variant="outline"
              className="border-electric-orange-500/50 text-electric-orange-500 hover:bg-electric-orange-500/10">
              <Flame className="w-4 h-4 mr-2" />
              Use Trending
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Swipeable Content Card */}
      {currentSuggestion && (
        <div className="relative">
          <div className="text-center mb-4">
            <p className="text-sm text-theme-secondary">
              {currentIndex + 1} of {suggestions.length} suggestions
            </p>
            <p className="text-xs text-theme-muted mt-1">
              Swipe right to save • Swipe left to skip
            </p>
          </div>

          <div
            ref={cardRef}
            className="relative max-w-md mx-auto cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              transition: isDragging ? "none" : "transform 0.3s ease, opacity 0.3s ease",
            }}>
            
            {/* Swipe indicators */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <div
                className={`absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold transform rotate-12 transition-opacity ${
                  dragOffset.x < -50 ? "opacity-100" : "opacity-0"
                }`}>
                SKIP
              </div>
              <div
                className={`absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold transform -rotate-12 transition-opacity ${
                  dragOffset.x > 50 ? "opacity-100" : "opacity-0"
                }`}>
                SAVE
              </div>
            </div>

            <Card className="glass-card border-emerald-500/20 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {formData.platform === "twitter" && "𝕏"}
                      {formData.platform === "instagram" && "📷"}
                      {formData.platform === "linkedin" && "💼"}
                    </span>
                    <span className="font-medium text-theme-primary capitalize">
                      {formData.platform}
                    </span>
                    {currentSuggestion.is_saved && (
                      <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                        Saved
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-emerald-400">
                      {currentSuggestion.engagement_score}% engagement
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(currentSuggestion.content)}
                      className="text-theme-secondary hover:text-theme-primary">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-theme-primary mb-4 leading-relaxed text-lg">
                  {currentSuggestion.content}
                </p>

                {currentSuggestion.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentSuggestion.hashtags.map((hashtag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {hashtag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="text-xs text-theme-muted">
                  Created: {new Date(currentSuggestion.created_at).toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-6 mt-6">
            <Button
              onClick={handleSwipeLeft}
              variant="outline"
              size="lg"
              className="w-16 h-16 rounded-full border-red-500/50 text-red-500 hover:bg-red-500/10">
              <X className="w-6 h-6" />
            </Button>

            <Button
              onClick={() => generateSuggestions()}
              variant="outline"
              size="lg"
              className="w-16 h-16 rounded-full border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10">
              <RotateCcw className="w-6 h-6" />
            </Button>

            <Button
              onClick={handleSwipeRight}
              variant="outline"
              size="lg"
              className="w-16 h-16 rounded-full border-green-500/50 text-green-500 hover:bg-green-500/10">
              <Heart className="w-6 h-6" />
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="mt-4 max-w-md mx-auto">
            <div className="w-full bg-surface rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / suggestions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && suggestions.length === 0 && (
        <Card className="glass-card border-emerald-500/20">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-theme-primary mb-2">
              Ready to Generate Content
            </h3>
            <p className="text-theme-secondary mb-6">
              Choose your platform and tone, then generate swipeable content suggestions.
            </p>
            <Button
              onClick={() => generateSuggestions()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}