import React from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../../services/firebase/auth';

interface LogoutButtonProps {
  color?: string;
  size?: number;
  style?: any;
}

export function LogoutButton({ color = '#8B4513', size = 24, style }: LogoutButtonProps) {
  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      // Navigation will be handled automatically by the auth listener in _layout.tsx
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      style={[{ marginRight: 15 }, style]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="log-out-outline" size={size} color={color} />
    </TouchableOpacity>
  );
} 