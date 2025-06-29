import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  orderBy, 
  limit, 
  where,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './config';
import { CraftPost, Comment, CommentInput } from '../../shared/types';

// Firestore collection names
const POSTS_COLLECTION = 'craftPosts';
const USERS_COLLECTION = 'users';
const COMMENTS_COLLECTION = 'comments';

/**
 * Create a new craft post
 * @param postData - Post data without ID and timestamps
 * @returns Promise with the created post ID
 */
export const createPost = async (postData: Omit<CraftPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    
    const postToCreate = {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log('📝 Creating post:', {
      userId: postData.userId,
      craftType: postData.craftType,
      hasImages: postData.content.images.length,
    });

    const docRef = await addDoc(postsRef, postToCreate);
    
    console.log('✅ Post created successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating post:', error);
    throw new Error(`Failed to create post: ${error}`);
  }
};

/**
 * Get all posts ordered by creation date (newest first)
 * @param limitCount - Maximum number of posts to retrieve
 * @returns Promise with array of posts
 */
export const getPosts = async (limitCount: number = 50): Promise<CraftPost[]> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    const q = query(
      postsRef, 
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const posts: CraftPost[] = [];

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to Date objects
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CraftPost);
    });

    console.log(`📄 Retrieved ${posts.length} posts from Firestore`);
    return posts;
  } catch (error) {
    console.error('❌ Error fetching posts:', error);
    throw new Error(`Failed to fetch posts: ${error}`);
  }
};

/**
 * Get posts by a specific user
 * @param userId - User ID to filter by
 * @param limitCount - Maximum number of posts to retrieve
 * @returns Promise with array of user's posts
 */
export const getUserPosts = async (userId: string, limitCount: number = 20): Promise<CraftPost[]> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    const q = query(
      postsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const posts: CraftPost[] = [];

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CraftPost);
    });

    console.log(`📄 Retrieved ${posts.length} posts for user ${userId}`);
    return posts;
  } catch (error) {
    console.error('❌ Error fetching user posts:', error);
    throw new Error(`Failed to fetch user posts: ${error}`);
  }
};

/**
 * Get posts by craft type
 * @param craftType - Craft type to filter by
 * @param limitCount - Maximum number of posts to retrieve
 * @returns Promise with array of filtered posts
 */
export const getPostsByCraftType = async (craftType: string, limitCount: number = 20): Promise<CraftPost[]> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    const q = query(
      postsRef, 
      where('craftType', '==', craftType),
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const posts: CraftPost[] = [];

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CraftPost);
    });

    console.log(`📄 Retrieved ${posts.length} ${craftType} posts`);
    return posts;
  } catch (error) {
    console.error('❌ Error fetching posts by craft type:', error);
    throw new Error(`Failed to fetch posts by craft type: ${error}`);
  }
};

/**
 * Update post engagement (likes, comments, etc.)
 * @param postId - Post ID to update
 * @param engagement - New engagement data
 * @returns Promise
 */
export const updatePostEngagement = async (
  postId: string, 
  engagement: CraftPost['engagement']
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      engagement,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Post engagement updated:', postId);
  } catch (error) {
    console.error('❌ Error updating post engagement:', error);
    throw new Error(`Failed to update post engagement: ${error}`);
  }
};

/**
 * Like a post with user attribution and duplicate prevention
 * @param postId - Post ID to like
 * @param userId - User ID who is liking the post
 * @returns Promise with updated like count
 */
export const likePost = async (postId: string, userId: string): Promise<number> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    // Get current post data
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      throw new Error('Post not found');
    }

    const postData = postSnap.data() as CraftPost;
    
    // Initialize likedBy array if it doesn't exist
    const likedBy = postData.likedBy || [];
    
    // Check if user already liked this post
    if (likedBy.includes(userId)) {
      console.log('⚠️ User already liked this post:', { postId, userId });
      return postData.engagement.likes; // Return current count without change
    }

    // Add user to likedBy array and increment like count
    const newLikedBy = [...likedBy, userId];
    const newLikeCount = postData.engagement.likes + 1;

    // Update post with new like data
    await updateDoc(postRef, {
      likedBy: newLikedBy,
      'engagement.likes': newLikeCount,
      updatedAt: serverTimestamp(),
    });

    console.log('❤️ Post liked successfully:', { postId, userId, newLikeCount });
    return newLikeCount;
  } catch (error) {
    console.error('❌ Error liking post:', error);
    throw new Error(`Failed to like post: ${error}`);
  }
};

/**
 * Unlike a post with user attribution
 * @param postId - Post ID to unlike
 * @param userId - User ID who is unliking the post
 * @returns Promise with updated like count
 */
export const unlikePost = async (postId: string, userId: string): Promise<number> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    // Get current post data
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      throw new Error('Post not found');
    }

    const postData = postSnap.data() as CraftPost;
    
    // Initialize likedBy array if it doesn't exist
    const likedBy = postData.likedBy || [];
    
    // Check if user actually liked this post
    if (!likedBy.includes(userId)) {
      console.log('⚠️ User has not liked this post:', { postId, userId });
      return postData.engagement.likes; // Return current count without change
    }

    // Remove user from likedBy array and decrement like count
    const newLikedBy = likedBy.filter((id: string) => id !== userId);
    const newLikeCount = Math.max(0, postData.engagement.likes - 1); // Prevent negative likes

    // Update post with new like data
    await updateDoc(postRef, {
      likedBy: newLikedBy,
      'engagement.likes': newLikeCount,
      updatedAt: serverTimestamp(),
    });

    console.log('💔 Post unliked successfully:', { postId, userId, newLikeCount });
    return newLikeCount;
  } catch (error) {
    console.error('❌ Error unliking post:', error);
    throw new Error(`Failed to unlike post: ${error}`);
  }
};

/**
 * Check if a user has liked a post
 * @param postId - Post ID to check
 * @param userId - User ID to check
 * @returns Promise with boolean indicating if user liked the post
 */
export const hasUserLikedPost = async (postId: string, userId: string): Promise<boolean> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      return false;
    }

    const postData = postSnap.data() as CraftPost;
    const likedBy = postData.likedBy || [];
    
    return likedBy.includes(userId);
  } catch (error) {
    console.error('❌ Error checking if user liked post:', error);
    return false; // Default to false on error
  }
};

/**
 * Get all liked posts by a user
 * @param userId - User ID to get liked posts for
 * @param limitCount - Maximum number of posts to retrieve
 * @returns Promise with array of liked posts
 */
export const getUserLikedPosts = async (userId: string, limitCount: number = 50): Promise<CraftPost[]> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    const q = query(
      postsRef, 
      where('likedBy', 'array-contains', userId),
      orderBy('updatedAt', 'desc'), 
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const posts: CraftPost[] = [];

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CraftPost);
    });

    console.log(`❤️ Retrieved ${posts.length} liked posts for user ${userId}`);
    return posts;
  } catch (error) {
    console.error('❌ Error fetching user liked posts:', error);
    throw new Error(`Failed to fetch user liked posts: ${error}`);
  }
};

/**
 * Get users who liked a specific post
 * @param postId - Post ID to get likers for
 * @returns Promise with array of user IDs who liked the post
 */
export const getPostLikers = async (postId: string): Promise<string[]> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      return [];
    }

    const postData = postSnap.data() as CraftPost;
    return postData.likedBy || [];
  } catch (error) {
    console.error('❌ Error fetching post likers:', error);
    return [];
  }
};

/**
 * Delete a post
 * @param postId - Post ID to delete
 * @returns Promise
 */
export const deletePost = async (postId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await deleteDoc(postRef);

    console.log('✅ Post deleted successfully:', postId);
  } catch (error) {
    console.error('❌ Error deleting post:', error);
    throw new Error(`Failed to delete post: ${error}`);
  }
};

/**
 * Get a single post by ID
 * @param postId - Post ID to retrieve
 * @returns Promise with post data or null if not found
 */
export const getPost = async (postId: string): Promise<CraftPost | null> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const docSnap = await getDoc(postRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CraftPost;
    } else {
      console.log('Post not found:', postId);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching post:', error);
    throw new Error(`Failed to fetch post: ${error}`);
  }
};

// ================================
// TASK 4.2: COMMENTING SYSTEM
// ================================

/**
 * Create a new comment on a post
 * @param commentData - Comment data without ID and timestamps
 * @returns Promise with the created comment
 */
export const createComment = async (commentData: CommentInput & { userId: string; author: Comment['author'] }): Promise<Comment> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    
    // Determine comment depth for threading
    let depth = 0;
    if (commentData.parentCommentId) {
      const parentComment = await getComment(commentData.parentCommentId);
      if (parentComment) {
        depth = Math.min(parentComment.depth + 1, 3); // Max depth of 3
      }
    }
    
    const commentToCreate = {
      postId: commentData.postId,
      userId: commentData.userId,
      author: commentData.author,
      content: {
        text: commentData.text.trim(),
        mentions: commentData.mentions || [],
        hashtags: extractHashtags(commentData.text),
      },
      parentCommentId: commentData.parentCommentId || null,
      replies: [],
      replyCount: 0,
      engagement: {
        likes: 0,
        replies: 0,
      },
      likedBy: [],
      isDeleted: false,
      isHidden: false,
      isEdited: false,
      editHistory: [],
      moderationFlags: [],
      depth,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log('💬 Creating comment:', {
      postId: commentData.postId,
      userId: commentData.userId,
      textLength: commentData.text.length,
      isReply: !!commentData.parentCommentId,
      depth,
    });

    const docRef = await addDoc(commentsRef, commentToCreate);
    
    // Update post comment count
    await updatePostCommentCount(commentData.postId, 1);
    
    // If this is a reply, update parent comment reply count
    if (commentData.parentCommentId) {
      await updateCommentReplyCount(commentData.parentCommentId, 1);
    }
    
    // Get the created comment with proper typing
    const createdComment = await getComment(docRef.id);
    if (!createdComment) {
      throw new Error('Failed to retrieve created comment');
    }
    
    console.log('✅ Comment created successfully:', docRef.id);
    return createdComment;
  } catch (error) {
    console.error('❌ Error creating comment:', error);
    throw new Error(`Failed to create comment: ${error}`);
  }
};

/**
 * Get comments for a specific post
 * @param postId - Post ID to get comments for
 * @param limitCount - Maximum number of comments to retrieve
 * @returns Promise with array of comments
 */
export const getPostComments = async (postId: string, limitCount: number = 50): Promise<Comment[]> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    const q = query(
      commentsRef,
      where('postId', '==', postId),
      where('isDeleted', '==', false),
      where('isHidden', '==', false),
      orderBy('createdAt', 'asc'), // Oldest first for better threading
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const comments: Comment[] = [];

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Comment);
    });

    console.log(`💬 Retrieved ${comments.length} comments for post ${postId}`);
    return comments;
  } catch (error) {
    console.error('❌ Error fetching post comments:', error);
    throw new Error(`Failed to fetch post comments: ${error}`);
  }
};

/**
 * Get a specific comment by ID
 * @param commentId - Comment ID to retrieve
 * @returns Promise with comment or null if not found
 */
export const getComment = async (commentId: string): Promise<Comment | null> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      return null;
    }
    
    const data = commentDoc.data();
    return {
      id: commentDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Comment;
  } catch (error) {
    console.error('❌ Error fetching comment:', error);
    throw new Error(`Failed to fetch comment: ${error}`);
  }
};

/**
 * Get replies for a specific comment
 * @param parentCommentId - Parent comment ID to get replies for
 * @param limitCount - Maximum number of replies to retrieve
 * @returns Promise with array of reply comments
 */
export const getCommentReplies = async (parentCommentId: string, limitCount: number = 20): Promise<Comment[]> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    const q = query(
      commentsRef,
      where('parentCommentId', '==', parentCommentId),
      where('isDeleted', '==', false),
      where('isHidden', '==', false),
      orderBy('createdAt', 'asc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const replies: Comment[] = [];

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      replies.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Comment);
    });

    console.log(`💬 Retrieved ${replies.length} replies for comment ${parentCommentId}`);
    return replies;
  } catch (error) {
    console.error('❌ Error fetching comment replies:', error);
    throw new Error(`Failed to fetch comment replies: ${error}`);
  }
};

/**
 * Like a comment
 * @param commentId - Comment ID to like
 * @param userId - User ID who is liking
 * @returns Promise with new like count
 */
export const likeComment = async (commentId: string, userId: string): Promise<number> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }
    
    const commentData = commentDoc.data() as Comment;
    const likedBy = commentData.likedBy || [];
    
    // Check if user already liked this comment
    if (likedBy.includes(userId)) {
      console.log('⚠️ User already liked this comment:', commentId);
      return commentData.engagement.likes;
    }
    
    // Add user to likedBy array and increment like count
    const newLikedBy = [...likedBy, userId];
    const newLikeCount = commentData.engagement.likes + 1;
    
    await updateDoc(commentRef, {
      likedBy: newLikedBy,
      'engagement.likes': newLikeCount,
      updatedAt: serverTimestamp(),
    });
    
    console.log('❤️ Comment liked successfully:', commentId, 'New count:', newLikeCount);
    return newLikeCount;
  } catch (error) {
    console.error('❌ Error liking comment:', error);
    throw new Error(`Failed to like comment: ${error}`);
  }
};

/**
 * Unlike a comment
 * @param commentId - Comment ID to unlike
 * @param userId - User ID who is unliking
 * @returns Promise with new like count
 */
export const unlikeComment = async (commentId: string, userId: string): Promise<number> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }
    
    const commentData = commentDoc.data() as Comment;
    const likedBy = commentData.likedBy || [];
    
    // Check if user hasn't liked this comment
    if (!likedBy.includes(userId)) {
      console.log('⚠️ User hasn\'t liked this comment:', commentId);
      return commentData.engagement.likes;
    }
    
    // Remove user from likedBy array and decrement like count
    const newLikedBy = likedBy.filter((id: string) => id !== userId);
    const newLikeCount = Math.max(0, commentData.engagement.likes - 1);
    
    await updateDoc(commentRef, {
      likedBy: newLikedBy,
      'engagement.likes': newLikeCount,
      updatedAt: serverTimestamp(),
    });
    
    console.log('💔 Comment unliked successfully:', commentId, 'New count:', newLikeCount);
    return newLikeCount;
  } catch (error) {
    console.error('❌ Error unliking comment:', error);
    throw new Error(`Failed to unlike comment: ${error}`);
  }
};

/**
 * Edit a comment
 * @param commentId - Comment ID to edit
 * @param newText - New comment text
 * @param userId - User ID who is editing (must be comment author)
 * @returns Promise with updated comment
 */
export const editComment = async (commentId: string, newText: string, userId: string): Promise<Comment> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }
    
    const commentData = commentDoc.data() as Comment;
    
    // Check if user is the author
    if (commentData.userId !== userId) {
      throw new Error('Unauthorized: Only comment author can edit');
    }
    
    // Add to edit history
    const editHistory = commentData.editHistory || [];
    editHistory.push({
      editedAt: new Date(),
      previousText: commentData.content.text,
    });
    
    await updateDoc(commentRef, {
      'content.text': newText.trim(),
      'content.hashtags': extractHashtags(newText),
      isEdited: true,
      editHistory,
      updatedAt: serverTimestamp(),
    });
    
    const updatedComment = await getComment(commentId);
    if (!updatedComment) {
      throw new Error('Failed to retrieve updated comment');
    }
    
    console.log('✏️ Comment edited successfully:', commentId);
    return updatedComment;
  } catch (error) {
    console.error('❌ Error editing comment:', error);
    throw new Error(`Failed to edit comment: ${error}`);
  }
};

/**
 * Delete a comment (soft delete)
 * @param commentId - Comment ID to delete
 * @param userId - User ID who is deleting (must be comment author)
 * @returns Promise
 */
export const deleteComment = async (commentId: string, userId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }
    
    const commentData = commentDoc.data() as Comment;
    
    // Check if user is the author
    if (commentData.userId !== userId) {
      throw new Error('Unauthorized: Only comment author can delete');
    }
    
    // Soft delete
    await updateDoc(commentRef, {
      isDeleted: true,
      'content.text': '[deleted]',
      updatedAt: serverTimestamp(),
    });
    
    // Update post comment count
    await updatePostCommentCount(commentData.postId, -1);
    
    // If this was a reply, update parent comment reply count
    if (commentData.parentCommentId) {
      await updateCommentReplyCount(commentData.parentCommentId, -1);
    }
    
    console.log('🗑️ Comment deleted successfully:', commentId);
  } catch (error) {
    console.error('❌ Error deleting comment:', error);
    throw new Error(`Failed to delete comment: ${error}`);
  }
};

// ================================
// HELPER FUNCTIONS
// ================================

/**
 * Update post comment count
 * @param postId - Post ID to update
 * @param increment - Amount to increment/decrement (+1 for new comment, -1 for deleted)
 */
const updatePostCommentCount = async (postId: string, increment: number): Promise<void> => {
  if (!db) {
    console.error('❌ Firestore not initialized');
    return;
  }
  
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postDoc = await getDoc(postRef);
    
    if (postDoc.exists()) {
      const postData = postDoc.data() as CraftPost;
      if (postData && postData.engagement) {
        const newCount = Math.max(0, (postData.engagement.comments || 0) + increment);
        
        await updateDoc(postRef, {
          'engagement.comments': newCount,
          updatedAt: serverTimestamp(),
        });
        
        console.log('✅ Post comment count updated:', postId, 'New count:', newCount);
      }
    }
  } catch (error) {
    console.error('❌ Error updating post comment count:', error);
    // Don't throw - allow comment creation to succeed even if count update fails
    console.log('⚠️ Comment created but count update failed - this is non-critical');
  }
};

/**
 * Update comment reply count
 * @param commentId - Comment ID to update
 * @param increment - Amount to increment/decrement (+1 for new reply, -1 for deleted)
 */
const updateCommentReplyCount = async (commentId: string, increment: number): Promise<void> => {
  if (!db) {
    console.error('❌ Firestore not initialized');
    return;
  }
  
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (commentDoc.exists()) {
      const commentData = commentDoc.data() as Comment;
      const newCount = Math.max(0, commentData.replyCount + increment);
      
      await updateDoc(commentRef, {
        replyCount: newCount,
        'engagement.replies': newCount,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('❌ Error updating comment reply count:', error);
  }
};

/**
 * Extract hashtags from text
 * @param text - Text to extract hashtags from
 * @returns Array of hashtags (without #)
 */
const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#(\w+)/g;
  const hashtags: string[] = [];
  let match;
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1].toLowerCase());
  }
  
  return [...new Set(hashtags)]; // Remove duplicates
}; 