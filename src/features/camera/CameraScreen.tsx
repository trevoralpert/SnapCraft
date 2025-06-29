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
  Modal,
  Image,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
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
import { ToolIdentificationService, ToolConfirmationData } from '@/src/services/toolIdentification';
import ToolConfirmationModal from '../tools/ToolConfirmationModal';
import { useAuthStore } from '@/src/stores/authStore';
import { uploadMultipleImages, generatePostImagePath } from '../../services/firebase/storage';
import { createPost } from '../../services/firebase/posts';
import { CraftPost } from '../../shared/types';
import { UserSkillLevelService } from '../../services/scoring/UserSkillLevelService';
import { ProjectScoringService } from '../../services/scoring/ProjectScoringService';
import { ManualReviewService } from '../../services/review/ManualReviewService';
import { ProjectScoringResultsScreen } from '../scoring';
import { ProjectScoringResult } from '../../shared/types';

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
  const { user } = useAuthStore();
  
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
  
  // Tool identification state
  const [showToolConfirmation, setShowToolConfirmation] = useState(false);
  const [toolConfirmations, setToolConfirmations] = useState<ToolConfirmationData[]>([]);
  const [lastPhotoUri, setLastPhotoUri] = useState<string>('');
  
  // Photo preview state
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [previewPhotoUri, setPreviewPhotoUri] = useState<string>('');
  const [previewVideoUri, setPreviewVideoUri] = useState<string>('');
  
  // Camera ref
  const cameraRef = useRef<CameraView>(null);

  // Add this state at the top of the component
  const [showTestOverlay, setShowTestOverlay] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Scoring and review state
  const [showScoringResults, setShowScoringResults] = useState(false);
  const [currentScoringResult, setCurrentScoringResult] = useState<ProjectScoringResult | null>(null);
  const [isProcessingScore, setIsProcessingScore] = useState(false);

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
        setLastPhotoUri(photo.uri);
        
        // Handle tool identification if in identify tools mode
        if (isVisionMode && currentVisionMode === VisionMode.IDENTIFY_TOOLS) {
          await handleToolIdentification(photo.uri);
        } else {
          // Show photo preview for seamless post creation
          setPreviewPhotoUri(photo.uri);
          setShowPhotoPreview(true);
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

  // Handle tool identification process
  const handleToolIdentification = async (photoUri: string) => {
    try {
      console.log('🔍 Starting tool identification for photo:', photoUri);
      
      // For now, create mock tool identification results
      // In the future, this will call the actual RAG service
      const mockToolConfirmations = await createMockToolIdentification(photoUri);
      
      if (mockToolConfirmations.length > 0) {
        // Check for duplicates against user's existing inventory
        const toolService = ToolIdentificationService.getInstance();
        const checkedConfirmations = await toolService.checkForDuplicates(
          mockToolConfirmations,
          user?.id || 'anonymous-user'
        );
        
        setToolConfirmations(checkedConfirmations);
        setShowToolConfirmation(true);
      } else {
        Alert.alert(
          'No Tools Found',
          'No tools were identified in this photo. Try taking a clearer photo or adjusting the angle.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error in tool identification:', error);
      Alert.alert(
        'Identification Failed',
        'Failed to identify tools in the photo. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Create mock tool identification results for testing
  const createMockToolIdentification = async (photoUri: string): Promise<ToolConfirmationData[]> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const toolService = ToolIdentificationService.getInstance();
    
    // Mock vision analysis result
    const mockAnalysisResult = {
      mode: VisionMode.IDENTIFY_TOOLS,
      photoUri: photoUri,
      analysis: {
        identifiedTools: [
          {
            name: 'Circular Saw',
            confidence: 0.92,
            category: 'power-tools',
            usage: 'Used for making straight cuts in wood and other materials'
          },
          {
            name: 'Measuring Tape',
            confidence: 0.87,
            category: 'measuring',
            usage: 'Essential for accurate measurements in construction and crafting'
          },
          {
            name: 'Safety Glasses',
            confidence: 0.95,
            category: 'safety',
            usage: 'Protect eyes from debris and dust during cutting operations'
          }
        ],
        missingTools: [],
        recommendations: ['Consider adding a dust mask for better safety'],
        safetyNotes: ['Always wear safety glasses when operating power tools']
      },
      confidence: 0.91,
      timestamp: new Date(),
      processingTime: 1200,
      queryId: `mock_${Date.now()}`,
    };
    
    return toolService.processVisionAnalysis(mockAnalysisResult);
  };

  // Handle tool confirmation modal events
  const handleToolsAdded = (addedCount: number) => {
    console.log(`✅ ${addedCount} tools added to inventory`);
    Alert.alert(
      'Success!',
      `${addedCount} tools have been added to your inventory.`,
      [
        {
          text: 'View Tools',
          onPress: () => {
            setShowToolConfirmation(false);
            router.push('/(tabs)/tools');
          }
        },
        {
          text: 'Continue',
          onPress: () => setShowToolConfirmation(false)
        }
      ]
    );
  };

  const handleToolConfirmationClose = () => {
    setShowToolConfirmation(false);
    setToolConfirmations([]);
  };

  // Photo/Video Preview Handlers
  const handleCreatePost = () => {
    console.log('🎬 Creating post with media:', { photo: previewPhotoUri, video: previewVideoUri });
    setShowPhotoPreview(false);
    
    // TEST: Show overlay instead of navigation
    console.log('🟢 SHOWING TEST OVERLAY INSTEAD OF NAVIGATION');
    setShowTestOverlay(true);
  };

  // Create real post with Firebase integration
  const handleCreateRealPost = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to create a post.');
      return;
    }

    if (!captionText.trim()) {
      Alert.alert('Caption Required', 'Please add a caption for your craft photo.');
      return;
    }

    try {
      console.log('🔄 Creating real post...');
      setIsProcessingScore(true);
      
      // Upload image to Firebase Storage
      const basePath = generatePostImagePath(user.id);
      const uploadResults = await uploadMultipleImages(
        [previewPhotoUri],
        basePath,
        (progress) => {
          console.log(`📊 Upload progress: ${progress.toFixed(1)}%`);
        }
      );

      const imageUrls = uploadResults.map(result => result.url);
      console.log('✅ Image uploaded successfully:', imageUrls[0]);

      // Create post data with minimal required fields
      const postData: Omit<CraftPost, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.id,
        author: {
          id: user.id,
          displayName: user.displayName || 'Anonymous Craftsman',
        },
        content: {
          description: captionText.trim(),
          images: imageUrls,
          videos: [],
          materials: [],
          timeSpent: 0,
          difficulty: 'beginner' as const,
        },
        craftType: 'general' as const,
        techniques: [],
        tags: [],
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
        },
        isEphemeral: false,
      };

      // Save post to Firestore
      console.log('💾 Saving post to Firestore...');
      const postId = await createPost(postData);
      console.log('✅ Craft post created successfully:', postId);

      // 🧠 AI PROJECT SCORING INTEGRATION
      try {
        console.log('🧠 Starting AI project scoring...');
        const scoringService = ProjectScoringService.getInstance();
        
        // Prepare scoring request data
        const scoringRequest = {
          projectId: postId,
          userId: user.id,
          craftType: postData.craftType as any,
          description: captionText.trim(),
          materials: [],
          techniques: [],
          timeSpent: 0,
          difficulty: 'beginner' as const,
          imageUrls: imageUrls,
          tags: [],
          userSkillLevel: user.skillLevel || 'apprentice',
          userProfile: {
            bio: user.bio,
            craftSpecialization: user.craftSpecialization
          }
        };
        
        // Score the project
        const scoringResult = await scoringService.scoreProject(scoringRequest);
        
        console.log('🎯 Project scoring completed:', {
          score: scoringResult.individualSkillScore,
          skillLevel: scoringResult.skillLevelCategory,
          confidence: scoringResult.aiScoringMetadata.confidence,
          needsReview: scoringResult.aiScoringMetadata.needsHumanReview
        });

        // If AI flagged for review, automatically submit to review queue
        if (scoringResult.aiScoringMetadata.needsHumanReview) {
          try {
            const reviewService = ManualReviewService.getInstance();
            const reviewId = await reviewService.submitForReview(scoringResult, false);
            console.log('📝 Project automatically submitted for manual review:', reviewId);
          } catch (reviewError) {
            console.warn('⚠️ Failed to submit for review:', reviewError);
          }
        }

        // Store scoring result and show results screen
        setCurrentScoringResult(scoringResult);
        setIsProcessingScore(false);
        setShowScoringResults(true);

      } catch (scoringError) {
        console.error('❌ Project scoring failed:', scoringError);
        setIsProcessingScore(false);
        
        // Still show success but without scoring
        setShowSuccessDialog(true);
        
        Alert.alert(
          'Scoring Unavailable', 
          'Your post was created successfully, but AI scoring is temporarily unavailable. You can view your scoring history later.',
          [{ text: 'OK' }]
        );
      }

      // Track tool usage for this project - Task 2.6 Enhanced Tool Management
      try {
        console.log('🔧 Tracking tool usage for project...');
        const { ToolUsageTrackingService } = await import('../../services/toolUsageTracking');
        const toolTrackingService = ToolUsageTrackingService.getInstance();
        
        // For now, we'll track usage of commonly used tools for the craft type
        // In a full implementation, this would come from user selection or AI analysis
        const mockToolUsageEvents = [
          {
            toolId: 'mock_tool_1', // This would be real tool IDs from user's inventory
            projectId: postId,
            craftType: 'general' as const,
            usageDate: new Date(),
            userSkillLevel: user.skillLevel || 'apprentice',
            projectDescription: captionText.trim()
          }
        ];
        
        const toolTrackingResult = await toolTrackingService.trackToolUsage(user.id, mockToolUsageEvents);
        console.log(`🔧 Tool usage tracking: ${toolTrackingResult.updatedTools} tools updated`);
      } catch (toolTrackingError) {
        console.warn('⚠️ Tool usage tracking failed:', toolTrackingError);
        // Don't fail the post creation if tool tracking fails
      }

      // Update user skill level after post creation
      try {
        console.log('🧠 Updating user skill level...');
        const skillLevelService = UserSkillLevelService.getInstance();
        const skillUpdate = await skillLevelService.updateUserSkillLevel(user.id, postId);
        
        if (skillUpdate.levelChanged) {
          console.log(`🎉 SKILL LEVEL UP! ${skillUpdate.oldLevel} → ${skillUpdate.newLevel}`);
          // TODO: Show skill level up notification
        }
        
        console.log(`📊 Current skill level: ${skillUpdate.newLevel} (avg: ${Math.round(skillUpdate.averageScore)})`);
      } catch (skillError) {
        console.warn('⚠️ Skill level update failed:', skillError);
        // Don't fail the post creation if skill update fails
      }

    } catch (error) {
      console.error('❌ Error creating post:', error);
      setIsProcessingScore(false);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    }
  };

  const handleRetakeMedia = () => {
    console.log('🔄 Retaking media');
    setShowPhotoPreview(false);
    setPreviewPhotoUri('');
    setPreviewVideoUri('');
  };

  const handleSaveToGallery = async () => {
    try {
      const mediaUri = previewPhotoUri || previewVideoUri;
      if (mediaUri && mediaLibraryPermission?.granted) {
        await MediaLibrary.saveToLibraryAsync(mediaUri);
        Alert.alert('Saved!', 'Media has been saved to your gallery.');
      } else {
        Alert.alert('Permission Required', 'Please grant media library access to save to gallery.');
      }
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('Error', 'Failed to save to gallery.');
    }
  };

  const handleDiscardMedia = () => {
    console.log('🗑️ Discarding media');
    setShowPhotoPreview(false);
    setPreviewPhotoUri('');
    setPreviewVideoUri('');
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
            setPreviewVideoUri(newUri);
            setShowPhotoPreview(true); // Reuse same preview modal for videos
            console.log('🎥 Video recorded successfully, showing preview');
          } catch (copyError) {
            console.error('🎥 Error copying video:', copyError);
            // Fallback to original URI if copy fails
            setPreviewVideoUri(video.uri);
            setShowPhotoPreview(true); // Reuse same preview modal for videos
            console.log('🎥 Video recorded successfully (fallback), showing preview');
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

  // Add this after photo capture logic, around where the preview modal would be
  if (showTestOverlay) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#F5F5DC',
          zIndex: 9999
        }}>
          {/* Processing Overlay - Show on top when processing */}
          {isProcessingScore && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10001
            }}>
              <View style={{
                backgroundColor: '#F5F5DC',
                borderRadius: 20,
                padding: 30,
                margin: 20,
                maxWidth: 320,
                alignItems: 'center',
                borderWidth: 3,
                borderColor: '#8B4513'
              }}>
                {/* Processing Icon */}
                <View style={{
                  backgroundColor: '#8B4513',
                  borderRadius: 50,
                  width: 80,
                  height: 80,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 20
                }}>
                  <Text style={{ fontSize: 40, color: 'white' }}>🧠</Text>
                </View>

                {/* Processing Title */}
                <Text style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#8B4513',
                  textAlign: 'center',
                  marginBottom: 10
                }}>
                  AI Scoring
                </Text>

                {/* Processing Message */}
                <Text style={{
                  fontSize: 16,
                  color: '#654321',
                  textAlign: 'center',
                  marginBottom: 25,
                  lineHeight: 22
                }}>
                  Our AI is analyzing your craft project and providing detailed feedback...
                </Text>

                {/* Loading Indicator */}
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 3,
                  borderColor: '#8B4513',
                  borderTopColor: 'transparent',
                  marginBottom: 15
                }} />
                
                <Text style={{
                  fontSize: 14,
                  color: '#8B4513',
                  fontStyle: 'italic'
                }}>
                  This may take a few moments...
                </Text>
              </View>
            </View>
          )}

          {/* Header */}
          <View style={{
            paddingTop: 50,
            paddingHorizontal: 20,
            paddingBottom: 20,
            backgroundColor: '#8B4513',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <TouchableOpacity onPress={() => {
              console.log('🟢 CLOSING CREATE POST OVERLAY');
              Keyboard.dismiss();
              setShowTestOverlay(false);
              setShowPhotoPreview(false);
              setPreviewPhotoUri('');
              setPreviewVideoUri('');
            }}>
              <Text style={{ color: 'white', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={{ 
              color: 'white', 
              fontSize: 18, 
              fontWeight: 'bold' 
            }}>
              Create Post
            </Text>
            
            <TouchableOpacity 
              style={{
                backgroundColor: isProcessingScore ? '#999' : '#D2691E',
                paddingHorizontal: 15,
                paddingVertical: 8,
                borderRadius: 6,
                opacity: isProcessingScore ? 0.6 : 1.0
              }}
              disabled={isProcessingScore}
              onPress={async () => {
                if (isProcessingScore) return;
                
                // Dismiss keyboard before processing
                Keyboard.dismiss();
                
                console.log('📤 CREATING REAL POST:', {
                  photo: previewPhotoUri,
                  caption: captionText,
                  captionLength: captionText.length
                });
                
                // Create the actual post using the same logic as CreatePostScreen
                await handleCreateRealPost();
              }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                {isProcessingScore ? 'Processing...' : 'Share'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content - Wrapped in ScrollView for better keyboard handling */}
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Photo Preview */}
            {previewPhotoUri && (
              <View style={{
                backgroundColor: 'white',
                borderRadius: 10,
                padding: 10,
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: 'bold', 
                  color: '#8B4513',
                  marginBottom: 10 
                }}>
                  📸 Your Craft Photo
                </Text>
                <Image 
                  source={{ uri: previewPhotoUri }}
                  style={{
                    height: 200,
                    width: '100%',
                    borderRadius: 8,
                    backgroundColor: '#f0f0f0'
                  }}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Caption Input */}
            <View style={{
              backgroundColor: 'white',
              borderRadius: 10,
              padding: 15,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: 'bold', 
                color: '#8B4513',
                marginBottom: 10 
              }}>
                ✍️ Caption Your Craft Story
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  minHeight: 100,
                  backgroundColor: '#fafafa',
                  fontSize: 14,
                  color: '#333',
                  textAlignVertical: 'top'
                }}
                placeholder="Describe your craft process, tools used, or what you learned..."
                placeholderTextColor="#999"
                multiline={true}
                value={captionText}
                onChangeText={setCaptionText}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>

            {/* Success Message */}
            <View style={{
              backgroundColor: '#DFF2BF',
              borderColor: '#4F8A10',
              borderWidth: 1,
              borderRadius: 8,
              padding: 15,
              alignItems: 'center'
            }}>
              <Text style={{ 
                color: '#4F8A10', 
                fontSize: 16, 
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                🎉 SUCCESS! Photo-to-Post Flow Works!
              </Text>
              <Text style={{ 
                color: '#4F8A10', 
                fontSize: 14,
                textAlign: 'center',
                marginTop: 5
              }}>
                This proves we can build the complete workflow without navigation issues.
              </Text>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // Custom Success Dialog
  if (showSuccessDialog) {
    return (
      <View style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000
      }}>
        <View style={{
          backgroundColor: '#F5F5DC',
          borderRadius: 20,
          padding: 30,
          margin: 20,
          maxWidth: 320,
          alignItems: 'center',
          borderWidth: 3,
          borderColor: '#8B4513'
        }}>
          {/* Success Icon */}
          <View style={{
            backgroundColor: '#4CAF50',
            borderRadius: 50,
            width: 80,
            height: 80,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Text style={{ fontSize: 40, color: 'white' }}>✅</Text>
          </View>

          {/* Success Title */}
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#8B4513',
            textAlign: 'center',
            marginBottom: 10
          }}>
            🎉 Post Shared!
          </Text>

          {/* Success Message */}
          <Text style={{
            fontSize: 16,
            color: '#654321',
            textAlign: 'center',
            marginBottom: 25,
            lineHeight: 22
          }}>
            Your craft photo has been shared to the community! Other craftsmen can now discover and learn from your work.
          </Text>

          {/* Action Buttons */}
          <View style={{
            flexDirection: 'row',
            gap: 15
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#8B4513',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 10,
                flex: 1
              }}
              onPress={() => {
                console.log('🏠 Navigating to feed');
                setShowSuccessDialog(false);
                setShowTestOverlay(false);
                setShowPhotoPreview(false);
                setPreviewPhotoUri('');
                setCaptionText('');
                onClose?.();
                router.push('/(tabs)');
              }}
            >
              <Text style={{ 
                color: 'white', 
                fontSize: 16, 
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                View Feed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: '#D2691E',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 10,
                flex: 1
              }}
              onPress={() => {
                console.log('📷 Taking another photo');
                setShowSuccessDialog(false);
                setShowTestOverlay(false);
                setShowPhotoPreview(false);
                setPreviewPhotoUri('');
                setCaptionText('');
              }}
            >
              <Text style={{ 
                color: 'white', 
                fontSize: 16, 
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                Take Another
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Scoring Results Modal
  if (showScoringResults && currentScoringResult) {
    return (
      <ProjectScoringResultsScreen
        scoringResult={currentScoringResult}
        projectImages={[previewPhotoUri]}
        onClose={() => {
          setShowScoringResults(false);
          setCurrentScoringResult(null);
          setShowTestOverlay(false);
          setShowPhotoPreview(false);
          setPreviewPhotoUri('');
          setCaptionText('');
        }}
        onViewProject={() => {
          // Navigate to project/feed view
          setShowScoringResults(false);
          setCurrentScoringResult(null);
          setShowTestOverlay(false);
          setShowPhotoPreview(false);
          setPreviewPhotoUri('');
          setCaptionText('');
          onClose?.();
          router.push('/(tabs)');
        }}
        onRequestReview={async () => {
          // Handle manual review request
          if (currentScoringResult) {
            try {
              const reviewService = ManualReviewService.getInstance();
              const reviewId = await reviewService.submitForReview(
                currentScoringResult,
                true, // User requested
                'User requested additional review after seeing AI scoring results'
              );
              
              Alert.alert(
                'Review Requested',
                'Your project has been submitted for manual review by our craft experts. You\'ll be notified when the review is complete.',
                [{ text: 'OK' }]
              );
              
              console.log('📝 User requested manual review:', reviewId);
            } catch (error) {
              console.error('❌ Failed to request review:', error);
              Alert.alert(
                'Request Failed',
                'Unable to submit review request. Please try again later.',
                [{ text: 'OK' }]
              );
            }
          }
        }}
      />
    );
  }

  // Processing Score Overlay
  if (isProcessingScore) {
    return (
      <View style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000
      }}>
        <View style={{
          backgroundColor: '#F5F5DC',
          borderRadius: 20,
          padding: 30,
          margin: 20,
          maxWidth: 320,
          alignItems: 'center',
          borderWidth: 3,
          borderColor: '#8B4513'
        }}>
          {/* Processing Icon */}
          <View style={{
            backgroundColor: '#8B4513',
            borderRadius: 50,
            width: 80,
            height: 80,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Text style={{ fontSize: 40, color: 'white' }}>🧠</Text>
          </View>

          {/* Processing Title */}
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#8B4513',
            textAlign: 'center',
            marginBottom: 10
          }}>
            AI Scoring
          </Text>

          {/* Processing Message */}
          <Text style={{
            fontSize: 16,
            color: '#654321',
            textAlign: 'center',
            marginBottom: 25,
            lineHeight: 22
          }}>
            Our AI is analyzing your craft project and providing detailed feedback...
          </Text>

          {/* Loading Indicator */}
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 3,
            borderColor: '#8B4513',
            borderTopColor: 'transparent',
            marginBottom: 15
          }} />
          
          <Text style={{
            fontSize: 14,
            color: '#8B4513',
            fontStyle: 'italic'
          }}>
            This may take a few moments...
          </Text>
        </View>
      </View>
    );
  }

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

      {/* Photo/Video Preview Modal */}
      <Modal
        visible={showPhotoPreview}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.previewContainer}>
          {/* Preview Header */}
          <View style={styles.previewHeader}>
            <TouchableOpacity style={styles.previewCloseButton} onPress={handleDiscardMedia}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>
              {previewPhotoUri ? '📸 Photo Preview' : '🎥 Video Preview'}
            </Text>
            <TouchableOpacity style={styles.previewSaveButton} onPress={handleSaveToGallery}>
              <Ionicons name="download" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Preview Content */}
          <View style={styles.previewContent}>
            {previewPhotoUri ? (
              <Image source={{ uri: previewPhotoUri }} style={styles.previewImage} resizeMode="contain" />
            ) : previewVideoUri ? (
              <View style={styles.videoPreviewContainer}>
                <Ionicons name="play-circle" size={80} color="white" />
                <Text style={styles.videoPreviewText}>Video Preview</Text>
                <Text style={styles.videoPreviewSubtext}>Tap "Create Post" to share your video</Text>
              </View>
            ) : null}
          </View>

          {/* Preview Actions */}
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.previewRetakeButton} onPress={handleRetakeMedia}>
              <Ionicons name="camera" size={24} color="#8B4513" />
              <Text style={styles.previewRetakeText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.previewCreatePostButton} onPress={handleCreatePost}>
              <Ionicons name="share" size={24} color="white" />
              <Text style={styles.previewCreatePostText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Tool Confirmation Modal */}
      <ToolConfirmationModal
        visible={showToolConfirmation}
        toolConfirmations={toolConfirmations}
        onClose={handleToolConfirmationClose}
        onToolsAdded={handleToolsAdded}
        photoUri={lastPhotoUri}
      />
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
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  previewCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTitle: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  previewSaveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  videoPreviewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  videoPreviewSubtext: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  previewRetakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  previewRetakeText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  previewCreatePostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  previewCreatePostText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
}); 