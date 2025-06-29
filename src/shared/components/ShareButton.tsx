import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CraftPost } from '../types';
import { SharingService, ShareResult } from '../../services/sharing/SharingService';
import { useNotifications } from './NotificationSystem';

interface ShareButtonProps {
  post: CraftPost;
  size?: number;
  color?: string;
  onShareComplete?: (success: boolean) => void;
  userId?: string;
}

export default function ShareButton({ 
  post, 
  size = 20, 
  color = '#8B4513',
  onShareComplete,
  userId 
}: ShareButtonProps) {
  const { showSuccess, showError } = useNotifications();

  const handlePress = async () => {
    try {
      const result: ShareResult = await SharingService.sharePost(post);
      
      if (result.success) {
        showSuccess('Shared Successfully!', 'Thanks for spreading craft knowledge');
        SharingService.trackShareEvent(post.id, result.activityType || 'unknown', userId);
        onShareComplete?.(true);
      } else {
        showError('Share Failed', result.error || 'Unable to share at this time');
        onShareComplete?.(false);
      }
    } catch (error) {
      showError('Share Failed', 'Unable to share at this time');
      onShareComplete?.(false);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.shareButton}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons name="share-outline" size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shareButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 