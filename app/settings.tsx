import React from 'react';
import { SettingsScreen } from '../src/features/profile/SettingsScreen';
import { useRouter } from 'expo-router';

export default function SettingsModal() {
  const router = useRouter();

  return (
    <SettingsScreen onClose={() => router.back()} />
  );
} 