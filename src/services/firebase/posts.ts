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