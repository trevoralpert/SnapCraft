import { VisionMode, VisionModeConfig } from '../types/vision';

export const VISION_MODES: VisionModeConfig[] = [
  {
    id: VisionMode.ANALYZE_PROJECT,
    name: 'Analyze Project',
    icon: 'construct',
    description: 'Get comprehensive feedback on your craft project',
    color: '#8B4513',
    isAvailable: true,
    badge: 'POPULAR',
    promptTemplate: `Analyze this craft project comprehensively. Provide detailed feedback including:
    - What craft type and techniques are being demonstrated
    - Assessment of skill level and execution quality
    - Specific suggestions for improvement
    - Safety considerations
    - Questions to help the crafter learn more
    
    Be encouraging but constructive in your feedback.`,
    quickQuestions: [
      'How can I improve this project?',
      'What techniques are being used here?',
      'Is this the right skill level for me?',
      'What would you change about this?',
      'How does this compare to professional work?'
    ]
  },
  {
    id: VisionMode.IDENTIFY_TOOLS,
    name: 'Identify Tools',
    icon: 'hammer',
    description: 'Recognize and learn about tools in your photo',
    color: '#CD853F',
    isAvailable: true,
    badge: 'NEW',
    promptTemplate: `Identify all tools visible in this image. For each tool provide:
    - Specific tool name and type
    - Primary uses and applications
    - Skill level typically required
    - Safety considerations
    - Alternative tools that could be used
    - Maintenance tips if applicable
    
    Be very specific in tool identification and focus on practical usage information.`,
    quickQuestions: [
      'What tools do you see here?',
      'How do I use this tool safely?',
      'What projects is this tool good for?',
      'Do I need this tool as a beginner?',
      'What are alternatives to this tool?'
    ]
  },
  {
    id: VisionMode.REVERSE_ENGINEER,
    name: 'Reverse Engineer',
    icon: 'cog',
    description: 'Learn how to recreate this project step-by-step',
    color: '#A0522D',
    isAvailable: true,
    badge: 'BETA',
    promptTemplate: `Analyze this finished project and reverse engineer the creation process. Provide:
    - Step-by-step recreation instructions
    - Required tools and materials for each step
    - Techniques and skills needed
    - Estimated time and difficulty level
    - Common challenges and how to avoid them
    - Prerequisites and preparation needed
    
    Focus on practical, actionable steps that a crafter could follow.`,
    quickQuestions: [
      'How was this made?',
      'What steps would I follow to recreate this?',
      'What materials do I need?',
      'How long would this take to make?',
      'What skills do I need first?'
    ]
  },
  {
    id: VisionMode.ASSESS_SKILL,
    name: 'Assess Skill',
    icon: 'school',
    description: 'Get feedback on your technique and skill level',
    color: '#8FBC8F',
    isAvailable: false, // Coming soon
    badge: 'COMING SOON',
    promptTemplate: `Assess the skill level and technique quality demonstrated in this craft work. Evaluate:
    - Overall skill level (beginner, intermediate, advanced)
    - Technique proficiency and execution
    - Areas of strength and expertise
    - Areas needing improvement
    - Specific next steps for skill development
    - Recommended practice exercises
    
    Be encouraging while providing honest, constructive assessment.`,
    quickQuestions: [
      'What skill level does this show?',
      'How is my technique?',
      'What should I work on next?',
      'Am I ready for harder projects?',
      'What are my strengths here?'
    ]
  },
  {
    id: VisionMode.SAFETY_CHECK,
    name: 'Safety Check',
    icon: 'shield-checkmark',
    description: 'Identify safety concerns and best practices',
    color: '#DC143C',
    isAvailable: false, // Coming soon
    badge: 'COMING SOON',
    promptTemplate: `Perform a comprehensive safety analysis of this craft workspace or project. Identify:
    - Potential safety hazards and risks
    - Missing or improper personal protective equipment (PPE)
    - Environmental safety concerns
    - Proper safety procedures being followed or missed
    - Recommendations for safer practices
    - Emergency preparedness considerations
    
    Prioritize safety above all else and be thorough in hazard identification.`,
    quickQuestions: [
      'Is this setup safe?',
      'What PPE should I be using?',
      'What hazards do you see?',
      'How can I make this safer?',
      'Am I following safety protocols?'
    ]
  }
];

// Helper functions for working with vision modes
export const getVisionModeConfig = (mode: VisionMode): VisionModeConfig | undefined => {
  return VISION_MODES.find(config => config.id === mode);
};

export const getAvailableVisionModes = (): VisionModeConfig[] => {
  return VISION_MODES.filter(config => config.isAvailable);
};

export const getVisionModesByAvailability = (includeComingSoon: boolean = false): VisionModeConfig[] => {
  return includeComingSoon ? VISION_MODES : getAvailableVisionModes();
};

export const getDefaultVisionMode = (): VisionMode => {
  const availableModes = getAvailableVisionModes();
  return availableModes.length > 0 ? availableModes[0]!.id : VisionMode.ANALYZE_PROJECT;
};

// Color palette for vision modes
export const VISION_MODE_COLORS = {
  [VisionMode.ANALYZE_PROJECT]: '#8B4513',
  [VisionMode.IDENTIFY_TOOLS]: '#CD853F', 
  [VisionMode.REVERSE_ENGINEER]: '#A0522D',
  [VisionMode.ASSESS_SKILL]: '#8FBC8F',
  [VisionMode.SAFETY_CHECK]: '#DC143C'
} as const; 