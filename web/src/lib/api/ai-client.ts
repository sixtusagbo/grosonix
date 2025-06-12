import {
  ContentSuggestion,
  StyleProfile,
  CrossPlatformContent,
  UsageStats,
  ContentGenerationRequest,
  StyleAnalysisRequest,
  ContentAdaptationRequest,
  VoiceSample,
  VoiceSampleRequest,
} from "@/types/ai";

class AIApiClient {
  private baseUrl = "/api";

  async generateContent(request: ContentGenerationRequest): Promise<{
    suggestions: ContentSuggestion[];
    remaining_quota: number;
    subscription_tier: string;
  }> {
    const params = new URLSearchParams({
      platform: request.platform,
      limit: "5",
    });

    if (request.topic) params.append("topic", request.topic);
    if (request.tone) params.append("tone", request.tone);

    const response = await fetch(
      `${this.baseUrl}/content/suggestions?${params}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to generate content");
    }

    return response.json();
  }

  async generateCustomContent(request: ContentGenerationRequest): Promise<{
    suggestion: ContentSuggestion;
    remaining_quota: number;
    subscription_tier: string;
  }> {
    const response = await fetch(`${this.baseUrl}/content/suggestions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to generate custom content");
    }

    return response.json();
  }

  async getStyleProfile(): Promise<{
    style_profile: StyleProfile;
    analysis_summary: string;
  }> {
    const response = await fetch(`${this.baseUrl}/ai/analyze-style`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get style profile");
    }

    return response.json();
  }

  async analyzeStyle(request: StyleAnalysisRequest): Promise<{
    style_profile: StyleProfile;
    analysis_summary: string;
  }> {
    const response = await fetch(`${this.baseUrl}/ai/analyze-style`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to analyze style");
    }

    return response.json();
  }

  async adaptContent(request: ContentAdaptationRequest): Promise<{
    adaptation: CrossPlatformContent;
    remaining_quota: number;
    subscription_tier: string;
  }> {
    const response = await fetch(`${this.baseUrl}/ai/adapt-content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to adapt content");
    }

    return response.json();
  }

  async getUsageStats(): Promise<UsageStats> {
    const response = await fetch(`${this.baseUrl}/ai/usage`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get usage stats");
    }

    return response.json();
  }

  async resetUsage(): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/ai/usage`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to reset usage");
    }

    return response.json();
  }

  async getVoiceSamples(): Promise<{
    voice_samples: VoiceSample[];
    count: number;
  }> {
    const response = await fetch(`${this.baseUrl}/ai/voice-samples`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get voice samples");
    }

    return response.json();
  }

  async addVoiceSample(request: VoiceSampleRequest): Promise<{
    voice_sample: VoiceSample;
    message: string;
  }> {
    const response = await fetch(`${this.baseUrl}/ai/voice-samples`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to add voice sample");
    }

    return response.json();
  }

  async deleteVoiceSample(sampleId: string): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseUrl}/ai/voice-samples?id=${sampleId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete voice sample");
    }

    return response.json();
  }

  async updateDefaultTone(tone: string): Promise<{
    style_profile: StyleProfile;
    message: string;
  }> {
    const response = await fetch(`${this.baseUrl}/ai/analyze-style`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ default_tone: tone }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update default tone");
    }

    return response.json();
  }
}

export const aiApiClient = new AIApiClient();

// Utility functions
export const validateEmojiContent = (content: string): boolean => {
  const emojiRegex =
    /(\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
  return emojiRegex.test(content);
};

export const extractEmojis = (content: string): string[] => {
  const emojiRegex =
    /(\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
  return content.match(emojiRegex) || [];
};

export const removeEmojis = (content: string): string => {
  const emojiRegex =
    /(\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
  return content.replace(emojiRegex, "").trim();
};

export const formatPlatformName = (platform: string): string => {
  switch (platform) {
    case "twitter":
      return "Twitter/X";
    case "instagram":
      return "Instagram";
    case "linkedin":
      return "LinkedIn";
    default:
      return platform;
  }
};

export const getPlatformColor = (platform: string): string => {
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

export const getPlatformIcon = (platform: string): string => {
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
