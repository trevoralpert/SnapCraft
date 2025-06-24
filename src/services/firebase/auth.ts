import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
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

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

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
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      console.error('Get user data error:', error);
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
} 