import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStoryViewers } from '../../services/firebase/stories';
import { StoryViewersList, StoryViewWithUser } from '../types';

interface StoryViewersModalProps {
  visible: boolean;
  onClose: () => void;
  storyId: string;
  storyOwnerId: string;
  currentUserId: string;
}

export const StoryViewersModal: React.FC<StoryViewersModalProps> = ({
  visible,
  onClose,
  storyId,
  storyOwnerId,
  currentUserId,
}) => {
  const [viewers, setViewers] = useState<StoryViewersList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only story owners can see who viewed their stories
  const canViewList = currentUserId === storyOwnerId;

  useEffect(() => {
    if (visible && canViewList) {
      loadViewers();
    }
  }, [visible, storyId, canViewList]);

  const loadViewers = async () => {
    try {
      setLoading(true);
      setError(null);
      const viewersData = await getStoryViewers(storyId);
      setViewers(viewersData);
    } catch (err) {
      console.error('Failed to load story viewers:', err);
      setError('Failed to load viewers list');
    } finally {
      setLoading(false);
    }
  };

  const formatViewTime = (viewedAt: string) => {
    const date = new Date(viewedAt);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderViewer = ({ item }: { item: StoryViewWithUser }) => (
    <View style={styles.viewerItem}>
      <View style={styles.viewerInfo}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholderAvatar]}>
            <Ionicons name="person" size={20} color="#8B4513" />
          </View>
        )}
        <View style={styles.viewerDetails}>
          <Text style={styles.viewerName}>{item.displayName}</Text>
          <Text style={styles.viewTime}>{formatViewTime(item.viewedAt)}</Text>
        </View>
      </View>
      <View style={styles.viewerStats}>
        {item.replayed && (
          <View style={styles.replayBadge}>
            <Ionicons name="repeat" size={12} color="#8B4513" />
            <Text style={styles.replayText}>{item.viewCount}</Text>
          </View>
        )}
        {item.completed && (
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
        )}
      </View>
    </View>
  );

  if (!canViewList) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Story Views</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.restrictedAccess}>
              <Ionicons name="lock-closed" size={48} color="#ccc" />
              <Text style={styles.restrictedText}>
                Only story owners can see who viewed their stories
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              Story Views ({viewers?.totalViews || 0})
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B4513" />
              <Text style={styles.loadingText}>Loading viewers...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#ff4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={loadViewers} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : viewers?.viewers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="eye-off" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No views yet</Text>
            </View>
          ) : (
            <FlatList
              data={viewers?.viewers || []}
              renderItem={renderViewer}
              keyExtractor={(item) => `${item.userId}-${item.viewedAt}`}
              style={styles.viewersList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  viewersList: {
    flex: 1,
  },
  viewerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  viewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  placeholderAvatar: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerDetails: {
    flex: 1,
  },
  viewerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  viewTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  viewerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  replayText: {
    fontSize: 12,
    color: '#8B4513',
    marginLeft: 2,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  restrictedAccess: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  restrictedText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
}); 