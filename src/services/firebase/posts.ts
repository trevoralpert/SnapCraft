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
import { CraftPost } from '../../shared/types';

// Firestore collection names
const POSTS_COLLECTION = 'craftPosts';
const USERS_COLLECTION = 'users';

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