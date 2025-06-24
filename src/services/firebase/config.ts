import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
// AsyncStorage is automatically detected by Firebase in React Native

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

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
    console.warn(
      `Missing Firebase configuration: ${missingKeys.join(', ')}. ` +
      'Please check your .env file and ensure all Firebase keys are set.'
    );
    return false;
  }
  
  // Check for placeholder values
  const hasPlaceholders = Object.values(firebaseConfig).some(value => 
    typeof value === 'string' && (
      value.includes('your-') || 
      value.includes('demo-') ||
      value === 'your_project_id' ||
      value === 'your_api_key'
    )
  );
  
  if (hasPlaceholders) {
    console.warn('🎭 Firebase config contains placeholder values - running in demo mode');
    return false;
  }
  
  // Log config for debugging (without sensitive values)
  console.log('🔧 Firebase config validation:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    projectId: firebaseConfig.projectId,
  });
  
  return true;
};

// Check if configuration is valid
const isValidConfig = validateFirebaseConfig();

// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  if (isValidConfig) {
    // Initialize Firebase app (only once) for real Firebase
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      
      // Initialize Auth - Firebase will automatically use AsyncStorage in React Native
      try {
        // For React Native, Firebase automatically detects and uses AsyncStorage
        auth = getAuth(app);
      } catch (error) {
        console.log('Error initializing auth:', error);
        auth = null;
      }
    } else {
      app = getApps()[0]!;
      auth = getAuth(app);
    }
    
    // Initialize other Firebase services
    db = getFirestore(app);
    storage = getStorage(app);
    
    console.log('✅ Firebase initialized successfully with AsyncStorage persistence');
  } else {
    console.log('✅ Demo mode initialized - Firebase mocked');
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  // Don't throw in demo mode, just log the error
  if (isValidConfig) {
    throw error;
  }
}

// Export Firebase services (will be null in demo mode)
export { auth, db, storage, isValidConfig as isDemoMode };
export default app; 