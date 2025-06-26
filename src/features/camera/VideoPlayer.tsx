import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VideoPlayerProps {
  videoUri: string;
  visible: boolean;
  onClose: () => void;
  title?: string;
}

export default function VideoPlayer({ 
  videoUri, 
  visible, 
  onClose, 
  title = "Craft Process Video" 
}: VideoPlayerProps) {
  const [showControls, setShowControls] = useState(true);
  
  // For mock videos, we'll show a placeholder since expo-video can't play mock URIs
  const isMockVideo = videoUri.startsWith('mock://');
  
  const player = useVideoPlayer(isMockVideo ? '' : videoUri, (player) => {
    if (!isMockVideo) {
      player.loop = false;
      player.muted = false;
    }
  });

  const handlePlayPause = () => {
    if (isMockVideo) {
      Alert.alert(
        'Demo Video', 
        'This is a demo video recorded in Expo Go. Real video playback will work in a development build!'
      );
      return;
    }

    try {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      console.error('Error controlling video playback:', error);
      Alert.alert('Error', 'Failed to control video playback');
    }
  };

  const handleRestart = () => {
    if (isMockVideo) {
      Alert.alert(
        'Demo Video', 
        'This is a demo video. Real video controls will work in a development build!'
      );
      return;
    }

    try {
      player.currentTime = 0;
      player.play();
    } catch (error) {
      console.error('Error restarting video:', error);
      Alert.alert('Error', 'Failed to restart video');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVideoPress = () => {
    setShowControls(!showControls);
  };

  const handleClose = () => {
    if (!isMockVideo && player.playing) {
      player.pause();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      supportedOrientations={['portrait', 'landscape']}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Video Player or Mock Placeholder */}
        <TouchableOpacity 
          style={styles.videoContainer} 
          onPress={handleVideoPress}
          activeOpacity={1}
        >
          {isMockVideo ? (
            // Mock video placeholder
            <View style={styles.mockVideoContainer}>
              <View style={styles.mockVideoContent}>
                <Ionicons name="videocam" size={64} color="#8B4513" />
                <Text style={styles.mockVideoTitle}>Demo Video</Text>
                <Text style={styles.mockVideoSubtitle}>
                  This is a demo video recorded in Expo Go
                </Text>
                <Text style={styles.mockVideoNote}>
                  Real video playback available in development builds
                </Text>
              </View>
            </View>
          ) : (
            // Real video player
            <VideoView
              style={styles.video}
              player={player}
              allowsFullscreen
              allowsPictureInPicture
            />
          )}

          {/* Custom Controls Overlay */}
          {showControls && (
            <View style={styles.controlsOverlay}>
              {/* Center Play/Pause Button */}
              <TouchableOpacity 
                style={styles.centerPlayButton}
                onPress={handlePlayPause}
              >
                <View style={styles.playButtonBackground}>
                  <Ionicons 
                    name={isMockVideo ? "play" : (player.playing ? "pause" : "play")} 
                    size={48} 
                    color="white" 
                  />
                </View>
              </TouchableOpacity>

              {/* Bottom Controls */}
              <View style={styles.bottomControls}>
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: isMockVideo 
                            ? '0%' 
                            : `${(player.currentTime / (player.duration || 1)) * 100}%`
                        }
                      ]} 
                    />
                  </View>
                </View>

                {/* Time and Controls */}
                <View style={styles.controlsRow}>
                  <Text style={styles.timeText}>
                    {isMockVideo 
                      ? '0:00 / 0:00 (Demo)'
                      : `${formatTime(player.currentTime)} / ${formatTime(player.duration || 0)}`
                    }
                  </Text>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.controlButton}
                      onPress={handleRestart}
                    >
                      <Ionicons name="refresh" size={24} color="white" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.controlButton}
                      onPress={handlePlayPause}
                    >
                      <Ionicons 
                        name={isMockVideo ? "play" : (player.playing ? "pause" : "play")} 
                        size={24} 
                        color="white" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Video Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="videocam" size={20} color="#8B4513" />
            <Text style={styles.infoText}>
              {isMockVideo ? 'Demo Craft Process Video' : 'Craft Process Documentation'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color="#8B4513" />
            <Text style={styles.infoText}>
              {isMockVideo 
                ? 'Duration: Demo mode (real timing in dev builds)'
                : `Duration: ${formatTime(player.duration || 0)}`
              }
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="hammer" size={20} color="#8B4513" />
            <Text style={styles.infoText}>
              Perfect for sharing techniques and processes
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 44, // Same width as close button for centering
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: screenWidth,
    height: screenHeight * 0.6,
  },
  mockVideoContainer: {
    width: screenWidth,
    height: screenHeight * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  mockVideoContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  mockVideoTitle: {
    color: '#8B4513',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  mockVideoSubtitle: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  mockVideoNote: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerPlayButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 40,
    padding: 16,
  },
  bottomControls: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B4513',
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    padding: 8,
  },
  infoContainer: {
    backgroundColor: '#F5F5DC',
    padding: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
}); 