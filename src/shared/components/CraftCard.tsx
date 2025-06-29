// Task 3.3: Visual Hierarchy Improvements - Enhanced Card Component
import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../constants/Typography';

interface CraftCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'craft';
  padding?: keyof typeof SPACING;
  margin?: keyof typeof SPACING;
  style?: ViewStyle;
  disabled?: boolean;
  interactive?: boolean;
}

export function CraftCard({
  children,
  onPress,
  variant = 'default',
  padding = 'md',
  margin,
  style,
  disabled = false,
  interactive = true,
}: CraftCardProps) {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  // Micro-interactions for Task 3.3
  const handlePressIn = () => {
    if (!interactive || disabled) return;
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (!interactive || disabled) return;
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Get variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.colors.surface,
          ...SHADOWS.lg,
          borderRadius: BORDER_RADIUS.lg,
        };
      case 'outlined':
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: BORDER_RADIUS.md,
        };
      case 'craft':
        return {
          backgroundColor: theme.colors.surface,
          ...SHADOWS.md,
          borderRadius: BORDER_RADIUS.lg,
          borderLeftWidth: 4,
          borderLeftColor: theme.colors.primary,
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          ...SHADOWS.sm,
          borderRadius: BORDER_RADIUS.md,
        };
    }
  };

  const cardStyle = [
    styles.base,
    getVariantStyles(),
    {
      padding: SPACING[padding],
      margin: margin ? SPACING[margin] : undefined,
    },
    disabled && styles.disabled,
    style,
  ];

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        style={styles.touchable}
      >
        <Animated.View style={[cardStyle, animatedStyle]}>
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={[cardStyle, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// Specialized card variants
export function ProjectCard({ children, ...props }: Omit<CraftCardProps, 'variant'>) {
  return (
    <CraftCard variant="craft" {...props}>
      {children}
    </CraftCard>
  );
}

export function ToolCard({ children, ...props }: Omit<CraftCardProps, 'variant'>) {
  return (
    <CraftCard variant="elevated" {...props}>
      {children}
    </CraftCard>
  );
}

export function InfoCard({ children, ...props }: Omit<CraftCardProps, 'variant'>) {
  return (
    <CraftCard variant="outlined" {...props}>
      {children}
    </CraftCard>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  touchable: {
    borderRadius: BORDER_RADIUS.md,
  },
  disabled: {
    opacity: 0.6,
  },
}); 