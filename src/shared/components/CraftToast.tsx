import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface CraftToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'info' | 'warning';
  duration?: number;
  onHide: () => void;
}

export default function CraftToast({
  visible,
  message,
  type = 'success',
  duration = 3000,
  onHide
}: CraftToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onHide();
    });
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      default: return 'information-circle';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': 
        return {
          background: '#228B22',
          border: '#32CD32',
          text: '#FFFFFF',
          icon: '#FFFFFF'
        };
      case 'warning':
        return {
          background: '#DAA520',
          border: '#FFD700',
          text: '#FFFFFF',
          icon: '#FFFFFF'
        };
      default:
        return {
          background: '#8B4513',
          border: '#A0522D',
          text: '#FFFFFF',
          icon: '#FFFFFF'
        };
    }
  };

  const colors = getColors();

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.content}>
        <Ionicons 
          name={getIcon()} 
          size={20} 
          color={colors.icon} 
          style={styles.icon}
        />
        <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
          {message}
        </Text>
        
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Ionicons name="close" size={18} color={colors.icon} />
        </TouchableOpacity>
      </View>

      {/* Craft accent */}
      <View style={styles.craftAccent}>
        <Text style={styles.craftEmoji}>🔨</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  craftAccent: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#654321',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  craftEmoji: {
    fontSize: 10,
  },
}); 