import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';

// Achievement categories
const ACHIEVEMENT_CATEGORIES = [
  { id: 'all', label: 'All Achievements', emoji: '🏆', count: 24 },
  { id: 'crafting', label: 'Crafting', emoji: '🔨', count: 8 },
  { id: 'social', label: 'Social', emoji: '👥', count: 6 },
  { id: 'learning', label: 'Learning', emoji: '📚', count: 5 },
  { id: 'tools', label: 'Tools', emoji: '🛠️', count: 5 },
];

// Mock achievements data
const MOCK_ACHIEVEMENTS = [
  {
    id: '1',
    title: 'First Steps',
    description: 'Create your first craft post',
    category: 'crafting',
    difficulty: 'beginner',
    points: 10,
    emoji: '👶',
    isUnlocked: true,
    unlockedAt: new Date('2024-06-20'),
    progress: 1,
    maxProgress: 1,
  },
  {
    id: '2',
    title: 'Tool Collector',
    description: 'Add 5 tools to your inventory',
    category: 'tools',
    difficulty: 'beginner',
    points: 25,
    emoji: '🧰',
    isUnlocked: true,
    unlockedAt: new Date('2024-06-21'),
    progress: 5,
    maxProgress: 5,
  },
  {
    id: '3',
    title: 'Knowledge Seeker',
    description: 'Read 10 knowledge base articles',
    category: 'learning',
    difficulty: 'intermediate',
    points: 50,
    emoji: '📖',
    isUnlocked: false,
    unlockedAt: null,
    progress: 7,
    maxProgress: 10,
  },
  {
    id: '4',
    title: 'Master Craftsman',
    description: 'Complete 25 craft projects',
    category: 'crafting',
    difficulty: 'expert',
    points: 200,
    emoji: '👑',
    isUnlocked: false,
    unlockedAt: null,
    progress: 3,
    maxProgress: 25,
  },
  {
    id: '5',
    title: 'Community Builder',
    description: 'Receive 100 likes on your posts',
    category: 'social',
    difficulty: 'intermediate',
    points: 75,
    emoji: '❤️',
    isUnlocked: false,
    unlockedAt: null,
    progress: 24,
    maxProgress: 100,
  },
  {
    id: '6',
    title: 'Helping Hand',
    description: 'Comment on 20 community posts',
    category: 'social',
    difficulty: 'beginner',
    points: 30,
    emoji: '🤝',
    isUnlocked: false,
    unlockedAt: null,
    progress: 12,
    maxProgress: 20,
  },
  {
    id: '7',
    title: 'Woodworking Apprentice',
    description: 'Complete 5 woodworking projects',
    category: 'crafting',
    difficulty: 'intermediate',
    points: 60,
    emoji: '🪵',
    isUnlocked: false,
    unlockedAt: null,
    progress: 2,
    maxProgress: 5,
  },
  {
    id: '8',
    title: 'Safety First',
    description: 'Read all safety articles',
    category: 'learning',
    difficulty: 'beginner',
    points: 40,
    emoji: '🥽',
    isUnlocked: true,
    unlockedAt: new Date('2024-06-19'),
    progress: 15,
    maxProgress: 15,
  },
];

export default function AchievementsScreen() {
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter achievements by category
  const filteredAchievements = MOCK_ACHIEVEMENTS.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  );

  // Calculate stats
  const unlockedCount = MOCK_ACHIEVEMENTS.filter(a => a.isUnlocked).length;
  const totalPoints = MOCK_ACHIEVEMENTS
    .filter(a => a.isUnlocked)
    .reduce((sum, a) => sum + a.points, 0);

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      case 'expert': return '#9C27B0';
      default: return '#757575';
    }
  };

  const getProgressPercentage = (progress: number, maxProgress: number): number => {
    return Math.min((progress / maxProgress) * 100, 100);
  };

  const renderAchievementItem = ({ item }: { item: typeof MOCK_ACHIEVEMENTS[0] }) => {
    const progressPercentage = getProgressPercentage(item.progress, item.maxProgress);
    
    return (
      <View style={[styles.achievementCard, !item.isUnlocked && styles.achievementCardLocked]}>
        <View style={styles.achievementHeader}>
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementEmoji, !item.isUnlocked && styles.lockedEmoji]}>
              {item.isUnlocked ? item.emoji : '🔒'}
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
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
              <Text style={styles.difficultyText}>{item.difficulty}</Text>
            </View>
            <Text style={styles.pointsText}>+{item.points} pts</Text>
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

        {/* Unlock Date */}
        {item.isUnlocked && item.unlockedAt && (
          <View style={styles.unlockedContainer}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.unlockedText}>
              Unlocked {item.unlockedAt.toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCategoryButton = (category: typeof ACHIEVEMENT_CATEGORIES[0]) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryButton,
        selectedCategory === category.id && styles.categoryButtonSelected,
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
      <Text style={[
        styles.categoryLabel,
        selectedCategory === category.id && styles.categoryLabelSelected,
      ]}>
        {category.label}
      </Text>
      <Text style={[
        styles.categoryCount,
        selectedCategory === category.id && styles.categoryCountSelected,
      ]}>
        {category.count}
      </Text>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authRequiredContainer}>
          <Text style={styles.authRequiredTitle}>Login Required</Text>
          <Text style={styles.authRequiredText}>
            Please log in to view your achievements.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Achievements</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>{unlockedCount}/{MOCK_ACHIEVEMENTS.length}</Text>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.overviewContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{unlockedCount}</Text>
          <Text style={styles.statLabel}>Unlocked</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {Math.round((unlockedCount / MOCK_ACHIEVEMENTS.length) * 100)}%
          </Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}
      >
        {ACHIEVEMENT_CATEGORIES.map(renderCategoryButton)}
      </ScrollView>

      {/* Achievements List */}
      <FlatList
        data={filteredAchievements}
        renderItem={renderAchievementItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.achievementsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No achievements found</Text>
            <Text style={styles.emptySubtext}>
              Start crafting to unlock your first achievements!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  statsContainer: {
    backgroundColor: '#F9F5F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
  overviewContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
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
  categoriesScroll: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  categoryButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryButtonSelected: {
    backgroundColor: '#F9F5F1',
    borderColor: '#8B4513',
  },
  categoryEmoji: {
    fontSize: 20,
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  categoryLabelSelected: {
    color: '#8B4513',
  },
  categoryCount: {
    fontSize: 10,
    color: '#666',
  },
  categoryCountSelected: {
    color: '#8B4513',
  },
  achievementsList: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  achievementCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
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
    alignItems: 'center',
    flex: 1,
  },
  achievementEmoji: {
    fontSize: 24,
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  lockedText: {
    color: '#999',
  },
  achievementMeta: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  difficultyText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B4513',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    minWidth: 40,
  },
  unlockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockedText: {
    fontSize: 11,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#8B4513',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  authRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  authRequiredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
  },
  authRequiredText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 