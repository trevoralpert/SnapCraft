import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment } from '../../shared/types';
import { useAuthStore } from '../../stores/authStore';
import { likeComment, unlikeComment, deleteComment } from '../../services/firebase/posts';
import { useNotifications } from './NotificationSystem';
import CommentInput from './CommentInput';

interface CommentItemProps {
  comment: Comment;
  onCommentUpdated?: (comment: Comment) => void;
  onReplyCreated?: (reply: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
  showReplies?: boolean;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onCommentUpdated,
  onReplyCreated,
  onCommentDeleted,
  showReplies = true,
  isReply = false,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.engagement.likes);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const { user } = useAuthStore();
  const { showSuccess, showError } = useNotifications();

  // Check if current user liked this comment
  React.useEffect(() => {
    if (user && comment.likedBy) {
      setIsLiked(comment.likedBy.includes(user.id));
    }
  }, [user, comment.likedBy]);

  const handleLike = async () => {
    if (!user) {
      showError('Authentication Required', 'Please sign in to like comments');
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    try {
      let newLikeCount: number;
      
      if (isLiked) {
        // Unlike the comment
        newLikeCount = await unlikeComment(comment.id, user.id);
        setIsLiked(false);
      } else {
        // Like the comment
        newLikeCount = await likeComment(comment.id, user.id);
        setIsLiked(true);
      }
      
      setLikeCount(newLikeCount);
    } catch (error) {
      console.error('Error toggling comment like:', error);
      showError('Like Failed', 'Unable to update like. Please try again.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleReply = () => {
    if (!user) {
      showError('Authentication Required', 'Please sign in to reply');
      return;
    }
    setShowReplyInput(true);
  };

  const handleDelete = () => {
    if (!user || user.id !== comment.userId) {
      showError('Unauthorized', 'You can only delete your own comments');
      return;
    }

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(comment.id, user.id);
              if (onCommentDeleted) {
                onCommentDeleted(comment.id);
              }
              showSuccess('Comment Deleted', 'Your comment has been removed');
            } catch (error) {
              console.error('Error deleting comment:', error);
              showError('Delete Failed', 'Unable to delete comment. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toLocaleDateString();
  };

  if (comment.isDeleted) {
    return (
      <View style={[styles.container, isReply && styles.replyContainer, styles.deletedContainer]}>
        <Text style={styles.deletedText}>[Comment deleted]</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      {/* Comment Header */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          {comment.author.avatar ? (
            <Image source={{ uri: comment.author.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={16} color="#8B4513" />
            </View>
          )}
          <Text style={styles.authorName}>{comment.author.displayName}</Text>
          <Text style={styles.timestamp}>{formatTimeAgo(comment.createdAt)}</Text>
          {comment.isEdited && (
            <Text style={styles.editedLabel}>(edited)</Text>
          )}
        </View>
        
        {user && user.id === comment.userId && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Comment Content */}
      <View style={styles.content}>
        <Text style={styles.commentText}>{comment.content.text}</Text>
        
        {/* Hashtags */}
        {comment.content.hashtags && comment.content.hashtags.length > 0 && (
          <View style={styles.hashtagContainer}>
            {comment.content.hashtags.map((hashtag, index) => (
              <Text key={index} style={styles.hashtag}>
                #{hashtag}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Comment Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleLike}
          style={[styles.actionButton, isLiked && styles.actionButtonActive]}
          disabled={isLiking}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={16}
            color={isLiked ? "#FF6B6B" : "#8B4513"}
          />
          {likeCount > 0 && (
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
              {likeCount}
            </Text>
          )}
        </TouchableOpacity>

        {showReplies && comment.depth < 3 && (
          <TouchableOpacity onPress={handleReply} style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={16} color="#8B4513" />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
        )}

        {comment.replyCount > 0 && showReplies && (
          <Text style={styles.replyCount}>
            {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
          </Text>
        )}
      </View>

      {/* Reply Input */}
      {showReplyInput && (
        <CommentInput
          postId={comment.postId}
          parentCommentId={comment.id}
          placeholder={`Reply to ${comment.author.displayName}...`}
          autoFocus={true}
          onCommentCreated={(reply) => {
            setShowReplyInput(false);
            if (onReplyCreated) {
              onReplyCreated(reply);
            }
          }}
          onCancel={() => setShowReplyInput(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  replyContainer: {
    backgroundColor: '#FAFAFA',
    marginLeft: 32,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E5E5',
    paddingLeft: 12,
  },
  deletedContainer: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#8B8B8B',
    marginRight: 8,
  },
  editedLabel: {
    fontSize: 12,
    color: '#8B8B8B',
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 4,
  },
  content: {
    marginBottom: 8,
  },
  commentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  hashtagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  hashtag: {
    fontSize: 13,
    color: '#8B4513',
    marginRight: 8,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  actionButtonActive: {
    backgroundColor: '#FFF0F0',
  },
  actionText: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#FF6B6B',
  },
  replyCount: {
    fontSize: 12,
    color: '#8B8B8B',
    marginLeft: 'auto',
  },
  deletedText: {
    fontSize: 14,
    color: '#8B8B8B',
    fontStyle: 'italic',
  },
});

export default CommentItem; 