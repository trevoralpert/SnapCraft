import { SkillLevel, CraftSpecialization } from '../../shared/types';

/**
 * Project Scoring Framework
 * Defines skill level categories, scoring criteria, and weighted algorithms
 */

// 5-Tier Skill Level Categories (aligned with existing User Profile levels)
export const SKILL_LEVEL_DEFINITIONS: Record<SkillLevel, {
  description: string;
  scoreRange: { min: number; max: number };
  characteristics: string[];
  expectedCapabilities: string[];
}> = {
  novice: {
    description: "Beginning crafter learning fundamental skills",
    scoreRange: { min: 0, max: 20 },
    characteristics: [
      "Learning basic tools and techniques",
      "Following simple instructions",
      "Focus on safety and proper form",
      "Building foundational knowledge"
    ],
    expectedCapabilities: [
      "Can identify basic tools",
      "Understands safety protocols",
      "Follows step-by-step instructions",
      "Produces simple functional items"
    ]
  },
  apprentice: {
    description: "Developing crafter with growing confidence",
    scoreRange: { min: 21, max: 40 },
    characteristics: [
      "Comfortable with basic techniques",
      "Beginning to understand material properties",
      "Can complete projects with minimal guidance",
      "Starting to troubleshoot problems"
    ],
    expectedCapabilities: [
      "Uses tools confidently and safely",
      "Adapts techniques to different materials",
      "Plans simple projects independently",
      "Recognizes and corrects basic mistakes"
    ]
  },
  journeyman: {
    description: "Competent crafter with solid technical skills",
    scoreRange: { min: 41, max: 60 },
    characteristics: [
      "Proficient in multiple techniques",
      "Good understanding of materials and processes",
      "Can design and execute original projects",
      "Shares knowledge with others"
    ],
    expectedCapabilities: [
      "Masters intermediate techniques",
      "Combines multiple skills in projects",
      "Teaches basic skills to others",
      "Innovates within established methods"
    ]
  },
  craftsman: {
    description: "Skilled artisan with advanced expertise",
    scoreRange: { min: 61, max: 80 },
    characteristics: [
      "Expert in specialized techniques",
      "Deep understanding of craft principles",
      "Creates complex, high-quality work",
      "Mentors other crafters"
    ],
    expectedCapabilities: [
      "Executes advanced techniques flawlessly",
      "Develops new approaches to problems",
      "Creates heirloom-quality pieces",
      "Leads craft communities"
    ]
  },
  master: {
    description: "Master craftsperson with exceptional skill and innovation",
    scoreRange: { min: 81, max: 100 },
    characteristics: [
      "Pushes boundaries of the craft",
      "Innovates new techniques and methods",
      "Creates museum-quality work",
      "Preserves and advances craft traditions"
    ],
    expectedCapabilities: [
      "Invents new techniques",
      "Teaches advanced workshops",
      "Judges craft competitions",
      "Preserves traditional knowledge"
    ]
  }
};

// Scoring Criteria Definitions (weighted algorithm components)
export const SCORING_CRITERIA = {
  TECHNICAL_EXECUTION: {
    weight: 0.40, // 40%
    description: "Quality of craftsmanship and technique execution",
    evaluationPoints: [
      "Precision and accuracy of work",
      "Proper technique application",
      "Consistency throughout project",
      "Attention to detail",
      "Finishing quality"
    ]
  },
  DOCUMENTATION_COMPLETENESS: {
    weight: 0.30, // 30%
    description: "Thoroughness of project documentation and process recording",
    evaluationPoints: [
      "Clear before/during/after photos",
      "Detailed process description",
      "Materials and tools documentation",
      "Challenges and solutions noted",
      "Learning outcomes shared"
    ]
  },
  TOOL_USAGE_APPROPRIATENESS: {
    weight: 0.15, // 15%
    description: "Appropriate selection and use of tools for the project",
    evaluationPoints: [
      "Correct tool selection for tasks",
      "Proper tool handling and technique",
      "Efficiency in tool usage",
      "Tool maintenance awareness",
      "Alternative tool considerations"
    ]
  },
  SAFETY_ADHERENCE: {
    weight: 0.10, // 10%
    description: "Demonstration of safety awareness and practices",
    evaluationPoints: [
      "Use of appropriate PPE",
      "Safe work environment setup",
      "Proper material handling",
      "Risk awareness and mitigation",
      "Emergency preparedness"
    ]
  },
  INNOVATION_CREATIVITY: {
    weight: 0.05, // 5%
    description: "Creative problem-solving and innovative approaches",
    evaluationPoints: [
      "Original design elements",
      "Creative problem-solving",
      "Adaptation of techniques",
      "Unique material usage",
      "Artistic expression"
    ]
  }
};

/**
 * Project Scoring Framework Class
 * Implements the weighted scoring algorithm
 */
export class ProjectScoringFramework {
  /**
   * Calculate weighted project score (0-100 scale)
   */
  static calculateWeightedScore(scores: {
    technicalExecution: number;
    documentationCompleteness: number;
    toolUsageAppropriateness: number;
    safetyAdherence: number;
    innovationCreativity: number;
  }, craftType: CraftSpecialization = 'general'): number {
    const criteria = SCORING_CRITERIA;
    
    // Calculate weighted sum
    const weightedSum = 
      scores.technicalExecution * criteria.TECHNICAL_EXECUTION.weight +
      scores.documentationCompleteness * criteria.DOCUMENTATION_COMPLETENESS.weight +
      scores.toolUsageAppropriateness * criteria.TOOL_USAGE_APPROPRIATENESS.weight +
      scores.safetyAdherence * criteria.SAFETY_ADHERENCE.weight +
      scores.innovationCreativity * criteria.INNOVATION_CREATIVITY.weight;
    
    // Return rounded score (0-100)
    return Math.round(Math.min(100, Math.max(0, weightedSum)));
  }
  
  /**
   * Determine skill level based on score
   */
  static determineSkillLevel(score: number): SkillLevel {
    if (score >= 81) return 'master';
    if (score >= 61) return 'craftsman';
    if (score >= 41) return 'journeyman';
    if (score >= 21) return 'apprentice';
    return 'novice';
  }
  
  /**
   * Get skill level definition
   */
  static getSkillLevelDefinition(skillLevel: SkillLevel) {
    return SKILL_LEVEL_DEFINITIONS[skillLevel];
  }
  
  /**
   * Validate score range (0-100)
   */
  static validateScore(score: number): boolean {
    return score >= 0 && score <= 100;
  }
  
  /**
   * Calculate documentation completeness percentage
   */
  static calculateDocumentationCompleteness(documentation: {
    hasBeforePhotos: boolean;
    hasProcessPhotos: boolean;
    hasAfterPhotos: boolean;
    hasDescription: boolean;
    hasMaterialsList: boolean;
    hasToolsList: boolean;
    hasTimeTracking: boolean;
    hasChallengesNoted: boolean;
  }): number {
    const totalCriteria = 8;
    const completedCriteria = Object.values(documentation).filter(Boolean).length;
    return Math.round((completedCriteria / totalCriteria) * 100);
  }
} 