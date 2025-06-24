import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Knowledge categories
const KNOWLEDGE_CATEGORIES = [
  { id: 'techniques', label: 'Techniques', emoji: '🔧', count: 24 },
  { id: 'materials', label: 'Materials', emoji: '🪵', count: 18 },
  { id: 'tools', label: 'Tool Guides', emoji: '🛠️', count: 32 },
  { id: 'safety', label: 'Safety', emoji: '🥽', count: 15 },
  { id: 'projects', label: 'Project Ideas', emoji: '💡', count: 45 },
  { id: 'troubleshooting', label: 'Troubleshooting', emoji: '🔍', count: 28 },
];

// Mock knowledge articles
const MOCK_ARTICLES = [
  {
    id: '1',
    title: 'Mortise and Tenon Joinery Basics',
    category: 'techniques',
    difficulty: 'intermediate',
    readTime: 8,
    summary: 'Learn the fundamentals of this traditional woodworking joint that has been used for centuries.',
    tags: ['woodworking', 'joinery', 'traditional'],
    lastUpdated: '2024-06-20',
    views: 1247,
    rating: 4.8,
  },
  {
    id: '2',
    title: 'Choosing the Right Steel for Knife Making',
    category: 'materials',
    difficulty: 'advanced',
    readTime: 12,
    summary: 'Understanding carbon content, hardness ratings, and heat treatment requirements for different steel types.',
    tags: ['blacksmithing', 'materials', 'steel', 'knives'],
    lastUpdated: '2024-06-18',
    views: 892,
    rating: 4.9,
  },
  {
    id: '3',
    title: 'Essential Safety Gear for Workshop',
    category: 'safety',
    difficulty: 'beginner',
    readTime: 5,
    summary: 'Complete guide to personal protective equipment every craftsman should have.',
    tags: ['safety', 'PPE', 'workshop'],
    lastUpdated: '2024-06-22',
    views: 2156,
    rating: 4.7,
  },
  {
    id: '4',
    title: 'Sharpening Chisels and Plane Irons',
    category: 'tools',
    difficulty: 'intermediate',
    readTime: 15,
    summary: 'Step-by-step guide to achieving razor-sharp edges on your woodworking tools.',
    tags: ['tools', 'sharpening', 'maintenance'],
    lastUpdated: '2024-06-19',
    views: 1534,
    rating: 4.6,
  },
  {
    id: '5',
    title: 'Building a Simple Wooden Box',
    category: 'projects',
    difficulty: 'beginner',
    readTime: 20,
    summary: 'Perfect first project for beginners. Learn basic cuts, assembly, and finishing.',
    tags: ['projects', 'beginner', 'woodworking'],
    lastUpdated: '2024-06-21',
    views: 3421,
    rating: 4.5,
  },
  {
    id: '6',
    title: 'Fixing Common Pottery Cracks',
    category: 'troubleshooting',
    difficulty: 'intermediate',
    readTime: 10,
    summary: 'Identify causes of cracking and learn repair techniques for ceramic pieces.',
    tags: ['pottery', 'repair', 'troubleshooting'],
    lastUpdated: '2024-06-17',
    views: 756,
    rating: 4.4,
  },
];

export default function KnowledgeBaseScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');

  // Filter and sort articles
  const filteredArticles = MOCK_ARTICLES
    .filter(article => {
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.views - a.views;
        case 'recent':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#757575';
    }
  };

  const handleArticlePress = (article: typeof MOCK_ARTICLES[0]) => {
    console.log('📖 Opening article:', article.title);
    // In a real app, this would navigate to the article detail screen
  };

  const renderArticleItem = ({ item }: { item: typeof MOCK_ARTICLES[0] }) => (
    <TouchableOpacity style={styles.articleCard} onPress={() => handleArticlePress(item)}>
      <View style={styles.articleHeader}>
        <View style={styles.articleMeta}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
            <Text style={styles.difficultyText}>{item.difficulty}</Text>
          </View>
          <Text style={styles.readTime}>{item.readTime} min read</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>

      <Text style={styles.articleTitle}>{item.title}</Text>
      <Text style={styles.articleSummary} numberOfLines={2}>
        {item.summary}
      </Text>

      <View style={styles.tagsContainer}>
        {item.tags.slice(0, 3).map((tag, index) => (
          <Text key={index} style={styles.tag}>
            #{tag}
          </Text>
        ))}
      </View>

      <View style={styles.articleFooter}>
        <View style={styles.statsContainer}>
          <Ionicons name="eye-outline" size={14} color="#666" />
          <Text style={styles.statsText}>{item.views.toLocaleString()} views</Text>
        </View>
        <Text style={styles.lastUpdated}>
          Updated {new Date(item.lastUpdated).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: typeof KNOWLEDGE_CATEGORIES[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        selectedCategory === item.id && styles.categoryCardSelected,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text style={styles.categoryEmoji}>{item.emoji}</Text>
      <Text style={[
        styles.categoryLabel,
        selectedCategory === item.id && styles.categoryLabelSelected,
      ]}>
        {item.label}
      </Text>
      <Text style={[
        styles.categoryCount,
        selectedCategory === item.id && styles.categoryCountSelected,
      ]}>
        {item.count} articles
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Knowledge Base</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.aiButton}
            onPress={() => {
              // For now, show notification about AI assistant
              if (typeof window !== 'undefined' && window.alert) {
                window.alert('🤖 AI Assistant is ready! Ask me anything about crafts, techniques, or tools.');
              } else {
                Alert.alert('AI Assistant', '🤖 AI Assistant is ready! Ask me anything about crafts, techniques, or tools.');
              }
            }}
          >
            <Ionicons name="sparkles" size={16} color="#4CAF50" />
            <Text style={styles.aiButtonText}>AI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={20} color="#8B4513" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search techniques, materials, projects..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <TouchableOpacity
            style={[
              styles.categoryCard,
              selectedCategory === 'all' && styles.categoryCardSelected,
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={styles.categoryEmoji}>🔥</Text>
            <Text style={[
              styles.categoryLabel,
              selectedCategory === 'all' && styles.categoryLabelSelected,
            ]}>
              All Topics
            </Text>
            <Text style={[
              styles.categoryCount,
              selectedCategory === 'all' && styles.categoryCountSelected,
            ]}>
              {MOCK_ARTICLES.length} articles
            </Text>
          </TouchableOpacity>
          {KNOWLEDGE_CATEGORIES.map((category) => (
            <View key={category.id} style={styles.categoryWrapper}>
              {renderCategoryItem({ item: category })}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'popular' && styles.sortButtonActive]}
          onPress={() => setSortBy('popular')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'popular' && styles.sortButtonTextActive]}>
            Popular
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'recent' && styles.sortButtonActive]}
          onPress={() => setSortBy('recent')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'recent' && styles.sortButtonTextActive]}>
            Recent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
          onPress={() => setSortBy('rating')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.sortButtonTextActive]}>
            Rating
          </Text>
        </TouchableOpacity>
      </View>

      {/* Articles List */}
      <FlatList
        data={filteredArticles}
        renderItem={renderArticleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.articlesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No articles found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new content'}
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
  searchButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  categoriesSection: {
    marginTop: 20,
  },
  categoriesScroll: {
    paddingLeft: 20,
  },
  categoryWrapper: {
    marginRight: 15,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryCardSelected: {
    borderColor: '#8B4513',
    backgroundColor: '#F9F5F1',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryLabelSelected: {
    color: '#8B4513',
  },
  categoryCount: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  categoryCountSelected: {
    color: '#8B4513',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    marginTop: 15,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 15,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
  },
  sortButtonActive: {
    backgroundColor: '#8B4513',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  articlesList: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  articleCard: {
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
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  difficultyText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  readTime: {
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  articleSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    fontSize: 11,
    color: '#8B4513',
    backgroundColor: '#F9F5F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 4,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  lastUpdated: {
    fontSize: 11,
    color: '#666',
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  aiButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
}); 