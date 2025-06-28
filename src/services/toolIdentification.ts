import { VisionAnalysisResult, ToolAnalysis } from '../shared/types/vision';
import { Tool, ToolCategory, ToolCondition } from '../shared/types';
import { AuthService } from './firebase/auth';

// Tool interface for identification results - extends the base Tool interface
export interface IdentifiedTool extends Tool {
  // Additional fields for tool identification
  confidence?: number;
  identifiedFromPhoto?: boolean;
  photoUri?: string;
  purchasePrice?: number; // Optional field for tool inventory screen compatibility
  model?: string;
  location?: string;
  lastUsed?: string;
  maintenanceReminders?: string[];
}

// Processed tool data for user confirmation
export interface ToolConfirmationData {
  tool: IdentifiedTool;
  confidence: number;
  isAlreadyInInventory: boolean;
  suggestedCategory: string;
}

export class ToolIdentificationService {
  private static instance: ToolIdentificationService;

  public static getInstance(): ToolIdentificationService {
    if (!ToolIdentificationService.instance) {
      ToolIdentificationService.instance = new ToolIdentificationService();
    }
    return ToolIdentificationService.instance;
  }

  /**
   * Process vision analysis results and extract tool information
   */
  public processVisionAnalysis(analysisResult: VisionAnalysisResult): ToolConfirmationData[] {
    if (analysisResult.mode !== 'identify_tools') {
      console.warn('⚠️ Analysis result is not for tool identification');
      return [];
    }

    const toolAnalysis = analysisResult.analysis as ToolAnalysis;
    const toolConfirmations: ToolConfirmationData[] = [];
    const currentDate = new Date();

    // Process each identified tool
    toolAnalysis.identifiedTools.forEach((identifiedTool, index) => {
      const tool: IdentifiedTool = {
        id: `identified_${Date.now()}_${index}`,
        name: identifiedTool.name,
        category: this.mapToolCategory(identifiedTool.category),
        brand: '', // Will be filled by user or extracted from AI analysis
        condition: 'good' as ToolCondition, // Default condition for newly identified tools
        acquiredDate: currentDate,
        notes: `Identified from photo analysis. Usage: ${identifiedTool.usage}`,
        isShared: false, // Default to private
        confidence: identifiedTool.confidence,
        identifiedFromPhoto: true,
        photoUri: analysisResult.photoUri,
        // Additional fields for compatibility with tool inventory screen
        model: '',
        purchasePrice: 0,
        location: '',
        lastUsed: currentDate.toISOString().split('T')[0] || currentDate.toISOString().substring(0, 10),
        maintenanceReminders: [],
      };

      toolConfirmations.push({
        tool,
        confidence: identifiedTool.confidence,
        isAlreadyInInventory: false, // Will be checked against existing inventory
        suggestedCategory: identifiedTool.category,
      });
    });

    return toolConfirmations;
  }

  /**
   * Map AI-identified tool categories to our predefined categories
   */
  private mapToolCategory(aiCategory: string): ToolCategory {
    const categoryMap: Record<string, ToolCategory> = {
      'hand': 'hand-tools',
      'power': 'power-tools',
      'measuring': 'measuring',
      'measurement': 'measuring',
      'safety': 'safety',
      'finishing': 'finishing',
      'specialized': 'specialized',
      'woodworking': 'hand-tools',
      'metalworking': 'power-tools',
      'cutting': 'hand-tools',
      'shaping': 'hand-tools',
    };

    const normalizedCategory = aiCategory.toLowerCase();
    return categoryMap[normalizedCategory] || 'hand-tools';
  }

  /**
   * Check if a tool already exists in the user's inventory
   */
  public async checkForDuplicates(
    toolConfirmations: ToolConfirmationData[],
    userId: string
  ): Promise<ToolConfirmationData[]> {
    try {
      // Get user's current tool inventory
      const userData = await AuthService.getUserData(userId);
      const existingTools = userData?.toolInventory || [];

      // Check each tool confirmation against existing inventory
      return toolConfirmations.map(confirmation => {
        const isDuplicate = existingTools.some(existingTool => 
          this.toolsAreSimilar(confirmation.tool, existingTool)
        );

        return {
          ...confirmation,
          isAlreadyInInventory: isDuplicate,
        };
      });
    } catch (error) {
      console.error('❌ Error checking for duplicate tools:', error);
      return toolConfirmations;
    }
  }

  /**
   * Compare two tools to determine if they're similar (potential duplicates)
   */
  private toolsAreSimilar(tool1: IdentifiedTool, tool2: Tool): boolean {
    // Simple similarity check based on name and category
    const name1 = tool1.name.toLowerCase().trim();
    const name2 = tool2.name.toLowerCase().trim();
    const category1 = tool1.category;
    const category2 = tool2.category;

    // Check if names are very similar (contains or exact match)
    const namesSimilar = name1.includes(name2) || name2.includes(name1) || name1 === name2;
    const categoriesSame = category1 === category2;

    return namesSimilar && categoriesSame;
  }

  /**
   * Add confirmed tools to user's inventory
   */
  public async addToolsToInventory(
    confirmedToolData: ToolConfirmationData[],
    userId: string
  ): Promise<{ success: boolean; addedCount: number; errors: string[] }> {
    try {
      const userData = await AuthService.getUserData(userId);
      if (!userData) {
        throw new Error('User data not found');
      }

      const currentInventory = userData.toolInventory || [];
      
      // Filter out tools that are already in inventory and convert to base Tool interface
      const newTools: Tool[] = confirmedToolData
        .filter(toolData => !toolData.isAlreadyInInventory)
        .map(toolData => ({
          id: toolData.tool.id,
          name: toolData.tool.name,
          category: toolData.tool.category,
          brand: toolData.tool.brand,
          condition: toolData.tool.condition,
          acquiredDate: toolData.tool.acquiredDate,
          notes: toolData.tool.notes,
          isShared: toolData.tool.isShared,
        }));
      
      // Add new tools to inventory
      const updatedInventory = [...currentInventory, ...newTools];

      // Update user data in Firebase
      await AuthService.updateUserData(userId, {
        toolInventory: updatedInventory,
      });

      console.log(`✅ Added ${newTools.length} tools to inventory`);
      
      return {
        success: true,
        addedCount: newTools.length,
        errors: [],
      };
    } catch (error) {
      console.error('❌ Error adding tools to inventory:', error);
      return {
        success: false,
        addedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Get tool recommendations based on identified tools
   */
  public getToolRecommendations(analysis: ToolAnalysis): string[] {
    return analysis.recommendations || [];
  }

  /**
   * Get safety notes for identified tools
   */
  public getSafetyNotes(analysis: ToolAnalysis): string[] {
    return analysis.safetyNotes || [];
  }
} 