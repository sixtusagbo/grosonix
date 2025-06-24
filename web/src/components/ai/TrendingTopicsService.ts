export interface TrendingTopic {
  topic: string;
  platform: string;
  volume: number;
  growth_rate: number;
  hashtags: string[];
  category: string;
}

export class TrendingTopicsService {
  private static instance: TrendingTopicsService;

  static getInstance(): TrendingTopicsService {
    if (!TrendingTopicsService.instance) {
      TrendingTopicsService.instance = new TrendingTopicsService();
    }
    return TrendingTopicsService.instance;
  }

  /**
   * Get trending topics for a specific platform
   */
  async getTrendingTopics(platform: string): Promise<TrendingTopic[]> {
    // In a real implementation, this would call external APIs like:
    // - Twitter Trends API
    // - Google Trends API
    // - Instagram Hashtag API
    // - LinkedIn Content API
    
    // For now, we'll return curated trending topics based on platform
    return this.getCuratedTrends(platform);
  }

  /**
   * Get curated trending topics based on current events and platform
   */
  private getCuratedTrends(platform: string): TrendingTopic[] {
    const currentDate = new Date();
    const month = currentDate.getMonth();
    const dayOfWeek = currentDate.getDay();

    const baseTrends = {
      twitter: [
        {
          topic: "AI Revolution",
          platform: "twitter",
          volume: 125000,
          growth_rate: 15.2,
          hashtags: ["#AI", "#ArtificialIntelligence", "#TechTrends", "#Innovation"],
          category: "Technology"
        },
        {
          topic: "Remote Work Culture",
          platform: "twitter",
          volume: 89000,
          growth_rate: 8.7,
          hashtags: ["#RemoteWork", "#WorkFromHome", "#DigitalNomad", "#Productivity"],
          category: "Business"
        },
        {
          topic: "Sustainable Living",
          platform: "twitter",
          volume: 67000,
          growth_rate: 12.3,
          hashtags: ["#Sustainability", "#ClimateAction", "#EcoFriendly", "#GreenLiving"],
          category: "Lifestyle"
        },
        {
          topic: "Mental Health Awareness",
          platform: "twitter",
          volume: 156000,
          growth_rate: 22.1,
          hashtags: ["#MentalHealth", "#Wellness", "#SelfCare", "#Mindfulness"],
          category: "Health"
        },
        {
          topic: "Cryptocurrency Trends",
          platform: "twitter",
          volume: 234000,
          growth_rate: -5.4,
          hashtags: ["#Crypto", "#Bitcoin", "#Blockchain", "#Web3"],
          category: "Finance"
        },
        {
          topic: "Content Creation Tips",
          platform: "twitter",
          volume: 78000,
          growth_rate: 18.9,
          hashtags: ["#ContentCreator", "#SocialMedia", "#CreatorEconomy", "#DigitalMarketing"],
          category: "Marketing"
        }
      ],
      instagram: [
        {
          topic: "Aesthetic Lifestyle",
          platform: "instagram",
          volume: 189000,
          growth_rate: 14.6,
          hashtags: ["#Aesthetic", "#Lifestyle", "#Minimalism", "#DailyInspiration"],
          category: "Lifestyle"
        },
        {
          topic: "Fitness Journey",
          platform: "instagram",
          volume: 267000,
          growth_rate: 11.2,
          hashtags: ["#FitnessJourney", "#Workout", "#HealthyLifestyle", "#Motivation"],
          category: "Health"
        },
        {
          topic: "Food Photography",
          platform: "instagram",
          volume: 145000,
          growth_rate: 7.8,
          hashtags: ["#FoodPhotography", "#Foodie", "#Recipe", "#Cooking"],
          category: "Food"
        },
        {
          topic: "Travel Stories",
          platform: "instagram",
          volume: 198000,
          growth_rate: 16.4,
          hashtags: ["#Travel", "#Wanderlust", "#Adventure", "#TravelPhotography"],
          category: "Travel"
        },
        {
          topic: "Self Care Routine",
          platform: "instagram",
          volume: 134000,
          growth_rate: 19.7,
          hashtags: ["#SelfCare", "#Wellness", "#MentalHealth", "#SelfLove"],
          category: "Wellness"
        },
        {
          topic: "Behind the Scenes",
          platform: "instagram",
          volume: 89000,
          growth_rate: 13.5,
          hashtags: ["#BehindTheScenes", "#CreativeProcess", "#WorkInProgress", "#Authentic"],
          category: "Creative"
        }
      ],
      linkedin: [
        {
          topic: "Leadership Insights",
          platform: "linkedin",
          volume: 78000,
          growth_rate: 9.3,
          hashtags: ["#Leadership", "#Management", "#ProfessionalDevelopment", "#CareerGrowth"],
          category: "Leadership"
        },
        {
          topic: "Industry Innovation",
          platform: "linkedin",
          volume: 92000,
          growth_rate: 12.7,
          hashtags: ["#Innovation", "#Technology", "#BusinessStrategy", "#DigitalTransformation"],
          category: "Business"
        },
        {
          topic: "Career Development",
          platform: "linkedin",
          volume: 156000,
          growth_rate: 15.8,
          hashtags: ["#CareerDevelopment", "#ProfessionalGrowth", "#SkillBuilding", "#Networking"],
          category: "Career"
        },
        {
          topic: "Team Collaboration",
          platform: "linkedin",
          volume: 67000,
          growth_rate: 8.9,
          hashtags: ["#TeamWork", "#Collaboration", "#RemoteTeams", "#Productivity"],
          category: "Management"
        },
        {
          topic: "Market Trends",
          platform: "linkedin",
          volume: 134000,
          growth_rate: 11.4,
          hashtags: ["#MarketTrends", "#BusinessInsights", "#DataAnalysis", "#Strategy"],
          category: "Analytics"
        },
        {
          topic: "Workplace Culture",
          platform: "linkedin",
          volume: 89000,
          growth_rate: 14.2,
          hashtags: ["#WorkplaceCulture", "#EmployeeEngagement", "#CompanyCulture", "#HR"],
          category: "Culture"
        }
      ]
    };

    // Add time-based trending topics
    const timeBasedTrends = this.getTimeBasedTrends(platform, month, dayOfWeek);
    
    return [...(baseTrends[platform as keyof typeof baseTrends] || baseTrends.twitter), ...timeBasedTrends];
  }

  /**
   * Get time-based trending topics (seasonal, weekly, etc.)
   */
  private getTimeBasedTrends(platform: string, month: number, dayOfWeek: number): TrendingTopic[] {
    const trends: TrendingTopic[] = [];

    // Monday motivation
    if (dayOfWeek === 1) {
      trends.push({
        topic: "Monday Motivation",
        platform,
        volume: 45000,
        growth_rate: 25.0,
        hashtags: ["#MondayMotivation", "#NewWeek", "#Goals", "#Inspiration"],
        category: "Motivation"
      });
    }

    // Friday feeling
    if (dayOfWeek === 5) {
      trends.push({
        topic: "Friday Feeling",
        platform,
        volume: 38000,
        growth_rate: 20.5,
        hashtags: ["#FridayFeeling", "#Weekend", "#WorkLifeBalance", "#TGIF"],
        category: "Lifestyle"
      });
    }

    // Seasonal trends
    if (month >= 2 && month <= 4) { // Spring
      trends.push({
        topic: "Spring Renewal",
        platform,
        volume: 32000,
        growth_rate: 18.3,
        hashtags: ["#Spring", "#Renewal", "#FreshStart", "#Growth"],
        category: "Seasonal"
      });
    }

    if (month >= 5 && month <= 7) { // Summer
      trends.push({
        topic: "Summer Vibes",
        platform,
        volume: 56000,
        growth_rate: 22.1,
        hashtags: ["#Summer", "#Vacation", "#SunnyDays", "#Adventure"],
        category: "Seasonal"
      });
    }

    if (month >= 8 && month <= 10) { // Fall
      trends.push({
        topic: "Fall Productivity",
        platform,
        volume: 41000,
        growth_rate: 16.7,
        hashtags: ["#Fall", "#BackToSchool", "#Productivity", "#Goals"],
        category: "Seasonal"
      });
    }

    if (month === 11 || month === 0 || month === 1) { // Winter
      trends.push({
        topic: "New Year Goals",
        platform,
        volume: 78000,
        growth_rate: 35.2,
        hashtags: ["#NewYear", "#Goals", "#Resolutions", "#FreshStart"],
        category: "Seasonal"
      });
    }

    return trends;
  }

  /**
   * Get hashtag suggestions based on trending topics
   */
  getHashtagSuggestions(topic: string, platform: string): string[] {
    const topicLower = topic.toLowerCase();
    
    const hashtagMap: { [key: string]: string[] } = {
      "ai": ["#AI", "#ArtificialIntelligence", "#MachineLearning", "#TechTrends", "#Innovation"],
      "remote work": ["#RemoteWork", "#WorkFromHome", "#DigitalNomad", "#Productivity", "#FlexibleWork"],
      "sustainability": ["#Sustainability", "#ClimateAction", "#EcoFriendly", "#GreenLiving", "#Environment"],
      "mental health": ["#MentalHealth", "#Wellness", "#SelfCare", "#Mindfulness", "#MentalWellness"],
      "fitness": ["#Fitness", "#Workout", "#HealthyLifestyle", "#Motivation", "#FitnessJourney"],
      "food": ["#Food", "#Recipe", "#Cooking", "#Foodie", "#HealthyEating"],
      "travel": ["#Travel", "#Wanderlust", "#Adventure", "#TravelPhotography", "#Explore"],
      "business": ["#Business", "#Entrepreneurship", "#StartUp", "#Leadership", "#Success"],
      "technology": ["#Technology", "#Tech", "#Innovation", "#DigitalTransformation", "#Future"],
      "marketing": ["#Marketing", "#DigitalMarketing", "#SocialMedia", "#ContentMarketing", "#Branding"]
    };

    // Find matching hashtags
    for (const [key, hashtags] of Object.entries(hashtagMap)) {
      if (topicLower.includes(key)) {
        return hashtags;
      }
    }

    // Default hashtags based on platform
    const platformDefaults = {
      twitter: ["#Twitter", "#SocialMedia", "#Trending", "#Viral", "#Engagement"],
      instagram: ["#Instagram", "#Content", "#Creative", "#Inspiration", "#Community"],
      linkedin: ["#LinkedIn", "#Professional", "#Career", "#Business", "#Networking"]
    };

    return platformDefaults[platform as keyof typeof platformDefaults] || platformDefaults.twitter;
  }

  /**
   * Analyze topic engagement potential
   */
  analyzeTopicEngagement(topic: TrendingTopic): {
    score: number;
    factors: string[];
    recommendation: string;
  } {
    let score = 50; // Base score
    const factors: string[] = [];

    // Volume factor
    if (topic.volume > 100000) {
      score += 20;
      factors.push("High search volume");
    } else if (topic.volume > 50000) {
      score += 10;
      factors.push("Moderate search volume");
    }

    // Growth rate factor
    if (topic.growth_rate > 15) {
      score += 25;
      factors.push("Rapidly growing trend");
    } else if (topic.growth_rate > 5) {
      score += 15;
      factors.push("Steady growth");
    } else if (topic.growth_rate < 0) {
      score -= 10;
      factors.push("Declining trend");
    }

    // Hashtag count factor
    if (topic.hashtags.length >= 4) {
      score += 10;
      factors.push("Rich hashtag ecosystem");
    }

    // Platform relevance
    if (topic.platform === "linkedin" && topic.category === "Business") {
      score += 15;
      factors.push("Platform-relevant content");
    }

    // Generate recommendation
    let recommendation = "";
    if (score >= 80) {
      recommendation = "Excellent opportunity - high engagement potential";
    } else if (score >= 60) {
      recommendation = "Good opportunity - solid engagement expected";
    } else if (score >= 40) {
      recommendation = "Moderate opportunity - consider niche targeting";
    } else {
      recommendation = "Low opportunity - consider alternative topics";
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      factors,
      recommendation
    };
  }
}

export default TrendingTopicsService;