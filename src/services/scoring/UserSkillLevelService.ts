import { SkillLevel, SkillProgressionEntry, SkillLevelThresholds, CraftPost, User } from '../../shared/types';
import { collection, doc, getDoc, getDocs, query, where, updateDoc, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Service for calculating and managing user skill levels based on project scores
 */
export class UserSkillLevelService {
  private static instance: UserSkillLevelService;

  // Skill level thresholds (0-100 scale)
  private readonly skillThresholds: SkillLevelThresholds = {
    novice: { min: 0, max: 20 },
    apprentice: { min: 21, max: 40 },
    journeyman: { min: 41, max: 60 },
    craftsman: { min: 61, max: 80 },
    master: { min: 81, max: 100 }
  };

  // Minimum projects required for skill level calculation
  private readonly minProjectsForCalculation = 3;

  // Weights for different scoring factors
  private readonly scoringWeights = {
    recentProjects: 0.6,    // Recent projects have more weight
    consistencyBonus: 0.2,  // Bonus for consistent performance
    improvementTrend: 0.2   // Bonus for showing improvement
  };

  private constructor() {}

  public static getInstance(): UserSkillLevelService {
    if (!UserSkillLevelService.instance) {
      UserSkillLevelService.instance = new UserSkillLevelService();
    }
    return UserSkillLevelService.instance;
  }

  /**
   * Calculate user's skill level based on their project scores
   */
  public async calculateUserSkillLevel(userId: string): Promise<{
    skillLevel: SkillLevel;
    averageScore: number;
    projectCount: number;
    confidence: number;
    progressionHistory: SkillProgressionEntry[];
  }> {
    console.log(`🧠 Calculating skill level for user: ${userId}`);

    try {
      // Get all user's scored projects
      const userProjects = await this.getUserScoredProjects(userId);
      
      if (userProjects.length === 0) {
        console.log('📝 No scored projects found, defaulting to novice');
        return {
          skillLevel: 'novice',
          averageScore: 0,
          projectCount: 0,
          confidence: 0,
          progressionHistory: []
        };
      }

      // Calculate weighted average score
      const { averageScore, confidence } = this.calculateWeightedScore(userProjects);
      
      // Determine skill level from score
      const skillLevel = this.determineSkillLevel(averageScore);
      
      // Get current user data for progression history
      const currentUser = await this.getCurrentUser(userId);
      const progressionHistory = currentUser?.scoring?.skillProgression || [];

      console.log(`🎯 Skill calculation result:`, {
        skillLevel,
        averageScore: Math.round(averageScore),
        projectCount: userProjects.length,
        confidence: Math.round(confidence * 100)
      });

      return {
        skillLevel,
        averageScore,
        projectCount: userProjects.length,
        confidence,
        progressionHistory
      };

    } catch (error) {
      console.error('❌ Error calculating user skill level:', error);
      throw error;
    }
  }

  /**
   * Update user's skill level in real-time after a new project is scored
   */
  public async updateUserSkillLevel(userId: string, newProjectId: string): Promise<{
    levelChanged: boolean;
    oldLevel?: SkillLevel;
    newLevel: SkillLevel;
    averageScore: number;
  }> {
    console.log(`🔄 Updating skill level for user ${userId} after project ${newProjectId}`);

    try {
      // Get current user data
      const currentUser = await this.getCurrentUser(userId);
      const oldLevel = currentUser?.scoring?.calculatedSkillLevel || 'novice';

      // Calculate new skill level
      const skillCalculation = await this.calculateUserSkillLevel(userId);
      const newLevel = skillCalculation.skillLevel;

      // Check if level changed
      const levelChanged = oldLevel !== newLevel;

      // Update user document
      await this.updateUserSkillData(userId, {
        averageProjectScore: skillCalculation.averageScore,
        calculatedSkillLevel: newLevel,
        projectCount: skillCalculation.projectCount,
        skillProgression: levelChanged 
          ? [...skillCalculation.progressionHistory, {
              skillLevel: newLevel,
              averageScore: skillCalculation.averageScore,
              achievedAt: new Date(),
              projectCount: skillCalculation.projectCount,
              triggerProjectId: newProjectId
            }]
          : skillCalculation.progressionHistory,
        lastScoreUpdate: serverTimestamp()
      });

      if (levelChanged) {
        console.log(`🎉 SKILL LEVEL UP! ${oldLevel} → ${newLevel}`);
        
        // Trigger achievement check for skill level advancement
        await this.checkSkillLevelAchievements(userId, oldLevel, newLevel);
      }

      return {
        levelChanged,
        oldLevel: levelChanged ? oldLevel : undefined,
        newLevel,
        averageScore: skillCalculation.averageScore
      };

    } catch (error) {
      console.error('❌ Error updating user skill level:', error);
      throw error;
    }
  }

  /**
   * Get skill level badge and visual indicators
   */
  public getSkillLevelBadge(skillLevel: SkillLevel): {
    emoji: string;
    color: string;
    title: string;
    description: string;
    nextLevel?: SkillLevel;
    progressToNext?: number;
  } {
    const badges = {
      novice: {
        emoji: '🌱',
        color: '#4CAF50',
        title: 'Novice Crafter',
        description: 'Just starting your craft journey'
      },
      apprentice: {
        emoji: '🔨',
        color: '#FF9800',
        title: 'Apprentice',
        description: 'Learning the fundamentals'
      },
      journeyman: {
        emoji: '⚒️',
        color: '#2196F3',
        title: 'Journeyman',
        description: 'Skilled in your craft'
      },
      craftsman: {
        emoji: '🏆',
        color: '#9C27B0',
        title: 'Craftsman',
        description: 'Master of your trade'
      },
      master: {
        emoji: '👑',
        color: '#FFD700',
        title: 'Master Craftsman',
        description: 'Pinnacle of craftsmanship'
      }
    };

    const badge = badges[skillLevel];
    const levels: SkillLevel[] = ['novice', 'apprentice', 'journeyman', 'craftsman', 'master'];
    const currentIndex = levels.indexOf(skillLevel);
    const nextLevel = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : undefined;

    return {
      ...badge,
      nextLevel
    };
  }

  /**
   * Calculate progress towards next skill level
   */
  public calculateProgressToNextLevel(currentScore: number, currentLevel: SkillLevel): {
    progressPercentage: number;
    pointsToNext: number;
    nextLevelThreshold: number;
  } {
    const levels: SkillLevel[] = ['novice', 'apprentice', 'journeyman', 'craftsman', 'master'];
    const currentIndex = levels.indexOf(currentLevel);
    
    if (currentIndex === levels.length - 1) {
      // Already at max level
      return {
        progressPercentage: 100,
        pointsToNext: 0,
        nextLevelThreshold: 100
      };
    }

    const nextLevel = levels[currentIndex + 1];
    if (!nextLevel) {
      // Fallback if nextLevel is undefined
      return {
        progressPercentage: 100,
        pointsToNext: 0,
        nextLevelThreshold: 100
      };
    }

    const nextThreshold = this.skillThresholds[nextLevel].min;
    const currentThreshold = this.skillThresholds[currentLevel].min;
    
    const progressInCurrentLevel = currentScore - currentThreshold;
    const totalLevelRange = nextThreshold - currentThreshold;
    const progressPercentage = Math.min(100, (progressInCurrentLevel / totalLevelRange) * 100);

    return {
      progressPercentage: Math.max(0, progressPercentage),
      pointsToNext: Math.max(0, nextThreshold - currentScore),
      nextLevelThreshold: nextThreshold
    };
  }

  // Private helper methods

  private async getUserScoredProjects(userId: string): Promise<CraftPost[]> {
    if (!db) {
      throw new Error('Firestore not initialized. Check your Firebase configuration.');
    }

    const postsRef = collection(db, 'craftPosts');
    
    // Query only by userId to avoid composite index requirement
    // We'll sort in memory after filtering
    const userPostsQuery = query(
      postsRef,
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(userPostsQuery);
    const allPosts = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      // Ensure createdAt is a proper Date object
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
    } as CraftPost));
    
    // Filter posts that have scoring data and sort by creation date (most recent first)
    return allPosts
      .filter(post => 
        post.scoring?.individualSkillScore && 
        post.scoring.individualSkillScore > 0
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private calculateWeightedScore(projects: CraftPost[]): { averageScore: number; confidence: number } {
    if (projects.length === 0) return { averageScore: 0, confidence: 0 };

    // Sort projects by date (most recent first)
    const sortedProjects = projects.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Calculate weighted average favoring recent projects
    let totalWeightedScore = 0;
    let totalWeight = 0;

    sortedProjects.forEach((project, index) => {
      const score = project.scoring?.individualSkillScore || 0;
      
      // Recent projects get higher weight
      const recencyWeight = Math.exp(-index * 0.1); // Exponential decay
      const weight = recencyWeight;
      
      totalWeightedScore += score * weight;
      totalWeight += weight;
    });

    const averageScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    // Calculate confidence based on number of projects and consistency
    const confidence = this.calculateConfidence(sortedProjects);

    return { averageScore, confidence };
  }

  private calculateConfidence(projects: CraftPost[]): number {
    if (projects.length === 0) return 0;

    // Base confidence on number of projects
    const projectCountFactor = Math.min(1, projects.length / 10); // Max confidence at 10+ projects

    // Calculate consistency (lower standard deviation = higher confidence)
    const scores = projects.map(p => p.scoring?.individualSkillScore || 0);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Consistency factor (0-1, where 1 is perfect consistency)
    const consistencyFactor = Math.max(0, 1 - (standardDeviation / 50)); // Normalize by max possible std dev

    // Combined confidence
    return (projectCountFactor * 0.6) + (consistencyFactor * 0.4);
  }

  private determineSkillLevel(averageScore: number): SkillLevel {
    for (const [level, threshold] of Object.entries(this.skillThresholds)) {
      if (averageScore >= threshold.min && averageScore <= threshold.max) {
        return level as SkillLevel;
      }
    }
    return 'novice'; // Fallback
  }

  private async getCurrentUser(userId: string): Promise<User | null> {
    if (!db) {
      throw new Error('Firestore not initialized. Check your Firebase configuration.');
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? userDoc.data() as User : null;
  }

  private async updateUserSkillData(userId: string, skillData: any): Promise<void> {
    if (!db) {
      throw new Error('Firestore not initialized. Check your Firebase configuration.');
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'scoring.averageProjectScore': skillData.averageProjectScore,
      'scoring.calculatedSkillLevel': skillData.calculatedSkillLevel,
      'scoring.projectCount': skillData.projectCount,
      'scoring.skillProgression': skillData.skillProgression,
      'scoring.lastScoreUpdate': serverTimestamp()
    });
  }

  private async checkSkillLevelAchievements(userId: string, oldLevel: SkillLevel, newLevel: SkillLevel): Promise<void> {
    // This would integrate with the AchievementService
    console.log(`🏆 Checking achievements for skill level advancement: ${oldLevel} → ${newLevel}`);
    
    // TODO: Integrate with AchievementService when available
    // const achievementService = AchievementService.getInstance();
    // await achievementService.checkSkillLevelAchievements(userId, oldLevel, newLevel);
  }
} 