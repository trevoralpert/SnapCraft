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
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/shared/contexts/ThemeContext';
import { VisionMode, VisionCameraProps } from '@/src/shared/types/vision';
import { getDefaultVisionMode, getVisionModeConfig } from '@/src/shared/constants/visionModes';
import EnvironmentService from '@/src/shared/services/EnvironmentService';
import VisionDropdownSelector from './VisionDropdownSelector';
import VisionToggleButton from './VisionToggleButton';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraScreenProps extends VisionCameraProps {
  onPhotoTaken?: (uri: string) => void;
  onVideoRecorded?: (uri: string) => void;
  onClose?: () => void;
}

export default function CameraScreen({ 
  onPhotoTaken, 
  onVideoRecorded, 
  onClose,
  initialVisionMode,
  enableVisionModes = true,
  onAnalysisComplete,
  onModeChange
}: CameraScreenProps) {
  // Theme and navigation
  const { theme } = useTheme();
  const router = useRouter();
  
  // Environment service for feature flags
  const envService = EnvironmentService.getInstance();
  const visionModesEnabled = envService.isFeatureEnabled('enableVisionModes') && enableVisionModes;
  
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
  
  // Vision mode state
  const [isVisionMode, setIsVisionMode] = useState(!!initialVisionMode);
  const [currentVisionMode, setCurrentVisionMode] = useState<VisionMode>(
    initialVisionMode || VisionMode.ANALYZE_PROJECT
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
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

  // Vision mode handlers
  const toggleVisionMode = () => {
    console.log('🔍 Vision toggle pressed:', { 
      currentIsVisionMode: isVisionMode, 
      currentDropdownOpen: isDropdownOpen,
      currentVisionMode: currentVisionMode 
    });
    
    if (!isVisionMode) {
      console.log('🔍 Enabling vision mode and opening dropdown');
      setIsVisionMode(true);
      setIsDropdownOpen(true); // Open dropdown when enabling vision mode
    } else {
      console.log('🔍 Toggling dropdown:', !isDropdownOpen);
      setIsDropdownOpen(!isDropdownOpen); // Toggle dropdown when already in vision mode
    }
  };

  const handleVisionModeSelect = (mode: VisionMode) => {
    setCurrentVisionMode(mode);
    setIsDropdownOpen(false); // Close dropdown after selection
    if (!isVisionMode) {
      setIsVisionMode(true); // Enable vision mode if not already enabled
    }
    onModeChange?.(mode);
  };

  const handleReturnToDefault = () => {
    console.log('📷 Returning to default craft documentation mode');
    setIsVisionMode(false); // Turn off vision mode
    setIsDropdownOpen(false); // Close dropdown
  };

  // Helper for getting current mode config
  const currentModeConfig = getVisionModeConfig(currentVisionMode);

  // Helper for getting mode icons
  const getModeIcon = (mode: VisionMode): keyof typeof Ionicons.glyphMap => {
    const config = getVisionModeConfig(mode);
    switch (config?.icon) {
      case 'construct': return 'construct';
      case 'hammer': return 'hammer';
      case 'cog': return 'cog';
      case 'school': return 'school';
      case 'shield-checkmark': return 'shield-checkmark';
      default: return 'eye';
    }
  };

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
        
        console.log('Photo taken:', photo.uri);
        onPhotoTaken?.(photo.uri);
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
        {/* Vision Toggle Button - Left side */}
        {visionModesEnabled && (
          <TouchableOpacity 
            style={[
              styles.visionToggleButton,
              isVisionMode && styles.activeVisionToggleButton,
              isVisionMode && currentModeConfig && { borderColor: currentModeConfig.color }
            ]}
            onPress={toggleVisionMode}
            activeOpacity={0.8}
          >
            <View style={styles.visionButtonContent}>
              {/* Mode Icon */}
              <View style={[
                styles.visionModeIconContainer,
                isVisionMode && currentModeConfig && { backgroundColor: currentModeConfig.color + '20' }
              ]}>
                <Ionicons 
                  name={isVisionMode ? getModeIcon(currentVisionMode) : "eye-off"} 
                  size={16} 
                  color={isVisionMode && currentModeConfig ? currentModeConfig.color : 'white'} 
                />
              </View>
              
              {/* Button Text */}
              <View style={styles.visionTextContainer}>
                <Text style={[
                  styles.visionButtonTitle,
                  isVisionMode && currentModeConfig && { color: currentModeConfig.color }
                ]}>
                  {isVisionMode ? 'Vision' : 'Camera'}
                </Text>
                {isVisionMode && currentModeConfig && (
                  <Text style={styles.visionButtonSubtitle} numberOfLines={1}>
                    {currentModeConfig.name}
                  </Text>
                )}
              </View>
              
              {/* Dropdown Arrow */}
              <Ionicons 
                name="chevron-down" 
                size={14} 
                color={isVisionMode && currentModeConfig ? currentModeConfig.color : 'white'} 
              />
            </View>
            
            {/* Active Indicator Dot */}
            {isVisionMode && (
              <View style={[
                styles.visionActiveDot,
                { backgroundColor: currentModeConfig?.color || '#8B4513' }
              ]} />
            )}
          </TouchableOpacity>
        )}
        
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
        {isVisionMode ? (
          <>
            <Text style={styles.craftTitle}>🔍 Vision Mode Active</Text>
            <Text style={styles.craftSubtitle}>
              Photos will be analyzed using {currentVisionMode ? getVisionModeConfig(currentVisionMode)?.name : 'AI Vision'}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.craftTitle}>📸 Craft Documentation</Text>
            <Text style={styles.craftSubtitle}>
              Capture your craft process, tools, and results
            </Text>
          </>
        )}
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

      {/* Translucent Tab Bar Overlay */}
      <View style={[styles.translucentTabBar, { backgroundColor: theme.colors.surface + '80' }]}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => {
            console.log('📱 Navigating to Craft Feed from camera');
            onClose?.(); // Close camera first
            router.push('/(tabs)');
          }}
        >
          <FontAwesome 
            name="home" 
            size={24} 
            color={theme.colors.tabIconDefault} 
          />
          <Text style={[styles.tabLabel, { color: theme.colors.tabIconDefault }]}>
            Craft Feed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => {
            console.log('📱 Navigating to Tools from camera');
            onClose?.(); // Close camera first
            router.push('/(tabs)/tools');
          }}
        >
          <FontAwesome 
            name="wrench" 
            size={24} 
            color={theme.colors.tabIconDefault} 
          />
          <Text style={[styles.tabLabel, { color: theme.colors.tabIconDefault }]}>
            Tools
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, styles.activeTab]}
          onPress={onClose}
        >
          <FontAwesome 
            name="cog" 
            size={24} 
            color={theme.colors.tabIconSelected} 
          />
          <Text style={[styles.tabLabel, { color: theme.colors.tabIconSelected }]}>
            Settings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => {
            console.log('📱 Navigating to Knowledge from camera');
            onClose?.(); // Close camera first
            router.push('/(tabs)/knowledge');
          }}
        >
          <FontAwesome 
            name="book" 
            size={24} 
            color={theme.colors.tabIconDefault} 
          />
          <Text style={[styles.tabLabel, { color: theme.colors.tabIconDefault }]}>
            Knowledge
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => {
            console.log('📱 Navigating to Profile from camera');
            onClose?.(); // Close camera first
            router.push('/(tabs)/profile');
          }}
        >
          <FontAwesome 
            name="user" 
            size={24} 
            color={theme.colors.tabIconDefault} 
          />
          <Text style={[styles.tabLabel, { color: theme.colors.tabIconDefault }]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Vision Mode Dropdown - Top Level for Proper Layering */}
      {visionModesEnabled && (
        <VisionDropdownSelector
          selectedMode={currentVisionMode}
          onModeSelect={handleVisionModeSelect}
          isVisionMode={isVisionMode}
          onToggle={toggleVisionMode}
          isDropdownOpen={isDropdownOpen}
          onDropdownToggle={(open: boolean) => setIsDropdownOpen(open)}
          onReturnToDefault={handleReturnToDefault}
        />
      )}
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
    paddingTop: 60,
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
    top: 120,
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
    bottom: 130,
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
  translucentTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 83,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 5,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  activeTab: {
    // Could add additional styling for active tab if needed
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  visionSelectorContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  visionToggleButton: {
    width: 120,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeVisionToggleButton: {
    borderColor: '#FF4500',
  },
  visionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visionModeIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  visionTextContainer: {
    flex: 1,
  },
  visionButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  visionButtonSubtitle: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  visionActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    position: 'absolute',
    right: 8,
    top: 18,
  },
}); 