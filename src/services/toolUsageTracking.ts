import { Tool, CraftSpecialization, SkillLevel, MaintenanceReminder, MaintenanceRecord } from '../shared/types';
import { AuthService } from './firebase/auth';

export interface ToolUsageEvent {
  toolId: string;
  projectId: string;
  craftType: CraftSpecialization;
  usageDate: Date;
  userSkillLevel: SkillLevel;
  projectDescription?: string;
}

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
        throw new Error('User data or tool inventory not found');
      }

      const tools = userData.toolInventory;
      const now = new Date();

      // Most used tools
      const mostUsedTools = tools
        .filter(tool => tool.usageTracking?.totalUsageCount)
        .map(tool => ({
          tool,
          usageCount: tool.usageTracking!.totalUsageCount
        }))
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5);

      // Least used tools
      const leastUsedTools = tools
        .filter(tool => tool.usageTracking?.lastUsedDate)
        .map(tool => ({
          tool,
          daysSinceLastUse: Math.floor(
            (now.getTime() - new Date(tool.usageTracking!.lastUsedDate!).getTime()) / 
            (1000 * 60 * 60 * 24)
          )
        }))
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

      const analytics: ToolAnalytics = {
        totalTools: tools.length,
        mostUsedTools,
        leastUsedTools,
        toolsByCategory,
        maintenanceOverdue,
        usageByMonth,
        recommendedTools: recommendedTools.slice(0, 10) // Top 10 overall
      };

      console.log(`📈 Tool analytics generated: ${analytics.totalTools} tools analyzed`);
      return analytics;
    } catch (error) {
      console.error('❌ Failed to generate tool analytics:', error);
      return {
        totalTools: 0,
        mostUsedTools: [],
        leastUsedTools: [],
        toolsByCategory: [],
        maintenanceOverdue: [],
        usageByMonth: [],
        recommendedTools: []
      };
    }
  }

  /**
   * Add maintenance reminder for a tool
   */
  public async addMaintenanceReminder(
    userId: string,
    toolId: string,
    reminder: Omit<MaintenanceReminder, 'id'>
  ): Promise<{ success: boolean; reminderId?: string; error?: string }> {
    try {
      const userData = await AuthService.getUserData(userId);
      if (!userData || !userData.toolInventory) {
        throw new Error('User data or tool inventory not found');
      }

      const updatedInventory = [...userData.toolInventory];
      const toolIndex = updatedInventory.findIndex(tool => tool.id === toolId);
      
      if (toolIndex === -1) {
        throw new Error('Tool not found');
      }

      const tool = updatedInventory[toolIndex];
      
      // Initialize maintenance if it doesn't exist
      if (!tool.maintenance) {
        tool.maintenance = {
          maintenanceReminders: [],
          maintenanceHistory: []
        };
      }

      // Create new reminder
      const newReminder: MaintenanceReminder = {
        ...reminder,
        id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      tool.maintenance.maintenanceReminders.push(newReminder);
      updatedInventory[toolIndex] = tool;

      // Save to Firebase
      await AuthService.updateUserData(userId, {
        toolInventory: updatedInventory
      });

      console.log(`✅ Added maintenance reminder for tool: ${tool.name}`);
      return { success: true, reminderId: newReminder.id };
    } catch (error) {
      console.error('❌ Failed to add maintenance reminder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
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