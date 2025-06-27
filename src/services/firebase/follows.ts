import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './config';

// Firestore collection names
const FOLLOWS_COLLECTION = 'follows';
const USERS_COLLECTION = 'users';

export interface Follow {
  id: string;
  followerId: string; // User who is following
  followingId: string; // User being followed
  createdAt: Date;
  status: 'pending' | 'accepted' | 'blocked';
}

export interface UserProfile {
  id: string;
  displayName: string;
  avatar?: string;
  craftSpecialization: string[];
  skillLevel: string;
  bio?: string;
  location?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

/**
 * Send a follow request to another user
 * @param followerId - ID of user sending the request
 * @param followingId - ID of user to follow
 * @returns Promise with the follow request ID
 */
export const sendFollowRequest = async (followerId: string, followingId: string): Promise<string> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  if (followerId === followingId) {
    throw new Error('Cannot follow yourself');
  }

  try {
    // Check if follow relationship already exists
    const existingFollow = await getFollowRelationship(followerId, followingId);
    if (existingFollow) {
      throw new Error('Follow relationship already exists');
    }

    const followsRef = collection(db, FOLLOWS_COLLECTION);
    
    const followData = {
      followerId,
      followingId,
      createdAt: serverTimestamp(),
      status: 'accepted', // For now, auto-accept all follows (like Instagram)
    };

    console.log('👥 Sending follow request:', { followerId, followingId });

    const docRef = await addDoc(followsRef, followData);
    
    console.log('✅ Follow request sent successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error sending follow request:', error);
    throw new Error(`Failed to send follow request: ${error}`);
  }
};

/**
 * Get follow relationship between two users
 * @param followerId - ID of potential follower
 * @param followingId - ID of potential following
 * @returns Promise with Follow object or null
 */
export const getFollowRelationship = async (followerId: string, followingId: string): Promise<Follow | null> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const followsRef = collection(db, FOLLOWS_COLLECTION);
    
    const q = query(
      followsRef,
      where('followerId', '==', followerId),
      where('followingId', '==', followingId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const docSnap = querySnapshot.docs[0];
    if (!docSnap) {
      return null;
    }
    
    const data = docSnap.data();
    
    return {
      id: docSnap.id,
      followerId: data.followerId,
      followingId: data.followingId,
      createdAt: data.createdAt?.toDate() || new Date(),
      status: data.status || 'accepted',
    };
  } catch (error) {
    console.error('❌ Error getting follow relationship:', error);
    throw new Error(`Failed to get follow relationship: ${error}`);
  }
};

/**
 * Search for users by name or craft specialization
 * @param searchTerm - Search term
 * @param currentUserId - ID of current user (to exclude from results)
 * @param limit - Maximum number of results
 * @returns Promise with array of user profiles
 */
export const searchUsers = async (searchTerm: string, currentUserId: string, limit: number = 20): Promise<UserProfile[]> => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your Firebase configuration.');
  }

  try {
    const usersRef = collection(db, USERS_COLLECTION);
    
    // Note: This is a simple search. In production, you'd use a proper search service like Algolia
    const querySnapshot = await getDocs(usersRef);
    const users: UserProfile[] = [];
    
    querySnapshot.forEach((doc) => {
      if (doc.id === currentUserId) return; // Skip current user
      
      const userData = doc.data();
      const displayName = userData.displayName?.toLowerCase() || '';
      const craftSpecs = (userData.craftSpecialization || []).join(' ').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      // Simple text matching
      if (displayName.includes(searchLower) || craftSpecs.includes(searchLower)) {
        users.push({
          id: doc.id,
          displayName: userData.displayName || 'Unknown User',
          avatar: userData.avatar,
          craftSpecialization: userData.craftSpecialization || [],
          skillLevel: userData.skillLevel || 'beginner',
          bio: userData.bio,
          location: userData.location,
          followersCount: 0, // TODO: Calculate actual counts
          followingCount: 0,
          postsCount: 0,
        });
      }
    });

    const limitedResults = users.slice(0, limit);
    console.log(`🔍 Found ${limitedResults.length} users matching "${searchTerm}"`);
    return limitedResults;
  } catch (error) {
    console.error('❌ Error searching users:', error);
    throw new Error(`Failed to search users: ${error}`);
  }
}; 