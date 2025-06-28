import React, { useState, useEffect } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CameraScreen, MediaGallery, VideoPlayer } from '@/src/features/camera';

export default function CameraTab() {
  const navigation = useNavigation();
  const [showCamera, setShowCamera] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string>('');
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [intentionallyClosed, setIntentionallyClosed] = useState(false);

  // Auto-open camera when tab is focused (Snapchat-style)
  useFocusEffect(
    React.useCallback(() => {
      console.log('📷 Camera tab focused - auto-opening camera');
      // Always open camera when tab is focused, regardless of previous state
      setShowCamera(true);
      setCameraPermissionDenied(false);
      setIntentionallyClosed(false); // Reset intentional closure flag on tab focus
      
      return () => {
        // Cleanup when tab loses focus
        console.log('📷 Camera tab unfocused');
      };
    }, [])
  );

  // Listen for tab press events to ensure camera opens even when already on camera tab
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, (e) => {
      console.log('📷 Camera tab pressed directly - forcing camera open');
      // Force camera to open when tab is pressed, mimicking quick action button
      setShowCamera(true);
      setCameraPermissionDenied(false);
      setIntentionallyClosed(false);
    });

    return unsubscribe;
  }, [navigation]);

  const handlePhotoTaken = (uri: string) => {
    console.log('Photo taken:', uri);
    setShowCamera(false);
  };

  const handleVideoRecorded = (uri: string) => {
    console.log('Video recorded:', uri);
    setShowCamera(false);
    
    // For both mock and real videos, open them in the video player
    setSelectedVideoUri(uri);
    setShowVideoPlayer(true);
  };

  const handleCameraClose = () => {
    console.log('📷 Camera closed by user via Settings button');
    setShowCamera(false);
    setIntentionallyClosed(true); // Mark as intentionally closed to prevent auto-reopening
  };

  // Handle camera errors by monitoring if camera closes unexpectedly
  useEffect(() => {
    if (!showCamera && cameraPermissionDenied) {
      console.log('📷 Camera permission was denied');
    }
  }, [showCamera, cameraPermissionDenied]);

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

  // Fallback UI when camera is closed or permissions denied
  const renderFallbackUI = () => (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Camera Settings</Text>
        <Text style={styles.headerSubtitle}>
          {cameraPermissionDenied 
            ? 'Camera access is required for craft documentation'
            : 'Configure camera preferences and access documentation tools'
          }
        </Text>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Camera Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons 
              name={cameraPermissionDenied ? "camera-outline" : "camera"} 
              size={24} 
              color={cameraPermissionDenied ? "#CD853F" : "#8B4513"} 
            />
            <Text style={styles.sectionTitle}>
              {cameraPermissionDenied ? 'Camera Access Needed' : 'Camera Access & Launch'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.primaryButton,
              cameraPermissionDenied && styles.warningButton
            ]}
            onPress={() => {
              console.log('📷 Open Camera button pressed from settings');
              setShowCamera(true);
              setCameraPermissionDenied(false);
              setIntentionallyClosed(false); // Reset intentional closure flag
            }}
          >
            <Ionicons 
              name={cameraPermissionDenied ? "settings" : "camera"} 
              size={24} 
              color="white" 
            />
            <Text style={styles.primaryButtonText}>
              {cameraPermissionDenied ? 'Grant Camera Access' : 'Open Camera'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.sectionDescription}>
            {cameraPermissionDenied 
              ? 'Please allow camera access in your device settings to document your craft process.'
              : 'Launch the camera to document your craft process with photos and videos. Perfect for showing before/after comparisons, technique demonstrations, and tool usage.'
            }
          </Text>
        </View>

        {/* Gallery Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="images" size={24} color="#8B4513" />
            <Text style={styles.sectionTitle}>Media Gallery Access</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => setShowGallery(true)}
          >
            <Ionicons name="images" size={24} color="#8B4513" />
            <Text style={styles.secondaryButtonText}>Open Gallery</Text>
          </TouchableOpacity>
          
          <Text style={styles.sectionDescription}>
            Access your media gallery to browse and organize your craft documentation. 
            View your photos and videos, and select media for sharing or further editing.
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>⚡ Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => {
                console.log('📷 Quick action camera button pressed');
                setShowCamera(true);
                setCameraPermissionDenied(false);
                setIntentionallyClosed(false); // Reset intentional closure flag
              }}
            >
              <Ionicons name="camera" size={20} color="#8B4513" />
              <Text style={styles.quickActionText}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setShowGallery(true)}
            >
              <Ionicons name="images" size={20} color="#8B4513" />
              <Text style={styles.quickActionText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <>
      {/* Show fallback UI when camera is not active */}
      {!showCamera && renderFallbackUI()}

      {/* Camera Modal - Auto-opens on tab focus */}
      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <CameraScreen
          onPhotoTaken={handlePhotoTaken}
          onVideoRecorded={handleVideoRecorded}
          onClose={handleCameraClose}
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
    </>
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
  warningButton: {
    backgroundColor: '#CD853F',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8B4513',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  quickActionText: {
    color: '#8B4513',
    fontSize: 18,
    fontWeight: '600',
  },
}); 