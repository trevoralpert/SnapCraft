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
import { CraftStory } from '../../shared/types';

// Firestore collection names
const STORIES_COLLECTION = 'craftStories';

/**
 * Create a new craft story
 * @param storyData - Story data without ID and timestamps
 * @returns Promise with the created story ID
 */
export const createStory = async (storyData: Omit<CraftStory, 'id' | 'createdAt' | 'expiresAt' | 'views' | 'isActive'>): Promise<string> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const storiesRef = collection(db, STORIES_COLLECTION);
    
    // Calculate expiration time (24 hours from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const storyToCreate = {
      ...storyData,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      views: [],
      isActive: true,
    };

    console.log('📖 Creating story:', {
      userId: storyData.userId,
      hasImage: !!storyData.content.imageUrl,
      hasVideo: !!storyData.content.videoUrl,
      hasText: !!storyData.content.text,
    });

    const docRef = await addDoc(storiesRef, storyToCreate);
    
    console.log('✅ Story created successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating story:', error);
    throw new Error(`Failed to create story: ${error}`);
  }
};

/**
 * Get active stories (not expired) ordered by creation date
 * @param limitCount - Maximum number of stories to retrieve
 * @returns Promise with array of active stories
 */
export const getActiveStories = async (limitCount: number = 50): Promise<CraftStory[]> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const storiesRef = collection(db, STORIES_COLLECTION);
    const now = Timestamp.now();
    
    const q = query(
      storiesRef, 
      where('isActive', '==', true),
      where('expiresAt', '>', now),
      orderBy('expiresAt'),
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const stories: CraftStory[] = [];

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      stories.push({
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to Date objects
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date(),
        views: data.views || [],
      } as CraftStory);
    });

    console.log(`📖 Retrieved ${stories.length} active stories from Firestore`);
    return stories;
  } catch (error) {
    console.error('❌ Error fetching active stories:', error);
    throw new Error(`Failed to fetch active stories: ${error}`);
  }
};

/**
 * Get stories by a specific user
 * @param userId - User ID to filter by
 * @param limitCount - Maximum number of stories to retrieve
 * @returns Promise with array of user's stories
 */
export const getUserStories = async (userId: string, limitCount: number = 20): Promise<CraftStory[]> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const storiesRef = collection(db, STORIES_COLLECTION);
    const now = Timestamp.now();
    
    const q = query(
      storiesRef, 
      where('userId', '==', userId),
      where('isActive', '==', true),
      where('expiresAt', '>', now),
      orderBy('expiresAt'),
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const stories: CraftStory[] = [];

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      stories.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date(),
        views: data.views || [],
      } as CraftStory);
    });

    console.log(`📖 Retrieved ${stories.length} stories for user ${userId}`);
    return stories;
  } catch (error) {
    console.error('❌ Error fetching user stories:', error);
    throw new Error(`Failed to fetch user stories: ${error}`);
  }
};

/**
 * Mark a story as viewed by a user
 * @param storyId - Story ID to mark as viewed
 * @param viewerId - User ID who viewed the story
 * @returns Promise
 */
export const markStoryAsViewed = async (storyId: string, viewerId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const storyRef = doc(db, STORIES_COLLECTION, storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      throw new Error('Story not found');
    }
    
    const storyData = storyDoc.data();
    const views = storyData.views || [];
    
    // Check if user already viewed this story
    const alreadyViewed = views.some((view: any) => view.userId === viewerId);
    
    if (!alreadyViewed) {
      const newView = {
        userId: viewerId,
        viewedAt: serverTimestamp(),
      };
      
      await updateDoc(storyRef, {
        views: [...views, newView],
      });
      
      console.log('✅ Story marked as viewed:', storyId, 'by', viewerId);
    }
  } catch (error) {
    console.error('❌ Error marking story as viewed:', error);
    throw new Error(`Failed to mark story as viewed: ${error}`);
  }
};

/**
 * Delete a story (mark as inactive)
 * @param storyId - Story ID to delete
 * @param userId - User ID who owns the story
 * @returns Promise
 */
export const deleteStory = async (storyId: string, userId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const storyRef = doc(db, STORIES_COLLECTION, storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      throw new Error('Story not found');
    }
    
    const storyData = storyDoc.data();
    
    // Verify ownership
    if (storyData.userId !== userId) {
      throw new Error('Unauthorized: Cannot delete story owned by another user');
    }
    
    await updateDoc(storyRef, {
      isActive: false,
    });

    console.log('✅ Story deleted successfully:', storyId);
  } catch (error) {
    console.error('❌ Error deleting story:', error);
    throw new Error(`Failed to delete story: ${error}`);
  }
};

/**
 * Clean up expired stories (mark as inactive)
 * This would typically be run by a Cloud Function on a schedule
 * @returns Promise with number of stories cleaned up
 */
export const cleanupExpiredStories = async (): Promise<number> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const storiesRef = collection(db, STORIES_COLLECTION);
    const now = Timestamp.now();
    
    const q = query(
      storiesRef, 
      where('isActive', '==', true),
      where('expiresAt', '<=', now)
    );
    
    const querySnapshot = await getDocs(q);
    let cleanedCount = 0;

    const updatePromises = querySnapshot.docs.map(async (doc) => {
      await updateDoc(doc.ref, { isActive: false });
      cleanedCount++;
    });
    
    await Promise.all(updatePromises);

    console.log(`🧹 Cleaned up ${cleanedCount} expired stories`);
    return cleanedCount;
  } catch (error) {
    console.error('❌ Error cleaning up expired stories:', error);
    throw new Error(`Failed to cleanup expired stories: ${error}`);
  }
}; 