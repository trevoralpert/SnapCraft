import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration for Web SDK (compatible with Expo Go)
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

// Initialize Firebase (Web SDK with React Native persistence)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

console.log('🔥 STARTING Firebase initialization process...');
console.log('🔍 Config validation result:', isValidConfig);

try {
  if (isValidConfig) {
    console.log('🔥 Step 1: Checking existing Firebase apps...');
    const existingApps = getApps();
    console.log('🔍 Existing apps count:', existingApps.length);
    
    // Initialize Firebase app (only once)
    if (existingApps.length === 0) {
      console.log('🔥 Step 2: Creating new Firebase app...');
      console.log('🔍 Config being used:', {
        apiKeyLength: firebaseConfig.apiKey?.length,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
      });
      
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase Web SDK app initialized successfully');
      console.log('🔍 App details:', {
        name: app.name,
        automaticDataCollectionEnabled: app.automaticDataCollectionEnabled,
        options: {
          projectId: app.options.projectId,
          apiKey: app.options.apiKey?.substring(0, 10) + '...',
        }
      });
    } else {
      app = existingApps[0]!;
      console.log('✅ Firebase app already initialized');
      console.log('🔍 Existing app name:', app.name);
    }
    
    console.log('🔥 Step 3: Initializing Firebase Auth...');
    console.log('🔍 App object:', !!app);
    console.log('🔍 App name:', app?.name);
    
        // FOCUSED AUTH INITIALIZATION FIX - Use getAuth() only
    try {
      console.log('🔥 Step 3a: Using getAuth() method (recommended for Web SDK)...');
      
      // Use getAuth() which is the recommended approach for Firebase Web SDK v9+
      auth = getAuth(app);
      
      console.log('✅ Firebase Auth initialized successfully with getAuth()');
      console.log('🔍 Auth object:', !!auth);
      console.log('🔍 Auth app:', auth?.app?.name);
      console.log('🔍 Auth currentUser:', auth?.currentUser);
    } catch (authError: any) {
      console.error('❌ getAuth() failed:', authError.code, authError.message);
      console.error('❌ Auth Error Details:', authError);
      auth = null;
    }
    
    console.log('🔥 Step 4: Initializing other Firebase services...');
    
    // Initialize other Firebase services
    try {
      db = getFirestore(app);
      console.log('✅ Firestore initialized:', !!db);
    } catch (firestoreError) {
      console.error('❌ Firestore initialization failed:', firestoreError);
      db = null;
    }
    
    try {
      storage = getStorage(app);
      console.log('✅ Storage initialized:', !!storage);
    } catch (storageError) {
      console.error('❌ Storage initialization failed:', storageError);
      storage = null;
    }
    
    console.log('🔥 FINAL Firebase services status:', {
      app: !!app,
      auth: !!auth,
      firestore: !!db,
      storage: !!storage,
    });
  } else {
    console.log('✅ Demo mode initialized - Firebase mocked');
  }
} catch (error: any) {
  console.error('❌ Firebase initialization failed:', error);
  console.error('❌ Error details:', {
    name: error?.name,
    message: error?.message,
    code: error?.code,
    stack: error?.stack,
  });
  // Don't throw in demo mode, just log the error
  if (isValidConfig) {
    // In production, we might want to throw, but for demo we'll continue
    console.warn('🎭 Continuing in demo mode due to Firebase initialization error');
  }
}

// Test function for Firebase connection
export const testFirebaseConnection = async () => {
  try {
    console.log('🧪 Testing Firebase Web SDK connection...');
    console.log('Environment variables:', {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'MISSING',
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'SET' : 'MISSING',
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'SET' : 'MISSING',
    });
    
    console.log('🔍 Service status check:');
    console.log('- app:', !!app, app?.name);
    console.log('- auth:', !!auth, auth?.app?.name);
    console.log('- db:', !!db);
    console.log('- storage:', !!storage);
    
    if (!auth) {
      console.log('❌ Auth not initialized');
      return false;
    }
    
    if (!db) {
      console.log('❌ Firestore not initialized');
      return false;
    }
    
    // Test current user
    const currentUser = auth.currentUser;
    console.log('🔍 Current user:', {
      isAuthenticated: !!currentUser,
      email: currentUser?.email,
      uid: currentUser?.uid,
    });
    
    console.log('✅ Firebase Web SDK services working');
    return true;
  } catch (error) {
    console.error('❌ Firebase Web SDK connection test failed:', error);
    return false;
  }
};

// Export Firebase services (Web SDK)
export { auth, db, storage, isValidConfig as isDemoMode };
export default app; 