import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VisionMode } from '@/src/shared/types/vision';
import { getVisionModeConfig } from '@/src/shared/constants/visionModes';

interface VisionToggleButtonProps {
  isVisionMode: boolean;
  currentVisionMode?: VisionMode;
  onToggle: () => void;
}

export default function VisionToggleButton({
  isVisionMode,
  currentVisionMode,
  onToggle,
}: VisionToggleButtonProps) {
  const visionConfig = currentVisionMode ? getVisionModeConfig(currentVisionMode) : null;
  
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isVisionMode && styles.activeContainer,
        isVisionMode && visionConfig && { borderColor: visionConfig.color }
      ]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Ionicons 
          name={isVisionMode ? "eye" : "eye-off"} 
          size={20} 
          color={isVisionMode && visionConfig ? visionConfig.color : 'white'} 
        />
        
        <View style={styles.textContainer}>
          <Text style={[
            styles.title,
            isVisionMode && visionConfig && { color: visionConfig.color }
          ]}>
            {isVisionMode ? 'Vision' : 'Camera'}
          </Text>
          
          {isVisionMode && visionConfig && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {visionConfig.name}
            </Text>
          )}
        </View>
      </View>
      
      {/* Active indicator dot */}
      {isVisionMode && (
        <View style={[
          styles.activeDot,
          { backgroundColor: visionConfig?.color || '#8B4513' }
        ]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 100,
    position: 'relative',
  },
  activeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  subtitle: {
    fontSize: 11,
    color: '#CCCCCC',
    marginTop: 1,
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
}); 