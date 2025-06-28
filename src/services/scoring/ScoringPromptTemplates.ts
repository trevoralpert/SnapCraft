import { CraftSpecialization } from '../../shared/types';

/**
 * Craft-Specific Scoring Prompt Templates
 * Provides specialized evaluation criteria for different craft types
 */

/**
 * Generate craft-specific evaluation prompt
 */
export function generateCraftSpecificPrompt(
  craftType: CraftSpecialization,
  criterion: 'technical' | 'safety' | 'tools' | 'innovation',
  projectDescription: string,
  additionalContext?: string
): string {
  const contextSection = additionalContext ? `\nAdditional Context: ${additionalContext}` : '';

  return `Evaluate this ${craftType} project for ${criterion} execution (0-100 scale):

Project Description: ${projectDescription}${contextSection}

Based on ${craftType}-specific standards, provide:
1. Score (0-100): How well does this project demonstrate ${criterion} excellence?
2. Specific feedback on ${craftType} technique application
3. Areas of strength specific to ${craftType}
4. Areas needing improvement for ${craftType}
5. Confidence level (0-100) in this ${craftType} assessment

Format: SCORE: [number] | FEEDBACK: [detailed analysis] | CONFIDENCE: [number]`;
}

/**
 * Get craft-specific safety considerations
 */
export function getCraftSafetyConsiderations(craftType: CraftSpecialization): string[] {
  const safetyMap: Partial<Record<CraftSpecialization, string[]>> = {
    woodworking: ['Eye and hearing protection', 'Dust collection', 'Blade guards', 'Safe feeding techniques'],
    metalworking: ['Heat protection', 'Ventilation for fumes', 'Eye protection for welding', 'Fire safety'],
    pottery: ['Clay dust prevention', 'Kiln safety', 'Chemical safety for glazes', 'Proper lifting techniques'],
    weaving: ['Proper posture', 'Eye strain prevention', 'Repetitive motion injury prevention'],
    leathercraft: ['Sharp blade handling', 'Chemical safety for dyes', 'Ventilation for solvents'],
    jewelry: ['Torch safety', 'Chemical safety for acids', 'Eye protection for detail work'],
    blacksmithing: ['Fire safety', 'Heat protection', 'Ventilation', 'Tool handling'],
    bushcraft: ['Knife safety', 'Fire safety', 'Weather awareness', 'First aid preparedness'],
    stonemasonry: ['Dust protection', 'Heavy lifting safety', 'Tool maintenance', 'Eye protection'],
    glassblowing: ['Heat protection', 'Eye protection', 'Ventilation', 'Tool safety'],
    general: ['Basic PPE usage', 'Safe workspace setup', 'Tool handling', 'Risk awareness']
  };

  return safetyMap[craftType] || safetyMap.general || [];
}

/**
 * Get craft-specific quality indicators
 */
export function getCraftQualityIndicators(craftType: CraftSpecialization): string[] {
  const qualityMap: Partial<Record<CraftSpecialization, string[]>> = {
    woodworking: ['Joint quality', 'Surface finish', 'Grain orientation', 'Dimensional accuracy'],
    metalworking: ['Precision tolerances', 'Weld quality', 'Surface finish', 'Heat treatment'],
    pottery: ['Wall thickness', 'Form balance', 'Glaze application', 'Firing success'],
    weaving: ['Tension consistency', 'Pattern accuracy', 'Edge quality', 'Color transitions'],
    leathercraft: ['Stitch consistency', 'Edge finishing', 'Dye application', 'Hardware attachment'],
    jewelry: ['Precision work', 'Stone setting', 'Surface polish', 'Joint quality'],
    blacksmithing: ['Heat control', 'Form accuracy', 'Surface texture', 'Structural integrity'],
    bushcraft: ['Functionality', 'Durability', 'Efficiency', 'Safety integration'],
    stonemasonry: ['Joint quality', 'Surface finish', 'Structural integrity', 'Tool marks'],
    glassblowing: ['Form consistency', 'Wall thickness', 'Surface quality', 'Color application'],
    general: ['Technique execution', 'Attention to detail', 'Functional quality', 'Aesthetic appeal']
  };

  return qualityMap[craftType] || qualityMap.general || [];
}

export default generateCraftSpecificPrompt; 