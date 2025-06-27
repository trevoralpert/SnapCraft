import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  TextInput,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { LinearGradient } from 'expo-linear-gradient';
import { CraftStory } from '../../shared/types';
import { createStory } from '../../services/firebase/stories';
import { uploadImage, uploadVideo } from '../../services/firebase/storage';
import { generateVideoThumbnail } from '../../services/firebase/thumbnails';

const { width, height } = Dimensions.get('window');

interface CreateStoryScreenProps {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onClose: () => void;
  onStoryCreated: (story: CraftStory) => void;
}

const COLOR_BACKGROUNDS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export const CreateStoryScreen: React.FC<CreateStoryScreenProps> = ({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onClose,
  onStoryCreated,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [storyText, setStoryText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  
  // Video recording state
  const [mode, setMode] = useState<'photo' | 'video'>('photo');

  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
    if (!microphonePermission) {
      requestMicrophonePermission();
    }
  }, [permission, requestPermission, microphonePermission, requestMicrophonePermission]);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      setSelectedImage(photo.uri);
      setSelectedVideo(null);
      setSelectedColor(null);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const recordVideoWithNativeCamera = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is required to record videos');
        return;
      }

      console.log('🎬 Opening native camera for video recording...');
      
      // Launch native camera for video recording
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos, // Note: MediaTypeOptions deprecated but still functional
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 30, // 30 second limit for stories
      });

      if (!result.canceled && result.assets[0]) {
        const videoUri = result.assets[0].uri;
        console.log('✅ Video recorded successfully:', videoUri);
        
        setSelectedVideo(videoUri);
        setSelectedImage(null);
        setSelectedColor(null);
        
        Alert.alert(
          '🎥 Video Ready!', 
          'Your video has been recorded and is ready to share!',
          [{ text: 'Great!', style: 'default' }]
        );
      } else {
        console.log('📱 Video recording cancelled by user');
      }
    } catch (error) {
      console.error('❌ Error recording video with native camera:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
    }
  };

  const selectVideoFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library access is required to select videos');
        return;
      }

      console.log('📱 Opening gallery for video selection...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos, // Note: MediaTypeOptions deprecated but still functional
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const videoUri = result.assets[0].uri;
        console.log('✅ Video selected from gallery:', videoUri);
        
        setSelectedVideo(videoUri);
        setSelectedImage(null);
        setSelectedColor(null);
        
        Alert.alert(
          '🎥 Video Selected!', 
          'Your video is ready to share!',
          [{ text: 'Great!', style: 'default' }]
        );
      } else {
        console.log('📱 Video selection cancelled by user');
      }
    } catch (error) {
      console.error('❌ Error selecting video from gallery:', error);
      Alert.alert('Error', 'Failed to select video. Please try again.');
    }
  };

  const showVideoOptions = () => {
    Alert.alert(
      'Add Video to Story',
      'How would you like to add a video?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: '📹 Record Video', 
          onPress: recordVideoWithNativeCamera 
        },
        { 
          text: '📱 Choose from Gallery', 
          onPress: selectVideoFromGallery 
        },
      ]
    );
  };



  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
        videoMaxDuration: 30, // 30 seconds max for stories
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.type === 'image') {
          setSelectedImage(asset.uri);
          setSelectedVideo(null);
        } else if (asset.type === 'video') {
          setSelectedVideo(asset.uri);
          setSelectedImage(null);
        }
        setSelectedColor(null); // Clear color when media is selected
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media from gallery');
    }
  };

  const selectColor = (color: string) => {
    setSelectedColor(color);
    setSelectedImage(null); // Clear image if color is selected
    setShowColorPicker(false);
  };

  const createNewStory = async () => {
    console.log('🎬 Creating story with media:', {
      hasImage: !!selectedImage,
      hasVideo: !!selectedVideo,
      hasColor: !!selectedColor,
      hasText: !!storyText.trim(),
      imageUri: selectedImage,
      videoUri: selectedVideo,
    });
    
    console.log('📊 Current state values:', {
      selectedImage,
      selectedVideo,
      selectedColor,
      storyText: storyText.trim(),
    });

    if (!selectedImage && !selectedVideo && !selectedColor && !storyText.trim()) {
      Alert.alert('Error', 'Please add an image, video, color, or text to your story');
      return;
    }

    setIsUploading(true);

    try {
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;
      let thumbnailUrl: string | undefined;

      // Upload image if selected
      if (selectedImage) {
        const imagePath = `craftStories/${currentUserId}/story_${Date.now()}/image.jpg`;
        const uploadResult = await uploadImage(selectedImage, imagePath);
        imageUrl = uploadResult.url;
      }

      // Upload video and generate thumbnail if selected
      if (selectedVideo) {
        const storyId = `story_${Date.now()}`;
        const videoPath = `craftStories/${currentUserId}/${storyId}/video.mp4`;
        
        // Upload video
        const videoUploadResult = await uploadVideo(selectedVideo, videoPath);
        videoUrl = videoUploadResult.url;
        
        // Generate and upload thumbnail (optional - graceful fallback if not available)
        try {
          thumbnailUrl = await generateVideoThumbnail(selectedVideo, currentUserId, storyId);
          console.log('✅ Video thumbnail generated successfully');
        } catch (thumbnailError) {
          console.warn('⚠️ Failed to generate thumbnail, story will continue without it:', thumbnailError);
          // Story will still work, just without a thumbnail
        }
      }

      // Create story data
      const storyData: Omit<CraftStory, 'id' | 'createdAt' | 'expiresAt' | 'views' | 'isActive'> = {
        userId: currentUserId,
        author: {
          id: currentUserId,
          displayName: currentUserName,
          ...(currentUserAvatar && { avatar: currentUserAvatar }), // Only include avatar if it exists
        },
        content: {
          ...(imageUrl && { imageUrl }),
          ...(videoUrl && { videoUrl }),
          ...(thumbnailUrl && { thumbnailUrl }),
          ...(storyText.trim() && { text: storyText.trim() }),
          ...(selectedColor && { backgroundColor: selectedColor }),
        },
      };

      const storyId = await createStory(storyData);
      
      // Create the full story object for callback
      const fullStory: CraftStory = {
        ...storyData,
        id: storyId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        views: [],
        isActive: true,
      };

      onStoryCreated(fullStory);
      Alert.alert(
        '🎉 Story Shared!', 
        'Your craft story is now live for 24 hours. Other craftsmen can view it in the stories bar!',
        [{ text: 'Awesome!', style: 'default' }]
      );
      onClose();
    } catch (error) {
      console.error('Error creating story:', error);
      Alert.alert('Error', 'Failed to create story. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const flipCamera = () => {
    setCameraFacing(cameraFacing === 'back' ? 'front' : 'back');
  };

  const clearContent = () => {
    setSelectedImage(null);
    setSelectedVideo(null);
    setSelectedColor(null);
    setStoryText('');
    setMode('photo');
  };

  if (!permission || !microphonePermission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted || !microphonePermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera and microphone access is required for video recording</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={() => {
          if (!permission.granted) requestPermission();
          if (!microphonePermission.granted) requestMicrophonePermission();
        }}>
          <Text style={styles.permissionButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permissionButton} onPress={pickImageFromGallery}>
          <Text style={styles.permissionButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderPreview = () => {
    if (selectedImage) {
      return (
        <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />
      );
    }

    if (selectedVideo) {
      return (
        <View style={styles.videoPreviewContainer}>
          <Image source={{ uri: selectedVideo }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.videoIndicator}>
            <Ionicons name="play-circle" size={50} color="white" />
            <Text style={styles.videoIndicatorText}>Video Story</Text>
          </View>
        </View>
      );
    }

    if (selectedColor) {
      return <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />;
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          style={styles.camera} 
          facing={cameraFacing} 
          ref={cameraRef}
        />
      </View>
    );
  };

  const renderColorPicker = () => (
    <View style={styles.colorPickerContainer}>
      <Text style={styles.colorPickerTitle}>Choose Background</Text>
      <View style={styles.colorGrid}>
        {COLOR_BACKGROUNDS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[styles.colorOption, { backgroundColor: color }]}
            onPress={() => selectColor(color)}
          />
        ))}
      </View>
    </View>
  );

  const renderCaptureArea = () => {
    if (selectedImage || selectedVideo || selectedColor) {
      return (
        <View style={styles.captureControls}>
          <TouchableOpacity style={styles.clearButton} onPress={clearContent}>
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.captureControls}>
        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'photo' && styles.modeButtonActive]}
            onPress={() => setMode('photo')}
          >
            <Text style={[styles.modeButtonText, mode === 'photo' && styles.modeButtonTextActive]}>
              Photo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'video' && styles.modeButtonActive]}
            onPress={() => setMode('video')}
          >
            <Text style={[styles.modeButtonText, mode === 'video' && styles.modeButtonTextActive]}>
              Video
            </Text>
          </TouchableOpacity>
        </View>

        {/* Capture Button */}
        <View style={styles.captureButtonContainer}>
          {mode === 'photo' ? (
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.videoCaptureButton} onPress={showVideoOptions}>
              <Ionicons name="videocam" size={32} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Mode Status */}
        <Text style={styles.modeStatus}>
          {mode === 'photo' ? 'Photo Mode' : 'Video Mode'}
        </Text>

        {/* Camera Flip Button */}
        <TouchableOpacity style={styles.flipButton} onPress={flipCamera}>
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Preview Area */}
      <View style={styles.previewContainer}>
        {renderPreview()}
        
        {/* Text Overlay */}
        {storyText.trim() && (
          <View style={styles.textOverlay}>
            <Text style={styles.overlayText}>{storyText}</Text>
          </View>
        )}
      </View>

      {/* Top Controls */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.topGradient}
      >
        <SafeAreaView style={styles.topControls}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          
          <View style={styles.topRightControls}>
            {(selectedImage || selectedVideo) && (
              <TouchableOpacity onPress={clearContent} style={styles.topButton}>
                <Ionicons name="refresh" size={24} color="white" />
              </TouchableOpacity>
            )}
            {!selectedImage && !selectedVideo && !selectedColor && (
              <TouchableOpacity onPress={flipCamera} style={styles.topButton}>
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Bottom Controls */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.bottomGradient}
      >
        <SafeAreaView style={styles.bottomControls}>
          {/* Color Picker Modal */}
          {showColorPicker && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                {renderColorPicker()}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowColorPicker(false)}
                >
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Text Input Modal */}
          {showTextInput && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add Text</Text>
                <TextInput
                  style={styles.textInput}
                  value={storyText}
                  onChangeText={setStoryText}
                  placeholder="What's happening?"
                  placeholderTextColor="#999"
                  multiline
                  maxLength={100}
                  autoFocus
                />
                <View style={styles.textInputButtons}>
                  <TouchableOpacity
                    style={styles.textInputButton}
                    onPress={() => setShowTextInput(false)}
                  >
                    <Text style={styles.textInputButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Main Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={pickImageFromGallery} style={styles.controlButton}>
              <Ionicons name="images" size={24} color="white" />
              <Text style={styles.controlButtonText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowColorPicker(true)}
              style={styles.controlButton}
            >
              <Ionicons name="color-palette" size={24} color="white" />
              <Text style={styles.controlButtonText}>Color</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowTextInput(true)}
              style={styles.controlButton}
            >
              <Ionicons name="text" size={24} color="white" />
              <Text style={styles.controlButtonText}>Text</Text>
            </TouchableOpacity>
          </View>

          {/* Capture/Create Button */}
          <View style={styles.captureRow}>
            {!selectedImage && !selectedVideo && !selectedColor ? (
              renderCaptureArea()
            ) : (
              <TouchableOpacity
                onPress={createNewStory}
                style={[styles.createButton, isUploading && styles.createButtonDisabled]}
                disabled={isUploading}
              >
                <Text style={styles.createButtonText}>
                  {isUploading ? '🔄 Creating Story...' : '📤 Share Story'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  previewImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
  colorPreview: {
    width: width,
    height: height,
    position: 'absolute',
  },
  textOverlay: {
    position: 'absolute',
    top: height * 0.4,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  overlayText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 100,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  closeButton: {
    padding: 8,
  },
  topRightControls: {
    flexDirection: 'row',
  },
  topButton: {
    padding: 8,
    marginLeft: 10,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 100,
  },
  bottomControls: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  },
  captureRow: {
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  createButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  createButtonDisabled: {
    backgroundColor: '#666',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: -150,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  colorPickerContainer: {
    alignItems: 'center',
  },
  colorPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    margin: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#333',
  },
  textInputButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  textInputButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  textInputButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#666',
    fontSize: 16,
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  permissionButton: {
    backgroundColor: '#8B4513',
    padding: 15,
    borderRadius: 10,
    margin: 20,
  },
  permissionButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  videoPreviewContainer: {
    flex: 1,
    position: 'relative',
  },
  videoIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
  },
  videoIndicatorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },

  captureControls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  clearButton: {
    padding: 10,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  modeButton: {
    padding: 10,
  },
  modeButtonActive: {
    backgroundColor: '#8B4513',
  },
  modeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  modeButtonTextActive: {
    fontWeight: '600',
  },
  captureButtonContainer: {
    marginRight: 20,
  },
  videoCaptureButton: {
    padding: 10,
  },
  modeStatus: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  flipButton: {
    padding: 10,
  },
}); 