import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import VideoPlayer from './VideoPlayer';

const { width: screenWidth } = Dimensions.get('window');
const itemSize = (screenWidth - 60) / 3; // 3 columns with padding

interface MediaItem {
  id: string;
  uri: string;
  mediaType: 'photo' | 'video';
  filename: string;
  creationTime: number;
  duration?: number;
  isAppSaved?: boolean; // Flag to indicate if this is from our app's Documents directory
  documentsUri?: string; // URI in Documents directory for playback
}

interface MediaGalleryProps {
  onMediaSelect?: (media: MediaItem) => void;
  onClose?: () => void;
  allowMultiSelect?: boolean;
}

export default function MediaGallery({ 
  onMediaSelect, 
  onClose,
  allowMultiSelect = false 
}: MediaGalleryProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(null);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadAppSavedVideos = async (): Promise<MediaItem[]> => {
    try {
      const documentsDir = FileSystem.documentDirectory;
      if (!documentsDir) return [];

      const files = await FileSystem.readDirectoryAsync(documentsDir);
      const videoFiles = files.filter(file => 
        file.toLowerCase().startsWith('craft_video_') && 
        (file.toLowerCase().endsWith('.mov') || file.toLowerCase().endsWith('.mp4'))
      );

      console.log('🎥 Found app-saved videos:', videoFiles);

      const appVideos: MediaItem[] = [];
      
      for (const file of videoFiles) {
        try {
          const fileUri = documentsDir + file;
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          
          if (fileInfo.exists && !fileInfo.isDirectory) {
            // Extract timestamp from filename (craft_video_TIMESTAMP.mov)
            const timestampMatch = file.match(/craft_video_(\d+)\./);
            const creationTime = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();
            
            appVideos.push({
              id: `app_${file}`, // Unique ID for app-saved videos
              uri: fileUri,
              mediaType: 'video',
              filename: file,
              creationTime,
              isAppSaved: true,
              documentsUri: fileUri, // Already in Documents directory
            });
          }
        } catch (error) {
          console.warn('🎥 Error processing app video file:', file, error);
        }
      }

      return appVideos.sort((a, b) => b.creationTime - a.creationTime);
    } catch (error) {
      console.error('🎥 Error loading app-saved videos:', error);
      return [];
    }
  };

  const findDocumentsUriForVideo = async (mediaLibraryItem: MediaItem): Promise<string | null> => {
    try {
      // Try to find a corresponding file in Documents directory
      // Look for files created around the same time (within 1 minute)
      const documentsDir = FileSystem.documentDirectory;
      if (!documentsDir) return null;

      const files = await FileSystem.readDirectoryAsync(documentsDir);
      const videoFiles = files.filter(file => 
        file.toLowerCase().startsWith('craft_video_') && 
        (file.toLowerCase().endsWith('.mov') || file.toLowerCase().endsWith('.mp4'))
      );

      for (const file of videoFiles) {
        const timestampMatch = file.match(/craft_video_(\d+)\./);
        if (timestampMatch) {
          const fileTimestamp = parseInt(timestampMatch[1]);
          const timeDiff = Math.abs(fileTimestamp - mediaLibraryItem.creationTime);
          
          // If created within 2 minutes of each other, likely the same video
          if (timeDiff < 120000) { // 2 minutes in milliseconds
            const documentsUri = `${documentsDir}${file}`;
            const fileInfo = await FileSystem.getInfoAsync(documentsUri);
            if (fileInfo.exists) {
              console.log('🎥 Found Documents URI for media library video:', documentsUri);
              return documentsUri;
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.warn('🎥 Error finding Documents URI for video:', error);
      return null;
    }
  };

  const loadMedia = async () => {
    try {
      // Load app-saved videos first
      const appVideos = await loadAppSavedVideos();
      
      if (!permission?.granted) {
        const permissionResult = await requestPermission();
        if (!permissionResult.granted) {
          // If no permission, just show app-saved videos
          setMediaItems(appVideos);
          setLoading(false);
          return;
        }
      }

      // Get recent media assets from Photos library
      const media = await MediaLibrary.getAssetsAsync({
        first: 100,
        mediaType: ['photo', 'video'],
        sortBy: 'creationTime',
      });

      const mediaLibraryItems: MediaItem[] = [];
      
      for (const asset of media.assets) {
        if (asset.mediaType === 'photo' || asset.mediaType === 'video') {
          const mediaItem: MediaItem = {
            id: asset.id,
            uri: asset.uri,
            mediaType: asset.mediaType as 'photo' | 'video',
            filename: asset.filename,
            creationTime: asset.creationTime,
            duration: asset.duration,
            isAppSaved: false,
          };

          // For videos, try to find corresponding Documents URI
          if (asset.mediaType === 'video') {
            const documentsUri = await findDocumentsUriForVideo(mediaItem);
            if (documentsUri) {
              mediaItem.documentsUri = documentsUri;
            }
          }

          mediaLibraryItems.push(mediaItem);
        }
      }

      // Combine app videos and media library items, removing duplicates
      const allItems = [...appVideos];
      
      // Add media library items that aren't already represented by app videos
      for (const mediaItem of mediaLibraryItems) {
        const isDuplicate = appVideos.some(appVideo => {
          const timeDiff = Math.abs(appVideo.creationTime - mediaItem.creationTime);
          return timeDiff < 120000; // Within 2 minutes
        });
        
        if (!isDuplicate) {
          allItems.push(mediaItem);
        }
      }

      // Sort by creation time (newest first)
      allItems.sort((a, b) => b.creationTime - a.creationTime);
      
      setMediaItems(allItems);
    } catch (error) {
      console.error('Error loading media:', error);
      const message = 'Failed to load media gallery. Please try again.';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMediaPress = async (item: MediaItem) => {
    if (allowMultiSelect) {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedItems(newSelected);
    } else if (item.mediaType === 'video') {
      // For videos, use the best available URI for playback
      try {
        console.log('🎥 Opening video for playback:', item.filename);
        
        let playbackUri = item.uri;
        
        // Prefer Documents URI if available (better permissions)
        if (item.documentsUri) {
          console.log('🎥 Using Documents URI for playback:', item.documentsUri);
          playbackUri = item.documentsUri;
        } else if (item.isAppSaved) {
          console.log('🎥 Using app-saved URI for playback:', item.uri);
          playbackUri = item.uri;
        } else {
          // For media library videos without Documents URI, try to get asset info
          console.log('🎥 Getting media library asset info for:', item.id);
          try {
            const asset = await MediaLibrary.getAssetInfoAsync(item.id);
            console.log('🎥 Asset info:', asset);
            
            // Use localUri if available, otherwise fall back to cleaned URI
            if (asset.localUri) {
              playbackUri = asset.localUri;
              // Clean the URI by removing metadata parameters
              if (playbackUri.includes('#')) {
                playbackUri = playbackUri.split('#')[0];
                console.log('🎥 Cleaned media library URI:', playbackUri);
              }
            }
          } catch (assetError) {
            console.warn('🎥 Could not get asset info, using original URI:', assetError);
          }
        }
        
        // Verify file exists before opening
        try {
          const fileInfo = await FileSystem.getInfoAsync(playbackUri);
          if (!fileInfo.exists) {
            console.error('🎥 Video file does not exist:', playbackUri);
            Alert.alert(
              'Video Not Found',
              'This video file is no longer available. It may have been moved or deleted.',
              [{ text: 'OK', style: 'default' }]
            );
            return;
          }
          console.log('🎥 Video file verified:', {
            uri: playbackUri,
            size: (fileInfo as any).size,
            exists: fileInfo.exists
          });
        } catch (verifyError) {
          console.warn('🎥 Could not verify file, proceeding anyway:', verifyError);
        }
        
        // Create video item with the best playback URI
        const videoItem = {
          ...item,
          uri: playbackUri
        };
        
        console.log('🎥 Opening video with URI:', videoItem.uri);
        setSelectedVideo(videoItem);
        setShowVideoPlayer(true);
      } catch (error) {
        console.error('🎥 Error preparing video for playback:', error);
        Alert.alert(
          'Video Playback Issue',
          'Unable to play this video. Try recording a new video or check if the file still exists.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } else {
      // For photos, use the existing callback
      onMediaSelect?.(item);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedItems.size > 0) {
      const selectedMedia = mediaItems.filter(item => selectedItems.has(item.id));
      // For now, just select the first item - could be enhanced for multi-select
      if (selectedMedia.length > 0 && selectedMedia[0]) {
        onMediaSelect?.(selectedMedia[0]);
      }
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderMediaItem = ({ item }: { item: MediaItem }) => {
    const isSelected = selectedItems.has(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.mediaItem, isSelected && styles.selectedItem]}
        onPress={() => handleMediaPress(item)}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.mediaImage}
          contentFit="cover"
          transition={200}
        />
        
        {/* Video indicator */}
        {item.mediaType === 'video' && (
          <View style={styles.videoOverlay}>
            <Ionicons name="play-circle" size={24} color="white" />
            {item.duration && (
              <Text style={styles.durationText}>
                {formatDuration(item.duration)}
              </Text>
            )}
          </View>
        )}

        {/* Selection indicator */}
        {allowMultiSelect && (
          <View style={styles.selectionIndicator}>
            <View style={[
              styles.selectionCircle,
              isSelected && styles.selectedCircle
            ]}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
          </View>
        )}

        {/* Craft documentation badge */}
        <View style={styles.craftBadge}>
          <Text style={styles.craftBadgeText}>🔨</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="images-outline" size={64} color="#8B4513" />
          <Text style={styles.permissionTitle}>Gallery Access</Text>
          <Text style={styles.permissionMessage}>
            {Platform.OS === 'web' 
              ? "On web, use the camera's gallery button or image picker for photo selection."
              : "SnapCraft needs access to your photo library to display your craft documentation."
            }
          </Text>
          {Platform.OS !== 'web' ? (
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Access</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.permissionButton} onPress={onClose}>
              <Text style={styles.permissionButtonText}>Go Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#8B4513" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Craft Gallery</Text>
        
        {allowMultiSelect && selectedItems.size > 0 && (
          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={handleConfirmSelection}
          >
            <Text style={styles.confirmButtonText}>
              Select ({selectedItems.size})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Media Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your craft documentation...</Text>
        </View>
      ) : mediaItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="camera-outline" size={64} color="#8B4513" />
          <Text style={styles.emptyTitle}>No Craft Documentation Yet</Text>
          <Text style={styles.emptyMessage}>
            Start documenting your craft process by taking photos and videos!
          </Text>
        </View>
      ) : (
        <FlatList
          data={mediaItems}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          📸 {mediaItems.filter(item => item.mediaType === 'photo').length} Photos • 
          🎥 {mediaItems.filter(item => item.mediaType === 'video').length} Videos
        </Text>
      </View>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer
          videoUri={selectedVideo.uri}
          visible={showVideoPlayer}
          onClose={() => {
            setShowVideoPlayer(false);
            setSelectedVideo(null);
          }}
          title={`Craft Video - ${selectedVideo.filename}`}
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  confirmButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  gridContainer: {
    padding: 15,
  },
  mediaItem: {
    width: itemSize,
    height: itemSize,
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedItem: {
    borderWidth: 3,
    borderColor: '#8B4513',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '500',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  craftBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(139, 69, 19, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  craftBadgeText: {
    fontSize: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
}); 