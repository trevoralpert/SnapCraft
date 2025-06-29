import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface CraftButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export function CraftButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
}: CraftButtonProps) {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[`${size}Size`],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  // Variants
  primary: {
    backgroundColor: '#8B4513', // Saddle brown - craft theme
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  secondary: {
    backgroundColor: '#D2B48C', // Tan - lighter craft color
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  
  disabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Sizes
  smallSize: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  
  mediumSize: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  largeSize: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  
  primaryText: {
    color: '#FFFFFF',
  },
  
  secondaryText: {
    color: '#8B4513',
  },
  
  outlineText: {
    color: '#8B4513',
  },
  
  disabledText: {
    color: '#999999',
  },
  
  // Text sizes
  smallText: {
    fontSize: 14,
  },
  
  mediumText: {
    fontSize: 16,
  },
  
  largeText: {
    fontSize: 18,
  },
}); 