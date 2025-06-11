'use client';

import { useState, useEffect } from 'react';
import { StyleProfile } from '@/types/ai';
import { aiApiClient } from '@/lib/api/ai-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Brain, TrendingUp, MessageSquare, Hash, Smile } from 'lucide-react';
import { toast } from 'sonner';

interface StyleAnalyzerProps {
  onStyleAnalyzed?: (profile: StyleProfile) => void;
}

export function StyleAnalyzer({ onStyleAnalyzed }: StyleAnalyzerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<string>('');

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    setIsLoading(true);
    try {
      const result = await aiApiClient.getStyleProfile();
      setStyleProfile(result.style_profile);
      setAnalysisSummary(result.analysis_summary);
    } catch (error) {
      // No existing profile is fine
      console.log('No existing style profile found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeStyle = async () => {
    setIsAnalyzing(true);
    try {
      // For now, we'll analyze without providing specific posts
      // In a real implementation, you'd fetch user's social media posts
      const result = await aiApiClient.analyzeStyle({});
      setStyleProfile(result.style_profile);
      setAnalysisSummary(result.analysis_summary);
      
      if (onStyleAnalyzed) {
        onStyleAnalyzed(result.style_profile);
      }
      
      toast.success('Style analysis completed successfully!');
    } catch (error) {
      console.error('Style analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze style');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getVocabularyIcon = (level: string) => {
    switch (level) {
      case 'simple': return '📝';
      case 'intermediate': return '📚';
      case 'advanced': return '🎓';
      default: return '📖';
    }
  };

  const getEmojiUsageIcon = (usage: string) => {
    switch (usage) {
      case 'minimal': return '😐';
      case 'moderate': return '😊';
      case 'heavy': return '🤩';
      default: return '😊';
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-electric-purple/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-electric-purple" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <Card className="glass-card border-electric-purple/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Brain className="w-5 h-5 text-electric-purple" />
            Writing Style Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!styleProfile ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-electric-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-electric-purple" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Analyze Your Writing Style</h3>
              <p className="text-silver mb-6 max-w-md mx-auto">
                Let our AI analyze your writing patterns to generate more personalized content suggestions.
              </p>
              <Button
                onClick={handleAnalyzeStyle}
                disabled={isAnalyzing}
                className="bg-electric-purple hover:bg-electric-purple/80"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                Analyze My Style
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Confidence Score */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Analysis Confidence</h3>
                  <p className="text-sm text-silver">
                    Based on {styleProfile.analyzed_posts_count} analyzed posts
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getConfidenceColor(styleProfile.confidence_score)}`}>
                    {styleProfile.confidence_score}%
                  </div>
                  <Progress 
                    value={styleProfile.confidence_score} 
                    className="w-24 mt-1"
                  />
                </div>
              </div>

              {/* Analysis Summary */}
              {analysisSummary && (
                <div className="bg-electric-purple/10 rounded-lg p-4 border border-electric-purple/20">
                  <h4 className="font-semibold text-white mb-2">AI Analysis Summary</h4>
                  <p className="text-silver text-sm leading-relaxed">{analysisSummary}</p>
                </div>
              )}

              {/* Style Characteristics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tone & Voice */}
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
                      <label className="text-sm text-silver">Vocabulary Level</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg">{getVocabularyIcon(styleProfile.vocabulary_level)}</span>
                        <Badge variant="outline" className="capitalize">
                          {styleProfile.vocabulary_level}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-silver">Emoji Usage</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg">{getEmojiUsageIcon(styleProfile.emoji_usage)}</span>
                        <Badge variant="outline" className="capitalize">
                          {styleProfile.emoji_usage}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Patterns */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-electric-purple" />
                    Content Patterns
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-silver">Content Length</label>
                      <Badge variant="secondary" className="ml-2 capitalize">
                        {styleProfile.content_length_preference}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm text-silver">Hashtag Style</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Hash className="w-4 h-4 text-electric-purple" />
                        <span className="text-sm text-white">{styleProfile.hashtag_style}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Topics */}
              {styleProfile.topics.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-3">Favorite Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {styleProfile.topics.map((topic, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Writing Patterns */}
              {styleProfile.writing_patterns.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-3">Writing Patterns</h4>
                  <div className="flex flex-wrap gap-2">
                    {styleProfile.writing_patterns.map((pattern, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Engagement Strategies */}
              {styleProfile.engagement_strategies.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-3">Engagement Strategies</h4>
                  <div className="flex flex-wrap gap-2">
                    {styleProfile.engagement_strategies.map((strategy, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-electric-purple/10 border-electric-purple/30">
                        {strategy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Re-analyze Button */}
              <div className="pt-4 border-t border-electric-purple/20">
                <Button
                  onClick={handleAnalyzeStyle}
                  disabled={isAnalyzing}
                  variant="outline"
                  className="border-electric-purple/50 text-electric-purple hover:bg-electric-purple/10"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  Re-analyze Style
                </Button>
                <p className="text-xs text-silver mt-2">
                  Last analyzed: {new Date(styleProfile.last_analyzed).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
