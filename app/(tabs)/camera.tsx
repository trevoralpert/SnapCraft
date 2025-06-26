import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraScreen, MediaGallery, VideoPlayer } from '@/src/features/camera';

export default function CameraTab() {
  const [showCamera, setShowCamera] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string>('');

  const handlePhotoTaken = (uri: string) => {
    console.log('Photo taken:', uri);
    setShowCamera(false);
    
    // Show success message
    const message = 'Great craft documentation! Photo saved successfully. 📸';
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(message);
    } else {
      Alert.alert('Success', message);
    }
  };

  const handleVideoRecorded = (uri: string) => {
    console.log('Video recorded:', uri);
    setShowCamera(false);
    
    // For both mock and real videos, open them in the video player
    setSelectedVideoUri(uri);
    setShowVideoPlayer(true);
    
    // Show success message for real videos
    if (!uri.startsWith('mock://')) {
      setTimeout(() => {
        const message = 'Excellent process documentation! Video recorded and ready to view. 🎥';
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(message);
        } else {
          Alert.alert('Success', message);
        }
      }, 500); // Delay to let video player open first
    }
  };

  const handleMediaSelected = (media: any) => {
    console.log('Media selected:', media);
    setShowGallery(false);
    
    // For videos, open in video player
    if (media.mediaType === 'video') {
      setSelectedVideoUri(media.uri);
      setShowVideoPlayer(true);
    } else {
      // For photos, show selection message
      const message = `Selected ${media.mediaType}: ${media.filename}`;
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      } else {
        Alert.alert('Media Selected', message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📸 Craft Documentation</Text>
        <Text style={styles.headerSubtitle}>
          Capture and organize your craft process
        </Text>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Camera Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="camera" size={24} color="#8B4513" />
            <Text style={styles.sectionTitle}>Capture New Content</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => setShowCamera(true)}
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.primaryButtonText}>Open Camera</Text>
          </TouchableOpacity>
          
          <Text style={styles.sectionDescription}>
            Document your craft process with photos and videos. Perfect for showing 
            before/after comparisons, technique demonstrations, and tool usage.
          </Text>
        </View>

        {/* Gallery Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="images" size={24} color="#8B4513" />
            <Text style={styles.sectionTitle}>View Documentation</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => setShowGallery(true)}
          >
            <Ionicons name="images" size={24} color="#8B4513" />
            <Text style={styles.secondaryButtonText}>Open Gallery</Text>
          </TouchableOpacity>
          
          <Text style={styles.sectionDescription}>
            Browse and organize your craft documentation. View your photos and videos, 
            and select media for sharing or further editing.
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>📋 Camera Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="flash" size={16} color="#8B4513" />
              <Text style={styles.featureText}>Flash control (auto, on, off)</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="camera-reverse" size={16} color="#8B4513" />
              <Text style={styles.featureText}>Front/back camera toggle</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="videocam" size={16} color="#8B4513" />
              <Text style={styles.featureText}>Video recording (60s max)</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="save" size={16} color="#8B4513" />
              <Text style={styles.featureText}>Auto-save to device gallery</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="images" size={16} color="#8B4513" />
              <Text style={styles.featureText}>Gallery access & selection</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <CameraScreen
          onPhotoTaken={handlePhotoTaken}
          onVideoRecorded={handleVideoRecorded}
          onClose={() => setShowCamera(false)}
        />
      </Modal>

      {/* Gallery Modal */}
      <Modal
        visible={showGallery}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <MediaGallery
          onMediaSelect={handleMediaSelected}
          onClose={() => setShowGallery(false)}
        />
      </Modal>

      {/* Video Player Modal */}
      {selectedVideoUri && (
        <VideoPlayer
          videoUri={selectedVideoUri}
          visible={showVideoPlayer}
          onClose={() => {
            setShowVideoPlayer(false);
            setSelectedVideoUri('');
          }}
          title="Craft Process Video"
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
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginLeft: 10,
  },
  primaryButton: {
    backgroundColor: '#8B4513',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8B4513',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  secondaryButtonText: {
    color: '#8B4513',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  featuresSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
}); 