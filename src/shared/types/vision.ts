export enum VisionMode {
  ANALYZE_PROJECT = 'analyze_project',
  IDENTIFY_TOOLS = 'identify_tools',
  REVERSE_ENGINEER = 'reverse_engineer',
  ASSESS_SKILL = 'assess_skill',
  SAFETY_CHECK = 'safety_check'
}

export interface VisionModeConfig {
  id: VisionMode;
  name: string;
  icon: string;
  description: string;
  promptTemplate: string;
  quickQuestions: string[];
  color: string;
  isAvailable: boolean; // For phased rollout
  badge?: string; // Optional badge text like "NEW" or "BETA"
}

export interface VisionAnalysisResult {
  mode: VisionMode;
  photoUri: string;
  analysis: VisionModeAnalysis;
  confidence: number;
  timestamp: Date;
  processingTime: number;
  queryId: string;
  relatedModes?: VisionMode[];
  knowledgeBase?: any[]; // RAG knowledge sources used
}

// Mode-specific analysis interfaces
export interface ProjectAnalysis {
  mainAnalysis: string;
  detectedCraft: string[];
  identifiedTechniques: string[];
  suggestedImprovements: string[];
  skillLevelAssessment: string;
  followUpQuestions: string[];
}

export interface ToolAnalysis {
  identifiedTools: Array<{
    name: string;
    confidence: number;
    category: string;
    usage: string;
  }>;
  missingTools: string[];
  recommendations: string[];
  safetyNotes: string[];
}

export interface ReverseEngineerAnalysis {
  projectType: string;
  estimatedSteps: Array<{
    step: number;
    description: string;
    tools: string[];
    materials: string[];
    techniques: string[];
  }>;
  difficulty: string;
  timeEstimate: string;
  prerequisites: string[];
}

export interface SkillAssessment {
  overallSkillLevel: string;
  techniqueProficiency: Array<{
    technique: string;
    level: string;
    feedback: string;
  }>;
  strengthAreas: string[];
  improvementAreas: string[];
  nextSteps: string[];
}

export interface SafetyAnalysis {
  safetyRating: string;
  identifiedHazards: Array<{
    hazard: string;
    severity: string;
    mitigation: string;
  }>;
  missingPPE: string[];
  environmentalConcerns: string[];
  recommendations: string[];
}

// Union type for all analysis types
export type VisionModeAnalysis = 
  | ProjectAnalysis 
  | ToolAnalysis 
  | ReverseEngineerAnalysis 
  | SkillAssessment 
  | SafetyAnalysis;

// Vision preferences for user settings
export interface VisionPreferences {
  defaultMode: VisionMode;
  enabledModes: VisionMode[];
  autoSuggestions: boolean;
  saveAnalyses: boolean;
  showConfidence: boolean;
  enableCrossMode: boolean; // Allow suggestions for other modes
}

// Camera integration props
export interface VisionCameraProps {
  initialVisionMode?: VisionMode;
  enableVisionModes?: boolean;
  onAnalysisComplete?: (result: VisionAnalysisResult) => void;
  onModeChange?: (mode: VisionMode) => void;
}

// Storage interface for saved vision photos
export interface StoredVisionPhoto {
  id: string;
  uri: string;
  timestamp: Date;
  analyses: VisionAnalysisResult[];
  tags: string[];
  userId: string;
  thumbnail?: string;
  metadata: {
    width: number;
    height: number;
    fileSize: number;
  };
} 