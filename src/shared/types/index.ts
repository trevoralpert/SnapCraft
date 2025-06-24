// Core SnapCraft Types
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
}

export interface CraftPost {
  id: string;
  userId: string;
  author: Pick<User, 'id' | 'displayName' | 'avatar'>;
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
  isEphemeral: boolean;
  expiresAt?: Date;
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