import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StoryViewCountProps {
  viewCount: number;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const StoryViewCount: React.FC<StoryViewCountProps> = ({
  viewCount,
  onPress,
  size = 'medium',
  color = '#666',
}) => {
  const formatViewCount = (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { fontSize: 12, iconSize: 14 };
      case 'large':
        return { fontSize: 16, iconSize: 18 };
      default:
        return { fontSize: 14, iconSize: 16 };
    }
  };

  const sizeStyles = getSizeStyles();

  const content = (
    <View style={styles.container}>
      <Ionicons 
        name="eye" 
        size={sizeStyles.iconSize} 
        color={color} 
        style={styles.icon}
      />
      <Text style={[styles.text, { fontSize: sizeStyles.fontSize, color }]}>
        {formatViewCount(viewCount)}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.touchable}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '500',
  },
}); 