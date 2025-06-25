import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CraftStory } from '../../shared/types';
import { markStoryAsViewed } from '../../services/firebase/stories';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story
const PROGRESS_BAR_HEIGHT = 3;

interface StoryViewerProps {
  stories: CraftStory[];
  initialStoryIndex: number;
  currentUserId: string;
  onClose: () => void;
  onStoryEnd: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialStoryIndex,
  currentUserId,
  onClose,
  onStoryEnd,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentStory = stories[currentIndex];

  // Mark story as viewed when it starts
  useEffect(() => {
    if (currentStory && currentUserId !== currentStory.userId) {
      markStoryAsViewed(currentStory.id, currentUserId).catch(err => {
        console.error('Failed to mark story as viewed:', err);
      });
    }
  }, [currentStory, currentUserId]);

  // Progress animation
  useEffect(() => {
    if (isPaused) return;

    progressAnim.setValue(0);
    
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        nextStory();
      }
    });

    return () => animation.stop();
  }, [currentIndex, isPaused]);

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onStoryEnd();
    }
  };

  const previousStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleTapLeft = () => {
    previousStory();
  };

  const handleTapRight = () => {
    nextStory();
  };

  const handleLongPressStart = () => {
    setIsPaused(true);
  };

  const handleLongPressEnd = () => {
    setIsPaused(false);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m`;
    } else {
      return 'now';
    }
  };

  const renderProgressBars = () => (
    <View style={styles.progressContainer}>
      {stories.map((_, index) => (
        <View key={index} style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width:
                  index < currentIndex
                    ? '100%'
                    : index === currentIndex
                    ? progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      })
                    : '0%',
              },
            ]}
          />
        </View>
      ))}
    </View>
  );

  const renderStoryContent = () => {
    if (!currentStory) return null;

    return (
      <View style={styles.storyContentContainer}>
        {currentStory.content.imageUrl && (
          <Image
            source={{ uri: currentStory.content.imageUrl }}
            style={styles.storyImage}
            resizeMode="cover"
          />
        )}
        
        {currentStory.content.text && (
          <View style={styles.textOverlay}>
            <Text style={styles.storyText}>{currentStory.content.text}</Text>
          </View>
        )}
        
        {currentStory.content.backgroundColor && !currentStory.content.imageUrl && (
          <View style={[styles.colorBackground, { backgroundColor: currentStory.content.backgroundColor }]} />
        )}
      </View>
    );
  };

  const renderHeader = () => {
    if (!currentStory) return null;
    
    return (
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.headerContainer}>
          <View style={styles.userInfo}>
            {currentStory.author.avatar ? (
              <Image source={{ uri: currentStory.author.avatar }} style={styles.userAvatar} />
            ) : (
              <View style={[styles.userAvatar, styles.placeholderAvatar]}>
                <Ionicons name="person" size={16} color="#8B4513" />
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.username}>{currentStory.author.displayName}</Text>
              <Text style={styles.timestamp}>{formatTimeAgo(currentStory.createdAt)}</Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  };

  const renderTapAreas = () => (
    <>
      <TouchableOpacity
        style={styles.tapAreaLeft}
        onPress={handleTapLeft}
        onLongPress={handleLongPressStart}
        onPressOut={handleLongPressEnd}
        activeOpacity={1}
      />
      <TouchableOpacity
        style={styles.tapAreaRight}
        onPress={handleTapRight}
        onLongPress={handleLongPressStart}
        onPressOut={handleLongPressEnd}
        activeOpacity={1}
      />
    </>
  );

  if (!currentStory) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {renderStoryContent()}
      {renderProgressBars()}
      {renderHeader()}
      {renderTapAreas()}
      
      {isPaused && (
        <View style={styles.pausedOverlay}>
          <Ionicons name="pause" size={40} color="white" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  storyContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
  colorBackground: {
    width: width,
    height: height,
    position: 'absolute',
  },
  textOverlay: {
    position: 'absolute',
    bottom: height * 0.3,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  storyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  progressContainer: {
    position: 'absolute',
    top: StatusBar.currentHeight || 44,
    left: 8,
    right: 8,
    flexDirection: 'row',
    zIndex: 100,
  },
  progressBarContainer: {
    flex: 1,
    height: PROGRESS_BAR_HEIGHT,
    marginHorizontal: 2,
    position: 'relative',
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 99,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  placeholderAvatar: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  closeButton: {
    padding: 5,
  },
  tapAreaLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: width * 0.3,
    height: height,
    zIndex: 50,
  },
  tapAreaRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: width * 0.7,
    height: height,
    zIndex: 50,
  },
  pausedOverlay: {
    position: 'absolute',
    top: height * 0.5 - 20,
    left: width * 0.5 - 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
}); 