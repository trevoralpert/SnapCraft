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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { CraftStory } from '../../shared/types';
import { createStory } from '../../services/firebase/stories';
import { uploadImage } from '../../services/firebase/storage';

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
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [storyText, setStoryText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setSelectedImage(photo.uri);
        setSelectedColor(null); // Clear color if image is selected
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setSelectedColor(null); // Clear color if image is selected
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const selectColor = (color: string) => {
    setSelectedColor(color);
    setSelectedImage(null); // Clear image if color is selected
    setShowColorPicker(false);
  };

  const createNewStory = async () => {
    if (!selectedImage && !selectedColor && !storyText.trim()) {
      Alert.alert('Error', 'Please add an image, color, or text to your story');
      return;
    }

    setIsUploading(true);

    try {
      let imageUrl: string | undefined;

             // Upload image if selected
       if (selectedImage) {
         const imagePath = `stories/${currentUserId}/${Date.now()}.jpg`;
         const uploadResult = await uploadImage(selectedImage, imagePath);
         imageUrl = uploadResult.url;
       }

      // Create story data
      const storyData: Omit<CraftStory, 'id' | 'createdAt' | 'expiresAt' | 'views' | 'isActive'> = {
        userId: currentUserId,
        author: {
          id: currentUserId,
          displayName: currentUserName,
          avatar: currentUserAvatar,
        },
        content: {
          imageUrl,
          text: storyText.trim() || undefined,
          backgroundColor: selectedColor || undefined,
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
    setSelectedColor(null);
    setStoryText('');
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera access is required to create stories</Text>
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

    if (selectedColor) {
      return <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />;
    }

    return (
      <CameraView style={styles.camera} facing={cameraFacing} ref={cameraRef}>
        <View style={styles.cameraOverlay} />
      </CameraView>
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
            {selectedImage && (
              <TouchableOpacity onPress={clearContent} style={styles.topButton}>
                <Ionicons name="refresh" size={24} color="white" />
              </TouchableOpacity>
            )}
            {!selectedImage && !selectedColor && (
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
            {!selectedImage && !selectedColor ? (
              <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
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
}); 