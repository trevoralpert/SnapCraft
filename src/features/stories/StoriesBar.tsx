import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CraftStory } from '../../shared/types';
import { getActiveStories } from '../../services/firebase/stories';
import { getStoryThumbnail } from '../../services/firebase/thumbnails';
import { StoryViewCount } from '../../shared/components/StoryViewCount';
import { StoryViewersModal } from '../../shared/components/StoryViewersModal';

const { width } = Dimensions.get('window');
const STORY_SIZE = 70;

interface StoriesBarProps {
  currentUserId: string;
  onStoryPress: (story: CraftStory, allStories: CraftStory[]) => void;
  onCreateStoryPress: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  currentUserId,
  onStoryPress,
  onCreateStoryPress,
}) => {
  const [stories, setStories] = useState<CraftStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewersModalVisible, setViewersModalVisible] = useState(false);
  const [selectedStoryForViewers, setSelectedStoryForViewers] = useState<CraftStory | null>(null);

  // Group stories by user (latest story per user) and separate current user's story
  const { currentUserStory, otherUsersStories } = React.useMemo(() => {
    const userStoriesMap = new Map<string, CraftStory>();
    
    stories.forEach(story => {
      const existingStory = userStoriesMap.get(story.userId);
      if (!existingStory || story.createdAt > existingStory.createdAt) {
        userStoriesMap.set(story.userId, story);
      }
    });
    
    const allGroupedStories = Array.from(userStoriesMap.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const currentUserStory = allGroupedStories.find(story => story.userId === currentUserId);
    const otherUsersStories = allGroupedStories.filter(story => story.userId !== currentUserId);
    
    return { currentUserStory, otherUsersStories };
  }, [stories, currentUserId]);

  const loadStories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const activeStories = await getActiveStories(100);
      setStories(activeStories);
      
      console.log(`📖 Loaded ${activeStories.length} active stories`);
    } catch (err) {
      console.error('Error loading stories:', err);
      setError('Failed to load stories');
      
      // Fallback to mock data for demo
      const mockStories: CraftStory[] = [
        {
          id: 'story1',
          userId: 'user1',
          author: {
            id: 'user1',
            displayName: 'Marcus Forge',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          },
          content: {
            imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=600&fit=crop',
            text: 'Morning forge session 🔥',
          },
          craftType: 'metalworking',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22 hours from now
          views: [],
          isActive: true,
        },
        {
          id: 'story2',
          userId: 'user2',
          author: {
            id: 'user2',
            displayName: 'Sarah Wood',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c1b5?w=150&h=150&fit=crop&crop=face',
          },
          content: {
            imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=600&fit=crop',
            text: 'Hand-carved spoon progress',
          },
          craftType: 'woodworking',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20 hours from now
          views: [],
          isActive: true,
        },
      ];
      setStories(mockStories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleStoryPress = (story: CraftStory) => {
    // Get all stories from the same user for the viewer
    const userStories = stories.filter(s => s.userId === story.userId);
    onStoryPress(story, userStories);
  };

  const hasUserViewed = (story: CraftStory): boolean => {
    return story.views.some(view => view.userId === currentUserId);
  };

  const getTotalViews = (story: CraftStory): number => {
    return story.views.reduce((sum, view) => sum + (view.viewCount || 1), 0);
  };

  const handleViewCountPress = (story: CraftStory) => {
    setSelectedStoryForViewers(story);
    setViewersModalVisible(true);
  };

  const renderStoryItem = (story: CraftStory, index: number) => {
    const isViewed = hasUserViewed(story);
    
    return (
      <TouchableOpacity
        key={story.id}
        style={styles.storyContainer}
        onPress={() => handleStoryPress(story)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isViewed ? ['#C0C0C0', '#A0A0A0'] : ['#8B4513', '#D2691E', '#CD853F']}
          style={styles.storyGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.storyInner}>
            {getStoryThumbnail(story) ? (
              <Image source={{ uri: getStoryThumbnail(story)! }} style={styles.storyImage} />
            ) : story.content.videoUrl ? (
              // For video stories without thumbnails, show a video placeholder
              <View style={[styles.storyImage, styles.videoPlaceholder]}>
                <Ionicons name="videocam" size={30} color="#8B4513" />
              </View>
            ) : story.author.avatar ? (
              <Image source={{ uri: story.author.avatar }} style={styles.storyImage} />
            ) : (
              <View style={[styles.storyImage, styles.placeholderAvatar]}>
                <Ionicons name="person" size={30} color="#8B4513" />
              </View>
            )}
            {story.content.videoUrl && (
              <View style={styles.videoIndicator}>
                <Ionicons name="play-circle" size={16} color="white" />
              </View>
            )}
          </View>
        </LinearGradient>
        <Text style={styles.storyUsername} numberOfLines={1}>
          {story.author.displayName}
        </Text>
        {getTotalViews(story) > 0 && (
          <StoryViewCount
            viewCount={getTotalViews(story)}
            size="small"
            color="#666"
            onPress={() => handleViewCountPress(story)}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderCreateStoryButton = () => {
    const hasCurrentUserStory = !!currentUserStory;
    
    return (
      <View style={styles.storyContainer}>
        {hasCurrentUserStory ? (
          // Show user's story with add button
          <>
            <View style={styles.userStoryContainer}>
              <TouchableOpacity
                onPress={() => handleStoryPress(currentUserStory!)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4CAF50', '#8BC34A']} // Green gradient for user's own story
                  style={styles.storyGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.storyInner}>
                    {getStoryThumbnail(currentUserStory) ? (
                      <Image source={{ uri: getStoryThumbnail(currentUserStory)! }} style={styles.storyImage} />
                    ) : currentUserStory.content.videoUrl ? (
                      <View style={[styles.storyImage, styles.videoPlaceholder]}>
                        <Ionicons name="videocam" size={30} color="#8B4513" />
                      </View>
                    ) : currentUserStory.content.imageUrl ? (
                      <Image source={{ uri: currentUserStory.content.imageUrl }} style={styles.storyImage} />
                    ) : (
                      <View style={[styles.storyImage, styles.placeholderAvatar]}>
                        <Ionicons name="person" size={30} color="#8B4513" />
                      </View>
                    )}
                    {currentUserStory.content.videoUrl && (
                      <View style={styles.videoIndicator}>
                        <Ionicons name="play-circle" size={16} color="white" />
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              
              {/* Add Story Button */}
              <TouchableOpacity 
                style={styles.addStoryButton}
                onPress={onCreateStoryPress}
                activeOpacity={0.8}
              >
                <View style={styles.addStoryButtonInner}>
                  <Ionicons name="add" size={16} color="white" />
                </View>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.storyUsername} numberOfLines={1}>
              Your Story
            </Text>
            {getTotalViews(currentUserStory) > 0 && (
              <StoryViewCount
                viewCount={getTotalViews(currentUserStory)}
                size="small"
                color="#666"
                onPress={() => handleViewCountPress(currentUserStory)}
              />
            )}
          </>
        ) : (
          // Show create story button
          <TouchableOpacity
            onPress={onCreateStoryPress}
            activeOpacity={0.8}
          >
            <View style={styles.createStoryContainer}>
              <View style={styles.createStoryButton}>
                <Ionicons name="add" size={30} color="#8B4513" />
              </View>
              <View style={styles.createStoryPlus}>
                <Ionicons name="add-circle" size={20} color="#8B4513" />
              </View>
            </View>
            <Text style={styles.storyUsername}>Your Story</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🔄 Loading craft stories...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
      >
        {renderCreateStoryButton()}
        {otherUsersStories.map((story, index) => renderStoryItem(story, index))}
      </ScrollView>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>📱 Demo mode - showing sample stories</Text>
        </View>
      )}

      {/* Story Viewers Modal */}
      <StoryViewersModal
        visible={viewersModalVisible}
        onClose={() => setViewersModalVisible(false)}
        storyId={selectedStoryForViewers?.id || ''}
        storyOwnerId={selectedStoryForViewers?.userId || ''}
        currentUserId={currentUserId}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5DC',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContainer: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  storyContainer: {
    alignItems: 'center',
    marginRight: 15,
    width: STORY_SIZE + 10,
  },
  storyGradient: {
    width: STORY_SIZE + 6,
    height: STORY_SIZE + 6,
    borderRadius: (STORY_SIZE + 6) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyInner: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    backgroundColor: '#F5F5DC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5F5DC',
  },
  storyImage: {
    width: STORY_SIZE - 8,
    height: STORY_SIZE - 8,
    borderRadius: (STORY_SIZE - 8) / 2,
    backgroundColor: '#E5E5E5',
  },
  placeholderAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 2,
  },
  storyUsername: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
    fontWeight: '500',
  },
  createStoryContainer: {
    width: STORY_SIZE + 6,
    height: STORY_SIZE + 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  createStoryButton: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    backgroundColor: '#F5F5DC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B4513',
    borderStyle: 'dashed',
  },
  createStoryPlus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#F5F5DC',
    borderRadius: 10,
  },
  userStoryContainer: {
    position: 'relative',
    width: STORY_SIZE + 6,
    height: STORY_SIZE + 6,
  },
  addStoryButton: {
    position: 'absolute',
    top: -2,
    right: -2,
    zIndex: 10,
  },
  addStoryButtonInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5F5DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#8B4513',
    fontSize: 14,
  },
  errorContainer: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  errorText: {
    color: '#CD853F',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 