import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ToolConfirmationData, ToolIdentificationService } from '../../services/toolIdentification';
import { useAuthStore } from '../../stores/authStore';

interface ToolConfirmationModalProps {
  visible: boolean;
  toolConfirmations: ToolConfirmationData[];
  onClose: () => void;
  onToolsAdded: (addedCount: number) => void;
  photoUri?: string;
}

export default function ToolConfirmationModal({
  visible,
  toolConfirmations,
  onClose,
  onToolsAdded,
  photoUri,
}: ToolConfirmationModalProps) {
  const { user } = useAuthStore();
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const toolService = ToolIdentificationService.getInstance();

  // Initialize selected tools (all non-duplicate tools selected by default)
  React.useEffect(() => {
    const defaultSelected = new Set(
      toolConfirmations
        .filter(tc => !tc.isAlreadyInInventory)
        .map(tc => tc.tool.id)
    );
    setSelectedTools(defaultSelected);
  }, [toolConfirmations]);

  const toggleToolSelection = (toolId: string) => {
    const newSelected = new Set(selectedTools);
    if (newSelected.has(toolId)) {
      newSelected.delete(toolId);
    } else {
      newSelected.add(toolId);
    }
    setSelectedTools(newSelected);
  };

  const handleConfirmTools = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (selectedTools.size === 0) {
      Alert.alert('No Tools Selected', 'Please select at least one tool to add to your inventory.');
      return;
    }

    setIsProcessing(true);
    try {
      // Filter to only include selected tools
      const selectedToolData = toolConfirmations.filter(tc => 
        selectedTools.has(tc.tool.id)
      );

      const result = await toolService.addToolsToInventory(selectedToolData, user.id);
      
      if (result.success) {
        Alert.alert(
          'Tools Added!',
          `Successfully added ${result.addedCount} tools to your inventory.`,
          [{ text: 'OK', onPress: () => {
            onToolsAdded(result.addedCount);
            onClose();
          }}]
        );
      } else {
        Alert.alert(
          'Error',
          `Failed to add tools: ${result.errors.join(', ')}`
        );
      }
    } catch (error) {
      console.error('Error confirming tools:', error);
      Alert.alert('Error', 'Failed to add tools to inventory. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#4CAF50'; // Green
    if (confidence >= 0.6) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const getCategoryEmoji = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'hand-tools': '🔨',
      'power-tools': '⚡',
      'measuring': '📏',
      'safety': '🥽',
      'finishing': '🎨',
      'specialized': '🛠️',
    };
    return categoryMap[category] || '🔧';
  };

  const renderToolItem = ({ item }: { item: ToolConfirmationData }) => {
    const isSelected = selectedTools.has(item.tool.id);
    const isDuplicate = item.isAlreadyInInventory;
    
    return (
      <TouchableOpacity
        style={[
          styles.toolItem,
          isSelected && !isDuplicate && styles.selectedToolItem,
          isDuplicate && styles.duplicateToolItem,
        ]}
        onPress={() => !isDuplicate && toggleToolSelection(item.tool.id)}
        disabled={isDuplicate}
        activeOpacity={isDuplicate ? 1 : 0.7}
      >
        <View style={styles.toolHeader}>
          <View style={styles.toolInfo}>
            <Text style={styles.toolEmoji}>{getCategoryEmoji(item.tool.category)}</Text>
            <View style={styles.toolDetails}>
              <Text style={styles.toolName}>{item.tool.name}</Text>
              <Text style={styles.toolCategory}>{item.tool.category.replace('-', ' ')}</Text>
            </View>
          </View>
          
          <View style={styles.toolMeta}>
            {/* Confidence Badge */}
            <View style={[
              styles.confidenceBadge,
              { backgroundColor: getConfidenceColor(item.confidence) }
            ]}>
              <Text style={styles.confidenceBadgeText}>
                {getConfidenceText(item.confidence)}
              </Text>
            </View>
            
            {/* Selection Indicator */}
            {!isDuplicate && (
              <View style={[
                styles.selectionIndicator,
                isSelected && styles.selectedIndicator
              ]}>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
            )}
            
            {/* Duplicate Indicator */}
            {isDuplicate && (
              <View style={styles.duplicateIndicator}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              </View>
            )}
          </View>
        </View>
        
        {/* Tool Notes */}
        {item.tool.notes && (
          <Text style={styles.toolNotes} numberOfLines={2}>
            {item.tool.notes}
          </Text>
        )}
        
        {/* Duplicate Message */}
        {isDuplicate && (
          <Text style={styles.duplicateMessage}>
            Already in your inventory
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const selectedCount = selectedTools.size;
  const totalNewTools = toolConfirmations.filter(tc => !tc.isAlreadyInInventory).length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={isProcessing}>
            <Ionicons name="close" size={24} color="#8B4513" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🔍 Tools Identified</Text>
          <TouchableOpacity 
            onPress={handleConfirmTools}
            disabled={isProcessing || selectedCount === 0}
            style={[
              styles.confirmButton,
              (isProcessing || selectedCount === 0) && styles.disabledButton
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.confirmButtonText}>Add ({selectedCount})</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Found {toolConfirmations.length} tools • {totalNewTools} new • {toolConfirmations.length - totalNewTools} already owned
          </Text>
        </View>

        {/* Tools List */}
        <FlatList
          data={toolConfirmations}
          renderItem={renderToolItem}
          keyExtractor={(item) => item.tool.id}
          contentContainerStyle={styles.toolsList}
          showsVerticalScrollIndicator={false}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Tap tools to select/deselect • Duplicates are automatically excluded
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  confirmButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  summary: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  toolsList: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  toolItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedToolItem: {
    borderColor: '#8B4513',
    backgroundColor: '#8B451305',
  },
  duplicateToolItem: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  toolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  toolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toolEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  toolDetails: {
    flex: 1,
  },
  toolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  toolCategory: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  toolMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicator: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  duplicateIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  duplicateMessage: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
