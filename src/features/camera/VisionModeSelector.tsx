import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VisionMode } from '@/src/shared/types/vision';
import { getAvailableVisionModes, getVisionModeConfig } from '@/src/shared/constants/visionModes';

const { width: screenWidth } = Dimensions.get('window');

interface VisionModeSelectorProps {
  selectedMode: VisionMode;
  onModeSelect: (mode: VisionMode) => void;
  isVisible: boolean;
}

export default function VisionModeSelector({
  selectedMode,
  onModeSelect,
  isVisible,
}: VisionModeSelectorProps) {
  const availableModes = getAvailableVisionModes();

  if (!isVisible) return null;

  const getIconName = (mode: VisionMode): keyof typeof Ionicons.glyphMap => {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Vision Modes</Text>
        <Text style={styles.subtitle}>Choose how to analyze your photo</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {availableModes.map((modeConfig) => {
          const isSelected = selectedMode === modeConfig.id;
          
          return (
            <TouchableOpacity
              key={modeConfig.id}
              style={[
                styles.modeCard,
                isSelected && styles.selectedModeCard,
                { borderColor: modeConfig.color }
              ]}
              onPress={() => onModeSelect(modeConfig.id)}
              activeOpacity={0.8}
            >
              {/* Badge */}
              {modeConfig.badge && (
                <View style={[styles.badge, { backgroundColor: modeConfig.color }]}>
                  <Text style={styles.badgeText}>{modeConfig.badge}</Text>
                </View>
              )}
              
              {/* Icon */}
              <View style={[
                styles.iconContainer,
                isSelected && { backgroundColor: modeConfig.color + '20' }
              ]}>
                <Ionicons 
                  name={getIconName(modeConfig.id)} 
                  size={28} 
                  color={isSelected ? modeConfig.color : '#666'} 
                />
              </View>
              
              {/* Mode Info */}
              <Text style={[
                styles.modeName,
                isSelected && { color: modeConfig.color }
              ]}>
                {modeConfig.name}
              </Text>
              
              <Text style={styles.modeDescription} numberOfLines={2}>
                {modeConfig.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 8,
    gap: 12,
  },
  modeCard: {
    width: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  selectedModeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 11,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 14,
  },
}); 