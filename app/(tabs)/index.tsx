import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { CraftFeedScreen, CreatePostScreen } from '../../src/features/craft-feed';
import { testFirebaseConnection } from '../../src/services/firebase/config';

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

  const handleTestFirebase = async () => {
    console.log('🧪 Testing Firebase connection...');
    const isConnected = await testFirebaseConnection();
    Alert.alert(
      'Firebase Test Result',
      isConnected ? 'Firebase is working! ✅' : 'Firebase connection failed ❌',
      [{ text: 'OK' }]
    );
  };

  return (
    <>
      <CraftFeedScreen onCreatePost={handleCreatePost} />
      
      {/* Firebase Test Button - positioned at bottom */}
      <View style={styles.testButtonContainer}>
        <TouchableOpacity style={styles.testButton} onPress={handleTestFirebase}>
          <Text style={styles.testButtonText}>🧪 Test Firebase</Text>
        </TouchableOpacity>
      </View>
      
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

const styles = StyleSheet.create({
  testButtonContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  testButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

