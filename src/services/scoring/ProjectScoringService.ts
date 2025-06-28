import { OpenAIService, CraftContext, RAGResponse } from '../rag/openai';
import { ProjectScoringFramework, SCORING_CRITERIA } from './ProjectScoringFramework';
import { 
  CraftPost, 
  ProjectScoringRequest, 
  ProjectScoringResult, 
  SkillLevel, 
  CraftSpecialization,
  User 
} from '../../shared/types';

/**
 * AI Project Scoring Service
 * Integrates OpenAI RAG with scoring framework for comprehensive project evaluation
 */
export class ProjectScoringService {
  private static instance: ProjectScoringService;
  private openaiService: OpenAIService;

  private constructor() {
    this.openaiService = OpenAIService.getInstance();
  }

  public static getInstance(): ProjectScoringService {
    if (!ProjectScoringService.instance) {
      ProjectScoringService.instance = new ProjectScoringService();
    }
    return ProjectScoringService.instance;
  }

  /**
   * Score a craft project using AI analysis and structured framework
   */
  async scoreProject(request: ProjectScoringRequest): Promise<ProjectScoringResult> {
    const startTime = Date.now();
    const scoringId = `scoring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log('🎯 Starting AI project scoring:', { 
        scoringId, 
        projectId: request.projectId,
        craftType: request.craftType 
      });

      // Step 1: Build context for AI analysis
      const context = this.buildScoringContext(request);

      // Step 2: Generate AI analysis for each scoring criterion
      const criteriaScores = await this.evaluateAllCriteria(request, context);

      // Step 3: Calculate weighted score using framework
      const weightedScore = ProjectScoringFramework.calculateWeightedScore(
        criteriaScores.scores,
        request.craftType
      );

      // Step 4: Determine skill level
      const skillLevel = ProjectScoringFramework.determineSkillLevel(weightedScore);

      // Step 5: Generate comprehensive feedback
      const feedback = await this.generateProjectFeedback(request, context, criteriaScores);

      // Step 6: Calculate confidence and review flags
      const confidence = this.calculateScoringConfidence(criteriaScores);
      const needsHumanReview = this.determineHumanReviewNeed(criteriaScores, confidence);

      const processingTime = Date.now() - startTime;

      const result: ProjectScoringResult = {
        scoringId,
        projectId: request.projectId,
        individualSkillScore: weightedScore,
        skillLevelCategory: skillLevel,
        scoringCriteria: {
          technicalExecution: {
            score: criteriaScores.scores.technicalExecution,
            weight: SCORING_CRITERIA.TECHNICAL_EXECUTION.weight,
            feedback: criteriaScores.feedback.technicalExecution,
            confidence: criteriaScores.confidence.technicalExecution
          },
          documentationCompleteness: {
            score: criteriaScores.scores.documentationCompleteness,
            weight: SCORING_CRITERIA.DOCUMENTATION_COMPLETENESS.weight,
            feedback: criteriaScores.feedback.documentationCompleteness,
            confidence: criteriaScores.confidence.documentationCompleteness
          },
          toolUsageAppropriateness: {
            score: criteriaScores.scores.toolUsageAppropriateness,
            weight: SCORING_CRITERIA.TOOL_USAGE_APPROPRIATENESS.weight,
            feedback: criteriaScores.feedback.toolUsageAppropriateness,
            confidence: criteriaScores.confidence.toolUsageAppropriateness
          },
          safetyAdherence: {
            score: criteriaScores.scores.safetyAdherence,
            weight: SCORING_CRITERIA.SAFETY_ADHERENCE.weight,
            feedback: criteriaScores.feedback.safetyAdherence,
            confidence: criteriaScores.confidence.safetyAdherence
          },
          innovationCreativity: {
            score: criteriaScores.scores.innovationCreativity,
            weight: SCORING_CRITERIA.INNOVATION_CREATIVITY.weight,
            feedback: criteriaScores.feedback.innovationCreativity,
            confidence: criteriaScores.confidence.innovationCreativity
          }
        },
        overallFeedback: feedback.overallFeedback,
        strengths: feedback.strengths,
        improvementAreas: feedback.improvementAreas,
        nextStepSuggestions: feedback.nextStepSuggestions,
        aiScoringMetadata: {
          modelVersion: 'gpt-4',
          confidence,
          processingTime,
          timestamp: new Date().toISOString(),
          needsHumanReview,
          reviewReason: needsHumanReview ? this.getReviewReason(criteriaScores, confidence) : undefined,
          craftTypeSpecific: this.getCraftSpecificMetadata(request.craftType),
          documentationAnalysis: this.analyzeDocumentationCompleteness(request)
        }
      };

      console.log(`✅ Project scoring completed in ${processingTime}ms:`, {
        scoringId,
        score: weightedScore,
        skillLevel,
        confidence,
        needsReview: needsHumanReview
      });

      return result;

    } catch (error) {
      console.error('❌ Project scoring failed:', error);
      throw new Error(`Failed to score project: ${error}`);
    }
  }

  /**
   * Build context for AI scoring analysis
   */
  private buildScoringContext(request: ProjectScoringRequest): CraftContext {
    return {
      userProfile: {
        craftSpecialization: [request.craftType],
        skillLevel: request.userSkillLevel || 'apprentice',
        bio: request.userProfile?.bio
      },
      currentProject: {
        description: request.description,
        craftType: request.craftType,
        difficulty: this.estimateProjectDifficulty(request),
        materials: request.materials || [],
        techniques: this.extractTechniquesFromDescription(request.description)
      }
    };
  }

  /**
   * Evaluate all scoring criteria using AI analysis
   */
  private async evaluateAllCriteria(
    request: ProjectScoringRequest, 
    context: CraftContext
  ): Promise<{
    scores: {
      technicalExecution: number;
      documentationCompleteness: number;
      toolUsageAppropriateness: number;
      safetyAdherence: number;
      innovationCreativity: number;
    };
    feedback: {
      technicalExecution: string;
      documentationCompleteness: string;
      toolUsageAppropriateness: string;
      safetyAdherence: string;
      innovationCreativity: string;
    };
    confidence: {
      technicalExecution: number;
      documentationCompleteness: number;
      toolUsageAppropriateness: number;
      safetyAdherence: number;
      innovationCreativity: number;
    };
  }> {
    // Run all criteria evaluations in parallel for efficiency
    const [
      technicalResult,
      documentationResult,
      toolUsageResult,
      safetyResult,
      innovationResult
    ] = await Promise.all([
      this.evaluateTechnicalExecution(request, context),
      this.evaluateDocumentationCompleteness(request, context),
      this.evaluateToolUsage(request, context),
      this.evaluateSafetyAdherence(request, context),
      this.evaluateInnovationCreativity(request, context)
    ]);

    return {
      scores: {
        technicalExecution: technicalResult.score,
        documentationCompleteness: documentationResult.score,
        toolUsageAppropriateness: toolUsageResult.score,
        safetyAdherence: safetyResult.score,
        innovationCreativity: innovationResult.score
      },
      feedback: {
        technicalExecution: technicalResult.feedback,
        documentationCompleteness: documentationResult.feedback,
        toolUsageAppropriateness: toolUsageResult.feedback,
        safetyAdherence: safetyResult.feedback,
        innovationCreativity: innovationResult.feedback
      },
      confidence: {
        technicalExecution: technicalResult.confidence,
        documentationCompleteness: documentationResult.confidence,
        toolUsageAppropriateness: toolUsageResult.confidence,
        safetyAdherence: safetyResult.confidence,
        innovationCreativity: innovationResult.confidence
      }
    };
  }

  /**
   * Evaluate technical execution using AI analysis
   */
  private async evaluateTechnicalExecution(
    request: ProjectScoringRequest, 
    context: CraftContext
  ): Promise<{ score: number; feedback: string; confidence: number }> {
    const prompt = `Evaluate the technical execution of this ${request.craftType} project (0-100 scale):

Project Description: ${request.description}
Images Available: ${request.imageUrls ? request.imageUrls.length : 0} photos
Materials Used: ${request.materials?.join(', ') || 'Not specified'}

Evaluation Criteria (Technical Execution - 40% weight):
- Precision and accuracy of work
- Proper technique application  
- Consistency throughout project
- Attention to detail
- Finishing quality

Based on the description and available information, provide:
1. Score (0-100): Technical execution quality
2. Specific feedback on technique application
3. Areas of strength in execution
4. Areas needing improvement
5. Confidence level (0-100) in this assessment

Format: SCORE: [number] | FEEDBACK: [detailed analysis] | CONFIDENCE: [number]`;

    try {
      const response = await this.openaiService.generateCraftContent(prompt, context);
      return this.parseCriteriaResponse(response.content, response.confidence);
    } catch (error) {
      console.warn('Technical execution evaluation failed, using fallback:', error);
      return this.getFallbackCriteriaScore('technical execution');
    }
  }

  /**
   * Evaluate documentation completeness
   */
  private async evaluateDocumentationCompleteness(
    request: ProjectScoringRequest, 
    context: CraftContext
  ): Promise<{ score: number; feedback: string; confidence: number }> {
    // Calculate base documentation score using framework
    const documentationAnalysis = this.analyzeDocumentationCompleteness(request);
    const baseScore = ProjectScoringFramework.calculateDocumentationCompleteness(documentationAnalysis);

    const prompt = `Evaluate the documentation completeness of this ${request.craftType} project (0-100 scale):

Project Description: ${request.description}
Images: ${request.imageUrls ? request.imageUrls.length : 0} photos
Process Documentation: ${documentationAnalysis.hasProcessPhotos ? 'Yes' : 'No'}
Materials Listed: ${documentationAnalysis.hasMaterialsList ? 'Yes' : 'No'}
Tools Listed: ${documentationAnalysis.hasToolsList ? 'Yes' : 'No'}

Base Documentation Score: ${baseScore}/100

Evaluation Criteria (Documentation Completeness - 30% weight):
- Clear before/during/after photos
- Detailed process description
- Materials and tools documentation
- Challenges and solutions noted
- Learning outcomes shared

Provide refined scoring and feedback considering the quality of documentation beyond just completeness.

Format: SCORE: [number] | FEEDBACK: [detailed analysis] | CONFIDENCE: [number]`;

    try {
      const response = await this.openaiService.generateCraftContent(prompt, context);
      const aiResult = this.parseCriteriaResponse(response.content, response.confidence);
      
      // Blend AI assessment with calculated base score (70% AI, 30% calculated)
      const blendedScore = Math.round(aiResult.score * 0.7 + baseScore * 0.3);
      
      return {
        score: blendedScore,
        feedback: aiResult.feedback,
        confidence: aiResult.confidence
      };
    } catch (error) {
      console.warn('Documentation evaluation failed, using calculated score:', error);
      return {
        score: baseScore,
        feedback: `Documentation completeness: ${baseScore}% based on available elements`,
        confidence: 85
      };
    }
  }

  /**
   * Evaluate tool usage appropriateness
   */
  private async evaluateToolUsage(
    request: ProjectScoringRequest, 
    context: CraftContext
  ): Promise<{ score: number; feedback: string; confidence: number }> {
    const toolsList = request.toolsUsed?.join(', ') || 'Not specified';
    
    const prompt = `Evaluate the tool usage appropriateness for this ${request.craftType} project (0-100 scale):

Project Description: ${request.description}
Tools Used: ${toolsList}
User Skill Level: ${request.userSkillLevel || 'apprentice'}

Evaluation Criteria (Tool Usage Appropriateness - 15% weight):
- Correct tool selection for tasks
- Proper tool handling and technique
- Efficiency in tool usage
- Tool maintenance awareness
- Alternative tool considerations

Consider whether the tools are appropriate for:
- The specific craft type and techniques
- The user's skill level
- The project complexity
- Safety requirements

Format: SCORE: [number] | FEEDBACK: [detailed analysis] | CONFIDENCE: [number]`;

    try {
      const response = await this.openaiService.generateCraftContent(prompt, context);
      return this.parseCriteriaResponse(response.content, response.confidence);
    } catch (error) {
      console.warn('Tool usage evaluation failed, using fallback:', error);
      return this.getFallbackCriteriaScore('tool usage');
    }
  }

  /**
   * Evaluate safety adherence
   */
  private async evaluateSafetyAdherence(
    request: ProjectScoringRequest, 
    context: CraftContext
  ): Promise<{ score: number; feedback: string; confidence: number }> {
    const prompt = `Evaluate the safety adherence for this ${request.craftType} project (0-100 scale):

Project Description: ${request.description}
Tools Used: ${request.toolsUsed?.join(', ') || 'Not specified'}
Images Available: ${request.imageUrls ? request.imageUrls.length : 0} photos

Evaluation Criteria (Safety Adherence - 10% weight):
- Use of appropriate PPE (Personal Protective Equipment)
- Safe work environment setup
- Proper material handling
- Risk awareness and mitigation
- Emergency preparedness

Look for evidence of:
- Safety equipment mentions or visibility
- Proper technique descriptions that indicate safety awareness
- Risk mitigation strategies
- Safe workspace organization

Format: SCORE: [number] | FEEDBACK: [detailed analysis] | CONFIDENCE: [number]`;

    try {
      const response = await this.openaiService.generateCraftContent(prompt, context);
      return this.parseCriteriaResponse(response.content, response.confidence);
    } catch (error) {
      console.warn('Safety evaluation failed, using fallback:', error);
      return this.getFallbackCriteriaScore('safety adherence');
    }
  }

  /**
   * Evaluate innovation and creativity
   */
  private async evaluateInnovationCreativity(
    request: ProjectScoringRequest, 
    context: CraftContext
  ): Promise<{ score: number; feedback: string; confidence: number }> {
    const prompt = `Evaluate the innovation and creativity of this ${request.craftType} project (0-100 scale):

Project Description: ${request.description}
Materials Used: ${request.materials?.join(', ') || 'Not specified'}

Evaluation Criteria (Innovation/Creativity - 5% weight):
- Original design elements
- Creative problem-solving
- Adaptation of techniques
- Unique material usage
- Artistic expression

Look for evidence of:
- Novel approaches to traditional techniques
- Creative material combinations
- Unique design solutions
- Personal artistic expression
- Problem-solving innovation

Format: SCORE: [number] | FEEDBACK: [detailed analysis] | CONFIDENCE: [number]`;

    try {
      const response = await this.openaiService.generateCraftContent(prompt, context);
      return this.parseCriteriaResponse(response.content, response.confidence);
    } catch (error) {
      console.warn('Innovation evaluation failed, using fallback:', error);
      return this.getFallbackCriteriaScore('innovation and creativity');
    }
  }

  /**
   * Generate comprehensive project feedback
   */
  private async generateProjectFeedback(
    request: ProjectScoringRequest,
    context: CraftContext,
    criteriaScores: any
  ): Promise<{
    overallFeedback: string;
    strengths: string[];
    improvementAreas: string[];
    nextStepSuggestions: string[];
  }> {
    const prompt = `Provide comprehensive feedback for this ${request.craftType} project:

Project: ${request.description}
Overall Score: ${ProjectScoringFramework.calculateWeightedScore(criteriaScores.scores, request.craftType)}/100

Individual Scores:
- Technical Execution: ${criteriaScores.scores.technicalExecution}/100
- Documentation: ${criteriaScores.scores.documentationCompleteness}/100  
- Tool Usage: ${criteriaScores.scores.toolUsageAppropriateness}/100
- Safety: ${criteriaScores.scores.safetyAdherence}/100
- Innovation: ${criteriaScores.scores.innovationCreativity}/100

Provide:
1. Overall feedback summary (2-3 sentences)
2. Top 3 strengths demonstrated
3. Top 3 areas for improvement
4. 3 specific next-step suggestions for skill development

Be encouraging while providing constructive guidance for improvement.`;

    try {
      const response = await this.openaiService.generateCraftContent(prompt, context);
      return this.parseFeedbackResponse(response.content);
    } catch (error) {
      console.warn('Feedback generation failed, using structured fallback:', error);
      return this.getFallbackFeedback(criteriaScores.scores);
    }
  }

  // Helper methods for parsing and calculations...

  /**
   * Parse AI response for scoring criteria
   */
  private parseCriteriaResponse(response: string, defaultConfidence: number): { 
    score: number; 
    feedback: string; 
    confidence: number 
  } {
    const scoreMatch = response.match(/SCORE:\s*(\d+)/i);
    const feedbackMatch = response.match(/FEEDBACK:\s*([^|]+)/i);
    const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)/i);

    return {
      score: scoreMatch && scoreMatch[1] ? parseInt(scoreMatch[1], 10) : 70,
      feedback: feedbackMatch && feedbackMatch[1] ? feedbackMatch[1].trim() : response.substring(0, 200),
      confidence: confidenceMatch && confidenceMatch[1] ? parseInt(confidenceMatch[1], 10) : defaultConfidence
    };
  }

  /**
   * Analyze documentation completeness
   */
  private analyzeDocumentationCompleteness(request: ProjectScoringRequest) {
    const description = request.description.toLowerCase();
    const hasImages = (request.imageUrls?.length || 0) > 0;
    
    return {
      hasBeforePhotos: hasImages && (description.includes('before') || description.includes('start')),
      hasProcessPhotos: hasImages && (description.includes('process') || description.includes('step')),
      hasAfterPhotos: hasImages && (description.includes('after') || description.includes('final')),
      hasDescription: request.description.length > 50,
      hasMaterialsList: (request.materials?.length || 0) > 0,
      hasToolsList: (request.toolsUsed?.length || 0) > 0,
      hasTimeTracking: description.includes('time') || description.includes('hour'),
      hasChallengesNoted: description.includes('challenge') || description.includes('problem')
    };
  }

  /**
   * Calculate overall scoring confidence
   */
  private calculateScoringConfidence(criteriaScores: any): number {
    const confidences = Object.values(criteriaScores.confidence) as number[];
    return Math.round(confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length);
  }

  /**
   * Determine if human review is needed
   */
  private determineHumanReviewNeed(criteriaScores: any, overallConfidence: number): boolean {
    // Flag for human review if:
    // 1. Overall confidence is low (< 70%)
    // 2. Any individual criterion has very low confidence (< 50%)
    // 3. Scores are inconsistent (high variance)
    
    if (overallConfidence < 70) return true;
    
    const confidences = Object.values(criteriaScores.confidence) as number[];
    if (confidences.some(conf => conf < 50)) return true;
    
    const scores = Object.values(criteriaScores.scores) as number[];
    const variance = this.calculateVariance(scores);
    if (variance > 800) return true; // High score variance
    
    return false;
  }

  /**
   * Get fallback scoring for failed evaluations
   */
  private getFallbackCriteriaScore(criteriaName: string): { 
    score: number; 
    feedback: string; 
    confidence: number 
  } {
    return {
      score: 70, // Neutral score
      feedback: `${criteriaName} evaluation: Unable to perform detailed analysis. Score based on available information.`,
      confidence: 40 // Low confidence for fallback
    };
  }

  /**
   * Parse comprehensive feedback response
   */
  private parseFeedbackResponse(response: string): {
    overallFeedback: string;
    strengths: string[];
    improvementAreas: string[];
    nextStepSuggestions: string[];
  } {
    // Simple parsing - in production, this would be more sophisticated
    const lines = response.split('\n').filter(line => line.trim());
    
    return {
      overallFeedback: lines[0] || "Project shows good craft fundamentals with room for growth.",
      strengths: lines.slice(1, 4).map(line => line.replace(/^[\d\-\*\s]+/, '')),
      improvementAreas: lines.slice(4, 7).map(line => line.replace(/^[\d\-\*\s]+/, '')),
      nextStepSuggestions: lines.slice(7, 10).map(line => line.replace(/^[\d\-\*\s]+/, ''))
    };
  }

  /**
   * Get fallback feedback for failed generation
   */
  private getFallbackFeedback(scores: any): {
    overallFeedback: string;
    strengths: string[];
    improvementAreas: string[];
    nextStepSuggestions: string[];
  } {
    const topScore = Math.max(...Object.values(scores) as number[]);
    const topCriteria = Object.entries(scores).find(([_, score]) => score === topScore)?.[0];
    
    return {
      overallFeedback: "This project demonstrates solid craft fundamentals with clear areas for continued development.",
      strengths: [
        `Strong performance in ${topCriteria || 'technical execution'}`,
        "Good attention to craft fundamentals",
        "Clear documentation of the process"
      ],
      improvementAreas: [
        "Enhanced documentation with more process photos",
        "Expanded tool usage exploration",
        "Increased focus on safety practices"
      ],
      nextStepSuggestions: [
        "Try a similar project with increased complexity",
        "Focus on documenting your process more thoroughly",
        "Explore advanced techniques in your craft specialization"
      ]
    };
  }

  // Utility methods...

  private estimateProjectDifficulty(request: ProjectScoringRequest): string {
    const description = request.description.toLowerCase();
    if (description.includes('advanced') || description.includes('complex')) return 'advanced';
    if (description.includes('intermediate') || description.includes('moderate')) return 'intermediate';
    return 'beginner';
  }

  private extractTechniquesFromDescription(description: string): string[] {
    // Simple technique extraction - could be enhanced with NLP
    const commonTechniques = ['cutting', 'sanding', 'joining', 'finishing', 'measuring', 'drilling'];
    return commonTechniques.filter(technique => 
      description.toLowerCase().includes(technique)
    );
  }

  private getReviewReason(criteriaScores: any, confidence: number): string {
    if (confidence < 70) return 'Low overall confidence in AI assessment';
    
    const confidences = Object.values(criteriaScores.confidence) as number[];
    if (confidences.some(conf => conf < 50)) return 'Low confidence in specific criteria evaluation';
    
    const scores = Object.values(criteriaScores.scores) as number[];
    const variance = this.calculateVariance(scores);
    if (variance > 800) return 'Inconsistent scoring across criteria';
    
    return 'Standard quality review';
  }

  private getCraftSpecificMetadata(craftType: CraftSpecialization) {
    return {
      craftType,
      evaluationFocus: this.getCraftEvaluationFocus(craftType),
      commonChallenges: this.getCraftCommonChallenges(craftType)
    };
  }

  private getCraftEvaluationFocus(craftType: CraftSpecialization): string[] {
    const focusMap: Partial<Record<CraftSpecialization, string[]>> = {
      general: ['technique execution', 'tool usage', 'safety practices'],
      woodworking: ['joint quality', 'grain orientation', 'finishing technique'],
      metalworking: ['precision', 'heat treatment', 'surface finish'],
      pottery: ['form consistency', 'glazing technique', 'firing results'],
      weaving: ['tension consistency', 'pattern execution', 'edge finishing'],
      leathercraft: ['stitching quality', 'edge finishing', 'dye application'],
      jewelry: ['precision work', 'stone setting', 'metal finishing']
    };
    
    return focusMap[craftType] || focusMap.general || [];
  }

  private getCraftCommonChallenges(craftType: CraftSpecialization): string[] {
    const challengeMap: Partial<Record<CraftSpecialization, string[]>> = {
      general: ['tool selection', 'project planning', 'quality consistency'],
      woodworking: ['wood movement', 'grain tear-out', 'joint fitting'],
      metalworking: ['heat control', 'material warping', 'surface oxidation'],
      pottery: ['cracking', 'glazing defects', 'firing issues'],
      weaving: ['tension problems', 'pattern errors', 'edge distortion'],
      leathercraft: ['leather selection', 'stitching consistency', 'dye bleeding'],
      jewelry: ['stone damage', 'metal fatigue', 'sizing accuracy']
    };
    
    return challengeMap[craftType] || challengeMap.general || [];
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  /**
   * Test the scoring service connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing ProjectScoringService connectivity...');
      const openaiTest = await this.openaiService.testConnection();
      console.log('🧪 ProjectScoringService test result:', openaiTest);
      return openaiTest;
    } catch (error) {
      console.error('❌ ProjectScoringService test failed:', error);
      return false;
    }
  }
}

export default ProjectScoringService;