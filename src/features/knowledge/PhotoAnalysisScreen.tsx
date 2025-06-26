import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { OpenAIService, PhotoAnalysisResponse, CraftContext } from '../../services/rag/openai';
import { RAGService } from '../../services/rag';
import { useAuthStore } from '../../stores/authStore';

interface AnalysisResult {
  response: PhotoAnalysisResponse;
  imageUri: string;
  query: string;
  timestamp: Date;
}

export default function PhotoAnalysisScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const { user } = useAuthStore();

  const openaiService = OpenAIService.getInstance();
  const ragService = RAGService.getInstance();

  // Request camera permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
      return false;
    }
    return true;
  };

  // Handle image selection from gallery
  const selectImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setAnalysisResult(null); // Clear previous analysis
    }
  };

  // Handle taking a new photo
  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setAnalysisResult(null); // Clear previous analysis
    }
  };

  // Show image selection options
  const showImageOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add a photo for analysis',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: selectImageFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Handle photo analysis
  const analyzePhoto = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first.');
      return;
    }

    if (!query.trim()) {
      Alert.alert('No Question', 'Please enter a question about your photo.');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Build context for the analysis
      const context: CraftContext = {
        userProfile: {
          craftSpecialization: user?.craftSpecialization || [],
          skillLevel: user?.skillLevel || 'beginner',
          bio: user?.bio,
        },
      };

      // Get relevant knowledge base articles
      const knowledgeResults = await ragService.searchKnowledge(query, {
        craftTypes: context.userProfile?.craftSpecialization,
      });

      const knowledgeBase = knowledgeResults.map((result: any) => result.knowledge.content);

      // Analyze the photo using GPT-4 Vision
      const response = await openaiService.analyzeCraftPhoto(
        selectedImage,
        query,
        context,
        knowledgeBase
      );

      const result: AnalysisResult = {
        response,
        imageUri: selectedImage,
        query,
        timestamp: new Date(),
      };

      setAnalysisResult(result);
      setAnalysisHistory(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 analyses
    } catch (error) {
      console.error('Photo Analysis Error:', error);
      Alert.alert('Analysis Failed', 'Unable to analyze the photo. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Quick analysis prompts
  const quickPrompts = [
    "What craft technique is being demonstrated?",
    "How can I improve this project?",
    "What tools do I need for this?",
    "Is this safe? Any concerns?",
    "What's the skill level required?",
  ];

  const handleQuickPrompt = (prompt: string) => {
    setQuery(prompt);
  };

  const renderAnalysisSection = (title: string, items: string[], icon: string) => {
    if (items.length === 0) return null;

    return (
      <View style={styles.analysisSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name={icon as any} size={18} color="#8B4513" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {items.map((item, index) => (
          <Text key={index} style={styles.sectionItem}>
            • {item}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="camera" size={32} color="#8B4513" />
            <Text style={styles.title}>Smart Photo Analysis</Text>
            <Text style={styles.subtitle}>
              AI-powered visual analysis of your craft projects
            </Text>
          </View>

          {/* Image Selection */}
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Upload Photo</Text>
            
            {selectedImage ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.changeImageButton}
                  onPress={showImageOptions}
                >
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  <Text style={styles.changeImageText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={showImageOptions}>
                <Ionicons name="camera-outline" size={48} color="#8B4513" />
                <Text style={styles.uploadText}>Tap to add photo</Text>
                <Text style={styles.uploadSubtext}>
                  Take a photo or choose from gallery
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Question Input */}
          <View style={styles.querySection}>
            <Text style={styles.sectionTitle}>Your Question</Text>
            
            {/* Quick Prompts */}
            <View style={styles.quickPrompts}>
              <Text style={styles.quickPromptsLabel}>Quick questions:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {quickPrompts.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickPromptButton}
                    onPress={() => handleQuickPrompt(prompt)}
                  >
                    <Text style={styles.quickPromptText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TextInput
              style={styles.queryInput}
              value={query}
              onChangeText={setQuery}
              placeholder="What would you like to know about this photo?"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
              onPress={analyzePhoto}
              disabled={isAnalyzing || !selectedImage}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="eye" size={20} color="#FFFFFF" />
                  <Text style={styles.analyzeButtonText}>Analyze Photo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Analysis Results */}
          {analysisResult && (
            <View style={styles.resultsSection}>
              <Text style={styles.sectionTitle}>Analysis Results</Text>
              
              {/* Confidence and Metadata */}
              <View style={styles.metadataRow}>
                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceLabel}>Confidence</Text>
                  <Text style={styles.confidenceValue}>
                    {analysisResult.response.confidence}%
                  </Text>
                </View>
                <Text style={styles.timestamp}>
                  {analysisResult.timestamp.toLocaleTimeString()}
                </Text>
              </View>

              {/* Main Analysis */}
              <View style={styles.analysisMain}>
                <Text style={styles.analysisText}>
                  {analysisResult.response.analysis}
                </Text>
              </View>

              {/* Structured Results */}
              {renderAnalysisSection(
                'Detected Crafts',
                analysisResult.response.detectedCraft,
                'construct'
              )}
              
              {renderAnalysisSection(
                'Techniques Identified',
                analysisResult.response.identifiedTechniques,
                'settings'
              )}
              
              {renderAnalysisSection(
                'Suggested Improvements',
                analysisResult.response.suggestedImprovements,
                'trending-up'
              )}
              
              {renderAnalysisSection(
                'Tool Recommendations',
                analysisResult.response.toolRecommendations,
                'hammer'
              )}
              
              {renderAnalysisSection(
                'Safety Considerations',
                analysisResult.response.safetyConsiderations,
                'shield-checkmark'
              )}
              
              {renderAnalysisSection(
                'Follow-up Questions',
                analysisResult.response.followUpQuestions,
                'help-circle'
              )}
            </View>
          )}

          {/* Analysis History */}
          {analysisHistory.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>Recent analyses</Text>
              {analysisHistory.slice(0, 3).map((result, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.historyItem}
                  onPress={() => setAnalysisResult(result)}
                >
                  <Image source={{ uri: result.imageUri }} style={styles.historyImage} />
                  <View style={styles.historyContent}>
                    <Text style={styles.historyQuery} numberOfLines={1}>
                      {result.query}
                    </Text>
                    <Text style={styles.historyTime}>
                      {result.timestamp.toLocaleString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#666" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  imageSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 12,
  },
  imageContainer: {
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B4513',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeImageText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B4513',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4513',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  querySection: {
    marginBottom: 24,
  },
  quickPrompts: {
    marginBottom: 16,
  },
  quickPromptsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quickPromptButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  quickPromptText: {
    fontSize: 12,
    color: '#8B4513',
  },
  queryInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  analyzeButton: {
    backgroundColor: '#8B4513',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#CCC',
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  analysisMain: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  analysisText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  analysisSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    paddingLeft: 8,
  },
  historySection: {
    marginBottom: 24,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyQuery: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  historyTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
}); 