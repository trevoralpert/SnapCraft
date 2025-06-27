import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserStories } from '../../services/firebase/stories';
import { CraftStory } from '../../shared/types';
import { StoryAnalyticsDashboard } from '../../shared/components/StoryAnalyticsDashboard';

interface StoryAnalyticsScreenProps {
  currentUserId: string;
  onBack: () => void;
}

export const StoryAnalyticsScreen: React.FC<StoryAnalyticsScreenProps> = ({
  currentUserId,
  onBack,
}) => {
  const [userStories, setUserStories] = useState<CraftStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<CraftStory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserStories();
  }, [currentUserId]);

  const loadUserStories = async () => {
    try {
      setLoading(true);
      setError(null);
      const stories = await getUserStories(currentUserId, 50);
      setUserStories(stories);
    } catch (err) {
      console.error('Failed to load user stories:', err);
      setError('Failed to load your stories');
    } finally {
      setLoading(false);
    }
  };

  const getTotalViews = (story: CraftStory): number => {
    return story.views.reduce((sum, view) => sum + (view.viewCount || 1), 0);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    }
  };

  const renderStoryItem = ({ item }: { item: CraftStory }) => {
    const viewCount = getTotalViews(item);
    const isExpired = item.expiresAt < new Date();
    
    return (
      <TouchableOpacity
        style={[styles.storyItem, isExpired && styles.expiredStory]}
        onPress={() => setSelectedStory(item)}
        activeOpacity={0.7}
      >
        <View style={styles.storyPreview}>
          {item.content.imageUrl ? (
            <Image source={{ uri: item.content.imageUrl }} style={styles.storyThumbnail} />
          ) : item.content.videoUrl ? (
            <View style={[styles.storyThumbnail, styles.videoPlaceholder]}>
              <Ionicons name="videocam" size={24} color="#8B4513" />
            </View>
          ) : (
            <View style={[styles.storyThumbnail, styles.textPlaceholder]}>
              <Ionicons name="text" size={24} color="#8B4513" />
            </View>
          )}
          {isExpired && (
            <View style={styles.expiredOverlay}>
              <Ionicons name="time" size={16} color="white" />
            </View>
          )}
        </View>
        
        <View style={styles.storyInfo}>
          <View style={styles.storyHeader}>
            <Text style={styles.storyDate}>{formatTimeAgo(item.createdAt)}</Text>
            <Text style={[styles.storyStatus, isExpired ? styles.expiredText : styles.activeText]}>
              {isExpired ? 'Expired' : 'Active'}
            </Text>
          </View>
          
          {item.content.text && (
            <Text style={styles.storyText} numberOfLines={2}>
              {item.content.text}
            </Text>
          )}
          
          <View style={styles.storyStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye" size={16} color="#666" />
              <Text style={styles.statText}>{viewCount} views</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people" size={16} color="#666" />
              <Text style={styles.statText}>{item.views.length} viewers</Text>
            </View>
            {item.craftType && (
              <View style={styles.craftTypeBadge}>
                <Text style={styles.craftTypeText}>{item.craftType}</Text>
              </View>
            )}
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="analytics" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Stories Yet</Text>
      <Text style={styles.emptyText}>
        Create your first craft story to see analytics and engagement metrics.
      </Text>
    </View>
  );

  if (selectedStory) {
    return (
      <StoryAnalyticsDashboard
        storyId={selectedStory.id}
        onClose={() => setSelectedStory(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#8B4513" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Story Analytics</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={loadUserStories} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#8B4513" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading your stories...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadUserStories} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : userStories.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Your Stories Summary</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{userStories.length}</Text>
                <Text style={styles.summaryLabel}>Total Stories</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {userStories.reduce((sum, story) => sum + getTotalViews(story), 0)}
                </Text>
                <Text style={styles.summaryLabel}>Total Views</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {userStories.filter(story => story.expiresAt > new Date()).length}
                </Text>
                <Text style={styles.summaryLabel}>Active Stories</Text>
              </View>
            </View>
          </View>

          <FlatList
            data={userStories}
            renderItem={renderStoryItem}
            keyExtractor={(item) => item.id}
            style={styles.storiesList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
  },
  refreshButton: {
    padding: 8,
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  storiesList: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  storyItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expiredStory: {
    opacity: 0.7,
  },
  storyPreview: {
    position: 'relative',
    marginRight: 12,
  },
  storyThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f4f8',
  },
  expiredOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 2,
  },
  storyInfo: {
    flex: 1,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  storyDate: {
    fontSize: 12,
    color: '#666',
  },
  storyStatus: {
    fontSize: 11,
    fontWeight: '500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeText: {
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  expiredText: {
    color: '#ff4444',
    backgroundColor: '#FFE8E8',
  },
  storyText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  storyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  craftTypeBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  craftTypeText: {
    fontSize: 10,
    color: '#8B4513',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
}); 