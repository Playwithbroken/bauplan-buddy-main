import { DocumentationArticle, DocumentationSection, SearchResult } from '@/types/documentation';

interface DocumentationMetrics {
  totalArticles: number;
  totalSections: number;
  lastUpdated: string;
  popularArticles: string[];
  searchQueries: string[];
}

interface DocumentationFeedback {
  articleId: string;
  userId: string;
  rating: number;
  feedback: string;
  helpful: boolean;
  timestamp: string;
}

export class DocumentationService {
  private static readonly STORAGE_KEY = 'bauplan-buddy-documentation';
  private static readonly FEEDBACK_KEY = 'bauplan-buddy-doc-feedback';
  private static readonly METRICS_KEY = 'bauplan-buddy-doc-metrics';
  private static readonly SEARCH_HISTORY_KEY = 'bauplan-buddy-search-history';

  /**
   * Get all documentation sections with their articles
   */
  static getAllSections(): DocumentationSection[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return this.getDefaultSections();
    } catch (error) {
      console.error('Error loading documentation:', error);
      return this.getDefaultSections();
    }
  }

  /**
   * Get a specific section by ID
   */
  static getSection(sectionId: string): DocumentationSection | null {
    const sections = this.getAllSections();
    return sections.find(section => section.id === sectionId) || null;
  }

  /**
   * Get a specific article by section and article ID
   */
  static getArticle(sectionId: string, articleId: string): DocumentationArticle | null {
    const section = this.getSection(sectionId);
    if (!section) return null;
    
    return section.articles.find(article => article.id === articleId) || null;
  }

  /**
   * Search articles across all sections
   */
  static searchArticles(query: string): SearchResult[] {
    if (!query.trim()) return [];

    // Track search query
    this.trackSearch(query);

    const sections = this.getAllSections();
    const results: SearchResult[] = [];

    sections.forEach(section => {
      section.articles.forEach(article => {
        const titleMatch = article.title.toLowerCase().includes(query.toLowerCase());
        const contentMatch = article.content.toLowerCase().includes(query.toLowerCase());
        const tagMatch = article.tags.some(tag => 
          tag.toLowerCase().includes(query.toLowerCase())
        );

        if (titleMatch || contentMatch || tagMatch) {
          // Calculate relevance score
          let score = 0;
          if (titleMatch) score += 10;
          if (contentMatch) score += 5;
          if (tagMatch) score += 3;

          // Find matching snippets
          const snippets = this.findContentSnippets(article.content, query);

          results.push({
            sectionId: section.id,
            sectionTitle: section.title,
            article,
            score,
            snippets
          });
        }
      });
    });

    // Sort by relevance score
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Get popular articles based on view count and ratings
   */
  static getPopularArticles(limit: number = 5): DocumentationArticle[] {
    const metrics = this.getMetrics();
    const sections = this.getAllSections();
    const articles: DocumentationArticle[] = [];

    sections.forEach(section => {
      articles.push(...section.articles);
    });

    return articles
      .filter(article => metrics.popularArticles.includes(article.id))
      .slice(0, limit);
  }

  /**
   * Get recently updated articles
   */
  static getRecentlyUpdated(limit: number = 5): DocumentationArticle[] {
    const sections = this.getAllSections();
    const articles: DocumentationArticle[] = [];

    sections.forEach(section => {
      articles.push(...section.articles);
    });

    return articles
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, limit);
  }

  /**
   * Submit feedback for an article
   */
  static submitFeedback(feedback: Omit<DocumentationFeedback, 'timestamp'>): void {
    try {
      const feedbackList = this.getFeedback();
      const newFeedback: DocumentationFeedback = {
        ...feedback,
        timestamp: new Date().toISOString()
      };

      feedbackList.push(newFeedback);
      localStorage.setItem(this.FEEDBACK_KEY, JSON.stringify(feedbackList));

      // Update metrics
      this.updateMetrics(feedback.articleId, 'feedback');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  }

  /**
   * Get feedback for an article
   */
  static getArticleFeedback(articleId: string): DocumentationFeedback[] {
    const feedbackList = this.getFeedback();
    return feedbackList.filter(feedback => feedback.articleId === articleId);
  }

  /**
   * Track article view
   */
  static trackArticleView(articleId: string): void {
    this.updateMetrics(articleId, 'view');
  }

  /**
   * Get article analytics
   */
  static getArticleAnalytics(articleId: string) {
    const feedback = this.getArticleFeedback(articleId);
    const avgRating = feedback.length > 0 
      ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
      : 0;
    
    const helpfulCount = feedback.filter(f => f.helpful).length;
    const totalFeedback = feedback.length;

    return {
      avgRating,
      helpfulCount,
      totalFeedback,
      helpfulPercentage: totalFeedback > 0 ? (helpfulCount / totalFeedback) * 100 : 0
    };
  }

  /**
   * Get suggested articles based on current article
   */
  static getSuggestedArticles(currentArticleId: string, sectionId: string): DocumentationArticle[] {
    const section = this.getSection(sectionId);
    if (!section) return [];

    const currentArticle = section.articles.find(a => a.id === currentArticleId);
    if (!currentArticle) return [];

    const sections = this.getAllSections();
    const allArticles: DocumentationArticle[] = [];

    sections.forEach(s => {
      allArticles.push(...s.articles);
    });

    // Find articles with similar tags or difficulty level
    return allArticles
      .filter(article => 
        article.id !== currentArticleId &&
        (article.difficulty === currentArticle.difficulty ||
         article.tags.some(tag => currentArticle.tags.includes(tag)))
      )
      .slice(0, 3);
  }

  /**
   * Export documentation for offline use
   */
  static exportDocumentation(): string {
    const sections = this.getAllSections();
    const metrics = this.getMetrics();
    
    return JSON.stringify({
      sections,
      metrics,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  /**
   * Get documentation metrics
   */
  static getMetrics(): DocumentationMetrics {
    try {
      const stored = localStorage.getItem(this.METRICS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return this.getDefaultMetrics();
    } catch (error) {
      console.error('Error loading metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  // Private helper methods

  private static getDefaultSections(): DocumentationSection[] {
    return []; // This would be populated with default documentation
  }

  private static getDefaultMetrics(): DocumentationMetrics {
    return {
      totalArticles: 0,
      totalSections: 0,
      lastUpdated: new Date().toISOString(),
      popularArticles: [],
      searchQueries: []
    };
  }

  private static getFeedback(): DocumentationFeedback[] {
    try {
      const stored = localStorage.getItem(this.FEEDBACK_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading feedback:', error);
      return [];
    }
  }

  private static trackSearch(query: string): void {
    try {
      const searches = this.getSearchHistory();
      searches.unshift({
        query,
        timestamp: new Date().toISOString()
      });

      // Keep only last 100 searches
      const limitedSearches = searches.slice(0, 100);
      localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(limitedSearches));
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  private static getSearchHistory(): Array<{query: string, timestamp: string}> {
    try {
      const stored = localStorage.getItem(this.SEARCH_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading search history:', error);
      return [];
    }
  }

  private static updateMetrics(articleId: string, action: 'view' | 'feedback'): void {
    try {
      const metrics = this.getMetrics();
      
      if (action === 'view') {
        if (!metrics.popularArticles.includes(articleId)) {
          metrics.popularArticles.push(articleId);
        }
      }

      metrics.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.METRICS_KEY, JSON.stringify(metrics));
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  }

  private static findContentSnippets(content: string, query: string): string[] {
    const words = content.split(' ');
    const queryLower = query.toLowerCase();
    const snippets: string[] = [];

    for (let i = 0; i < words.length; i++) {
      if (words[i].toLowerCase().includes(queryLower)) {
        const start = Math.max(0, i - 5);
        const end = Math.min(words.length, i + 6);
        const snippet = words.slice(start, end).join(' ');
        snippets.push(snippet);
      }
    }

    return snippets.slice(0, 3); // Return up to 3 snippets
  }
}