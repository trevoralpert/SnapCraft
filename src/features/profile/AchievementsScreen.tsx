import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { AchievementService, ScoreBasedAchievement } from '../../services/achievements/AchievementService';

// Achievement categories based on real achievement types
const ACHIEVEMENT_CATEGORIES = [
  { id: 'all', label: 'All Achievements', emoji: '🏆' },
  { id: 'onboarding', label: 'Getting Started', emoji: '🎯' },
  { id: 'tutorials', label: 'Learning', emoji: '📚' },
  { id: 'projects', label: 'Projects', emoji: '🔨' },
  { id: 'skills', label: 'Skills', emoji: '⭐' },
  { id: 'scoring', label: 'Scoring', emoji: '📊' },
];

interface AchievementWithProgress extends ScoreBasedAchievement {
  isUnlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
  category: string;
}

export default function AchievementsScreen() {
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [achievementStats, setAchievementStats] = useState({
    unlockedCount: 0,
    totalCount: 0,
    totalPoints: 0,
    progressByCategory: {} as Record<string, { unlocked: number; total: number }>
  });

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const achievementService = AchievementService.getInstance();
      
      console.log('🏆 AchievementsScreen - User data for achievements:', {
        onboarding: user.onboarding,
        tutorialProgress: user.tutorialProgress,
        firstProjectGuidance: user.firstProjectGuidance,
        skillLevel: user.skillLevel,
        craftSpecialization: user.craftSpecialization
      });
      
      // Calculate user achievements based on real data
      const result = await achievementService.calculateUserAchievements({
        onboarding: user.onboarding,
        tutorialProgress: user.tutorialProgress,
        firstProjectGuidance: user.firstProjectGuidance,
        skillLevel: user.skillLevel || 'novice',
        craftSpecialization: user.craftSpecialization || [],
        projectCount: 0, // TODO: Get from posts collection
        recentScores: [], // TODO: Get from scoring history
        existingAchievements: [] // TODO: Get from user achievements collection
      });

      console.log('🏆 Achievement calculation result:', result);

      // Get all achievements and map them to include progress
      const allAchievements = achievementService.getAllAchievements();
      const achievementsWithProgress: AchievementWithProgress[] = allAchievements.map(achievement => {
        const isUnlocked = result.unlockedAchievements.some(ua => ua.id === achievement.id);
        const progress = calculateProgress(achievement, user);
        const maxProgress = getMaxProgress(achievement);
        
        console.log(`🏆 Achievement ${achievement.id}:`, {
          isUnlocked,
          progress,
          maxProgress,
          trigger: achievement.trigger
        });
        
        return {
          ...achievement,
          isUnlocked,
          unlockedAt: isUnlocked ? new Date() : undefined,
          progress,
          maxProgress,
          category: getCategoryFromAchievement(achievement)
        };
      });

      console.log('🏆 Sample achievements with progress:', achievementsWithProgress.slice(0, 5));

      setAchievements(achievementsWithProgress);
      setAchievementStats({
        unlockedCount: result.unlockedAchievements.length,
        totalCount: result.totalAchievements,
        totalPoints: result.achievementPoints,
        progressByCategory: result.progressByCategory
      });

      console.log('🏆 Final achievement stats:', {
        total: achievementsWithProgress.length,
        unlocked: result.unlockedAchievements.length,
        points: result.achievementPoints,
        unlockedIds: result.unlockedAchievements.map(a => a.id)
      });

    } catch (error) {
      console.error('❌ Failed to load achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = (achievement: ScoreBasedAchievement, userData: any): number => {
    switch (achievement.trigger.type) {
      case 'onboarding':
        return userData.onboarding?.completed ? 1 : (userData.onboarding?.stepsCompleted?.length || 0);
      
      case 'tutorial':
        if (achievement.trigger.tutorialId) {
          const progress = userData.tutorialProgress?.[achievement.trigger.tutorialId];
          return progress?.completedAt ? 1 : 0;
        } else if (achievement.trigger.threshold) {
          // All tutorials achievement
          const completed = Object.values(userData.tutorialProgress || {})
            .filter((p: any) => p.completedAt).length;
          return Math.min(completed, achievement.trigger.threshold);
        }
        return 0;
      
      case 'first_project':
        return userData.firstProjectGuidance?.startedAt ? 1 : 0;
      
      case 'skill_level':
        const levelOrder = ['novice', 'apprentice', 'journeyman', 'craftsman', 'master'];
        const currentIndex = levelOrder.indexOf(userData.skillLevel || 'novice');
        const targetIndex = levelOrder.indexOf(achievement.trigger.skillLevel || 'novice');
        return currentIndex >= targetIndex ? 1 : 0;
      
      default:
        return 0;
    }
  };

  const getMaxProgress = (achievement: ScoreBasedAchievement): number => {
    switch (achievement.trigger.type) {
      case 'onboarding':
        return achievement.id === 'welcome_aboard' ? 5 : 1; // 5 onboarding steps
      case 'tutorial':
        return achievement.trigger.threshold || 1;
      case 'project_count':
        return achievement.trigger.threshold || 1;
      default:
        return 1;
    }
  };

  const getCategoryFromAchievement = (achievement: ScoreBasedAchievement): string => {
    if (['welcome_aboard', 'craft_specialist'].includes(achievement.id)) return 'onboarding';
    if (['camera_master', 'tool_identifier', 'documentation_pro', 'tutorial_graduate'].includes(achievement.id)) return 'tutorials';
    if (['first_project_started', 'first_score', 'prolific_creator'].includes(achievement.id)) return 'projects';
    if (['apprentice_level', 'journeyman_level', 'craftsman_level', 'master_level'].includes(achievement.id)) return 'skills';
    if (['score_70', 'score_85', 'perfect_score', 'improvement_streak'].includes(achievement.id)) return 'scoring';
    return 'other';
  };

  // Filter achievements by category
  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  );

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common': return '#4CAF50';
      case 'rare': return '#FF9800';
      case 'legendary': return '#9C27B0';
      default: return '#757575';
    }
  };

  const getProgressPercentage = (progress: number, maxProgress: number): number => {
    return Math.min((progress / maxProgress) * 100, 100);
  };

  const renderAchievementItem = ({ item }: { item: AchievementWithProgress }) => {
    const progressPercentage = getProgressPercentage(item.progress, item.maxProgress);
    
    return (
      <View style={[styles.achievementCard, !item.isUnlocked && styles.achievementCardLocked]}>
        <View style={styles.achievementHeader}>
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementEmoji, !item.isUnlocked && styles.lockedEmoji]}>
              {item.isUnlocked ? item.icon : '🔒'}
            </Text>
            <View style={styles.achievementDetails}>
              <Text style={[styles.achievementTitle, !item.isUnlocked && styles.lockedText]}>
                {item.title}
              </Text>
              <Text style={[styles.achievementDescription, !item.isUnlocked && styles.lockedText]}>
                {item.description}
              </Text>
            </View>
          </View>
          <View style={styles.achievementMeta}>
            <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(item.rarity) }]}>
              <Text style={styles.rarityText}>{item.rarity}</Text>
            </View>
            <Text style={styles.pointsText}>
              +{item.rarity === 'common' ? 10 : item.rarity === 'rare' ? 25 : 50} pts
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: item.isUnlocked ? '#4CAF50' : '#FF9800'
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {item.progress}/{item.maxProgress}
          </Text>
        </View>

        {item.isUnlocked && item.unlockedAt && (
          <Text style={styles.unlockedText}>
            Unlocked {item.unlockedAt.toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

  const renderCategoryButton = (category: typeof ACHIEVEMENT_CATEGORIES[0]) => {
    const isSelected = selectedCategory === category.id;
    const categoryStats = achievementStats.progressByCategory[category.id];
    const count = category.id === 'all' ? achievementStats.totalCount : (categoryStats?.total || 0);
    
    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
        onPress={() => setSelectedCategory(category.id)}
      >
        <Text style={[styles.categoryEmoji, isSelected && styles.categoryEmojiSelected]}>
          {category.emoji}
        </Text>
        <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
          {category.label}
        </Text>
        <Text style={[styles.categoryCount, isSelected && styles.categoryCountSelected]}>
          {count}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Achievements</Text>
        <Text style={styles.headerSubtitle}>
          {achievementStats.unlockedCount} of {achievementStats.totalCount} unlocked
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{achievementStats.unlockedCount}</Text>
          <Text style={styles.statLabel}>Unlocked</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{achievementStats.totalPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {Math.round((achievementStats.unlockedCount / achievementStats.totalCount) * 100)}%
          </Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScrollView}
        contentContainerStyle={styles.categoryContainer}
      >
        {ACHIEVEMENT_CATEGORIES.map(renderCategoryButton)}
      </ScrollView>

      {/* Achievements List */}
      <FlatList
        data={filteredAchievements}
        renderItem={renderAchievementItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.achievementsList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B4513',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  categoryScrollView: {
    marginBottom: 16,
  },
  categoryContainer: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  categoryButtonSelected: {
    backgroundColor: '#8B4513',
  },
  categoryEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  categoryEmojiSelected: {
    // No change needed
  },
  categoryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: '#fff',
  },
  categoryCount: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  categoryCountSelected: {
    color: '#E0E0E0',
  },
  achievementsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  achievementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementCardLocked: {
    backgroundColor: '#F8F8F8',
    opacity: 0.7,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  achievementInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  achievementEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  lockedEmoji: {
    opacity: 0.5,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  lockedText: {
    color: '#999',
  },
  achievementMeta: {
    alignItems: 'flex-end',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  rarityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  pointsText: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    minWidth: 30,
  },
  unlockedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
}); 