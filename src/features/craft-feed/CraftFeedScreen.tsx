import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  RefreshControl,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useNotifications } from '../../shared/components/NotificationSystem';
import { CraftAlert } from '../../shared/components';
import { 
  getPosts, 
  updatePostEngagement, 
  likePost, 
  unlikePost, 
  hasUserLikedPost 
} from '../../services/firebase/posts';
import { CraftPost, CraftStory } from '../../shared/types';
import { StoriesBar, StoryViewer, CreateStoryScreen } from '../stories';
import { AuthService } from '../../services/firebase/auth';
import { auth, db, storage, isDemoMode, testFirebaseConnection } from '../../services/firebase/config';
import { AchievementService } from '../../services/achievements/AchievementService';

// Task 4.2: Commenting System
import CommentModal from '../../shared/components/CommentModal';

// Task 4.3: Sharing Functionality
import { SharingService } from '../../services/sharing/SharingService';
import { SharingModal } from '../../shared/components';

// Mock craft posts data for MVP demo
const MOCK_CRAFT_POSTS: CraftPost[] = [
  {
    id: '1',
    userId: 'user1',
    author: {
      id: 'user1',
      displayName: 'Master Woodworker',
      avatar: '🪵',
    },
    content: {
      description: 'Just finished this beautiful oak dining table! 48 hours of careful crafting with traditional joinery techniques.',
      images: ['https://via.placeholder.com/400x300/8B4513/FFFFFF?text=Oak+Table'],
      videos: [],
      materials: ['Oak wood', 'Wood stain', 'Polyurethane finish'],
      timeSpent: 2880, // 48 hours in minutes
      difficulty: 'advanced' as const,
    },
    craftType: 'woodworking' as const,
    techniques: ['Mortise and tenon', 'Hand sanding', 'Traditional finish'],
    tags: ['furniture', 'dining', 'oak', 'handmade'],
    createdAt: new Date('2024-06-24T10:00:00'),
    updatedAt: new Date('2024-06-24T10:00:00'),
    engagement: {
      likes: 24,
      comments: 8,
      shares: 3,
      saves: 12,
    },
    isEphemeral: false,
  },
  {
    id: '2',
    userId: 'user2',
    author: {
      id: 'user2',
      displayName: 'Iron Forge Smith',
      avatar: '⚒️',
    },
    content: {
      description: 'Forged this custom kitchen knife from 1084 steel. Heat treatment was crucial for the perfect hardness.',
      images: ['https://via.placeholder.com/400x300/2F4F4F/FFFFFF?text=Kitchen+Knife'],
      videos: [],
      materials: ['1084 steel', 'Hardwood handle', 'Brass pins'],
      timeSpent: 480, // 8 hours
      difficulty: 'expert' as const,
    },
    craftType: 'blacksmithing' as const,
    techniques: ['Forging', 'Heat treatment', 'Handle wrapping'],
    tags: ['knife', 'kitchen', 'steel', 'forged'],
    createdAt: new Date('2024-06-24T08:30:00'),
    updatedAt: new Date('2024-06-24T08:30:00'),
    engagement: {
      likes: 31,
      comments: 12,
      shares: 5,
      saves: 18,
    },
    isEphemeral: false,
  },
  {
    id: '3',
    userId: 'user3',
    author: {
      id: 'user3',
      displayName: 'Clay Artist',
      avatar: '🏺',
    },
    content: {
      description: 'Wheel-thrown pottery set glazed with my signature earth-tone finish. Each piece is unique!',
      images: ['https://via.placeholder.com/400x300/8B7355/FFFFFF?text=Pottery+Set'],
      videos: [],
      materials: ['Stoneware clay', 'Earth-tone glaze', 'Clear protective coat'],
      timeSpent: 720, // 12 hours
      difficulty: 'intermediate' as const,
    },
    craftType: 'pottery' as const,
    techniques: ['Wheel throwing', 'Glazing', 'Kiln firing'],
    tags: ['pottery', 'ceramic', 'handmade', 'kitchenware'],
    createdAt: new Date('2024-06-24T06:15:00'),
    updatedAt: new Date('2024-06-24T06:15:00'),
    engagement: {
      likes: 19,
      comments: 6,
      shares: 2,
      saves: 9,
    },
    isEphemeral: false,
  },
];

interface CraftFeedScreenProps {
  onCreatePost?: () => void;
}

export default function CraftFeedScreen({ onCreatePost }: CraftFeedScreenProps) {
  const { user } = useAuthStore();
  const { showSuccess, showError, showAchievement, showInfo } = useNotifications();
  const [posts, setPosts] = useState<CraftPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [showPostOptions, setShowPostOptions] = useState<string | null>(null);
  
  // Stories state
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [currentStories, setCurrentStories] = useState<CraftStory[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  // Task 4.2: Commenting System
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<CraftPost | null>(null);

  // Task 4.3: Sharing Functionality
  const [sharingModalVisible, setSharingModalVisible] = useState(false);
  const [selectedPostForSharing, setSelectedPostForSharing] = useState<CraftPost | null>(null);

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    buttons: Array<{
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }>;
    copyable: boolean;
  }>({
    title: '',
    message: '',
    buttons: [],
    copyable: false,
  });

  // Load posts from Firebase
  const loadPosts = async () => {
    try {
      console.log('📄 Loading posts from Firebase...');
      console.log('🔍 Auth state:', { user: !!user, userId: user?.id });
      
      // Check if user is authenticated
      if (!user) {
        console.log('⚠️ User not authenticated, using mock data');
        setPosts(MOCK_CRAFT_POSTS);
        setError('Authentication required for live data');
        showInfo('Demo Mode', 'Sign in to see live content');
        setLoading(false);
        return;
      }
      
      const fetchedPosts = await getPosts(50);
      setPosts(fetchedPosts);
      setError(null); // Clear any previous errors
      console.log(`✅ Loaded ${fetchedPosts.length} posts`);
      
      // Load user's existing likes
      await loadUserLikes(fetchedPosts);
    } catch (err) {
      console.error('❌ Error loading posts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      // Fallback to mock data if Firebase fails
      setPosts(MOCK_CRAFT_POSTS);
      showError('Failed to load posts', 'Using cached content');
    } finally {
      setLoading(false);
    }
  };

  // Load user's existing likes for all posts
  const loadUserLikes = async (postsToCheck: CraftPost[]) => {
    if (!user) return;
    
    try {
      console.log('❤️ Loading user likes...');
      const likedPostIds = new Set<string>();
      
      // Check each post to see if user has liked it
      for (const post of postsToCheck) {
        try {
          const hasLiked = await hasUserLikedPost(post.id, user.id);
          if (hasLiked) {
            likedPostIds.add(post.id);
          }
        } catch (error) {
          console.warn(`⚠️ Error checking like for post ${post.id}:`, error);
        }
      }
      
      setLikedPosts(likedPostIds);
      console.log(`✅ Loaded ${likedPostIds.size} liked posts for user`);
    } catch (error) {
      console.error('❌ Error loading user likes:', error);
    }
  };

  // Load posts on component mount and when user changes
  useEffect(() => {
    loadPosts();
  }, [user]); // Reload when user authentication state changes

  // Setup custom alert handler for SharingService
  useEffect(() => {
    const showCustomAlert = (
      title: string,
      message: string,
      buttons?: Array<{
        text: string;
        style?: 'default' | 'cancel' | 'destructive';
        onPress?: () => void;
      }>,
      copyable?: boolean
    ) => {
      setAlertConfig({
        title,
        message,
        buttons: buttons || [{ text: 'OK', style: 'default' }],
        copyable: copyable || false,
      });
      setAlertVisible(true);
    };

    SharingService.setCustomAlertHandler(showCustomAlert);
  }, []);

  // Refresh feed
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPosts();
    } catch (error) {
      console.error('❌ Error refreshing posts:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle post interactions
  const handleLike = async (postId: string) => {
    if (!user) {
      showError('Authentication Required', 'Please sign in to like posts');
      return;
    }

    const isLiked = likedPosts.has(postId);
    
    try {
      let newLikeCount: number;
      
      if (isLiked) {
        // Unlike the post
        console.log('💔 Unliking post:', postId);
        newLikeCount = await unlikePost(postId, user.id);
        
        // Update local state
        const newLikedPosts = new Set(likedPosts);
        newLikedPosts.delete(postId);
        setLikedPosts(newLikedPosts);
        
        showInfo('Unliked', 'Post removed from your liked crafts');
      } else {
        // Like the post
        console.log('❤️ Liking post:', postId);
        newLikeCount = await likePost(postId, user.id);
        
        // Update local state
        const newLikedPosts = new Set(likedPosts);
        newLikedPosts.add(postId);
        setLikedPosts(newLikedPosts);
        
        showSuccess('Liked!', 'Post added to your liked crafts');
        
        // Simulate achievement unlock for first like
        if (likedPosts.size === 0) {
          setTimeout(() => {
            showAchievement(
              'First Like!',
              'You liked your first craft post. Keep engaging with the community!',
              {
                label: 'View Achievement',
                onPress: () => console.log('Navigate to achievements'),
              }
            );
          }, 1000);
        }
      }
      
      // Update post engagement count in local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                engagement: { 
                  ...post.engagement, 
                  likes: newLikeCount
                } 
              }
            : post
        )
      );
      
    } catch (error) {
      console.error('❌ Error handling like:', error);
      showError('Like Failed', 'Unable to update like status. Please try again.');
    }
  };

  const handleComment = (postId: string) => {
    console.log('💬 Opening comments for post:', postId);
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPostForComments(post);
      setCommentModalVisible(true);
    }
  };

  const handleShare = (postId: string) => {
    console.log('📤 Opening sharing modal for post:', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) {
      showError('Share Error', 'Post not found');
      return;
    }

    setSelectedPostForSharing(post);
    setSharingModalVisible(true);
  };

  const handleShareComplete = (result: any) => {
    if (result.success) {
      showSuccess('Shared Successfully!', 'Thanks for spreading craft knowledge');
      
      // Track sharing analytics
      SharingService.trackShareEvent(
        selectedPostForSharing?.id || '', 
        result.activityType || 'unknown', 
        user?.id
      );
      
      // Update post engagement (increment share count)
      if (selectedPostForSharing) {
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === selectedPostForSharing.id
              ? {
                  ...p,
                  engagement: {
                    ...p.engagement,
                    shares: p.engagement.shares + 1
                  }
                }
              : p
          )
        );
      }
    } else {
      showError('Share Failed', result.error || 'Unable to share at this time');
    }
  };

  const handleSave = (postId: string) => {
    showSuccess('Post saved!', 'Added to your saved projects');
    console.log('💾 Save post:', postId);
  };

  // Post options handlers
  const handlePostOptions = (postId: string) => {
    setShowPostOptions(showPostOptions === postId ? null : postId);
  };

  const handleSaveToList = (postId: string) => {
    const newSavedPosts = new Set(savedPosts);
    const isSaved = savedPosts.has(postId);
    
    if (isSaved) {
      newSavedPosts.delete(postId);
      showInfo('Removed from saved', 'Post removed from your saved list');
    } else {
      newSavedPosts.add(postId);
      showSuccess('Saved to list!', 'Added to your saved projects');
    }
    
    setSavedPosts(newSavedPosts);
    setShowPostOptions(null);
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
            showSuccess('Post deleted', 'Your post has been removed');
            setShowPostOptions(null);
          },
        },
      ]
    );
  };

  const handleReportPost = (postId: string) => {
    Alert.alert(
      'Report Post',
      'Why are you reporting this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Inappropriate content', onPress: () => submitReport(postId, 'inappropriate') },
        { text: 'Spam', onPress: () => submitReport(postId, 'spam') },
        { text: 'Copyright violation', onPress: () => submitReport(postId, 'copyright') },
        { text: 'Other', onPress: () => submitReport(postId, 'other') },
      ]
    );
    setShowPostOptions(null);
  };

  const submitReport = (postId: string, reason: string) => {
    // In a real app, this would send the report to your backend
    showSuccess('Report submitted', 'Thank you for helping keep our community safe');
    console.log('🚨 Report submitted:', { postId, reason });
  };

  const handleCopyLink = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const result = await SharingService.copyPostLink(post);
    if (result.success) {
      showSuccess('Link copied!', 'Post link copied to clipboard');
    } else {
      showError('Copy failed', result.error || 'Unable to copy link');
    }
    setShowPostOptions(null);
  };

  const handleHidePost = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    showInfo('Post hidden', 'You won\'t see posts from this user anymore');
    setShowPostOptions(null);
  };

  // Story handlers
  const handleStoryPress = (story: CraftStory, allStories: CraftStory[]) => {
    setCurrentStories(allStories);
    setCurrentStoryIndex(allStories.findIndex(s => s.id === story.id));
    setShowStoryViewer(true);
  };

  const handleCreateStoryPress = () => {
    setShowCreateStory(true);
  };

  const handleStoryCreated = (story: CraftStory) => {
    console.log('✅ Story created:', story.id);
    showSuccess('Story Shared!', 'Your story is now live for 24 hours');
  };

  const handleCloseStoryViewer = () => {
    setShowStoryViewer(false);
    setCurrentStories([]);
    setCurrentStoryIndex(0);
  };

  const handleCloseCreateStory = () => {
    setShowCreateStory(false);
  };

  // Format time spent
  const formatTimeSpent = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      case 'expert': return '#9C27B0';
      default: return '#757575';
    }
  };

  // Use demo data if demo mode is enabled or if there are Firebase errors
  const displayPosts = isDemoMode || error ? MOCK_CRAFT_POSTS : posts;

  // Debug Firebase initialization (development only)
  useEffect(() => {
    if (__DEV__) {
      console.log('🔍 Firebase Debug Info:');
      console.log('- isDemoMode:', isDemoMode);
      console.log('- auth:', !!auth);
      console.log('- db:', !!db);
      console.log('- storage:', !!storage);
    }
  }, []);

  // Render craft post
  const renderCraftPost = ({ item }: { item: typeof MOCK_CRAFT_POSTS[0] }) => {
    const isLiked = likedPosts.has(item.id);
    const isSaved = savedPosts.has(item.id);
    const isOwnPost = user?.id === item.userId;
    const showOptions = showPostOptions === item.id;
    
    return (
      <View style={styles.postContainer}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <Text style={styles.authorAvatar}>{item.author.avatar}</Text>
            <View style={styles.authorDetails}>
              <Text style={styles.authorName}>{item.author.displayName}</Text>
              <Text style={styles.postTime}>
                {item.createdAt.toLocaleDateString()} • {item.craftType}
              </Text>
            </View>
          </View>
          <View style={styles.postOptionsContainer}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => handlePostOptions(item.id)}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#8B4513" />
            </TouchableOpacity>
            
            {/* Options Dropdown */}
            {showOptions && (
              <View style={styles.optionsDropdown}>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleSaveToList(item.id)}
                >
                  <Ionicons 
                    name={isSaved ? "bookmark" : "bookmark-outline"} 
                    size={18} 
                    color="#8B4513" 
                  />
                  <Text style={styles.optionText}>
                    {isSaved ? 'Remove from saved' : 'Save to list'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleCopyLink(item.id)}
                >
                  <Ionicons name="link-outline" size={18} color="#8B4513" />
                  <Text style={styles.optionText}>Copy link</Text>
                </TouchableOpacity>
                
                {isOwnPost ? (
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => handleDeletePost(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF4444" />
                    <Text style={[styles.optionText, { color: '#FF4444' }]}>Delete post</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.optionItem}
                      onPress={() => handleHidePost(item.id)}
                    >
                      <Ionicons name="eye-off-outline" size={18} color="#8B4513" />
                      <Text style={styles.optionText}>Hide post</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.optionItem}
                      onPress={() => handleReportPost(item.id)}
                    >
                      <Ionicons name="flag-outline" size={18} color="#FF4444" />
                      <Text style={[styles.optionText, { color: '#FF4444' }]}>Report post</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Post Content */}
        <Text style={styles.postDescription}>{item.content.description}</Text>

        {/* Post Image */}
        {item.content.images.length > 0 && (
          <Image source={{ uri: item.content.images[0] }} style={styles.postImage} />
        )}

        {/* Post Details */}
        <View style={styles.postDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#8B4513" />
            <Text style={styles.detailText}>Time: {formatTimeSpent(item.content.timeSpent)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="bar-chart-outline" size={16} color={getDifficultyColor(item.content.difficulty)} />
            <Text style={[styles.detailText, { color: getDifficultyColor(item.content.difficulty) }]}>
              {item.content.difficulty.charAt(0).toUpperCase() + item.content.difficulty.slice(1)}
            </Text>
          </View>
        </View>

        {/* Materials */}
        <View style={styles.materialsContainer}>
          <Text style={styles.materialsTitle}>Materials:</Text>
          <View style={styles.materialsList}>
            {item.content.materials.map((material, index) => (
              <Text key={index} style={styles.materialTag}>
                {material}
              </Text>
            ))}
          </View>
        </View>

        {/* Techniques */}
        <View style={styles.techniquesContainer}>
          <Text style={styles.techniquesTitle}>Techniques:</Text>
          <View style={styles.techniquesList}>
            {item.techniques.map((technique, index) => (
              <Text key={index} style={styles.techniqueTag}>
                {technique}
              </Text>
            ))}
          </View>
        </View>

        {/* Engagement Bar */}
        <View style={styles.engagementBar}>
          <TouchableOpacity 
            style={styles.engagementButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={20} 
              color={isLiked ? "#FF4444" : "#8B4513"} 
            />
            <Text style={[styles.engagementText, isLiked && styles.likedText]}>
              {item.engagement.likes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.engagementButton}
            onPress={() => handleComment(item.id)}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#8B4513" />
            <Text style={styles.engagementText}>{item.engagement.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.engagementButton}
            onPress={() => handleShare(item.id)}
          >
            <Ionicons name="share-outline" size={20} color="#8B4513" />
            <Text style={styles.engagementText}>{item.engagement.shares}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.engagementButton}
            onPress={() => handleSave(item.id)}
          >
            <Ionicons name="bookmark-outline" size={20} color="#8B4513" />
            <Text style={styles.engagementText}>{item.engagement.saves}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Environment Indicator */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            {error.includes('permissions') || error.includes('Authentication') 
              ? '🔐 Sign in to access live content' 
              : `⚠️ Using cached content - ${error}`}
          </Text>
          {(error.includes('permissions') || error.includes('Authentication')) && (
            <Text style={styles.errorSubtext}>
              Currently showing demo content
            </Text>
          )}
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔨 Craft Feed</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={onCreatePost}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stories Bar */}
      {user && (
        <StoriesBar
          currentUserId={user.id}
          onStoryPress={handleStoryPress}
          onCreateStoryPress={handleCreateStoryPress}
        />
      )}

      {/* Welcome Message for New Users */}
      {user && (
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            Welcome, {user.displayName}! 👋 Discover amazing craft projects from the community.
          </Text>
        </View>
      )}

      {/* Craft Feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading craft projects...</Text>
        </View>
      ) : displayPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptyMessage}>
            Be the first to share your craft project with the community!
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayPosts}
          renderItem={renderCraftPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feedContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8B4513"
              colors={["#8B4513"]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Story Viewer Modal */}
      <Modal
        visible={showStoryViewer}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {showStoryViewer && currentStories.length > 0 && user && (
          <StoryViewer
            stories={currentStories}
            initialStoryIndex={currentStoryIndex}
            currentUserId={user.id}
            onClose={handleCloseStoryViewer}
            onStoryEnd={handleCloseStoryViewer}
          />
        )}
      </Modal>

      {/* Create Story Modal */}
      <Modal
        visible={showCreateStory}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {showCreateStory && user && (
          <CreateStoryScreen
            currentUserId={user.id}
            currentUserName={user.displayName}
            currentUserAvatar={user.avatar}
            onClose={handleCloseCreateStory}
            onStoryCreated={handleStoryCreated}
          />
        )}
      </Modal>

      {/* Task 4.2: Comment Modal */}
      {selectedPostForComments && (
        <CommentModal
          visible={commentModalVisible}
          postId={selectedPostForComments.id}
          postAuthor={selectedPostForComments.author.displayName}
          initialCommentCount={selectedPostForComments.engagement.comments}
          onClose={() => {
            setCommentModalVisible(false);
            setSelectedPostForComments(null);
          }}
          onCommentCountChange={(count) => {
            // Update post comment count in local state
            setPosts(prevPosts =>
              prevPosts.map(post =>
                post.id === selectedPostForComments.id
                  ? {
                      ...post,
                      engagement: {
                        ...post.engagement,
                        comments: count
                      }
                    }
                  : post
              )
            );
          }}
        />
      )}

      {/* Task 4.3: Custom Sharing Modal */}
      <SharingModal
        visible={sharingModalVisible}
        post={selectedPostForSharing}
        onClose={() => {
          setSharingModalVisible(false);
          setSelectedPostForSharing(null);
        }}
        onShareComplete={handleShareComplete}
      />

      {/* Custom Craft Alert */}
      <CraftAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        copyable={alertConfig.copyable}
        onClose={() => setAlertVisible(false)}
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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#8B4513',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  feedContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  postContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    fontSize: 24,
    marginRight: 10,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  postOptionsContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
    marginLeft: -20,
  },
  optionsDropdown: {
    position: 'absolute',
    right: -10,
    top: 35,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    zIndex: 1000,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  postDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  materialsContainer: {
    marginBottom: 12,
  },
  materialsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 6,
  },
  materialsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  materialTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    color: '#666',
    marginRight: 6,
    marginBottom: 4,
  },
  techniquesContainer: {
    marginBottom: 15,
  },
  techniquesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 6,
  },
  techniquesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  techniqueTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    color: '#4CAF50',
    marginRight: 6,
    marginBottom: 4,
  },
  engagementBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  engagementText: {
    fontSize: 12,
    color: '#8B4513',
    marginLeft: 4,
  },
  likedText: {
    color: '#FF4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#8B4513',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBanner: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  errorBannerText: {
    fontSize: 14,
    color: '#8B4513',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
}); 