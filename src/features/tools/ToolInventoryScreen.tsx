import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { VisionMode } from '../../shared/types/vision';
import { Tool } from '../../shared/types';
import { useAuthStore } from '../../stores/authStore';
import { AuthService } from '../../services/firebase/auth';

// Tool categories with emojis
const TOOL_CATEGORIES = [
  { id: 'hand-tools', label: 'Hand Tools', emoji: '🔨' },
  { id: 'power-tools', label: 'Power Tools', emoji: '⚡' },
  { id: 'measuring', label: 'Measuring', emoji: '📏' },
  { id: 'safety', label: 'Safety', emoji: '🥽' },
  { id: 'finishing', label: 'Finishing', emoji: '🎨' },
  { id: 'specialized', label: 'Specialized', emoji: '🛠️' },
];

// Tool conditions
const TOOL_CONDITIONS = [
  { id: 'excellent', label: 'Excellent', color: '#4CAF50' },
  { id: 'good', label: 'Good', color: '#8BC34A' },
  { id: 'fair', label: 'Fair', color: '#FFC107' },
  { id: 'needs-repair', label: 'Needs Repair', color: '#FF5722' },
];

// Tool interface for type safety - extends the shared Tool interface
interface ToolInventoryItem extends Tool {
  // Additional fields for tool inventory screen compatibility
  model?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  location?: string;
  lastUsed?: string;
  maintenanceReminders?: string[];
}

// Tools will be populated from user's Firebase document and camera tool identification

interface AddToolModalProps {
  visible: boolean;
  onClose: () => void;
  onAddTool: (tool: Tool) => void;
}

function AddToolModal({ visible, onClose, onAddTool }: AddToolModalProps) {
  const [toolName, setToolName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setToolName('');
    setSelectedCategory('');
    setBrand('');
    setModel('');
    setSelectedCondition('');
    setPurchasePrice('');
    setLocation('');
    setNotes('');
  };

  const handleSubmit = () => {
    if (!toolName.trim() || !selectedCategory || !selectedCondition) {
      const message = 'Please fill in required fields: Tool Name, Category, and Condition.';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      } else {
        Alert.alert('Missing Information', message);
      }
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0] || new Date().toISOString().substring(0, 10);
    
    const newTool: Tool = {
      id: Date.now().toString(),
      name: toolName.trim(),
      category: selectedCategory,
      brand: brand.trim(),
      model: model.trim(),
      condition: selectedCondition,
      purchaseDate: currentDate,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
      location: location.trim(),
      notes: notes.trim(),
      lastUsed: currentDate,
      maintenanceReminders: [],
    };

    onAddTool(newTool);
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#8B4513" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add New Tool</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.fieldLabel}>Tool Name *</Text>
          <TextInput
            style={styles.textInput}
            value={toolName}
            onChangeText={setToolName}
            placeholder="e.g., Circular Saw"
            placeholderTextColor="#999"
          />

          <Text style={styles.fieldLabel}>Category *</Text>
          <View style={styles.categoryGrid}>
            {TOOL_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonSelected,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={[
                  styles.categoryLabel,
                  selectedCategory === category.id && styles.categoryLabelSelected,
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Brand</Text>
          <TextInput
            style={styles.textInput}
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g., DeWalt, Bosch"
            placeholderTextColor="#999"
          />

          <Text style={styles.fieldLabel}>Model</Text>
          <TextInput
            style={styles.textInput}
            value={model}
            onChangeText={setModel}
            placeholder="e.g., DWE575"
            placeholderTextColor="#999"
          />

          <Text style={styles.fieldLabel}>Condition *</Text>
          <View style={styles.conditionContainer}>
            {TOOL_CONDITIONS.map((condition) => (
              <TouchableOpacity
                key={condition.id}
                style={[
                  styles.conditionButton,
                  selectedCondition === condition.id && { backgroundColor: condition.color },
                ]}
                onPress={() => setSelectedCondition(condition.id)}
              >
                <Text style={[
                  styles.conditionLabel,
                  selectedCondition === condition.id && styles.conditionLabelSelected,
                ]}>
                  {condition.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Purchase Price ($)</Text>
          <TextInput
            style={styles.textInput}
            value={purchasePrice}
            onChangeText={setPurchasePrice}
            placeholder="0.00"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />

          <Text style={styles.fieldLabel}>Location</Text>
          <TextInput
            style={styles.textInput}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Workshop - Main Bench"
            placeholderTextColor="#999"
          />

          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes about this tool..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function ToolInventoryScreen() {
  const { user } = useAuthStore();
  const [tools, setTools] = useState<Tool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'lastUsed'>('name');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  const handleAddTool = (newTool: Tool) => {
    setTools((prevTools: Tool[]) => [...prevTools, newTool]);
  };

  const getConditionColor = (condition: string): string => {
    const conditionObj = TOOL_CONDITIONS.find(c => c.id === condition);
    return conditionObj?.color || '#666';
  };

  const getCategoryEmoji = (categoryId: string): string => {
    const category = TOOL_CATEGORIES.find(c => c.id === categoryId);
    return category?.emoji || '🛠️';
  };

  const formatPrice = (price: number): string => {
    return price > 0 ? `$${price.toFixed(2)}` : '';
  };

  // Filter and sort tools
  const filteredTools = tools
    .filter((tool: Tool) => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.model.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a: Tool, b: Tool) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'lastUsed':
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        default:
          return 0;
      }
    });

  const renderToolItem = ({ item }: { item: Tool }) => (
    <View style={styles.toolCard}>
      <View style={styles.toolHeader}>
        <View style={styles.toolInfo}>
          <Text style={styles.toolEmoji}>{getCategoryEmoji(item.category)}</Text>
          <View style={styles.toolDetails}>
            <Text style={styles.toolName}>{item.name}</Text>
            <Text style={styles.toolBrand}>
              {item.brand} {item.model && `• ${item.model}`}
            </Text>
          </View>
        </View>
        <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(item.condition) }]}>
          <Text style={styles.conditionBadgeText}>
            {TOOL_CONDITIONS.find(c => c.id === item.condition)?.label}
          </Text>
        </View>
      </View>

      <View style={styles.toolMeta}>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.metaText}>{item.location || 'Location not set'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.metaText}>Last used: {new Date(item.lastUsed).toLocaleDateString()}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="cash-outline" size={14} color="#666" />
          <Text style={styles.metaText}>{formatPrice(item.purchasePrice)}</Text>
        </View>
      </View>

      {item.notes && (
        <Text style={styles.toolNotes} numberOfLines={2}>
          {item.notes}
        </Text>
      )}

      {item.maintenanceReminders.length > 0 && (
        <View style={styles.maintenanceContainer}>
          <Ionicons name="warning-outline" size={16} color="#FF9800" />
          <Text style={styles.maintenanceText}>
            {item.maintenanceReminders.length} maintenance reminder(s)
          </Text>
        </View>
      )}
    </View>
  );

  useFocusEffect(
    React.useCallback(() => {
      const fetchTools = async () => {
        if (user) {
          try {
            const userData = await AuthService.getUserData(user.id);
            if (userData && userData.toolInventory) {
              setTools(userData.toolInventory);
            }
          } catch (error) {
            console.error('Error fetching tools:', error);
          }
        }
      };

      fetchTools();
    }, [user])
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authRequiredContainer}>
          <Text style={styles.authRequiredTitle}>Login Required</Text>
          <Text style={styles.authRequiredText}>
            Please log in to access your tool inventory.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔧 Tool Inventory</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tools..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
            onPress={() => setSortBy('name')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
              Name
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'category' && styles.sortButtonActive]}
            onPress={() => setSortBy('category')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'category' && styles.sortButtonTextActive]}>
              Category
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'lastUsed' && styles.sortButtonActive]}
            onPress={() => setSortBy('lastUsed')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'lastUsed' && styles.sortButtonTextActive]}>
              Recent
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryFilterContainer}>
        <TouchableOpacity
          style={styles.filterHeader}
          onPress={() => setFiltersCollapsed(!filtersCollapsed)}
        >
          <View style={styles.filterHeaderLeft}>
            <Text style={styles.filterHeaderTitle}>Filter by Category</Text>
            <Text style={styles.filterHeaderCount}>({TOOL_CATEGORIES.length + 1} options)</Text>
          </View>
          <Ionicons
            name={filtersCollapsed ? "chevron-down" : "chevron-up"}
            size={20}
            color="#8B4513"
          />
        </TouchableOpacity>

        {!filtersCollapsed && (
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, selectedCategory === 'all' && styles.filterButtonActive]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedCategory === 'all' && styles.filterButtonTextActive
              ]}>
                All ({tools.length})
              </Text>
            </TouchableOpacity>
            {TOOL_CATEGORIES.map((category) => {
              const count = tools.filter(tool => tool.category === category.id).length;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.filterButton,
                    selectedCategory === category.id && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.filterEmoji}>{category.emoji}</Text>
                  <Text style={[
                    styles.filterButtonText,
                    selectedCategory === category.id && styles.filterButtonTextActive
                  ]}>
                    {category.label} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Tools List */}
      <FlatList
        data={filteredTools}
        renderItem={renderToolItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.toolsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {searchQuery ? (
              // Search results empty state
              <>
                <Ionicons name="search" size={48} color="#8B4513" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>No tools found</Text>
                <Text style={styles.emptySubtext}>
                  Try adjusting your search or add a new tool
                </Text>
              </>
            ) : (
              // Initial empty state - no tools at all
              <>
                <Ionicons name="construct" size={64} color="#8B4513" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>Build Your Tool Inventory</Text>
                <Text style={styles.emptySubtext}>
                  Start documenting your craft tools to track your workshop and get personalized project recommendations.
                </Text>
                
                <View style={styles.getStartedContainer}>
                  <Text style={styles.getStartedTitle}>🚀 Get Started</Text>
                  
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push(`/camera?visionMode=${VisionMode.IDENTIFY_TOOLS}`)}
                  >
                    <Ionicons name="camera" size={20} color="white" style={styles.buttonIcon} />
                    <Text style={styles.primaryButtonText}>Identify Tools with Camera</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.orText}>or</Text>
                  
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setShowAddModal(true)}
                  >
                    <Ionicons name="add" size={20} color="#8B4513" style={styles.buttonIcon} />
                    <Text style={styles.secondaryButtonText}>Add Tool Manually</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.benefitsContainer}>
                  <Text style={styles.benefitsTitle}>Why track your tools?</Text>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitEmoji}>🎯</Text>
                    <Text style={styles.benefitText}>Get project recommendations based on what you own</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitEmoji}>📊</Text>
                    <Text style={styles.benefitText}>Track tool usage and maintenance schedules</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitEmoji}>🤝</Text>
                    <Text style={styles.benefitText}>Share and discover tools with the community</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        }
      />

      {/* Add Tool Modal */}
      <AddToolModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddTool={handleAddTool}
      />
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#8B4513',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  categoryFilterContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  filterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  filterHeaderCount: {
    fontSize: 12,
    color: '#999',
  },
  filterButtons: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#8B4513',
  },
  filterEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  toolsList: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  toolCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
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
  toolBrand: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  toolMeta: {
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  toolNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  maintenanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  maintenanceText: {
    fontSize: 11,
    color: '#FF9800',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#8B4513',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyIcon: {
    marginBottom: 15,
  },
  getStartedContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  getStartedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#8B4513',
    padding: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },
  orText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 10,
  },
  secondaryButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8B4513',
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '600',
  },
  benefitsContainer: {
    alignItems: 'center',
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  benefitEmoji: {
    fontSize: 16,
    marginRight: 5,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
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
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  saveButton: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 8,
    marginTop: 15,
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
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryButton: {
    width: '30%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryButtonSelected: {
    borderColor: '#8B4513',
    backgroundColor: '#F9F5F1',
  },
  categoryEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: '#8B4513',
    fontWeight: '600',
  },
  conditionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  conditionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 8,
    marginHorizontal: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  conditionLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  conditionLabelSelected: {
    color: 'white',
    fontWeight: '600',
  },
}); 