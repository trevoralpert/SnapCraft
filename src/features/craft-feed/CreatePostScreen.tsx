import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../stores/authStore';
import { uploadMultipleImages, generatePostImagePath } from '../../services/firebase/storage';
import { createPost } from '../../services/firebase/posts';
import { CraftPost } from '../../shared/types';

// Craft types for selection
const CRAFT_TYPES = [
  { id: 'woodworking', label: 'Woodworking', emoji: '🪵' },
  { id: 'blacksmithing', label: 'Blacksmithing', emoji: '⚒️' },
  { id: 'pottery', label: 'Pottery', emoji: '🏺' },
  { id: 'leatherworking', label: 'Leatherworking', emoji: '🧳' },
  { id: 'weaving', label: 'Weaving', emoji: '🧵' },
  { id: 'glassblowing', label: 'Glassblowing', emoji: '🫧' },
  { id: 'jewelry', label: 'Jewelry', emoji: '💍' },
  { id: 'bushcraft', label: 'Bushcraft', emoji: '🌿' },
  { id: 'stonework', label: 'Stonework', emoji: '🪨' },
  { id: 'metalwork', label: 'Metalwork', emoji: '🔧' },
  { id: 'other', label: 'Other', emoji: '🎨' },
];

// Difficulty levels
const DIFFICULTY_LEVELS = [
  { id: 'beginner', label: 'Beginner', color: '#4CAF50' },
  { id: 'intermediate', label: 'Intermediate', color: '#FF9800' },
  { id: 'advanced', label: 'Advanced', color: '#F44336' },
  { id: 'expert', label: 'Expert', color: '#9C27B0' },
];

interface CreatePostScreenProps {
  onPostCreated?: (post: any) => void;
  onCancel?: () => void;
}

export default function CreatePostScreen({ onPostCreated, onCancel }: CreatePostScreenProps) {
  const { user } = useAuthStore();
  const [description, setDescription] = useState('');
  const [selectedCraftType, setSelectedCraftType] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [materials, setMaterials] = useState<string[]>(['']);
  const [techniques, setTechniques] = useState<string[]>(['']);
  const [timeSpent, setTimeSpent] = useState('');
  const [tags, setTags] = useState('');
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Add/remove material fields
  const addMaterial = () => {
    setMaterials([...materials, '']);
  };

  const removeMaterial = (index: number) => {
    if (materials.length > 1) {
      setMaterials(materials.filter((_, i) => i !== index));
    }
  };

  const updateMaterial = (index: number, value: string) => {
    const newMaterials = [...materials];
    newMaterials[index] = value;
    setMaterials(newMaterials);
  };

  // Add/remove technique fields
  const addTechnique = () => {
    setTechniques([...techniques, '']);
  };

  const removeTechnique = (index: number) => {
    if (techniques.length > 1) {
      setTechniques(techniques.filter((_, i) => i !== index));
    }
  };

  const updateTechnique = (index: number, value: string) => {
    const newTechniques = [...techniques];
    newTechniques[index] = value;
    setTechniques(newTechniques);
  };

  // Real image picker
  const handleAddImage = async () => {
    if (selectedImages.length >= 3) {
      const message = 'Maximum 3 images allowed per post.';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      } else {
        Alert.alert('Image Limit', message);
      }
      return;
    }

    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        const message = 'Permission to access media library is required to add photos to your craft post.';
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(message);
        } else {
          Alert.alert('Permission Required', message);
        }
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImageUri = result.assets[0].uri;
        setSelectedImages([...selectedImages, newImageUri]);
        console.log('📸 Real image added:', newImageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      const message = 'Failed to select image. Please try again.';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!description.trim()) {
      const message = 'Please add a description for your craft project.';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      } else {
        Alert.alert('Missing Description', message);
      }
      return false;
    }

    if (!selectedCraftType) {
      const message = 'Please select a craft type.';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      } else {
        Alert.alert('Missing Craft Type', message);
      }
      return false;
    }

    if (!selectedDifficulty) {
      const message = 'Please select a difficulty level.';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      } else {
        Alert.alert('Missing Difficulty', message);
      }
      return false;
    }

    const validMaterials = materials.filter(m => m.trim());
    if (validMaterials.length === 0) {
      const message = 'Please add at least one material.';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      } else {
        Alert.alert('Missing Materials', message);
      }
      return false;
    }

    return true;
  };

  // Convert time string to minutes
  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr.trim()) return 0;
    
    const lowerTime = timeStr.toLowerCase();
    let totalMinutes = 0;
    
    // Extract hours
    const hoursMatch = lowerTime.match(/(\d+(?:\.\d+)?)\s*h/);
    if (hoursMatch && hoursMatch[1]) {
      totalMinutes += parseFloat(hoursMatch[1]) * 60;
    }
    
    // Extract minutes
    const minutesMatch = lowerTime.match(/(\d+)\s*m/);
    if (minutesMatch && minutesMatch[1]) {
      totalMinutes += parseInt(minutesMatch[1]);
    }
    
    // If no specific format, assume it's hours
    if (!hoursMatch && !minutesMatch) {
      const numValue = parseFloat(timeStr);
      if (!isNaN(numValue)) {
        totalMinutes = numValue * 60; // Assume hours
      }
    }
    
    return Math.max(0, totalMinutes);
  };

  // Submit post with real Firebase integration
  const handleSubmit = async () => {
    if (!user) {
      const message = 'Please log in to create a post.';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      } else {
        Alert.alert('Authentication Required', message);
      }
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let imageUrls: string[] = [];

      // Upload images to Firebase Storage if any selected
      if (selectedImages.length > 0) {
        console.log('📤 Uploading images to Firebase Storage...');
        const basePath = generatePostImagePath(user.id);
        
        const uploadResults = await uploadMultipleImages(
          selectedImages,
          basePath,
          (progress) => {
            setUploadProgress(progress);
            console.log(`📊 Upload progress: ${progress.toFixed(1)}%`);
          }
        );

        imageUrls = uploadResults.map(result => result.url);
        console.log('✅ Images uploaded successfully:', imageUrls.length);
      }

      // Create post data
      const postData: Omit<CraftPost, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.id,
        author: {
          id: user.id,
          displayName: user.displayName || 'Anonymous Craftsman',
          // Only include avatar if user has one
        },
        content: {
          description: description.trim(),
          images: imageUrls,
          videos: [],
          materials: materials.filter(m => m.trim()),
          timeSpent: parseTimeToMinutes(timeSpent),
          difficulty: selectedDifficulty as 'beginner' | 'intermediate' | 'advanced' | 'expert',
        },
        craftType: selectedCraftType as CraftPost['craftType'],
        techniques: techniques.filter(t => t.trim()),
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
        },
        isEphemeral,
      };

      // Save post to Firestore
      console.log('💾 Saving post to Firestore...');
      const postId = await createPost(postData);

      console.log('✅ Craft post created successfully:', postId);
      
      // Reset form
      setDescription('');
      setSelectedCraftType('');
      setSelectedDifficulty('');
      setMaterials(['']);
      setTechniques(['']);
      setTimeSpent('');
      setTags('');
      setSelectedImages([]);
      setIsEphemeral(false);
      
      // Call success callback
      if (onPostCreated) {
        onPostCreated({ id: postId, ...postData });
      }

      // Show success message
      const message = `Your ${selectedCraftType} project has been shared with the community! 🎉`;
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      } else {
        Alert.alert('Post Created!', message);
      }

    } catch (error) {
      console.error('❌ Error creating post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const message = `Failed to create post: ${errorMessage}`;
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authRequiredContainer}>
          <Text style={styles.authRequiredTitle}>Authentication Required</Text>
          <Text style={styles.authRequiredText}>
            Please log in to share your craft projects with the community.
          </Text>
          <TouchableOpacity style={styles.authButton} onPress={onCancel}>
            <Text style={styles.authButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Ionicons name="close" size={24} color="#8B4513" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Your Craft</Text>
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting 
              ? (uploadProgress > 0 ? `Uploading ${Math.round(uploadProgress)}%` : 'Posting...')
              : 'Post'
            }
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Description *</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe your craft project, techniques used, challenges faced..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{description.length}/500</Text>
        </View>

        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Photos</Text>
          <View style={styles.imagesContainer}>
            {selectedImages.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={20} color="#FF4444" />
                </TouchableOpacity>
              </View>
            ))}
            {selectedImages.length < 3 && (
              <TouchableOpacity style={styles.addImageButton} onPress={handleAddImage}>
                <Ionicons name="camera" size={24} color="#8B4513" />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Craft Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Craft Type *</Text>
          <View style={styles.craftTypesGrid}>
            {CRAFT_TYPES.map((craft) => (
              <TouchableOpacity
                key={craft.id}
                style={[
                  styles.craftTypeButton,
                  selectedCraftType === craft.id && styles.craftTypeButtonSelected,
                ]}
                onPress={() => setSelectedCraftType(craft.id)}
              >
                <Text style={styles.craftTypeEmoji}>{craft.emoji}</Text>
                <Text style={[
                  styles.craftTypeLabel,
                  selectedCraftType === craft.id && styles.craftTypeLabelSelected,
                ]}>
                  {craft.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Difficulty Level *</Text>
          <View style={styles.difficultyContainer}>
            {DIFFICULTY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.difficultyButton,
                  selectedDifficulty === level.id && { backgroundColor: level.color },
                ]}
                onPress={() => setSelectedDifficulty(level.id)}
              >
                <Text style={[
                  styles.difficultyLabel,
                  selectedDifficulty === level.id && styles.difficultyLabelSelected,
                ]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time Spent */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Spent</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., 2h 30m, 4 hours, 90m"
            placeholderTextColor="#999"
            value={timeSpent}
            onChangeText={setTimeSpent}
          />
          <Text style={styles.helpText}>
            Enter time in hours (h) and/or minutes (m)
          </Text>
        </View>

        {/* Materials */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Materials Used *</Text>
            <TouchableOpacity style={styles.addButton} onPress={addMaterial}>
              <Ionicons name="add" size={20} color="#8B4513" />
            </TouchableOpacity>
          </View>
          {materials.map((material, index) => (
            <View key={index} style={styles.inputRow}>
              <TextInput
                style={[styles.textInput, styles.flexInput]}
                placeholder={`Material ${index + 1}`}
                placeholderTextColor="#999"
                value={material}
                onChangeText={(value) => updateMaterial(index, value)}
              />
              {materials.length > 1 && (
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeMaterial(index)}
                >
                  <Ionicons name="remove" size={20} color="#FF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Techniques */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Techniques Used</Text>
            <TouchableOpacity style={styles.addButton} onPress={addTechnique}>
              <Ionicons name="add" size={20} color="#8B4513" />
            </TouchableOpacity>
          </View>
          {techniques.map((technique, index) => (
            <View key={index} style={styles.inputRow}>
              <TextInput
                style={[styles.textInput, styles.flexInput]}
                placeholder={`Technique ${index + 1}`}
                placeholderTextColor="#999"
                value={technique}
                onChangeText={(value) => updateTechnique(index, value)}
              />
              {techniques.length > 1 && (
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeTechnique(index)}
                >
                  <Ionicons name="remove" size={20} color="#FF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <TextInput
            style={styles.textInput}
            placeholder="handmade, furniture, oak, traditional (comma separated)"
            placeholderTextColor="#999"
            value={tags}
            onChangeText={setTags}
          />
          <Text style={styles.helpText}>
            Add tags to help others discover your project
          </Text>
        </View>

        {/* Ephemeral Toggle */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.toggleContainer}
            onPress={() => setIsEphemeral(!isEphemeral)}
          >
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Ephemeral Post</Text>
              <Text style={styles.toggleDescription}>
                Post will disappear after 24 hours (like Snapchat stories)
              </Text>
            </View>
            <View style={[styles.toggle, isEphemeral && styles.toggleActive]}>
              {isEphemeral && <View style={styles.toggleDot} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  cancelButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  submitButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 10,
  },
  descriptionInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  flexInput: {
    flex: 1,
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8B4513',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  addImageText: {
    fontSize: 10,
    color: '#8B4513',
    marginTop: 4,
  },
  craftTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  craftTypeButton: {
    width: '30%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  craftTypeButtonSelected: {
    borderColor: '#8B4513',
    backgroundColor: '#F9F5F1',
  },
  craftTypeEmoji: {
    fontSize: 20,
    marginBottom: 5,
  },
  craftTypeLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  craftTypeLabelSelected: {
    color: '#8B4513',
    fontWeight: '600',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  difficultyLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  difficultyLabelSelected: {
    color: 'white',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F9F5F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  toggleContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  toggleDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 3,
  },
  toggleActive: {
    backgroundColor: '#8B4513',
    alignItems: 'flex-start',
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  bottomSpacing: {
    height: 50,
  },
  authRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  authRequiredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
  },
  authRequiredText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  authButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 