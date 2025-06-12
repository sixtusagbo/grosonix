"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, Shuffle, Zap } from "lucide-react";
import { toast } from "sonner";

export function AIDemo() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [demoContent, setDemoContent] = useState<string>("");

  const generateDemoContent = () => {
    setIsGenerating(true);

    // Simulate AI content generation
    setTimeout(() => {
      const demoContents = [
        "🚀 Just discovered how AI is revolutionizing social media marketing! The future is here and it's incredible. What's your take on AI-powered content creation? #AI #SocialMedia #Marketing",
        "💡 Pro tip: Consistency beats perfection every time. Your audience wants authentic content, not polished perfection. Share your journey, not just your highlights! #ContentCreation #Authenticity",
        "🎯 The secret to viral content? Understanding your audience's pain points and providing genuine value. Stop selling, start helping! #ContentStrategy #Value",
        "⚡ Breaking: AI tools are now generating 40% more engagement than traditional content. The data doesn't lie - adaptation is key! #AIMarketing #Growth",
      ];

      const randomContent =
        demoContents[Math.floor(Math.random() * demoContents.length)];
      setDemoContent(randomContent);
      setIsGenerating(false);
      toast.success("Demo content generated successfully!");
    }, 2000);
  };

  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "AI Content Generation",
      description:
        "Generate personalized content suggestions based on your style and audience",
      status: "Ready",
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: "Style Analysis",
      description:
        "Analyze your writing patterns to improve content personalization",
      status: "Ready",
    },
    {
      icon: <Shuffle className="w-5 h-5" />,
      title: "Cross-Platform Adaptation",
      description:
        "Automatically adapt content for Twitter, Instagram, and LinkedIn",
      status: "Ready",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Usage Analytics",
      description: "Track your AI usage and optimize your content strategy",
      status: "Ready",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Demo Header */}
      <Card className="glass-card border-emerald-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-theme-primary">
            <Sparkles className="w-6 h-6 text-emerald-500" />
            AI Content Engine Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-theme-secondary">
            Experience the power of AI-driven content creation. Click the button
            below to generate sample content.
          </p>

          <Button
            onClick={generateDemoContent}
            disabled={isGenerating}
            className="bg-emerald-500 hover:bg-emerald-600 text-white">
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Demo Content
              </>
            )}
          </Button>

          {demoContent && (
            <div className="mt-6 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <h4 className="font-semibold text-theme-primary mb-2">
                Generated Content:
              </h4>
              <p className="text-theme-primary leading-relaxed">
                {demoContent}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">
                  Twitter Optimized
                </Badge>
                <Badge variant="outline" className="text-xs">
                  High Engagement
                </Badge>
                <Badge variant="outline" className="text-xs">
                  85% Score
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <Card key={index} className="glass-card border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="text-emerald-500 mt-1">{feature.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-theme-primary">
                      {feature.title}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="text-xs bg-green-500/20 text-green-400">
                      {feature.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-theme-secondary">
                    {feature.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card className="glass-card border-emerald-500/20">
        <CardHeader>
          <CardTitle className="text-theme-primary">
            AI Engine Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">4</div>
              <div className="text-xs text-theme-secondary">AI Features</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">3</div>
              <div className="text-xs text-theme-secondary">Platforms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">∞</div>
              <div className="text-xs text-theme-secondary">Possibilities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">100%</div>
              <div className="text-xs text-theme-secondary">Ready</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
