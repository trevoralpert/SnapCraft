import { AuthService } from './firebase/auth';
import { 
  Tool, 
  CraftSpecialization, 
  SkillLevel, 
  MaintenanceReminder,
  ToolRecommendation,
  ToolAnalytics
} from '../shared/types';

export interface ToolUsageEvent {
  toolId: string;
  projectId: string;
  craftType: CraftSpecialization;
  usageDate: Date;
  userSkillLevel: SkillLevel;
  projectDescription?: string;
}

export class ToolUsageTrackingService {
  private static instance: ToolUsageTrackingService;

  public static getInstance(): ToolUsageTrackingService {
    if (!ToolUsageTrackingService.instance) {
      ToolUsageTrackingService.instance = new ToolUsageTrackingService();
    }
    return ToolUsageTrackingService.instance;
  }

  /**
   * Track tool usage when a project is created or updated
   */
  public async trackToolUsage(
    userId: string,
    toolUsageEvents: ToolUsageEvent[]
  ): Promise<{ success: boolean; updatedTools: number; errors: string[] }> {
    try {
      console.log(`🔧 Tracking tool usage for ${toolUsageEvents.length} tools`);
      
      const userData = await AuthService.getUserData(userId);
      if (!userData || !userData.toolInventory) {
        throw new Error('User data or tool inventory not found');
      }

      let updatedTools = 0;
      const errors: string[] = [];
      const updatedInventory = [...userData.toolInventory];

      for (const event of toolUsageEvents) {
        try {
          const toolIndex = updatedInventory.findIndex(tool => tool.id === event.toolId);
          if (toolIndex === -1) {
            console.warn(`⚠️ Tool ${event.toolId} not found in inventory`);
            errors.push(`Tool ${event.toolId} not found in inventory`);
            continue;
          }

          const tool = updatedInventory[toolIndex];
          if (!tool) {
            console.warn(`⚠️ Tool at index ${toolIndex} is undefined`);
            errors.push(`Tool at index ${toolIndex} is undefined`);
            continue;
          }
          
          // Initialize usage tracking if it doesn't exist
          if (!tool.usageTracking) {
            tool.usageTracking = {
              totalUsageCount: 0,
              projectsUsedIn: [],
              averageUsagePerMonth: 0,
              craftTypesUsedFor: []
            };
          }

          // Update usage tracking
          tool.usageTracking.totalUsageCount += 1;
          tool.usageTracking.lastUsedDate = event.usageDate;
          
          // Add project ID if not already tracked
          if (!tool.usageTracking.projectsUsedIn.includes(event.projectId)) {
            tool.usageTracking.projectsUsedIn.push(event.projectId);
          }

          // Add craft type if not already tracked
          if (!tool.usageTracking.craftTypesUsedFor.includes(event.craftType)) {
            tool.usageTracking.craftTypesUsedFor.push(event.craftType);
          }

          // Calculate average usage per month
          const monthsSinceAcquired = this.calculateMonthsSinceDate(tool.acquiredDate);
          tool.usageTracking.averageUsagePerMonth = monthsSinceAcquired > 0 
            ? tool.usageTracking.totalUsageCount / monthsSinceAcquired 
            : tool.usageTracking.totalUsageCount;

          updatedInventory[toolIndex] = tool;
          updatedTools++;
          
          console.log(`✅ Updated usage tracking for tool: ${tool.name}`);
        } catch (toolError) {
          console.error(`❌ Error tracking usage for tool ${event.toolId}:`, toolError);
          errors.push(`Error tracking tool ${event.toolId}: ${toolError}`);
        }
      }

      // Save updated inventory to Firebase
      await AuthService.updateUserData(userId, {
        toolInventory: updatedInventory
      });

      console.log(`🎯 Tool usage tracking completed: ${updatedTools} tools updated`);
      
      return {
        success: true,
        updatedTools,
        errors
      };
    } catch (error) {
      console.error('❌ Failed to track tool usage:', error);
      return {
        success: false,
        updatedTools: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Generate tool recommendations based on user's craft types and skill level
   */
  public async generateToolRecommendations(
    userId: string,
    craftType: CraftSpecialization,
    userSkillLevel: SkillLevel
  ): Promise<ToolRecommendation[]> {
    try {
      console.log(`🎯 Generating tool recommendations for ${craftType} at ${userSkillLevel} level`);
      
      const userData = await AuthService.getUserData(userId);
      if (!userData) {
        throw new Error('User data not found');
      }

      const existingTools = userData.toolInventory || [];
      const existingToolNames = existingTools.map(tool => tool.name.toLowerCase());

      // Get tool recommendations based on craft type and skill level
      const recommendations = this.getToolRecommendationsForCraftAndSkill(
        craftType, 
        userSkillLevel, 
        existingToolNames
      );

      console.log(`✅ Generated ${recommendations.length} tool recommendations`);
      return recommendations;
    } catch (error) {
      console.error('❌ Failed to generate tool recommendations:', error);
      return [];
    }
  }

  /**
   * Get tool analytics for a user
   */
  public async getToolAnalytics(userId: string): Promise<ToolAnalytics> {
    try {
      console.log(`📊 Generating tool analytics for user: ${userId}`);
      
      const userData = await AuthService.getUserData(userId);
      if (!userData || !userData.toolInventory) {
        return this.getEmptyAnalytics();
      }

      const tools = userData.toolInventory;
      const now = new Date();

      // Most used tools
      const mostUsedTools = tools
        .filter(tool => tool.usageTracking?.totalUsageCount)
        .map(tool => ({
          tool,
          usageCount: tool.usageTracking?.totalUsageCount || 0
        }))
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5);

      // Least used tools
      const leastUsedTools = tools
        .filter(tool => tool.usageTracking?.lastUsedDate)
        .map(tool => {
          const lastUsedDate = tool.usageTracking?.lastUsedDate;
          return {
            tool,
            daysSinceLastUse: lastUsedDate 
              ? Math.floor((now.getTime() - new Date(lastUsedDate).getTime()) / (1000 * 60 * 60 * 24))
              : 0
          };
        })
        .sort((a, b) => b.daysSinceLastUse - a.daysSinceLastUse)
        .slice(0, 5);

      // Tools by category
      const categoryMap = new Map<string, number>();
      tools.forEach(tool => {
        const count = categoryMap.get(tool.category) || 0;
        categoryMap.set(tool.category, count + 1);
      });
      const toolsByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
        category,
        count
      }));

      // Maintenance overdue
      const maintenanceOverdue = tools.filter(tool => 
        tool.maintenance?.nextMaintenanceDate && 
        new Date(tool.maintenance.nextMaintenanceDate) < now
      );

      // Usage by month (mock data for now - would need to track historical usage)
      const usageByMonth = this.generateUsageByMonth(tools);

      // Generate recommendations for primary craft types
      const recommendedTools: ToolRecommendation[] = [];
      if (userData.craftSpecialization) {
        for (const craftType of userData.craftSpecialization) {
          const recommendations = await this.generateToolRecommendations(
            userId, 
            craftType, 
            userData.skillLevel
          );
          recommendedTools.push(...recommendations.slice(0, 3)); // Top 3 per craft type
        }
      }

      // Task 2.7: Enhanced Tool Inventory Analytics
      // Tool identification accuracy (based on tools added via AI identification)
      const identifiedTools = tools.filter(tool => (tool as any).identifiedFromPhoto);
      const identificationAccuracy = {
        totalIdentifications: identifiedTools.length,
        correctIdentifications: identifiedTools.filter(tool => (tool as any).confidence && (tool as any).confidence > 0.8).length,
        accuracyRate: identifiedTools.length > 0 
          ? (identifiedTools.filter(tool => (tool as any).confidence && (tool as any).confidence > 0.8).length / identifiedTools.length) * 100 
          : 0,
        averageConfidence: identifiedTools.length > 0 
          ? identifiedTools.reduce((sum, tool) => sum + ((tool as any).confidence || 0), 0) / identifiedTools.length * 100
          : 0,
        highConfidenceTools: identifiedTools
          .filter(tool => (tool as any).confidence && (tool as any).confidence > 0.9)
          .map(tool => ({ toolName: tool.name, confidence: ((tool as any).confidence || 0) * 100 }))
          .slice(0, 5),
        lowConfidenceTools: identifiedTools
          .filter(tool => (tool as any).confidence && (tool as any).confidence < 0.6)
          .map(tool => ({ toolName: tool.name, confidence: ((tool as any).confidence || 0) * 100 }))
          .slice(0, 5)
      };

      // Usage patterns analysis
      const usagePatterns = {
        mostFrequentCombinations: this.analyzeMostFrequentToolCombinations(tools),
        craftTypeDistribution: this.analyzeCraftTypeDistribution(tools),
        seasonalTrends: this.analyzeSeasonalTrends(tools),
        efficiencyMetrics: this.calculateEfficiencyMetrics(tools)
      };

      // Missing tools analysis
      const missingToolsAnalysis = {
        suggestedForCraftTypes: await this.analyzeMissingToolsForCraftTypes(userData),
        projectScoringInsights: this.analyzeProjectScoringInsights(tools),
        gapAnalysis: this.analyzeToolGaps(tools, userData.craftSpecialization || [])
      };

      const analytics: ToolAnalytics = {
        totalTools: tools.length,
        mostUsedTools,
        leastUsedTools,
        toolsByCategory,
        maintenanceOverdue,
        usageByMonth,
        recommendedTools: recommendedTools.slice(0, 10), // Top 10 overall
        identificationAccuracy,
        usagePatterns,
        missingToolsAnalysis
      };

      console.log(`📈 Tool analytics generated: ${analytics.totalTools} tools analyzed`);
      return analytics;
    } catch (error) {
      console.error('❌ Failed to generate tool analytics:', error);
      return this.getEmptyAnalytics();
    }
  }

  /**
   * Get empty analytics structure for error cases
   */
  private getEmptyAnalytics(): ToolAnalytics {
    return {
      totalTools: 0,
      mostUsedTools: [],
      leastUsedTools: [],
      toolsByCategory: [],
      maintenanceOverdue: [],
      usageByMonth: [],
      recommendedTools: [],
      identificationAccuracy: {
        totalIdentifications: 0,
        correctIdentifications: 0,
        accuracyRate: 0,
        averageConfidence: 0,
        highConfidenceTools: [],
        lowConfidenceTools: []
      },
      usagePatterns: {
        mostFrequentCombinations: [],
        craftTypeDistribution: [],
        seasonalTrends: [],
        efficiencyMetrics: { avgToolsPerProject: 0, toolUtilizationRate: 0 }
      },
      missingToolsAnalysis: {
        suggestedForCraftTypes: [],
        projectScoringInsights: [],
        gapAnalysis: []
      }
    };
  }

  /**
   * Task 2.7: Analyze most frequent tool combinations used together
   */
  private analyzeMostFrequentToolCombinations(tools: Tool[]): { tools: string[]; usageCount: number }[] {
    // For now, return mock data - would need project-level tool usage tracking
    return [
      { tools: ['Circular Saw', 'Measuring Tape'], usageCount: 15 },
      { tools: ['Drill', 'Screwdriver Set'], usageCount: 12 },
      { tools: ['Hammer', 'Nails', 'Level'], usageCount: 8 }
    ];
  }

  /**
   * Task 2.7: Analyze craft type distribution of tool usage
   */
  private analyzeCraftTypeDistribution(tools: Tool[]): { craftType: CraftSpecialization; usageCount: number }[] {
    const craftTypeMap = new Map<CraftSpecialization, number>();
    
    tools.forEach(tool => {
      if (tool.usageTracking?.craftTypesUsedFor) {
        tool.usageTracking.craftTypesUsedFor.forEach(craftType => {
          const count = craftTypeMap.get(craftType) || 0;
          craftTypeMap.set(craftType, count + (tool.usageTracking?.totalUsageCount || 0));
        });
      }
    });

    return Array.from(craftTypeMap.entries())
      .map(([craftType, usageCount]) => ({ craftType, usageCount }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);
  }

  /**
   * Task 2.7: Analyze seasonal trends in tool usage
   */
  private analyzeSeasonalTrends(tools: Tool[]): { period: string; toolsUsed: number }[] {
    // Mock seasonal data - would need historical usage tracking
    return [
      { period: 'Spring', toolsUsed: 45 },
      { period: 'Summer', toolsUsed: 62 },
      { period: 'Fall', toolsUsed: 38 },
      { period: 'Winter', toolsUsed: 25 }
    ];
  }

  /**
   * Task 2.7: Calculate efficiency metrics
   */
  private calculateEfficiencyMetrics(tools: Tool[]): { avgToolsPerProject: number; toolUtilizationRate: number } {
    const totalTools = tools.length;
    const usedTools = tools.filter(tool => tool.usageTracking?.totalUsageCount && tool.usageTracking.totalUsageCount > 0);
    const totalProjects = tools.reduce((sum, tool) => {
      return sum + (tool.usageTracking?.projectsUsedIn.length || 0);
    }, 0);

    return {
      avgToolsPerProject: totalProjects > 0 ? usedTools.length / totalProjects : 0,
      toolUtilizationRate: totalTools > 0 ? (usedTools.length / totalTools) * 100 : 0
    };
  }

  /**
   * Task 2.7: Analyze missing tools for specific craft types
   */
  private async analyzeMissingToolsForCraftTypes(userData: any): Promise<{ craftType: CraftSpecialization; missingTools: string[] }[]> {
    const result: { craftType: CraftSpecialization; missingTools: string[] }[] = [];
    
    if (userData.craftSpecialization) {
      for (const craftType of userData.craftSpecialization) {
        const recommendations = await this.generateToolRecommendations(
          userData.id,
          craftType,
          userData.skillLevel
        );
        
        const missingTools = recommendations
          .filter(rec => rec.priority === 'high')
          .map(rec => rec.toolName)
          .slice(0, 3);
        
        if (missingTools.length > 0) {
          result.push({ craftType, missingTools });
        }
      }
    }

    return result;
  }

  /**
   * Task 2.7: Analyze project scoring insights related to tool usage
   */
  private analyzeProjectScoringInsights(tools: Tool[]): { toolName: string; impactOnScore: number; frequency: number }[] {
    // Mock data - would need integration with actual project scoring results
    const essentialTools = [
      { toolName: 'Safety Glasses', impactOnScore: 15, frequency: 85 },
      { toolName: 'Measuring Tape', impactOnScore: 12, frequency: 78 },
      { toolName: 'Level', impactOnScore: 10, frequency: 65 },
      { toolName: 'Clamps', impactOnScore: 8, frequency: 52 },
      { toolName: 'Dust Mask', impactOnScore: 7, frequency: 45 }
    ];

    return essentialTools.filter(tool => 
      !tools.some(userTool => userTool.name.toLowerCase().includes(tool.toolName.toLowerCase()))
    );
  }

  /**
   * Task 2.7: Analyze tool gaps by category
   */
  private analyzeToolGaps(tools: Tool[], craftTypes: CraftSpecialization[]): { category: string; recommendedCount: number; currentCount: number }[] {
    const categoryMap = new Map<string, number>();
    tools.forEach(tool => {
      const count = categoryMap.get(tool.category) || 0;
      categoryMap.set(tool.category, count + 1);
    });

    // Recommended tool counts by category for different craft types
    const recommendedCounts = {
      'hand-tools': 8,
      'power-tools': 5,
      'measuring': 4,
      'safety': 6,
      'finishing': 3,
      'specialized': 2
    };

    return Object.entries(recommendedCounts).map(([category, recommendedCount]) => ({
      category,
      recommendedCount,
      currentCount: categoryMap.get(category) || 0
    }));
  }

  /**
   * Helper method to calculate months since a date
   */
  private calculateMonthsSinceDate(date: Date): number {
    const now = new Date();
    const startDate = new Date(date);
    
    const yearDiff = now.getFullYear() - startDate.getFullYear();
    const monthDiff = now.getMonth() - startDate.getMonth();
    
    return yearDiff * 12 + monthDiff;
  }

  /**
   * Get tool recommendations based on craft type and skill level
   */
  private getToolRecommendationsForCraftAndSkill(
    craftType: CraftSpecialization,
    skillLevel: SkillLevel,
    existingToolNames: string[]
  ): ToolRecommendation[] {
    const recommendations: ToolRecommendation[] = [];

    // Define tool recommendations by craft type and skill level
    const toolDatabase = this.getToolRecommendationDatabase();
    
    const craftRecommendations = toolDatabase[craftType] || [];
    
    for (const toolRec of craftRecommendations) {
      // Check if user already has this tool
      if (existingToolNames.includes(toolRec.name.toLowerCase())) {
        continue;
      }

      // Check if tool is appropriate for skill level
      if (toolRec.skillLevels.includes(skillLevel)) {
        recommendations.push({
          toolId: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          toolName: toolRec.name,
          category: toolRec.category,
          reason: toolRec.reason,
          priority: toolRec.priority,
          craftType,
          estimatedCost: toolRec.estimatedCost,
          alternatives: toolRec.alternatives
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Tool recommendation database
   */
  private getToolRecommendationDatabase(): Record<CraftSpecialization, any[]> {
    return {
      woodworking: [
        {
          name: 'Combination Square',
          category: 'measuring',
          reason: 'Essential for accurate measurements and marking',
          priority: 'high' as const,
          skillLevels: ['novice', 'apprentice', 'journeyman', 'craftsman', 'master'],
          estimatedCost: 25,
          alternatives: ['Speed Square', 'Try Square']
        },
        {
          name: 'Block Plane',
          category: 'hand-tools',
          reason: 'Perfect for smoothing and fine adjustments',
          priority: 'high' as const,
          skillLevels: ['apprentice', 'journeyman', 'craftsman', 'master'],
          estimatedCost: 45,
          alternatives: ['Smoothing Plane', 'Low-Angle Block Plane']
        },
        {
          name: 'Dovetail Saw',
          category: 'hand-tools',
          reason: 'Precision cutting for joinery work',
          priority: 'medium' as const,
          skillLevels: ['journeyman', 'craftsman', 'master'],
          estimatedCost: 65,
          alternatives: ['Tenon Saw', 'Carcass Saw']
        }
      ],
      metalworking: [
        {
          name: 'Digital Calipers',
          category: 'measuring',
          reason: 'Precise measurements essential for metalwork',
          priority: 'high' as const,
          skillLevels: ['novice', 'apprentice', 'journeyman', 'craftsman', 'master'],
          estimatedCost: 35,
          alternatives: ['Dial Calipers', 'Vernier Calipers']
        },
        {
          name: 'Center Punch Set',
          category: 'hand-tools',
          reason: 'Mark precise drilling locations',
          priority: 'high' as const,
          skillLevels: ['novice', 'apprentice', 'journeyman', 'craftsman', 'master'],
          estimatedCost: 20,
          alternatives: ['Automatic Center Punch', 'Spring-loaded Punch']
        }
      ],
      pottery: [
        {
          name: 'Wire Clay Cutter',
          category: 'hand-tools',
          reason: 'Essential for cutting clay from wheel and blocks',
          priority: 'high' as const,
          skillLevels: ['novice', 'apprentice', 'journeyman', 'craftsman', 'master'],
          estimatedCost: 15,
          alternatives: ['Fishing Line', 'Piano Wire']
        }
      ],
      general: [
        {
          name: 'Digital Multimeter',
          category: 'measuring',
          reason: 'Versatile tool for electrical measurements',
          priority: 'medium' as const,
          skillLevels: ['apprentice', 'journeyman', 'craftsman', 'master'],
          estimatedCost: 40,
          alternatives: ['Analog Multimeter', 'Voltage Tester']
        }
      ],
      leathercraft: [],
      weaving: [],
      blacksmithing: [],
      bushcraft: [],
      stonemasonry: [],
      glassblowing: [],
      jewelry: []
    };
  }

  /**
   * Generate mock usage by month data
   */
  private generateUsageByMonth(tools: Tool[]): { month: string; usageCount: number }[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      usageCount: Math.floor(Math.random() * 20) + 5 // Mock data
    }));
  }
}

export default ToolUsageTrackingService; 