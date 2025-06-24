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
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const itemSize = (screenWidth - 60) / 3; // 3 columns with padding

interface MediaItem {
  id: string;
  uri: string;
  mediaType: 'photo' | 'video';
  filename: string;
  creationTime: number;
  duration?: number;
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

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      if (!permission?.granted) {
        const permissionResult = await requestPermission();
        if (!permissionResult.granted) {
          const message = 'Media library access is required to view your craft documentation.';
          if (typeof window !== 'undefined' && window.alert) {
            window.alert(message);
          } else {
            Alert.alert('Permission Required', message);
          }
          return;
        }
      }

      // Get recent media assets
      const media = await MediaLibrary.getAssetsAsync({
        first: 100,
        mediaType: ['photo', 'video'],
        sortBy: 'creationTime',
      });

      const mediaItems: MediaItem[] = media.assets
        .filter(asset => asset.mediaType === 'photo' || asset.mediaType === 'video')
        .map(asset => ({
          id: asset.id,
          uri: asset.uri,
          mediaType: asset.mediaType as 'photo' | 'video',
          filename: asset.filename,
          creationTime: asset.creationTime,
          duration: asset.duration,
        }));

      setMediaItems(mediaItems);
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

  const handleMediaPress = (item: MediaItem) => {
    if (allowMultiSelect) {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedItems(newSelected);
    } else {
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