import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CraftFeedScreen } from '../../src/features/craft-feed';

export default function TabOneScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();

  // Handle navigation parameters from camera
  useEffect(() => {
    if (searchParams.showCreatePost === 'true' && searchParams.mediaUri && searchParams.mediaType) {
      console.log('🎬 Opening create post with pre-populated media:', {
        uri: searchParams.mediaUri,
        type: searchParams.mediaType
      });
      
      // Navigate to modal screen with media data
      router.push({
        pathname: '/modal',
        params: {
          mediaUri: searchParams.mediaUri,
          mediaType: searchParams.mediaType,
        }
      });
      
      // Clear the navigation parameters
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    }
  }, [searchParams.showCreatePost, searchParams.mediaUri, searchParams.mediaType]);

  const handleCreatePost = () => {
    console.log('🔨 Opening create post modal');
    router.push('/modal');
  };

  return <CraftFeedScreen onCreatePost={handleCreatePost} />;
}

