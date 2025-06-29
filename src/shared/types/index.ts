// Core SnapCraft Types
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  craftSpecialization: CraftSpecialization[];
  skillLevel: SkillLevel;
  toolInventory: Tool[];
  joinedAt: Date;
  location?: string;
  bio?: string;
  // Onboarding tracking - Phase 5: Task 5.1
  onboarding?: {
    completed: boolean;
    completedAt?: Date;
    currentStep?: number; // For resuming if interrupted (0-4)
    stepsCompleted?: OnboardingStep[]; // Track which steps were completed
  };
  // Tutorial Progress tracking - Phase 5: Task 5.2
  tutorialProgress?: { [tutorialId: string]: TutorialProgress };
  // First Project Assistance tracking - Phase 5: Task 5.3
  firstProjectGuidance?: FirstProjectGuidance;
  // Project Scoring Calculated Fields
  scoring?: {
    averageProjectScore: number; // 0-100 average of all project scores
    calculatedSkillLevel: SkillLevel; // AI-calculated skill level based on projects
    projectCount: number; // Total number of scored projects
    skillProgression: SkillProgressionEntry[]; // Historical skill level changes
    lastScoreUpdate: Date; // When skill calculations were last updated
  };
}

export interface CraftPost {
  id: string;
  userId: string;
  author: {
    id: string;
    displayName: string;
    avatar?: string;
  };
  content: {
    description: string;
    images: string[];
    videos?: string[];
    materials: string[];
    timeSpent: number; // minutes
    difficulty: DifficultyLevel;
  };
  craftType: CraftSpecialization;
  techniques: string[];
  tags: string[];
  location?: GeoLocation;
  createdAt: Date;
  updatedAt: Date;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  // Social Features - Task 4.1: Post Interaction System
  likedBy?: string[]; // Array of user IDs who liked this post
  commentedBy?: string[]; // Array of user IDs who commented on this post
  sharedBy?: string[]; // Array of user IDs who shared this post
  savedBy?: string[]; // Array of user IDs who saved this post
  // Social Features - Task 4.2: Commenting System
  comments?: Comment[]; // Array of comments for this post
  commentCount?: number; // Total number of comments (including replies)
  isEphemeral: boolean;
  expiresAt?: Date;
  // Project Scoring Fields
  scoring?: {
    individualSkillScore: number; // 0-100 overall project score
    skillLevelCategory: SkillLevel; // AI-determined skill level for this project
    scoringCriteria: {
      technicalExecution: number; // 0-100 (40% weight)
      documentationCompleteness: number; // 0-100 (30% weight)
      toolUsageAppropriateness: number; // 0-100 (15% weight)
      safetyAdherence: number; // 0-100 (10% weight)
      innovationCreativity: number; // 0-100 (5% weight)
    };
    documentationCompleteness: number; // 0-100 percentage
    aiScoringMetadata: {
      confidence: number; // 0-1 AI confidence in scoring
      modelVersion: string; // AI model version used
      scoredAt: Date; // When scoring was performed
      reviewRequired: boolean; // Whether human review is needed
      reviewReason?: string; // Reason for human review flag
    };
  };
}

export interface Comment {
  id: string;
  postId: string; // ID of the post this comment belongs to
  userId: string; // ID of the user who made the comment
  author: {
    id: string;
    displayName: string;
    avatar?: string;
  };
  content: {
    text: string; // The comment text (max 500 characters)
    mentions?: string[]; // Array of user IDs mentioned in the comment
    hashtags?: string[]; // Array of hashtags in the comment
  };
  createdAt: Date;
  updatedAt: Date;
  // Reply functionality
  parentCommentId?: string; // If this is a reply, ID of the parent comment
  replies?: Comment[]; // Array of replies to this comment
  replyCount: number; // Number of direct replies
  // Engagement
  engagement: {
    likes: number;
    replies: number;
  };
  likedBy?: string[]; // Array of user IDs who liked this comment
  // Moderation
  isDeleted: boolean; // Soft delete flag
  isHidden: boolean; // Hidden by moderation
  isEdited: boolean; // Whether the comment has been edited
  editHistory?: CommentEdit[]; // History of edits
  moderationFlags?: ModerationFlag[]; // Moderation flags
  // Threading depth (to prevent infinite nesting)
  depth: number; // 0 = top-level comment, 1 = first reply, etc. (max 3)
}

export interface CommentEdit {
  editedAt: Date;
  previousText: string;
  editReason?: string;
}

export interface ModerationFlag {
  id: string;
  flaggedBy: string; // User ID who flagged
  reason: ModerationReason;
  flaggedAt: Date;
  status: 'pending' | 'reviewed' | 'dismissed';
  reviewedBy?: string; // Moderator user ID
  reviewedAt?: Date;
  reviewNotes?: string;
}

export type ModerationReason = 
  | 'spam'
  | 'harassment'
  | 'inappropriate'
  | 'offensive'
  | 'misinformation'
  | 'copyright'
  | 'other';

export interface CommentInput {
  postId: string;
  text: string;
  parentCommentId?: string; // For replies
  mentions?: string[]; // User IDs mentioned
}

export interface CommentThread {
  topLevelComment: Comment;
  replies: Comment[];
  totalReplies: number;
  hasMoreReplies: boolean;
}

export interface CommentAnalytics {
  postId: string;
  totalComments: number;
  totalReplies: number;
  topCommenters: { userId: string; displayName: string; commentCount: number }[];
  engagementRate: number; // Comments per post view
  averageCommentLength: number;
  sentimentAnalysis?: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface CraftStory {
  id: string;
  userId: string;
  author: {
    id: string;
    displayName: string;
    avatar?: string;
  };
  content: {
    imageUrl?: string;
    videoUrl?: string;
    text?: string;
    backgroundColor?: string;
    thumbnailUrl?: string; // Thumbnail for video stories
  };
  craftType?: CraftSpecialization;
  createdAt: Date;
  expiresAt: Date; // 24 hours from creation
  views: StoryView[];
  isActive: boolean; // false if expired or manually deleted
}

export interface StoryView {
  userId: string;
  viewedAt: string; // ISO string
  lastViewedAt?: string; // ISO string for replays
  watchDuration: number; // seconds
  completed: boolean;
  replayed: boolean;
  viewCount: number; // number of times this user viewed the story
}

export interface StoryAnalytics {
  storyId: string;
  totalViews: number;
  uniqueViewers: number;
  totalReplays: number;
  completedViews: number;
  completionRate: number; // percentage
  averageWatchDuration: number; // seconds
  views: StoryViewWithUser[];
  createdAt: Date;
  expiresAt: Date;
}

export interface StoryViewWithUser extends StoryView {
  displayName: string;
  avatar?: string;
}

export interface StoryViewersList {
  storyId: string;
  totalViewers: number;
  totalViews: number;
  viewers: StoryViewWithUser[];
}

export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  brand?: string;
  condition: ToolCondition;
  acquiredDate: Date;
  notes?: string;
  image?: string;
  isShared: boolean; // Can other users see this tool
  // Enhanced Tool Management - Task 2.6
  usageTracking?: {
    totalUsageCount: number; // Total times used in projects
    lastUsedDate?: Date; // Last time used in a project
    projectsUsedIn: string[]; // Array of project IDs where this tool was used
    averageUsagePerMonth: number; // Calculated usage frequency
    craftTypesUsedFor: CraftSpecialization[]; // What craft types this tool has been used for
  };
  recommendations?: {
    recommendedForCraftTypes: CraftSpecialization[]; // What craft types this tool is recommended for
    skillLevelRecommendation: SkillLevel[]; // What skill levels should use this tool
    complementaryTools: string[]; // Tool IDs that work well with this tool
    projectTypes: string[]; // Types of projects this tool is good for
  };
  maintenance?: {
    lastMaintenanceDate?: Date;
    nextMaintenanceDate?: Date;
    maintenanceReminders: MaintenanceReminder[];
    maintenanceHistory: MaintenanceRecord[];
  };
}

export interface MaintenanceReminder {
  id: string;
  type: 'cleaning' | 'sharpening' | 'calibration' | 'replacement' | 'inspection';
  description: string;
  dueDate: Date;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface MaintenanceRecord {
  id: string;
  type: 'cleaning' | 'sharpening' | 'calibration' | 'replacement' | 'inspection' | 'repair';
  description: string;
  performedDate: Date;
  cost?: number;
  notes?: string;
  nextMaintenanceDue?: Date;
}

export interface Skill {
  id: string;
  name: string;
  category: CraftSpecialization;
  level: SkillLevel;
  xpPoints: number;
  achievements: Achievement[];
  lastPracticed?: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'legendary';
}

export interface SkillProgressionEntry {
  skillLevel: SkillLevel;
  averageScore: number; // 0-100 score that triggered this level
  achievedAt: Date;
  projectCount: number; // Number of projects at time of level change
  triggerProjectId?: string; // ID of project that triggered the level change
}

// Project Scoring Types
export interface ProjectScoringRequest {
  projectId: string;
  userId: string;
  craftType: CraftSpecialization;
  imageUrls?: string[];
  description: string;
  materials?: string[];
  toolsUsed?: string[];
  timeSpent?: number;
  userSkillLevel?: SkillLevel;
  userProfile?: {
    bio?: string;
    craftSpecialization?: CraftSpecialization[];
  };
}

export interface ProjectScoringResult {
  scoringId: string;
  projectId: string;
  individualSkillScore: number;
  skillLevelCategory: SkillLevel;
  scoringCriteria: {
    technicalExecution: {
      score: number;
      weight: number;
      feedback: string;
      confidence: number;
    };
    documentationCompleteness: {
      score: number;
      weight: number;
      feedback: string;
      confidence: number;
    };
    toolUsageAppropriateness: {
      score: number;
      weight: number;
      feedback: string;
      confidence: number;
    };
    safetyAdherence: {
      score: number;
      weight: number;
      feedback: string;
      confidence: number;
    };
    innovationCreativity: {
      score: number;
      weight: number;
      feedback: string;
      confidence: number;
    };
  };
  overallFeedback: string;
  strengths: string[];
  improvementAreas: string[];
  nextStepSuggestions: string[];
  aiScoringMetadata: {
    modelVersion: string;
    confidence: number;
    processingTime: number;
    timestamp: string;
    needsHumanReview: boolean;
    reviewReason?: string;
    craftTypeSpecific: {
      craftType: CraftSpecialization;
      evaluationFocus: string[];
      commonChallenges: string[];
    };
    documentationAnalysis: {
      hasBeforePhotos: boolean;
      hasProcessPhotos: boolean;
      hasAfterPhotos: boolean;
      hasDescription: boolean;
      hasMaterialsList: boolean;
      hasToolsList: boolean;
      hasTimeTracking: boolean;
      hasChallengesNoted: boolean;
    };
  };
}

// Legacy types for backward compatibility
export interface ProjectScoringRequestLegacy {
  postId: string;
  userId: string;
  craftType: CraftSpecialization;
  images: string[];
  description: string;
  materials: string[];
  techniques: string[];
  timeSpent: number;
  difficulty: DifficultyLevel;
}

export interface ProjectScoringResultLegacy {
  postId: string;
  scoring: {
    individualSkillScore: number;
    skillLevelCategory: SkillLevel;
    scoringCriteria: {
      technicalExecution: number;
      documentationCompleteness: number;
      toolUsageAppropriateness: number;
      safetyAdherence: number;
      innovationCreativity: number;
    };
    documentationCompleteness: number;
    aiScoringMetadata: {
      confidence: number;
      modelVersion: string;
      scoredAt: Date;
      reviewRequired: boolean;
      reviewReason?: string;
    };
  };
  feedback?: {
    strengths: string[];
    improvementAreas: string[];
    nextSteps: string[];
    skillSpecificTips: string[];
  };
}

export interface SkillLevelThresholds {
  novice: { min: 0; max: 20 };
  apprentice: { min: 21; max: 40 };
  journeyman: { min: 41; max: 60 };
  craftsman: { min: 61; max: 80 };
  master: { min: 81; max: 100 };
}

// Enums
export type CraftSpecialization = 
  | 'woodworking'
  | 'metalworking'
  | 'leathercraft'
  | 'pottery'
  | 'weaving'
  | 'blacksmithing'
  | 'bushcraft'
  | 'stonemasonry'
  | 'glassblowing'
  | 'jewelry'
  | 'general';

export type SkillLevel = 
  | 'novice'
  | 'apprentice'
  | 'journeyman'
  | 'craftsman'
  | 'master';

export type DifficultyLevel = 
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert';

export type ToolCategory = 
  | 'hand-tools'
  | 'power-tools'
  | 'measuring'
  | 'safety'
  | 'finishing'
  | 'specialized';

export type ToolCondition = 
  | 'excellent'
  | 'good'
  | 'fair'
  | 'needs-repair';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// RAG Types
export interface KnowledgeQuery {
  query: string;
  craftType?: CraftSpecialization;
  context?: string;
  userSkillLevel?: SkillLevel;
}

export interface KnowledgeResponse {
  answer: string;
  sources: KnowledgeSource[];
  confidence: number;
  relatedTopics: string[];
}

export interface KnowledgeSource {
  title: string;
  snippet: string;
  url?: string;
  type: 'tutorial' | 'reference' | 'community';
  relevanceScore: number;
}

// Vision AI Types
export * from './vision';

export interface ToolRecommendation {
  toolId: string;
  toolName: string;
  category: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  craftType: CraftSpecialization;
  estimatedCost?: number;
  alternatives?: string[];
}

export interface ToolAnalytics {
  totalTools: number;
  mostUsedTools: { tool: Tool; usageCount: number }[];
  leastUsedTools: { tool: Tool; daysSinceLastUse: number }[];
  toolsByCategory: { category: string; count: number }[];
  maintenanceOverdue: Tool[];
  usageByMonth: { month: string; usageCount: number }[];
  recommendedTools: ToolRecommendation[];
  // Task 2.7: Enhanced Tool Inventory Analytics
  identificationAccuracy: {
    totalIdentifications: number;
    correctIdentifications: number;
    accuracyRate: number;
    averageConfidence: number;
    highConfidenceTools: { toolName: string; confidence: number }[];
    lowConfidenceTools: { toolName: string; confidence: number }[];
  };
  usagePatterns: {
    mostFrequentCombinations: { tools: string[]; usageCount: number }[];
    craftTypeDistribution: { craftType: CraftSpecialization; usageCount: number }[];
    seasonalTrends: { period: string; toolsUsed: number }[];
    efficiencyMetrics: { avgToolsPerProject: number; toolUtilizationRate: number };
  };
  missingToolsAnalysis: {
    suggestedForCraftTypes: { craftType: CraftSpecialization; missingTools: string[] }[];
    projectScoringInsights: { toolName: string; impactOnScore: number; frequency: number }[];
    gapAnalysis: { category: string; recommendedCount: number; currentCount: number }[];
  };
}

// Phase 5: Onboarding System Types
export interface OnboardingStep {
  id: number;
  name: string;
  completed: boolean;
  completedAt?: Date;
}

export interface OnboardingData {
  selectedCraftSpecializations?: CraftSpecialization[];
  cameraPermissionGranted?: boolean;
  hasSeenToolIntro?: boolean;
  hasSeenFirstProjectTip?: boolean;
}

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  stepsCompleted: OnboardingStep[];
  data: OnboardingData;
  canSkip: boolean;
}

export type OnboardingStepType = 
  | 'welcome'
  | 'craft-selection'
  | 'camera-permissions'
  | 'tool-introduction'
  | 'first-project-guidance';

// Tutorial System Types
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  type: 'camera' | 'tool-identification' | 'documentation' | 'vision-mode';
  completed: boolean;
  completedAt?: Date;
  duration?: number; // in seconds
  interactionRequired?: boolean;
  highlightElement?: string; // CSS selector or component identifier
}

export interface Tutorial {
  id: string;
  name: string;
  description: string;
  category: 'camera' | 'tools' | 'documentation' | 'general';
  steps: TutorialStep[];
  estimatedDuration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[]; // Other tutorial IDs
  isRequired: boolean; // Required for onboarding vs optional
}

export interface TutorialProgress {
  tutorialId: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  currentStepId?: string;
  completedSteps: string[];
  timeSpent: number; // in seconds
  skipped: boolean;
}

export interface TutorialData {
  availableTutorials: Tutorial[];
  userProgress: { [tutorialId: string]: TutorialProgress };
  completedTutorials: string[];
  recommendedTutorials: string[];
}

// First Project Assistance Types - Phase 5: Task 5.3
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  craftType: CraftSpecialization;
  skillLevel: SkillLevel;
  estimatedTime: number; // in minutes
  difficulty: DifficultyLevel;
  materials: string[];
  tools: string[];
  steps: ProjectStep[];
  tips: string[];
  imageUrl?: string;
  isPopular: boolean;
  completionRate: number; // percentage of users who complete this template
}

export interface ProjectStep {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  tips: string[];
  estimatedTime: number; // in minutes
  photoRequired: boolean;
  safetyNotes?: string[];
  commonMistakes?: string[];
  successCriteria: string[];
}

export interface FirstProjectGuidance {
  userId: string;
  selectedTemplate?: ProjectTemplate;
  currentStep: number;
  completedSteps: string[];
  startedAt: Date;
  completedAt?: Date;
  projectId?: string; // Link to actual created project
  guidanceNotes: string[];
  userFeedback?: {
    difficulty: 'too-easy' | 'just-right' | 'too-hard';
    helpfulness: number; // 1-5 rating
    suggestions?: string;
  };
}

export interface ProjectAssistanceData {
  templates: ProjectTemplate[];
  userGuidance: { [userId: string]: FirstProjectGuidance };
  completionStats: {
    totalUsers: number;
    completedFirstProject: number;
    averageCompletionTime: number; // in hours
    popularTemplates: { templateId: string; completions: number }[];
  };
} 