import React, { useState } from 'react';
import { Modal } from 'react-native';
import { CraftFeedScreen, CreatePostScreen } from '../../src/features/craft-feed';

export default function TabOneScreen() {
  const [showCreatePost, setShowCreatePost] = useState(false);

  const handleCreatePost = () => {
    console.log('🔨 Opening create post modal');
    setShowCreatePost(true);
  };

  const handlePostCreated = (newPost: any) => {
    console.log('✅ New post created:', newPost);
    setShowCreatePost(false);
    // In a real app, this would refresh the feed or add the post to the feed
  };

  const handleCancelPost = () => {
    console.log('❌ Post creation cancelled');
    setShowCreatePost(false);
  };

  return (
    <>
      <CraftFeedScreen onCreatePost={handleCreatePost} />
      
      <Modal
        visible={showCreatePost}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <CreatePostScreen 
          onPostCreated={handlePostCreated}
          onCancel={handleCancelPost}
        />
      </Modal>
    </>
  );
}

