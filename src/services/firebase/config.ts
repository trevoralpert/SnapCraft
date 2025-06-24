import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Check if we're in demo mode (using placeholder values)
const isDemoMode = process.env.EXPO_PUBLIC_FIREBASE_API_KEY === 'demo-api-key' || 
                   process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID === 'demo-project';

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredKeys = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ];

  const missingKeys = requiredKeys.filter(key => !process.env[key]);
  
  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase configuration: ${missingKeys.join(', ')}. ` +
      'Please check your .env file and ensure all Firebase keys are set.'
    );
  }
  
  if (isDemoMode) {
    console.log('🎭 Running in DEMO MODE - Firebase features will be mocked');
  }
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  validateFirebaseConfig();
  
  if (!isDemoMode) {
    // Initialize Firebase app (only once) for real Firebase
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0]!;
    }
    
    // Initialize Firebase services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    console.log('✅ Firebase initialized successfully');
  } else {
    console.log('✅ Demo mode initialized - Firebase mocked');
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  // Don't throw in demo mode, just log the error
  if (!isDemoMode) {
    throw error;
  }
}

// Export Firebase services (will be null in demo mode)
export { auth, db, storage, isDemoMode };
export default app; 