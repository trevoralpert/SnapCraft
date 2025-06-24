import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { AuthUser, User, CraftSpecialization, SkillLevel } from '../../shared/types';

export class AuthService {
  // Convert Firebase User to our AuthUser type
  static toAuthUser(firebaseUser: FirebaseUser): AuthUser {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
    };
  }

  // Sign up new user
  static async signUp(
    email: string, 
    password: string, 
    displayName: string,
    craftSpecialization: CraftSpecialization[] = ['general'],
    skillLevel: SkillLevel = 'novice'
  ): Promise<AuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update display name
      await updateProfile(firebaseUser, { displayName });

      // Create user document in Firestore
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName,
        craftSpecialization,
        skillLevel,
        toolInventory: [],
        joinedAt: new Date(),
      };

      console.log('💾 Creating Firestore user document:', userData);
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('✅ User document created successfully');

      return this.toAuthUser(firebaseUser);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  // Sign in existing user
  static async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return this.toAuthUser(userCredential.user);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Sign out user
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get user data from Firestore
  static async getUserData(uid: string): Promise<User | null> {
    try {
      console.log('🔍 Getting user data for UID:', uid);
      const userDoc = await getDoc(doc(db, 'users', uid));
      console.log('📄 Firestore document exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        console.log('📊 Raw Firestore data:', userData);
        return userData;
      } else {
        console.log('❌ No user document found in Firestore for UID:', uid);
        return null;
      }
    } catch (error) {
      console.error('❌ Get user data error:', error);
      throw error;
    }
  }

  // Update user data
  static async updateUserData(uid: string, userData: Partial<User>): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), userData, { merge: true });
    } catch (error) {
      console.error('Update user data error:', error);
      throw error;
    }
  }

  // Update user profile (convenience method)
  static async updateUserProfile(user: User): Promise<void> {
    try {
      await this.updateUserData(user.id, user);
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  // Set up auth state listener
  static onAuthStateChanged(callback: (user: User | null) => void) {
    console.log('🔧 Setting up Firebase auth state listener...');
    return onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Firebase auth state changed:', { 
        firebaseUser: firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email } : null 
      });
      
      if (firebaseUser) {
        try {
          console.log('📊 Fetching user data from Firestore...');
          let userData = await this.getUserData(firebaseUser.uid);
          
          // If user data doesn't exist, create it
          if (!userData) {
            console.log('🔧 User document missing, creating default profile...');
            userData = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || 'SnapCraft User',
              craftSpecialization: ['general'],
              skillLevel: 'novice',
              toolInventory: [],
              joinedAt: new Date(),
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
            console.log('✅ Default user profile created');
          }
          
          console.log('✅ User data retrieved:', userData ? { id: userData.id, email: userData.email } : null);
          callback(userData);
        } catch (error) {
          console.error('❌ Error getting user data:', error);
          callback(null);
        }
      } else {
        console.log('🚫 No Firebase user, calling callback with null');
        callback(null);
      }
    });
  }
}

// Export instance for use in components
export const authService = new AuthService(); 