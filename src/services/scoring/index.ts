/**
 * Project Scoring Services
 * Comprehensive AI-powered project evaluation system
 */

export { ProjectScoringService } from './ProjectScoringService';
export { ProjectScoringFramework, SCORING_CRITERIA, SKILL_LEVEL_DEFINITIONS } from './ProjectScoringFramework';
export { 
  generateCraftSpecificPrompt, 
  getCraftSafetyConsiderations, 
  getCraftQualityIndicators 
} from './ScoringPromptTemplates';

export type {
  ProjectScoringRequest,
  ProjectScoringResult,
  SkillProgressionEntry
} from '../../shared/types';

// Re-export commonly used types
export type { SkillLevel, CraftSpecialization, DifficultyLevel } from '../../shared/types'; 