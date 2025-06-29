/**
 * Content formatting utilities for social media platforms
 */

export interface FormattingOptions {
  platform: 'twitter' | 'instagram' | 'linkedin';
  maxLength?: number;
  preserveLineBreaks?: boolean;
  addCallToAction?: boolean;
}

export class ContentFormatter {
  /**
   * Format content for specific platform with proper spacing and structure
   */
  static formatForPlatform(content: string, options: FormattingOptions): string {
    const { platform, maxLength, preserveLineBreaks = true } = options;
    
    // Clean up the content first
    let formattedContent = this.cleanContent(content);
    
    // Apply platform-specific formatting
    switch (platform) {
      case 'twitter':
        formattedContent = this.formatForTwitter(formattedContent, maxLength);
        break;
      case 'instagram':
        formattedContent = this.formatForInstagram(formattedContent, maxLength);
        break;
      case 'linkedin':
        formattedContent = this.formatForLinkedIn(formattedContent, maxLength);
        break;
    }
    
    return formattedContent;
  }

  /**
   * Clean and normalize content
   */
  private static cleanContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Replace 3+ line breaks with 2
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n /g, '\n') // Remove spaces after line breaks
      .replace(/ \n/g, '\n'); // Remove spaces before line breaks
  }

  /**
   * Format content for Twitter
   */
  private static formatForTwitter(content: string, maxLength: number = 280): string {
    // Ensure content fits Twitter's character limit
    if (content.length > maxLength) {
      content = this.truncateToLastCompleteSentence(content, maxLength);
    }
    
    // Add strategic line breaks for readability
    return this.addTwitterLineBreaks(content);
  }

  /**
   * Truncate text to the last complete sentence within maxLength
   */
  private static truncateToLastCompleteSentence(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    
    // Find the last sentence boundary within the maxLength
    const truncated = text.substring(0, maxLength);
    const sentenceEndMatch = truncated.match(/[.!?][^\w]*$/);
    
    if (sentenceEndMatch && sentenceEndMatch.index !== undefined) {
      // Found a sentence end, truncate there
      return truncated.substring(0, sentenceEndMatch.index + 1);
    } else {
      // Try to find the last complete word
      const lastSpaceIndex = truncated.lastIndexOf(' ');
      if (lastSpaceIndex > maxLength * 0.8) { // Only truncate at word if it's not too far back
        return truncated.substring(0, lastSpaceIndex) + '...';
      } else {
        // If no good truncation point, just cut at maxLength - 3 and add ellipsis
        return truncated.substring(0, maxLength - 3) + '...';
      }
    }
  }

  /**
   * Add strategic line breaks for Twitter
   */
  private static addTwitterLineBreaks(content: string): string {
    // If content is short, no need for breaks
    if (content.length < 100) return content;
    
    // Split into sentences and group for readability
    const sentences = content.split(/(?<=[.!?])\s+/);
    if (sentences.length <= 2) return content;
    
    // Group sentences with line breaks
    const groups = [];
    let currentGroup = '';
    
    for (const sentence of sentences) {
      if (currentGroup && (currentGroup + ' ' + sentence).length > 140) {
        groups.push(currentGroup);
        currentGroup = sentence;
      } else {
        currentGroup += (currentGroup ? ' ' : '') + sentence;
      }
    }
    
    if (currentGroup) groups.push(currentGroup);
    
    return groups.join('\n\n');
  }

  /**
   * Format content for Instagram
   */
  private static formatForInstagram(content: string, maxLength?: number): string {
    // Apply length limit if specified
    if (maxLength && content.length > maxLength) {
      content = this.truncateToLastCompleteSentence(content, maxLength);
    }
    
    // Instagram benefits from visual breaks and engaging structure
    const sentences = content.split(/(?<=[.!?])\s+/);
    
    if (sentences.length <= 2) return content;
    
    // Create visually appealing paragraph structure
    const paragraphs = [];
    
    // Opening hook (1-2 sentences)
    if (sentences.length >= 1) {
      paragraphs.push(sentences[0]);
    }
    
    // Main content (group remaining sentences)
    if (sentences.length > 2) {
      const mainContent = sentences.slice(1, -1);
      if (mainContent.length > 0) {
        // Group main content into readable chunks
        const chunks = this.groupSentences(mainContent, 2);
        paragraphs.push(...chunks);
      }
    }
    
    // Closing (last sentence if more than 1 sentence total)
    if (sentences.length > 1) {
      paragraphs.push(sentences[sentences.length - 1]);
    }
    
    return paragraphs.join('\n\n');
  }

  /**
   * Format content for LinkedIn with professional structure
   */
  private static formatForLinkedIn(content: string, maxLength?: number): string {
    // Apply length limit if specified
    if (maxLength && content.length > maxLength) {
      content = this.truncateToLastCompleteSentence(content, maxLength);
    }
    
    // If content already has proper formatting, preserve it
    if (content.includes('\n\n')) {
      return content;
    }

    // LinkedIn requires professional, well-structured content
    const sentences = content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);

    if (sentences.length <= 2) {
      return content; // Too short to need formatting
    }

    const paragraphs = [];

    // Professional structure: Hook → Value → Action
    if (sentences.length >= 3) {
      // Opening hook (1-2 sentences)
      const hookSize = Math.min(2, Math.ceil(sentences.length / 3));
      paragraphs.push(sentences.slice(0, hookSize).join(' '));

      // Main value content (middle sentences)
      const mainStart = hookSize;
      const mainEnd = sentences.length - 1;

      if (mainEnd > mainStart) {
        const mainSentences = sentences.slice(mainStart, mainEnd);
        // Group main content into logical paragraphs (smaller groups for LinkedIn)
        const mainParagraphs = this.groupSentences(mainSentences, 2);
        paragraphs.push(...mainParagraphs);
      }

      // Call to action / conclusion (last sentence)
      if (sentences.length > 1) {
        paragraphs.push(sentences[sentences.length - 1]);
      }
    }

    return paragraphs.filter(p => p.trim().length > 0).join('\n\n');
  }

  /**
   * Group sentences into paragraphs
   */
  private static groupSentences(sentences: string[], maxPerGroup: number = 2): string[] {
    const groups = [];
    
    for (let i = 0; i < sentences.length; i += maxPerGroup) {
      const group = sentences.slice(i, i + maxPerGroup).join(' ');
      if (group.trim().length > 0) {
        groups.push(group);
      }
    }
    
    return groups;
  }

  /**
   * Add professional call-to-action for LinkedIn
   */
  static addLinkedInCallToAction(content: string, type: 'question' | 'engagement' | 'connection' = 'question'): string {
    const callToActions = {
      question: [
        "What's your experience with this?",
        "How do you approach this in your organization?",
        "What are your thoughts on this topic?",
        "Have you encountered similar challenges?",
        "What strategies have worked for you?"
      ],
      engagement: [
        "Share your thoughts in the comments below.",
        "I'd love to hear your perspective on this.",
        "Let's discuss this in the comments.",
        "What would you add to this list?",
        "Drop a comment with your insights."
      ],
      connection: [
        "Connect with me to continue the conversation.",
        "Follow for more insights like this.",
        "Let's connect and share ideas.",
        "Repost if you found this valuable.",
        "Save this post for future reference."
      ]
    };
    
    const options = callToActions[type];
    const randomCTA = options[Math.floor(Math.random() * options.length)];
    
    // Add CTA as a separate paragraph if not already present
    if (!content.toLowerCase().includes('what') && !content.includes('?')) {
      return `${content}\n\n${randomCTA}`;
    }
    
    return content;
  }

  /**
   * Validate content formatting for platform
   */
  static validateFormatting(content: string, platform: 'twitter' | 'instagram' | 'linkedin'): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check for proper paragraph structure
    if (platform === 'linkedin' && !content.includes('\n\n')) {
      issues.push('LinkedIn content should have paragraph breaks for readability');
      suggestions.push('Add double line breaks (\\n\\n) between main points');
    }
    
    // Check character limits
    const limits = { twitter: 280, instagram: 2200, linkedin: 3000 };
    if (content.length > limits[platform]) {
      issues.push(`Content exceeds ${platform} character limit (${limits[platform]})`);
      suggestions.push('Consider shortening the content or splitting into multiple posts');
    }
    
    // Check for engagement elements
    if (platform === 'linkedin' && !content.includes('?') && !content.toLowerCase().includes('share')) {
      suggestions.push('Consider adding a question or call-to-action to encourage engagement');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}