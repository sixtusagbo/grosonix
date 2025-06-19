import { OpenAIService } from './openai';

export interface LinkedInHashtagSuggestion {
  hashtag: string;
  category: 'industry' | 'skill' | 'career' | 'trending' | 'general';
  relevanceScore: number;
  description: string;
}

export class LinkedInHashtagGenerator {
  private openaiService: OpenAIService;

  // Curated LinkedIn hashtag categories
  private static readonly INDUSTRY_HASHTAGS = {
    technology: ['#TechLeadership', '#Innovation', '#DigitalTransformation', '#AI', '#MachineLearning', '#CloudComputing', '#Cybersecurity', '#DataScience', '#SoftwareDevelopment', '#TechTrends'],
    marketing: ['#DigitalMarketing', '#ContentMarketing', '#SocialMediaMarketing', '#MarketingStrategy', '#BrandBuilding', '#CustomerExperience', '#MarketingTips', '#GrowthHacking', '#MarketingAutomation', '#InfluencerMarketing'],
    business: ['#BusinessStrategy', '#Entrepreneurship', '#StartupLife', '#BusinessDevelopment', '#Sales', '#BusinessGrowth', '#Innovation', '#Leadership', '#Management', '#BusinessTips'],
    finance: ['#Finance', '#Investment', '#FinTech', '#Banking', '#Accounting', '#FinancialPlanning', '#Economics', '#CorporateFinance', '#PersonalFinance', '#FinancialLiteracy'],
    healthcare: ['#Healthcare', '#HealthTech', '#MedicalInnovation', '#PublicHealth', '#HealthcareLeadership', '#PatientCare', '#HealthcareIT', '#Telemedicine', '#HealthcareManagement', '#MedicalResearch'],
    education: ['#Education', '#EdTech', '#LearningAndDevelopment', '#OnlineLearning', '#EducationTechnology', '#Teaching', '#SkillDevelopment', '#ProfessionalDevelopment', '#Training', '#EducationInnovation'],
    consulting: ['#Consulting', '#BusinessConsulting', '#ManagementConsulting', '#Strategy', '#BusinessTransformation', '#ChangeManagement', '#ProcessImprovement', '#BusinessAnalysis', '#ConsultingLife', '#ProblemSolving']
  };

  private static readonly SKILL_HASHTAGS = [
    '#Leadership', '#ProjectManagement', '#Communication', '#TeamBuilding', '#ProblemSolving',
    '#CriticalThinking', '#Creativity', '#Adaptability', '#TimeManagement', '#Negotiation',
    '#PublicSpeaking', '#Mentoring', '#Coaching', '#StrategicThinking', '#DecisionMaking',
    '#EmotionalIntelligence', '#Collaboration', '#Innovation', '#AnalyticalThinking', '#CustomerService'
  ];

  private static readonly CAREER_HASHTAGS = [
    '#ProfessionalDevelopment', '#CareerGrowth', '#Networking', '#JobSearch', '#CareerAdvice',
    '#WorkLifeBalance', '#CareerChange', '#PersonalBranding', '#ProfessionalGoals', '#CareerTips',
    '#MentorshipMatters', '#CareerSuccess', '#ProfessionalSkills', '#CareerPlanning', '#WorkplaceCulture',
    '#RemoteWork', '#FutureOfWork', '#CareerMotivation', '#ProfessionalNetwork', '#CareerDevelopment'
  ];

  private static readonly TRENDING_HASHTAGS = [
    '#AI', '#Sustainability', '#RemoteWork', '#DigitalTransformation', '#ESG', '#Diversity',
    '#Inclusion', '#MentalHealth', '#WellBeing', '#Innovation', '#Automation', '#BlockChain',
    '#Metaverse', '#Web3', '#ClimateChange', '#GreenTech', '#FutureOfWork', '#HybridWork',
    '#EmployeeExperience', '#CustomerExperience', '#DataPrivacy', '#Cybersecurity'
  ];

  constructor() {
    this.openaiService = OpenAIService.getInstance();
  }

  /**
   * Generate relevant LinkedIn hashtags for content
   */
  async generateHashtags(
    content: string,
    industry?: string,
    maxHashtags: number = 3
  ): Promise<LinkedInHashtagSuggestion[]> {
    try {
      // First, try AI-powered hashtag generation
      const aiHashtags = await this.generateAIHashtags(content, industry, maxHashtags);
      
      // Then, get curated hashtags based on content analysis
      const curatedHashtags = this.getCuratedHashtags(content, industry, maxHashtags);
      
      // Combine and rank hashtags
      const allHashtags = [...aiHashtags, ...curatedHashtags];
      const uniqueHashtags = this.deduplicateHashtags(allHashtags);
      
      // Sort by relevance score and return top results
      return uniqueHashtags
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxHashtags);
        
    } catch (error) {
      console.error('Error generating LinkedIn hashtags:', error);
      // Fallback to curated hashtags
      return this.getCuratedHashtags(content, industry, maxHashtags);
    }
  }

  /**
   * Generate hashtags using AI
   */
  private async generateAIHashtags(
    content: string,
    industry?: string,
    maxHashtags: number = 3
  ): Promise<LinkedInHashtagSuggestion[]> {
    const prompt = `Analyze this LinkedIn post content and suggest ${maxHashtags} highly relevant professional hashtags:

Content: "${content}"
${industry ? `Industry context: ${industry}` : ''}

Requirements:
- Hashtags should be professional and LinkedIn-appropriate
- Focus on industry-specific, skill-based, or trending business topics
- Each hashtag should be 1-3 words, properly capitalized (e.g., #DigitalMarketing, #AI, #Leadership)
- Avoid generic hashtags like #business or #work
- Consider current business trends and professional development topics

Format your response as:
HASHTAG1: #ExampleHashtag - Brief explanation of relevance
HASHTAG2: #AnotherHashtag - Brief explanation of relevance
HASHTAG3: #ThirdHashtag - Brief explanation of relevance`;

    try {
      const response = await this.openaiService.generateContent({
        prompt,
        platform: 'linkedin',
        tone: 'professional',
        maxTokens: 200,
      });

      return this.parseAIHashtagResponse(response.content);
    } catch (error) {
      console.error('AI hashtag generation failed:', error);
      return [];
    }
  }

  /**
   * Parse AI response to extract hashtags
   */
  private parseAIHashtagResponse(response: string): LinkedInHashtagSuggestion[] {
    const hashtags: LinkedInHashtagSuggestion[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      const match = line.match(/HASHTAG\d+:\s*(#\w+)\s*-\s*(.+)/i);
      if (match) {
        const [, hashtag, description] = match;
        hashtags.push({
          hashtag: hashtag.trim(),
          category: this.categorizeHashtag(hashtag),
          relevanceScore: 0.8, // AI-generated hashtags get high relevance
          description: description.trim()
        });
      }
    }

    return hashtags;
  }

  /**
   * Get curated hashtags based on content analysis
   */
  private getCuratedHashtags(
    content: string,
    industry?: string,
    maxHashtags: number = 3
  ): LinkedInHashtagSuggestion[] {
    const contentLower = content.toLowerCase();
    const suggestions: LinkedInHashtagSuggestion[] = [];

    // Industry-specific hashtags
    if (industry) {
      const industryHashtags = LinkedInHashtagGenerator.INDUSTRY_HASHTAGS[industry.toLowerCase() as keyof typeof LinkedInHashtagGenerator.INDUSTRY_HASHTAGS];
      if (industryHashtags) {
        industryHashtags.slice(0, 2).forEach(hashtag => {
          suggestions.push({
            hashtag,
            category: 'industry',
            relevanceScore: 0.9,
            description: `Industry-specific hashtag for ${industry}`
          });
        });
      }
    }

    // Skill-based hashtags
    const skillKeywords = ['leadership', 'management', 'strategy', 'innovation', 'team', 'project', 'communication', 'development'];
    for (const keyword of skillKeywords) {
      if (contentLower.includes(keyword)) {
        const relevantSkillHashtags = LinkedInHashtagGenerator.SKILL_HASHTAGS.filter(tag => 
          tag.toLowerCase().includes(keyword)
        );
        if (relevantSkillHashtags.length > 0) {
          suggestions.push({
            hashtag: relevantSkillHashtags[0],
            category: 'skill',
            relevanceScore: 0.7,
            description: `Skill-related hashtag based on content keywords`
          });
        }
      }
    }

    // Career-focused hashtags
    const careerKeywords = ['career', 'professional', 'growth', 'development', 'networking', 'job', 'workplace'];
    for (const keyword of careerKeywords) {
      if (contentLower.includes(keyword)) {
        const relevantCareerHashtags = LinkedInHashtagGenerator.CAREER_HASHTAGS.filter(tag => 
          tag.toLowerCase().includes(keyword)
        );
        if (relevantCareerHashtags.length > 0) {
          suggestions.push({
            hashtag: relevantCareerHashtags[0],
            category: 'career',
            relevanceScore: 0.6,
            description: `Career-focused hashtag based on content`
          });
        }
      }
    }

    // Trending hashtags
    const trendingKeywords = ['ai', 'artificial intelligence', 'remote', 'digital', 'sustainability', 'innovation', 'automation'];
    for (const keyword of trendingKeywords) {
      if (contentLower.includes(keyword)) {
        const relevantTrendingHashtags = LinkedInHashtagGenerator.TRENDING_HASHTAGS.filter(tag => 
          tag.toLowerCase().includes(keyword.replace(' ', ''))
        );
        if (relevantTrendingHashtags.length > 0) {
          suggestions.push({
            hashtag: relevantTrendingHashtags[0],
            category: 'trending',
            relevanceScore: 0.8,
            description: `Trending business hashtag`
          });
        }
      }
    }

    return suggestions.slice(0, maxHashtags);
  }

  /**
   * Categorize a hashtag
   */
  private categorizeHashtag(hashtag: string): LinkedInHashtagSuggestion['category'] {
    const hashtagLower = hashtag.toLowerCase();
    
    // Check if it's in our predefined categories
    for (const [industry, tags] of Object.entries(LinkedInHashtagGenerator.INDUSTRY_HASHTAGS)) {
      if (tags.some(tag => tag.toLowerCase() === hashtagLower)) {
        return 'industry';
      }
    }
    
    if (LinkedInHashtagGenerator.SKILL_HASHTAGS.some(tag => tag.toLowerCase() === hashtagLower)) {
      return 'skill';
    }
    
    if (LinkedInHashtagGenerator.CAREER_HASHTAGS.some(tag => tag.toLowerCase() === hashtagLower)) {
      return 'career';
    }
    
    if (LinkedInHashtagGenerator.TRENDING_HASHTAGS.some(tag => tag.toLowerCase() === hashtagLower)) {
      return 'trending';
    }
    
    return 'general';
  }

  /**
   * Remove duplicate hashtags and merge similar ones
   */
  private deduplicateHashtags(hashtags: LinkedInHashtagSuggestion[]): LinkedInHashtagSuggestion[] {
    const seen = new Set<string>();
    const unique: LinkedInHashtagSuggestion[] = [];

    for (const hashtag of hashtags) {
      const normalizedTag = hashtag.hashtag.toLowerCase();
      if (!seen.has(normalizedTag)) {
        seen.add(normalizedTag);
        unique.push(hashtag);
      }
    }

    return unique;
  }

  /**
   * Get popular hashtags by category
   */
  static getPopularHashtagsByCategory(category: string, limit: number = 10): string[] {
    switch (category.toLowerCase()) {
      case 'technology':
        return LinkedInHashtagGenerator.INDUSTRY_HASHTAGS.technology.slice(0, limit);
      case 'marketing':
        return LinkedInHashtagGenerator.INDUSTRY_HASHTAGS.marketing.slice(0, limit);
      case 'business':
        return LinkedInHashtagGenerator.INDUSTRY_HASHTAGS.business.slice(0, limit);
      case 'skills':
        return LinkedInHashtagGenerator.SKILL_HASHTAGS.slice(0, limit);
      case 'career':
        return LinkedInHashtagGenerator.CAREER_HASHTAGS.slice(0, limit);
      case 'trending':
        return LinkedInHashtagGenerator.TRENDING_HASHTAGS.slice(0, limit);
      default:
        return [...LinkedInHashtagGenerator.SKILL_HASHTAGS.slice(0, 3), ...LinkedInHashtagGenerator.CAREER_HASHTAGS.slice(0, 3)].slice(0, limit);
    }
  }
}
