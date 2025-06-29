import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { createComment } from '../../services/firebase/posts';
import { Comment } from '../../shared/types';
import { useNotifications } from './NotificationSystem';

interface CommentInputProps {
  postId: string;
  parentCommentId?: string; // For replies
  placeholder?: string;
  autoFocus?: boolean;
  onCommentCreated?: (comment: Comment) => void;
  onCancel?: () => void; // For reply mode
  maxLength?: number;
}

const CommentInput: React.FC<CommentInputProps> = ({
  postId,
  parentCommentId,
  placeholder = 'Add a comment...',
  autoFocus = false,
  onCommentCreated,
  onCancel,
  maxLength = 500,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const { showSuccess, showError } = useNotifications();
  const textInputRef = useRef<TextInput>(null);

  const isReply = !!parentCommentId;
  const charactersLeft = maxLength - commentText.length;
  const isNearLimit = charactersLeft <= 50;
  const isOverLimit = charactersLeft < 0;

  const handleSubmit = async () => {
    if (!user) {
      showError('Authentication Required', 'Please sign in to comment');
      return;
    }

    if (!commentText.trim()) {
      Alert.alert('Empty Comment', 'Please enter a comment before submitting');
      return;
    }

    if (isOverLimit) {
      Alert.alert('Comment Too Long', `Please keep your comment under ${maxLength} characters`);
      return;
    }

    setIsSubmitting(true);

    try {
      const newComment = await createComment({
        postId,
        text: commentText.trim(),
        parentCommentId,
        userId: user.id,
        author: {
          id: user.id,
          displayName: user.displayName,
          avatar: user.avatar || '👤', // Provide fallback avatar if undefined
        },
      });

      setCommentText('');
      Keyboard.dismiss();
      
      if (onCommentCreated) {
        onCommentCreated(newComment);
      }

      showSuccess(
        isReply ? 'Reply Added' : 'Comment Added',
        isReply ? 'Your reply has been posted' : 'Your comment has been posted'
      );
    } catch (error) {
      console.error('Error creating comment:', error);
      showError('Comment Failed', 'Unable to post your comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCommentText('');
    Keyboard.dismiss();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      {isReply && (
        <View style={styles.replyHeader}>
          <Ionicons name="return-down-forward" size={16} color="#8B4513" />
          <Text style={styles.replyText}>Replying to comment</Text>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Ionicons name="close" size={16} color="#8B4513" />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          ref={textInputRef}
          style={[styles.textInput, isOverLimit && styles.textInputError]}
          value={commentText}
          onChangeText={setCommentText}
          placeholder={placeholder}
          placeholderTextColor="#A0A0A0"
          multiline
          maxLength={maxLength + 50} // Allow slight overflow for warning
          autoFocus={autoFocus}
          returnKeyType="default"
          blurOnSubmit={false}
        />
        
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!commentText.trim() || isSubmitting || isOverLimit) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!commentText.trim() || isSubmitting || isOverLimit}
        >
          {isSubmitting ? (
            <Ionicons name="hourglass" size={20} color="#FFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Character count */}
      <View style={styles.footer}>
        <Text style={[
          styles.characterCount,
          isNearLimit && styles.characterCountWarning,
          isOverLimit && styles.characterCountError
        ]}>
          {charactersLeft} characters remaining
        </Text>
        
        {isReply && (
          <TouchableOpacity onPress={handleCancel} style={styles.cancelTextButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  replyContainer: {
    backgroundColor: '#FDF6E3',
    borderLeftWidth: 3,
    borderLeftColor: '#8B4513',
    marginLeft: 20,
    borderRadius: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  replyText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  cancelButton: {
    padding: 4,
  },
  inputContainer: {
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
    maxHeight: 100,
    backgroundColor: '#FAFAFA',
  },
  textInputError: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#8B4513',
  },
  characterCountWarning: {
    color: '#FF8C00',
    fontWeight: '500',
  },
  characterCountError: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  cancelTextButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
  },
});

export default CommentInput; 