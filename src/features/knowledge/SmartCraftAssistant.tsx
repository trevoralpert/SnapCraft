import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RAGService, RAGQuery, EnhancedRAGResponse } from '../../services/rag';
import { useAuthStore } from '../../stores/authStore';

interface ToolInventoryItem {
  id: string;
  name: string;
  category: string;
  owned: boolean;
}

// Mock multi-craft tool inventory - in production this would come from Firebase
const MOCK_TOOL_INVENTORY: ToolInventoryItem[] = [
  // Woodworking tools
  { id: 'saw_001', name: 'Circular Saw', category: 'woodworking', owned: true },
  { id: 'chisel_001', name: '1/2" Chisel', category: 'woodworking', owned: true },
  { id: 'plane_001', name: 'Block Plane', category: 'woodworking', owned: true },
  
  // Metalworking tools
  { id: 'welder_001', name: 'MIG Welder', category: 'metalworking', owned: false },
  { id: 'grinder_001', name: 'Angle Grinder', category: 'metalworking', owned: true },
  { id: 'vise_001', name: '4" Bench Vise', category: 'metalworking', owned: true },
  
  // Pottery tools
  { id: 'wheel_001', name: 'Pottery Wheel', category: 'pottery', owned: false },
  { id: 'kiln_001', name: 'Electric Kiln', category: 'pottery', owned: false },
  { id: 'tools_001', name: 'Clay Tool Set', category: 'pottery', owned: true },
  
  // General tools
  { id: 'drill_001', name: 'Cordless Drill', category: 'general', owned: true },
  { id: 'square_001', name: 'Combination Square', category: 'general', owned: true },
  { id: 'clamp_001', name: 'Bar Clamps (4)', category: 'general', owned: true },
];

interface SmartCraftAssistantProps {
  onBack?: () => void;
}

export default function SmartCraftAssistant({ onBack }: SmartCraftAssistantProps) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<EnhancedRAGResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toolInventory] = useState<ToolInventoryItem[]>(MOCK_TOOL_INVENTORY);
  const [selectedCraftType, setSelectedCraftType] = useState<string>('general');
  const { user } = useAuthStore();

  const ragService = RAGService.getInstance();

  const handleSubmitQuery = async () => {
    if (!query.trim()) {
      Alert.alert('Please enter a question');
      return;
    }

    setIsLoading(true);
    try {
      // Build RAG query with tool inventory context
      const ownedTools = toolInventory.filter(tool => tool.owned).map(tool => tool.name);
      const missingTools = toolInventory.filter(tool => !tool.owned).map(tool => tool.name);
      
      const enhancedQuery = `${query}

My available tools: ${ownedTools.join(', ')}
Tools I don't have: ${missingTools.join(', ')}

Please consider my available tools when providing recommendations.`;

      // Detect craft type from query or use user's specializations
      const detectedCraftTypes = user?.craftSpecialization || [];
      
      const ragQuery: RAGQuery = {
        query: enhancedQuery,
        context: {
          craftTypes: detectedCraftTypes.length > 0 ? detectedCraftTypes : undefined,
          includeUserProfile: true,
        },
        options: {
          maxKnowledgeResults: 5,
          includeFollowUp: true,
        }
      };

      const result = await ragService.processQuery(ragQuery);
      setResponse(result);
    } catch (error) {
      console.error('RAG Query Error:', error);
      Alert.alert('Error', 'Failed to get assistance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuery = async (quickQuery: string) => {
    setQuery(quickQuery);
    // Auto-submit after setting query
    setTimeout(() => handleSubmitQuery(), 100);
  };

  const quickQueryOptions = [
    "What tools do I need for leather tooling?",
    "How do I start pottery wheel throwing?",
    "What's the best welding technique for beginners?",
    "How do I organize my workshop efficiently?",
    "What safety equipment do I need for metalworking?",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              {onBack && (
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                  <Ionicons name="arrow-back" size={24} color="#8B4513" />
                </TouchableOpacity>
              )}
              <View style={styles.headerContent}>
                <Ionicons name="construct" size={32} color="#8B4513" />
                <Text style={styles.title}>Smart Craft Assistant</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              AI-powered guidance for all crafts with your tool inventory
            </Text>
          </View>

          {/* Tool Inventory Summary */}
          <View style={styles.toolSummary}>
            <Text style={styles.sectionTitle}>Your Tools</Text>
            <View style={styles.toolStats}>
              <View style={styles.toolStat}>
                <Text style={styles.toolStatNumber}>
                  {toolInventory.filter(t => t.owned).length}
                </Text>
                <Text style={styles.toolStatLabel}>Owned</Text>
              </View>
              <View style={styles.toolStat}>
                <Text style={styles.toolStatNumber}>
                  {toolInventory.filter(t => !t.owned).length}
                </Text>
                <Text style={styles.toolStatLabel}>Missing</Text>
              </View>
            </View>
          </View>

          {/* Quick Query Options */}
          <View style={styles.quickQueries}>
            <Text style={styles.sectionTitle}>Quick Questions</Text>
            {quickQueryOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQueryButton}
                onPress={() => handleQuickQuery(option)}
              >
                <Text style={styles.quickQueryText}>{option}</Text>
                <Ionicons name="arrow-forward" size={16} color="#8B4513" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Query Input */}
          <View style={styles.querySection}>
            <Text style={styles.sectionTitle}>Ask Your Question</Text>
            <TextInput
              style={styles.queryInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Ask about any craft technique, project, or problem..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmitQuery}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Get AI Assistance</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Response Display */}
          {response && (
            <View style={styles.responseSection}>
              <Text style={styles.sectionTitle}>AI Assistant Response</Text>
              
              {/* Main Content */}
              <View style={styles.responseCard}>
                <View style={styles.responseHeader}>
                  <Ionicons name="bulb" size={20} color="#8B4513" />
                  <Text style={styles.responseTitle}>Guidance</Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      {response.confidence}% confident
                    </Text>
                  </View>
                </View>
                <Text style={styles.responseContent}>{response.content}</Text>
              </View>

              {/* Knowledge Sources */}
              {response.knowledgeBase.length > 0 && (
                <View style={styles.sourcesCard}>
                  <Text style={styles.sourcesTitle}>
                    <Ionicons name="library" size={16} color="#8B4513" /> 
                    {' '}Knowledge Sources
                  </Text>
                  {response.knowledgeBase.map((source, index) => (
                    <View key={index} style={styles.sourceItem}>
                      <Text style={styles.sourceTitle}>{source.knowledge.title}</Text>
                      <Text style={styles.sourceCategory}>
                        {source.knowledge.category} • {source.knowledge.difficulty}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Suggestions */}
              {response.suggestions.length > 0 && (
                <View style={styles.suggestionsCard}>
                  <Text style={styles.suggestionsTitle}>
                    <Ionicons name="bulb" size={16} color="#8B4513" />
                    {' '}Related Suggestions
                  </Text>
                  {response.suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => handleQuickQuery(suggestion)}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                      <Ionicons name="arrow-forward" size={14} color="#8B4513" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Follow-up Questions */}
              {response.followUpQuestions.length > 0 && (
                <View style={styles.followUpCard}>
                  <Text style={styles.followUpTitle}>
                    <Ionicons name="help-circle" size={16} color="#8B4513" />
                    {' '}Follow-up Questions
                  </Text>
                  {response.followUpQuestions.map((question, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.followUpItem}
                      onPress={() => handleQuickQuery(question)}
                    >
                      <Text style={styles.followUpText}>{question}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Processing Stats */}
              <View style={styles.statsCard}>
                <Text style={styles.statsText}>
                  Processed in {response.processingTime}ms • Query ID: {response.queryId}
                </Text>
              </View>
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
    backgroundColor: '#F5F5DC', // Beige craft theme
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  toolSummary: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 12,
  },
  toolStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  toolStat: {
    alignItems: 'center',
  },
  toolStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  toolStatLabel: {
    fontSize: 14,
    color: '#666666',
  },
  quickQueries: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickQueryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickQueryText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  querySection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  queryInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    backgroundColor: '#F8F8F8',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B4513',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  responseSection: {
    margin: 16,
  },
  responseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginLeft: 8,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  responseContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  },
  sourcesCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sourcesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
  },
  sourceItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sourceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  sourceCategory: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  suggestionsCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  followUpCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  followUpTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
  },
  followUpItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  followUpText: {
    fontSize: 14,
    color: '#333333',
  },
  statsCard: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
}); 