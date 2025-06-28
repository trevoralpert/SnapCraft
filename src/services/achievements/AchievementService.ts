import { Achievement, SkillLevel } from '../../shared/types';

export interface ScoreBasedAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
  trigger: {
    type: 'score' | 'skill_level' | 'project_count' | 'perfect_score' | 'improvement';
    threshold?: number;
    skillLevel?: SkillLevel;
    craftType?: string;
  };
}

class AchievementService {
  private static instance: AchievementService;

  private achievements: ScoreBasedAchievement[] = [
    // Score-based achievements
    {
      id: 'first_score',
      title: 'First Steps',
      description: 'Complete your first AI-scored project',
      icon: '🎯',
      rarity: 'common',
      trigger: { type: 'project_count', threshold: 1 }
    },
    {
      id: 'score_70',
      title: 'Solid Craftsman',
      description: 'Achieve a project score of 70 or higher',
      icon: '🔨',
      rarity: 'common',
      trigger: { type: 'score', threshold: 70 }
    },
    {
      id: 'score_85',
      title: 'Expert Artisan',
      description: 'Achieve a project score of 85 or higher',
      icon: '⭐',
      rarity: 'rare',
      trigger: { type: 'score', threshold: 85 }
    },
    {
      id: 'perfect_score',
      title: 'Perfection',
      description: 'Achieve a perfect score of 100',
      icon: '🏆',
      rarity: 'legendary',
      trigger: { type: 'perfect_score', threshold: 100 }
    },
    {
      id: 'apprentice_level',
      title: 'Rising Apprentice',
      description: 'Reach Apprentice skill level',
      icon: '📈',
      rarity: 'common',
      trigger: { type: 'skill_level', skillLevel: 'apprentice' }
    },
    {
      id: 'journeyman_level',
      title: 'Skilled Journeyman',
      description: 'Reach Journeyman skill level',
      icon: '🎓',
      rarity: 'rare',
      trigger: { type: 'skill_level', skillLevel: 'journeyman' }
    },
    {
      id: 'craftsman_level',
      title: 'Master Craftsman',
      description: 'Reach Craftsman skill level',
      icon: '👑',
      rarity: 'rare',
      trigger: { type: 'skill_level', skillLevel: 'craftsman' }
    },
    {
      id: 'master_level',
      title: 'Grand Master',
      description: 'Reach Master skill level',
      icon: '🌟',
      rarity: 'legendary',
      trigger: { type: 'skill_level', skillLevel: 'master' }
    },
    {
      id: 'prolific_creator',
      title: 'Prolific Creator',
      description: 'Complete 10 scored projects',
      icon: '📚',
      rarity: 'rare',
      trigger: { type: 'project_count', threshold: 10 }
    },
    {
      id: 'woodworking_specialist',
      title: 'Woodworking Specialist',
      description: 'Score 80+ on 3 woodworking projects',
      icon: '🪵',
      rarity: 'rare',
      trigger: { type: 'score', threshold: 80, craftType: 'woodworking' }
    },
    {
      id: 'improvement_streak',
      title: 'Always Improving',
      description: 'Show consistent improvement over 5 projects',
      icon: '📊',
      rarity: 'rare',
      trigger: { type: 'improvement', threshold: 5 }
    }
  ];

  public static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  /**
   * Check which achievements should be unlocked based on scoring results
   */
  public checkScoreBasedAchievements(data: {
    score: number;
    skillLevel: SkillLevel;
    craftType: string;
    totalProjects: number;
    recentScores: number[];
    existingAchievements: string[];
  }): ScoreBasedAchievement[] {
    const newAchievements: ScoreBasedAchievement[] = [];

    for (const achievement of this.achievements) {
      // Skip if already unlocked
      if (data.existingAchievements.includes(achievement.id)) {
        continue;
      }

      let shouldUnlock = false;

      switch (achievement.trigger.type) {
        case 'score':
          if (achievement.trigger.craftType) {
            // Craft-specific score achievement
            shouldUnlock = data.score >= (achievement.trigger.threshold || 0) && 
                          data.craftType === achievement.trigger.craftType;
          } else {
            // General score achievement
            shouldUnlock = data.score >= (achievement.trigger.threshold || 0);
          }
          break;

        case 'perfect_score':
          shouldUnlock = data.score === 100;
          break;

        case 'skill_level':
          if (achievement.trigger.skillLevel) {
            shouldUnlock = this.isSkillLevelReached(data.skillLevel, achievement.trigger.skillLevel);
          }
          break;

        case 'project_count':
          shouldUnlock = data.totalProjects >= (achievement.trigger.threshold || 0);
          break;

        case 'improvement':
          shouldUnlock = this.checkImprovementStreak(data.recentScores, achievement.trigger.threshold || 5);
          break;
      }

      if (shouldUnlock) {
        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  }

  /**
   * Check if a skill level has been reached
   */
  private isSkillLevelReached(currentLevel: SkillLevel, targetLevel: SkillLevel): boolean {
    const levelOrder: SkillLevel[] = ['novice', 'apprentice', 'journeyman', 'craftsman', 'master'];
    const currentIndex = levelOrder.indexOf(currentLevel);
    const targetIndex = levelOrder.indexOf(targetLevel);
    
    // Handle case where skill levels are not found
    if (currentIndex === -1 || targetIndex === -1) {
      return false;
    }
    
    return currentIndex >= targetIndex;
  }

  /**
   * Check for improvement streak in recent scores
   */
  private checkImprovementStreak(recentScores: number[], requiredLength: number): boolean {
    if (recentScores.length < requiredLength) {
      return false;
    }

    // Check if scores are generally improving over the last N projects
    const lastN = recentScores.slice(-requiredLength);
    let improvementCount = 0;

    for (let i = 1; i < lastN.length; i++) {
      if (lastN[i] > lastN[i - 1]) {
        improvementCount++;
      }
    }

    // At least 60% of comparisons should show improvement
    return improvementCount >= Math.floor(requiredLength * 0.6);
  }

  /**
   * Calculate achievement points
   */
  public calculateAchievementPoints(achievements: ScoreBasedAchievement[]): number {
    return achievements.reduce((total, achievement) => {
      switch (achievement.rarity) {
        case 'common': return total + 10;
        case 'rare': return total + 25;
        case 'legendary': return total + 50;
        default: return total;
      }
    }, 0);
  }

  /**
   * Get achievement by ID
   */
  public getAchievementById(id: string): ScoreBasedAchievement | undefined {
    return this.achievements.find(achievement => achievement.id === id);
  }

  /**
   * Get all achievements
   */
  public getAllAchievements(): ScoreBasedAchievement[] {
    return [...this.achievements];
  }

  /**
   * Show achievement unlock notification
   */
  public showAchievementNotification(achievement: ScoreBasedAchievement): void {
    console.log(`🏆 Achievement Unlocked: ${achievement.title}`);
    console.log(`📝 ${achievement.description}`);
    console.log(`✨ Rarity: ${achievement.rarity}`);
    
    // In a real app, this would trigger a toast notification or modal
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`🏆 Achievement Unlocked!\n\n${achievement.icon} ${achievement.title}\n${achievement.description}`);
    }
  }
}

export { AchievementService }; 