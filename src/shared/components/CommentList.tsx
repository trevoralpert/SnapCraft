import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment } from '../../shared/types';
import { getPostComments, getCommentReplies } from '../../services/firebase/posts';
import CommentItem from './CommentItem';

interface CommentListProps {
  postId: string;
  comments?: Comment[];
  onCommentsChange?: (comments: Comment[]) => void;
  maxDepth?: number;
  showLoadMore?: boolean;
}

const CommentList: React.FC<CommentListProps> = ({
  postId,
  comments: initialComments,
  onCommentsChange,
  maxDepth = 3,
  showLoadMore = true,
}) => {
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [repliesMap, setRepliesMap] = useState<Map<string, Comment[]>>(new Map());

  // Load comments if not provided
  useEffect(() => {
    if (!initialComments) {
      loadComments();
    }
  }, [postId, initialComments]);

  const loadComments = async (refresh = false) => {
    if (loading && !refresh) return;
    
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const fetchedComments = await getPostComments(postId, 50);
      
      // Organize comments by threading (top-level comments first)
      const topLevelComments = fetchedComments.filter(comment => !comment.parentCommentId);
      
      setComments(topLevelComments);
      
      if (onCommentsChange) {
        onCommentsChange(topLevelComments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadReplies = async (commentId: string) => {
    if (repliesMap.has(commentId)) {
      // Toggle visibility if already loaded
      const newExpanded = new Set(expandedComments);
      if (expandedComments.has(commentId)) {
        newExpanded.delete(commentId);
      } else {
        newExpanded.add(commentId);
      }
      setExpandedComments(newExpanded);
      return;
    }

    try {
      const replies = await getCommentReplies(commentId, 20);
      const newRepliesMap = new Map(repliesMap);
      newRepliesMap.set(commentId, replies);
      setRepliesMap(newRepliesMap);
      
      const newExpanded = new Set(expandedComments);
      newExpanded.add(commentId);
      setExpandedComments(newExpanded);
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    setComments(prevComments =>
      prevComments.map(comment =>
        comment.id === updatedComment.id ? updatedComment : comment
      )
    );
  };

  const handleReplyCreated = (parentCommentId: string, newReply: Comment) => {
    // Add reply to the replies map
    const newRepliesMap = new Map(repliesMap);
    const existingReplies = newRepliesMap.get(parentCommentId) || [];
    newRepliesMap.set(parentCommentId, [...existingReplies, newReply]);
    setRepliesMap(newRepliesMap);
    
    // Ensure the parent comment is expanded to show the new reply
    const newExpanded = new Set(expandedComments);
    newExpanded.add(parentCommentId);
    setExpandedComments(newExpanded);
    
    // Update parent comment reply count
    setComments(prevComments =>
      prevComments.map(comment =>
        comment.id === parentCommentId
          ? { ...comment, replyCount: comment.replyCount + 1 }
          : comment
      )
    );
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments(prevComments =>
      prevComments.filter(comment => comment.id !== commentId)
    );
    
    // Also remove from replies map if it exists
    const newRepliesMap = new Map(repliesMap);
    for (const [parentId, replies] of newRepliesMap.entries()) {
      const filteredReplies = replies.filter(reply => reply.id !== commentId);
      if (filteredReplies.length !== replies.length) {
        newRepliesMap.set(parentId, filteredReplies);
      }
    }
    setRepliesMap(newRepliesMap);
  };

  const renderComment = ({ item: comment }: { item: Comment }) => {
    const replies = repliesMap.get(comment.id) || [];
    const isExpanded = expandedComments.has(comment.id);
    const hasReplies = comment.replyCount > 0;

    return (
      <View key={comment.id}>
        <CommentItem
          comment={comment}
          onCommentUpdated={handleCommentUpdated}
          onReplyCreated={(reply) => handleReplyCreated(comment.id, reply)}
          onCommentDeleted={handleCommentDeleted}
          showReplies={comment.depth < maxDepth}
        />
        
        {/* Show replies toggle button */}
        {hasReplies && (
          <TouchableOpacity
            style={styles.repliesToggle}
            onPress={() => loadReplies(comment.id)}
          >
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color="#8B4513"
            />
            <Text style={styles.repliesToggleText}>
              {isExpanded ? 'Hide' : 'Show'} {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Render replies */}
        {isExpanded && replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onCommentUpdated={handleCommentUpdated}
                onReplyCreated={(nestedReply) => handleReplyCreated(reply.id, nestedReply)}
                onCommentDeleted={handleCommentDeleted}
                showReplies={reply.depth < maxDepth}
                isReply={true}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={48} color="#C0C0C0" />
      <Text style={styles.emptyStateText}>No comments yet</Text>
      <Text style={styles.emptyStateSubtext}>Be the first to share your thoughts!</Text>
    </View>
  );

  const renderHeader = () => {
    if (comments.length === 0) return null;
    
    return (
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadComments(true)}
            colors={['#8B4513']}
            tintColor="#8B4513"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={comments.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
  },
  repliesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 48,
    gap: 6,
  },
  repliesToggleText: {
    fontSize: 13,
    color: '#8B4513',
    fontWeight: '500',
  },
  repliesContainer: {
    backgroundColor: '#FAFAFA',
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
});

export default CommentList; 