export interface DocumentationSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  articles: DocumentationArticle[];
  order: number;
  isVisible: boolean;
}

export interface DocumentationArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  difficulty: 'Anfänger' | 'Fortgeschritten' | 'Experte';
  lastUpdated: string;
  readTime: string;
  type: 'guide' | 'tutorial' | 'reference' | 'faq' | 'video';
  author?: string;
  version?: string;
  prerequisites?: string[];
  relatedArticles?: string[];
  attachments?: DocumentationAttachment[];
  metadata?: ArticleMetadata;
}

export interface DocumentationAttachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'download';
  url: string;
  size?: number;
  description?: string;
}

export interface ArticleMetadata {
  views: number;
  likes: number;
  shares: number;
  lastViewed?: string;
  bookmarked?: boolean;
  completionRate?: number;
}

export interface SearchResult {
  sectionId: string;
  sectionTitle: string;
  article: DocumentationArticle;
  score: number;
  snippets: string[];
  highlightedTitle?: string;
}

export interface DocumentationFeedback {
  articleId: string;
  userId: string;
  rating: number; // 1-5 stars
  feedback: string;
  helpful: boolean;
  timestamp: string;
  category?: 'content' | 'clarity' | 'accuracy' | 'completeness';
}

export interface DocumentationAnalytics {
  articleId: string;
  views: number;
  avgTimeSpent: number;
  bounceRate: number;
  completionRate: number;
  searchRank: number;
  popularSearchTerms: string[];
  userFlow: string[];
}

export interface DocumentationSettings {
  defaultDifficulty: 'Anfänger' | 'Fortgeschritten' | 'Experte';
  preferredContentTypes: ('guide' | 'tutorial' | 'reference' | 'faq' | 'video')[];
  showEstimatedReadTime: boolean;
  enableOfflineMode: boolean;
  bookmarkLimit: number;
  searchResultsPerPage: number;
  enableFeedback: boolean;
  enableAnalytics: boolean;
}

export interface DocumentationNavigation {
  currentSection?: string;
  currentArticle?: string;
  breadcrumbs: NavigationItem[];
  previousArticle?: NavigationItem;
  nextArticle?: NavigationItem;
  relatedArticles: NavigationItem[];
}

export interface NavigationItem {
  id: string;
  title: string;
  url: string;
  type: 'section' | 'article';
}

export interface DocumentationBookmark {
  id: string;
  userId: string;
  articleId: string;
  sectionId: string;
  title: string;
  timestamp: string;
  notes?: string;
  tags?: string[];
}

export interface DocumentationExport {
  format: 'pdf' | 'html' | 'markdown' | 'json';
  includeImages: boolean;
  includeTOC: boolean;
  sections?: string[];
  articles?: string[];
  filename?: string;
}

export interface DocumentationProgress {
  userId: string;
  articleId: string;
  sectionId: string;
  progress: number; // 0-100%
  timeSpent: number; // in seconds
  completed: boolean;
  lastAccessed: string;
  bookmarked: boolean;
  notes?: string;
}

export interface DocumentationTemplate {
  id: string;
  name: string;
  description: string;
  structure: TemplateSection[];
  defaultValues: Record<string, unknown>;
  // TODO: narrow template defaults with a specific schema if available
  version: string;
  author: string;
  created: string;
}

export interface TemplateSection {
  id: string;
  title: string;
  type: 'text' | 'image' | 'video' | 'code' | 'list' | 'table';
  required: boolean;
  placeholder?: string;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern';
  value?: unknown;
  // Using unknown would be ideal, but validators often accept mixed types
  message: string;
}

export interface DocumentationComment {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  parentId?: string; // for replies
  likes: number;
  status: 'pending' | 'approved' | 'rejected';
  isAuthorResponse?: boolean;
}

export interface DocumentationNotification {
  id: string;
  userId: string;
  type: 'article_updated' | 'new_article' | 'comment_reply' | 'feedback_response';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  // Consider a specific metadata shape when stabilized
}

export interface DocumentationVersion {
  id: string;
  articleId: string;
  version: string;
  content: string;
  changes: string[];
  author: string;
  timestamp: string;
  published: boolean;
}

export interface DocumentationCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  parent?: string;
  order: number;
  isVisible: boolean;
}

export interface DocumentationTag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  count: number;
  category?: string;
}

export interface DocumentationWidget {
  id: string;
  type: 'search' | 'popular' | 'recent' | 'bookmarks' | 'progress';
  title: string;
  config: Record<string, unknown>;
  // Widget configs vary by widget type; could union this later
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  visible: boolean;
}

export interface DocumentationTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
    code: string;
  };
  layout: {
    maxWidth: string;
    sidebarWidth: string;
    contentPadding: string;
  };
}
