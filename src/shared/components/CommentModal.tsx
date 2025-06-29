import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment } from '../../shared/types';
import { getPostComments, createComment } from '../../services/firebase/posts';
import { useAuthStore } from '../../stores/authStore';
import { useNotifications } from './NotificationSystem';

interface CommentModalProps {
  visible: boolean;
  postId: string;
  postAuthor?: string;
  initialCommentCount?: number;
  onClose: () => void;
  onCommentCountChange?: (count: number) => void;
}

const CommentModal: React.FC<CommentModalProps> = ({
  visible,
  postId,
  postAuthor,
  initialCommentCount = 0,
  onClose,
  onCommentCountChange,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuthStore();
  const { showSuccess, showError } = useNotifications();

  // Load comments when modal opens
  useEffect(() => {
    if (visible && postId) {
      loadComments();
    }
  }, [visible, postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      console.log('📄 Loading comments for post:', postId);
      const fetchedComments = await getPostComments(postId, 50);
      
      // Filter top-level comments only for now
      const topLevelComments = fetchedComments.filter(comment => !comment.parentCommentId);
      
      setComments(topLevelComments);
      setCommentCount(topLevelComments.length);
      
      if (onCommentCountChange) {
        onCommentCountChange(topLevelComments.length);
      }
      
      console.log(`✅ Loaded ${topLevelComments.length} comments`);
    } catch (error) {
      console.error('❌ Error loading comments:', error);
      showError('Failed to load comments', 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      showError('Authentication Required', 'Please sign in to comment');
      return;
    }

    if (!commentText.trim()) {
      Alert.alert('Empty Comment', 'Please enter a comment before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('💬 Creating comment for post:', postId);
      
      const newComment = await createComment({
        postId,
        text: commentText.trim(),
        userId: user.id,
        author: {
          id: user.id,
          displayName: user.displayName,
          avatar: user.avatar || '👤',
        },
      });

      // Add new comment to the list
      setComments(prevComments => [newComment, ...prevComments]);
      const newCount = commentCount + 1;
      setCommentCount(newCount);
      
      if (onCommentCountChange) {
        onCommentCountChange(newCount);
      }

      setCommentText('');
      showSuccess('Comment Added', 'Your comment has been posted');
      
      console.log('✅ Comment created successfully:', newComment.id);
    } catch (error) {
      console.error('❌ Error creating comment:', error);
      showError('Comment Failed', 'Unable to post your comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = ({ item: comment }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthorAvatar}>{comment.author.avatar || '👤'}</Text>
        <View style={styles.commentAuthorInfo}>
          <Text style={styles.commentAuthorName}>{comment.author.displayName}</Text>
          <Text style={styles.commentTime}>
            {comment.createdAt && typeof comment.createdAt === 'object' && 'seconds' in comment.createdAt 
              ? new Date((comment.createdAt as any).seconds * 1000).toLocaleDateString() 
              : 'Now'}
          </Text>
        </View>
      </View>
      <Text style={styles.commentText}>{comment.content.text}</Text>
      
      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.commentAction}>
          <Ionicons name="heart-outline" size={16} color="#8B8B8B" />
          <Text style={styles.commentActionText}>{comment.engagement?.likes || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.commentAction}>
          <Ionicons name="chatbubble-outline" size={16} color="#8B8B8B" />
          <Text style={styles.commentActionText}>Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={48} color="#C0C0C0" />
      <Text style={styles.emptyStateText}>No comments yet</Text>
      <Text style={styles.emptyStateSubtext}>Be the first to share your thoughts!</Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="chevron-down" size={24} color="#8B4513" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>
        Comments ({commentCount})
      </Text>
      
      <View style={styles.headerSpacer} />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {renderHeader()}
          
          <View style={styles.content}>
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={loading ? null : renderEmptyState}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={comments.length === 0 && !loading ? styles.emptyContainer : undefined}
            />
            
            {loading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading comments...</Text>
              </View>
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <View style={styles.commentInputRow}>
              <TextInput
                style={[styles.textInput, { maxHeight: 100 }]}
                value={commentText}
                onChangeText={setCommentText}
                placeholder={postAuthor ? `Reply to ${postAuthor}...` : 'Add a comment...'}
                placeholderTextColor="#A0A0A0"
                multiline
              />
              
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!commentText.trim() || isSubmitting) && styles.submitButtonDisabled
                ]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <Ionicons name="hourglass" size={20} color="#FFF" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFF',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4513',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4513',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8B8B8B',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8B4513',
  },
  commentItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthorAvatar: {
    fontSize: 20,
    marginRight: 12,
  },
  commentAuthorInfo: {
    flex: 1,
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#8B8B8B',
    marginTop: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: '#8B8B8B',
  },
  inputContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    padding: 16,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  submitButton: {
    backgroundColor: '#8B4513',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#C0C0C0',
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default CommentModal;
