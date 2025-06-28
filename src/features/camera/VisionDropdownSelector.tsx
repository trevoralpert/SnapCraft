import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VisionMode } from '@/src/shared/types/vision';
import { getAvailableVisionModes, getVisionModeConfig, getComingSoonVisionModes } from '@/src/shared/constants/visionModes';

const { width: screenWidth } = Dimensions.get('window');

interface VisionDropdownSelectorProps {
  selectedMode: VisionMode;
  onModeSelect: (mode: VisionMode) => void;
  isVisionMode: boolean;
  onToggle: () => void;
  isDropdownOpen: boolean;
  onDropdownToggle: (open: boolean) => void;
  onReturnToDefault: () => void;
}

export default function VisionDropdownSelector({
  selectedMode,
  onModeSelect,
  isVisionMode,
  onToggle,
  isDropdownOpen,
  onDropdownToggle,
  onReturnToDefault,
}: VisionDropdownSelectorProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const availableModes = getAvailableVisionModes();
  const comingSoonModes = getComingSoonVisionModes();
  const currentModeConfig = getVisionModeConfig(selectedMode);

  useEffect(() => {
    if (isDropdownOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDropdownOpen]);

  // Close dropdown when vision mode is turned off
  useEffect(() => {
    if (!isVisionMode) {
      onDropdownToggle(false);
    }
  }, [isVisionMode]);

  const handleModeSelect = (mode: VisionMode) => {
    onModeSelect(mode);
  };

  const handleOutsidePress = () => {
    onDropdownToggle(false);
  };

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

  const dropdownTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  // Don't render anything if vision modes are disabled or dropdown is closed
  if (!isDropdownOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop for outside press detection */}
      <TouchableWithoutFeedback onPress={handleOutsidePress}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Dropdown Menu - Positioned absolutely at top-left */}
      <Animated.View 
        style={[
          styles.dropdown,
          {
            opacity: opacityAnim,
            transform: [{ translateY: dropdownTranslateY }],
          }
        ]}
      >
        <ScrollView 
          style={styles.dropdownScrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={16}
        >
          {/* Available Modes */}
          <View style={styles.dropdownSection}>
            {availableModes.map((modeConfig) => {
              const isSelected = selectedMode === modeConfig.id;
              
              return (
                <TouchableOpacity
                  key={modeConfig.id}
                  style={[
                    styles.dropdownItem,
                    isSelected && styles.selectedDropdownItem,
                    isSelected && { backgroundColor: modeConfig.color + '15' }
                  ]}
                  onPress={() => handleModeSelect(modeConfig.id)}
                  activeOpacity={0.7}
                >
                  {/* Selection Indicator */}
                  <View style={styles.selectionIndicator}>
                    {isSelected && (
                      <Ionicons 
                        name="checkmark-circle" 
                        size={16} 
                        color={modeConfig.color} 
                      />
                    )}
                  </View>
                  
                  {/* Mode Icon */}
                  <View style={[
                    styles.dropdownItemIcon,
                    isSelected && { backgroundColor: modeConfig.color + '20' }
                  ]}>
                    <Ionicons 
                      name={getModeIcon(modeConfig.id)} 
                      size={18} 
                      color={isSelected ? modeConfig.color : '#CCCCCC'} 
                    />
                  </View>
                  
                  {/* Mode Info */}
                  <View style={styles.dropdownItemText}>
                    <View style={styles.dropdownItemHeader}>
                      <Text style={[
                        styles.dropdownItemTitle,
                        isSelected && { color: modeConfig.color }
                      ]}>
                        {modeConfig.name}
                      </Text>
                      {modeConfig.badge && (
                        <View style={[styles.badge, { backgroundColor: modeConfig.color }]}>
                          <Text style={styles.badgeText}>{modeConfig.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.dropdownItemDescription} numberOfLines={2}>
                      {modeConfig.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Coming Soon Section */}
          {comingSoonModes.length > 0 && (
            <>
              <View style={styles.separator} />
              <View style={styles.dropdownSection}>
                <Text style={styles.sectionHeader}>Coming Soon</Text>
                {comingSoonModes.map((modeConfig) => (
                  <View
                    key={modeConfig.id}
                    style={[styles.dropdownItem, styles.disabledDropdownItem]}
                  >
                    <View style={styles.selectionIndicator} />
                    
                    <View style={styles.dropdownItemIcon}>
                      <Ionicons 
                        name={getModeIcon(modeConfig.id)} 
                        size={18} 
                        color="#666666" 
                      />
                    </View>
                    
                    <View style={styles.dropdownItemText}>
                      <Text style={styles.disabledDropdownItemTitle}>
                        {modeConfig.name}
                      </Text>
                      <Text style={styles.disabledDropdownItemDescription} numberOfLines={2}>
                        {modeConfig.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
          
          {/* Return to Default Button */}
          <View style={styles.separator} />
          <View style={styles.dropdownSection}>
            <TouchableOpacity
              style={styles.returnToDefaultButton}
              onPress={onReturnToDefault}
              activeOpacity={0.7}
            >
              <View style={styles.selectionIndicator} />
              
              <View style={styles.dropdownItemIcon}>
                <Ionicons 
                  name="camera" 
                  size={18} 
                  color="#F5F5DC" 
                />
              </View>
              
              <View style={styles.dropdownItemText}>
                <Text style={styles.returnToDefaultTitle}>
                  Craft Documentation
                </Text>
                <Text style={styles.returnToDefaultDescription}>
                  Return to regular photo and video capture
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 19998,
  },
  container: {
    position: 'relative',
    zIndex: 9999,
  },
  toggleButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 140,
    maxWidth: 180,
    position: 'relative',
    zIndex: 9999,
  },
  activeToggleButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modeIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  buttonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    flexShrink: 1,
  },
  buttonSubtitle: {
    fontSize: 11,
    color: '#CCCCCC',
    marginTop: 1,
    flexShrink: 1,
  },
  activeDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  dropdown: {
    position: 'absolute',
    top: 80, // Further reduced to give maximum room for content
    left: 20, // Match header padding
    minWidth: 280,
    maxWidth: 340,
    maxHeight: 400, // Fixed max height to prevent screen overflow
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 16,
    paddingTop: 16,
    paddingBottom: 24, // Increased bottom padding to ensure last item is fully visible
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 20000, // Highest z-index
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownSection: {
    paddingVertical: 0, // Remove vertical padding since ScrollView handles it
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999999',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  selectedDropdownItem: {
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  disabledDropdownItem: {
    opacity: 0.5,
  },
  selectionIndicator: {
    width: 20,
    alignItems: 'center',
    flexShrink: 0,
  },
  dropdownItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  dropdownItemText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  dropdownItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  dropdownItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    flexShrink: 0,
  },
  dropdownItemDescription: {
    fontSize: 12,
    color: '#CCCCCC',
    lineHeight: 17,
    flexShrink: 1,
  },
  disabledDropdownItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  disabledDropdownItemDescription: {
    fontSize: 12,
    color: '#555555',
    lineHeight: 16,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  dropdownScrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24, // Extra bottom padding to ensure last item is fully visible
  },
  returnToDefaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  returnToDefaultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  returnToDefaultDescription: {
    fontSize: 12,
    color: '#CCCCCC',
  },
}); 