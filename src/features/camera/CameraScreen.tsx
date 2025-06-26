import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraScreenProps {
  onPhotoTaken?: (uri: string) => void;
  onVideoRecorded?: (uri: string) => void;
  onClose?: () => void;
}

export default function CameraScreen({ 
  onPhotoTaken, 
  onVideoRecorded, 
  onClose 
}: CameraScreenProps) {
  // Camera permissions and setup
  const [permission, requestPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
  
  // Camera state
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [mode, setMode] = useState<'picture' | 'video'>('picture');
  
  // Camera ref
  const cameraRef = useRef<CameraView>(null);

  // Request permissions on mount and check available codecs
  useEffect(() => {
    requestPermissions();
    checkAvailableCodecs();
  }, []);

  const checkAvailableCodecs = async () => {
    try {
      const codecs = await CameraView.getAvailableVideoCodecsAsync();
      console.log('📹 Available video codecs on this device:', codecs);
    } catch (error) {
      console.log('📹 Could not get available codecs:', error);
    }
  };

  const requestPermissions = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    if (!microphonePermission?.granted) {
      await requestMicrophonePermission();
    }
    if (!mediaLibraryPermission?.granted) {
      await requestMediaLibraryPermission();
    }
  };

  // Check if permissions are granted
  if (!permission || !microphonePermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting permissions...</Text>
      </View>
    );
  }

  if (!permission.granted || !microphonePermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera and microphone access is required for video recording</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
          <Text style={styles.permissionButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Toggle camera facing
  function toggleCameraFacing() {
    setFacing((current: CameraType) => (current === 'back' ? 'front' : 'back'));
  }

  // Toggle flash
  function toggleFlash() {
    setFlash((current: FlashMode) => {
      switch (current) {
        case 'off': return 'on';
        case 'on': return 'auto';
        case 'auto': return 'off';
        default: return 'off';
      }
    });
  }

  // Take photo
  const takePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;
    
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true,
      });

      if (photo?.uri) {
        // Save to media library if permission granted
        if (mediaLibraryPermission?.granted) {
          await MediaLibrary.saveToLibraryAsync(photo.uri);
        }
        
        // Call callback if provided
        onPhotoTaken?.(photo.uri);
        
        // Show success message
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Photo captured successfully! 📸');
        } else {
          Alert.alert('Success', 'Photo captured successfully! 📸');
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      const message = 'Failed to capture photo. Please try again.';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // Start/stop video recording - SIMPLIFIED APPROACH
  const toggleVideoRecording = async () => {
    if (!cameraRef.current) {
      return;
    }

    try {
      if (isRecording) {
        // Stop recording
        cameraRef.current.stopRecording();
        setIsRecording(false);
        setMode('picture');
      } else {
        // Set mode to video first, then start recording
        setMode('video');
        
        // Wait for the mode change to propagate to the CameraView
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Start recording
        setIsRecording(true);
        
        const video = await cameraRef.current.recordAsync({
          maxDuration: 30, // 30 seconds max
          maxFileSize: 100 * 1024 * 1024 // 100MB max
          // Let device choose the best codec automatically
        });
        
        // Debug: Log video information
        console.log('🎥 Video recording completed:', {
          uri: video?.uri,
          type: typeof video,
          hasUri: !!video?.uri
        });
        
        // Reset state
        setIsRecording(false);
        setMode('picture');

        if (video?.uri) {
          // Debug: Check file information
          try {
            const fileInfo = await FileSystem.getInfoAsync(video.uri);
            console.log('🎥 Video file info:', {
              exists: fileInfo.exists,
              size: fileInfo.exists ? (fileInfo as any).size : 'N/A',
              uri: video.uri
            });
          } catch (error) {
            console.log('🎥 Could not check file info:', error);
          }
          
          // Copy video to Documents directory for better access
          try {
            const fileName = `craft_video_${Date.now()}.mov`;
            const documentsDir = FileSystem.documentDirectory;
            const newUri = documentsDir + fileName;
            
            console.log('🎥 Copying video from cache to documents...');
            await FileSystem.copyAsync({
              from: video.uri,
              to: newUri
            });
            
            console.log('🎥 Video copied to:', newUri);
            
            // Save original to media library if permission granted
            if (mediaLibraryPermission?.granted) {
              await MediaLibrary.saveToLibraryAsync(video.uri);
              console.log('🎥 Video saved to media library');
            }
            
            // Use the copied video URI for playback
            onVideoRecorded?.(newUri);
            Alert.alert('Success', 'Video recorded successfully! 🎥');
          } catch (copyError) {
            console.error('🎥 Error copying video:', copyError);
            // Fallback to original URI if copy fails
            onVideoRecorded?.(video.uri);
            Alert.alert('Success', 'Video recorded successfully! 🎥');
          }
        } else {
          Alert.alert('Error', 'No video file was created');
        }
      }
    } catch (error) {
      console.error('Error in video recording:', error);
      
      // Reset state on error
      setIsRecording(false);
      setMode('picture');
      
      Alert.alert('Error', `Failed to record video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Open image picker for gallery access
  const openImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.type === 'image') {
          onPhotoTaken?.(asset.uri);
        } else if (asset.type === 'video') {
          onVideoRecorded?.(asset.uri);
        }
      }
    } catch (error) {
      console.error('Error opening image picker:', error);
      const message = 'Failed to access gallery. Please try again.';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  // Get flash icon
  const getFlashIcon = () => {
    switch (flash) {
      case 'on': return 'flash';
      case 'auto': return 'flash-outline';
      default: return 'flash-off';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Camera View - NO CHILDREN */}
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing={facing}
        flash={flash}
        mode={mode}
      />

      {/* Header Controls - Absolute positioned */}
      <View style={styles.headerControls}>
        <TouchableOpacity style={styles.controlButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Ionicons name={getFlashIcon()} size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Recording Indicator - Absolute positioned */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>REC</Text>
        </View>
      )}

      {/* Craft Documentation Overlay - Absolute positioned */}
      <View style={styles.craftOverlay}>
        <Text style={styles.craftTitle}>📸 Craft Documentation</Text>
        <Text style={styles.craftSubtitle}>
          Capture your craft process, tools, and results
        </Text>
      </View>

      {/* Bottom Controls - Absolute positioned */}
      <View style={styles.bottomControls}>
        {/* Gallery Button */}
        <TouchableOpacity style={styles.galleryButton} onPress={openImagePicker}>
          <Ionicons name="images" size={24} color="white" />
          <Text style={styles.galleryText}>Gallery</Text>
        </TouchableOpacity>

        {/* Capture Buttons */}
        <View style={styles.captureButtons}>
          {/* Photo Button */}
          <TouchableOpacity 
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={takePhoto}
            disabled={isCapturing}
          >
            <View style={styles.captureButtonInner}>
              <Ionicons 
                name="camera" 
                size={32} 
                color={isCapturing ? '#999' : 'white'} 
              />
            </View>
          </TouchableOpacity>

          {/* Video Button */}
          <TouchableOpacity 
            style={[
              styles.videoButton, 
              isRecording && styles.videoButtonRecording
            ]}
            onPress={toggleVideoRecording}
          >
            <Ionicons 
              name={isRecording ? "stop" : "videocam"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>

        {/* Mode Indicator */}
        <View style={styles.modeIndicator}>
          <Text style={styles.modeText}>
            {isRecording ? 'Recording...' : mode === 'video' ? 'Video Mode' : 'Photo Mode'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    fontSize: 18,
    color: '#8B4513',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
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
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 15,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 80,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 10,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 6,
  },
  recordingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  craftOverlay: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  craftTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 8,
  },
  craftSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    opacity: 0.9,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  galleryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  galleryText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  captureButtons: {
    alignItems: 'center',
    gap: 15,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  videoButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DC143C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  videoButtonRecording: {
    backgroundColor: '#FF4500',
  },
  modeIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  modeText: {
    color: 'white',
    fontSize: 11,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
}); 