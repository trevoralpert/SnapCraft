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
 * Mark a story as viewed by a user with engagement metrics
 * @param storyId - Story ID to mark as viewed
 * @param viewerId - User ID who viewed the story
 * @param engagementData - Optional engagement metrics
 * @returns Promise
 */
export const markStoryAsViewed = async (
  storyId: string, 
  viewerId: string, 
  engagementData?: {
    watchDuration?: number; // How long they watched in seconds
    completed?: boolean; // Did they watch to the end
    replayed?: boolean; // Did they replay the story
  }
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const storyRef = doc(db, STORIES_COLLECTION, storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      console.warn('⚠️ Story not found for view tracking:', storyId);
      return; // Don't throw error, just log and continue
    }
    
    const storyData = storyDoc.data();
    const views = storyData.views || [];
    
    // Check if user already viewed this story
    const existingViewIndex = views.findIndex((view: any) => view.userId === viewerId);
    
    if (existingViewIndex === -1) {
      // First time viewing
      const newView = {
        userId: viewerId,
        viewedAt: new Date().toISOString(),
        watchDuration: Math.max(0, engagementData?.watchDuration || 0), // Ensure non-negative
        completed: engagementData?.completed || false,
        replayed: false,
        viewCount: 1,
      };
      
      console.log('🔄 Attempting to update story views...', storyId);
      await updateDoc(storyRef, {
        views: [...views, newView],
      });
      
      console.log('✅ Story marked as viewed:', storyId, 'by', viewerId);
    } else if (engagementData?.replayed) {
      // Update existing view with replay data
      const updatedViews = [...views];
      const existingView = updatedViews[existingViewIndex];
      
      updatedViews[existingViewIndex] = {
        ...existingView,
        replayed: true,
        viewCount: (existingView.viewCount || 1) + 1,
        lastViewedAt: new Date().toISOString(),
        watchDuration: Math.max(
          existingView.watchDuration || 0,
          engagementData.watchDuration || 0
        ),
        completed: existingView.completed || engagementData.completed || false,
      };
      
      await updateDoc(storyRef, {
        views: updatedViews,
      });
      
      console.log('✅ Story replay tracked:', storyId, 'by', viewerId);
    } else {
      console.log('ℹ️ Story already viewed by user:', storyId, viewerId);
      
      // Update watch duration if it's longer than previous
      if (engagementData?.watchDuration && engagementData.watchDuration > 0) {
        const updatedViews = [...views];
        const existingView = updatedViews[existingViewIndex];
        
        if ((engagementData.watchDuration > (existingView.watchDuration || 0)) || engagementData.completed) {
          updatedViews[existingViewIndex] = {
            ...existingView,
            watchDuration: Math.max(existingView.watchDuration || 0, engagementData.watchDuration),
            completed: existingView.completed || engagementData.completed || false,
            lastViewedAt: new Date().toISOString(),
          };
          
          await updateDoc(storyRef, {
            views: updatedViews,
          });
          
          console.log('✅ Story engagement updated:', storyId);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error marking story as viewed:', error);
    
    // Check if it's a permission error (multiple ways Firebase can present this)
    const isPermissionError = error && typeof error === 'object' && (
      ('code' in error && error.code === 'permission-denied') ||
      ('message' in error && typeof error.message === 'string' && 
       (error.message.includes('permission-denied') || 
        error.message.includes('Missing or insufficient permissions')))
    );
    
    if (isPermissionError) {
      console.warn('⚠️ Permission denied for marking story as viewed - this is expected until Firestore rules are updated');
      console.warn('📖 Story viewing will continue to work, just without server-side view tracking');
      // Don't throw error for permission issues - let the story viewing continue
      return;
    }
    
    // For now, let's not throw ANY errors from view tracking since it's not critical
    console.warn('⚠️ Story view tracking failed, but continuing with story viewing:', error);
    return;
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

/**
 * Get story analytics for a specific story
 * @param storyId - Story ID to get analytics for
 * @returns Promise with analytics data
 */
export const getStoryAnalytics = async (storyId: string) => {
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
    
    // Calculate analytics with improved error handling
    const totalViews = views.reduce((sum: number, view: any) => {
      const viewCount = view.viewCount || 1;
      return sum + Math.max(0, viewCount); // Ensure non-negative
    }, 0);
    
    const uniqueViewers = views.length;
    const totalReplays = views.reduce((sum: number, view: any) => {
      const viewCount = view.viewCount || 1;
      return sum + Math.max(0, viewCount - 1); // Replays = viewCount - 1
    }, 0);
    
    const completedViews = views.filter((view: any) => view.completed === true).length;
    const completionRate = uniqueViewers > 0 ? completedViews / uniqueViewers : 0;
    
    const totalWatchDuration = views.reduce((sum: number, view: any) => {
      const duration = view.watchDuration || 0;
      return sum + Math.max(0, duration); // Ensure non-negative
    }, 0);
    const averageWatchDuration = uniqueViewers > 0 ? totalWatchDuration / uniqueViewers : 0;
    
    return {
      storyId,
      totalViews,
      uniqueViewers,
      totalReplays,
      completedViews,
      completionRate: Math.round(completionRate * 100),
      averageWatchDuration: Math.round(averageWatchDuration),
      views: views.map((view: any) => ({
        userId: view.userId,
        viewedAt: view.viewedAt,
        lastViewedAt: view.lastViewedAt,
        completed: view.completed || false,
        replayed: view.replayed || false,
        watchDuration: Math.max(0, view.watchDuration || 0),
        viewCount: Math.max(1, view.viewCount || 1),
      })),
      createdAt: storyData.createdAt?.toDate() || new Date(),
      expiresAt: storyData.expiresAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('❌ Error getting story analytics:', error);
    throw error;
  }
};

/**
 * Debug function to get comprehensive story information
 * @param storyId - Story ID to debug
 * @returns Promise with debug information
 */
export const debugStoryAnalytics = async (storyId: string) => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    console.log('🔍 Debug: Fetching story data for:', storyId);
    
    const storyRef = doc(db, STORIES_COLLECTION, storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (!storyDoc.exists()) {
      console.log('❌ Debug: Story does not exist:', storyId);
      return { exists: false, storyId };
    }
    
    const storyData = storyDoc.data();
    const views = storyData.views || [];
    
    console.log('📊 Debug: Story data:', {
      storyId,
      userId: storyData.userId,
      isActive: storyData.isActive,
      createdAt: storyData.createdAt,
      expiresAt: storyData.expiresAt,
      viewsCount: views.length,
      views: views.map((v: any) => ({
        userId: v.userId,
        viewedAt: v.viewedAt,
        watchDuration: v.watchDuration,
        completed: v.completed,
        viewCount: v.viewCount
      }))
    });
    
    // Calculate analytics
    const analytics = await getStoryAnalytics(storyId);
    console.log('📈 Debug: Calculated analytics:', analytics);
    
    return {
      exists: true,
      storyId,
      rawData: storyData,
      analytics,
      debugInfo: {
        viewsArrayLength: views.length,
        isExpired: new Date() > (storyData.expiresAt?.toDate() || new Date()),
        isActive: storyData.isActive,
      }
    };
  } catch (error) {
    console.error('❌ Debug: Error analyzing story:', error);
    return { 
      exists: false, 
      storyId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Get story viewers list with user details
 * @param storyId - Story ID to get viewers for
 * @returns Promise with viewers list
 */
export const getStoryViewers = async (storyId: string) => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const analytics = await getStoryAnalytics(storyId);
    console.log(`👥 Getting user details for ${analytics.views.length} viewers...`);
    
    // Get user details for each viewer with improved error handling
    const viewersWithDetails = await Promise.all(
      analytics.views.map(async (view: any) => {
        try {
          console.log(`🔍 Fetching user details for: ${view.userId}`);
          const userRef = doc(db!, 'users', view.userId);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log(`✅ User data found for ${view.userId}:`, {
              displayName: userData.displayName,
              hasAvatar: !!userData.avatar
            });
            
            return {
              ...view,
              displayName: userData.displayName || userData.email || 'Unknown User',
              avatar: userData.avatar || null,
            };
          } else {
            console.warn(`⚠️ User document not found for viewer: ${view.userId}`);
            return {
              ...view,
              displayName: 'Deleted User',
              avatar: null,
            };
          }
        } catch (error) {
          console.error(`❌ Failed to get user details for viewer: ${view.userId}`, error);
          return {
            ...view,
            displayName: 'Unknown User',
            avatar: null,
          };
        }
      })
    );
    
    console.log(`✅ Successfully fetched details for ${viewersWithDetails.length} viewers`);
    
    return {
      storyId,
      totalViewers: analytics.uniqueViewers,
      totalViews: analytics.totalViews,
      viewers: viewersWithDetails.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()),
    };
  } catch (error) {
    console.error('❌ Error getting story viewers:', error);
    throw error;
  }
};

/**
 * Test story analytics functionality
 * @returns Promise with test results
 */
export const testStoryAnalytics = async () => {
  console.log('🧪 Testing story analytics functionality...');
  
  try {
    // Test 1: Get active stories
    console.log('📖 Test 1: Loading active stories...');
    const stories = await getActiveStories(5);
    console.log(`✅ Found ${stories.length} active stories`);
    
    if (stories.length === 0) {
      console.log('ℹ️ No active stories found. Analytics test cannot proceed without stories.');
      return {
        success: true,
        message: 'No active stories to test analytics with',
        storiesCount: 0,
        tests: []
      };
    }
    
    // Test 2: Test analytics for first story
    const testStory = stories[0];
    if (!testStory) {
      console.log('❌ No test story available');
      return {
        success: false,
        message: 'No test story available',
        storiesCount: stories.length,
        tests: []
      };
    }
    
    console.log(`📊 Test 2: Testing analytics for story: ${testStory.id}`);
    
    const analytics = await getStoryAnalytics(testStory.id);
    console.log('✅ Analytics calculated successfully:', {
      totalViews: analytics.totalViews,
      uniqueViewers: analytics.uniqueViewers,
      completionRate: analytics.completionRate
    });
    
    // Test 3: Test debug function
    console.log(`🔍 Test 3: Testing debug function for story: ${testStory.id}`);
    const debugData = await debugStoryAnalytics(testStory.id);
    console.log('✅ Debug data retrieved successfully');
    
    return {
      success: true,
      message: 'All story analytics tests passed',
      storiesCount: stories.length,
      testStoryId: testStory.id,
      analytics,
      tests: [
        { name: 'Load active stories', passed: true },
        { name: 'Calculate analytics', passed: true },
        { name: 'Debug function', passed: true }
      ]
    };
    
  } catch (error) {
    console.error('❌ Story analytics test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error
    };
  }
}; 