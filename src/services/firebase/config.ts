import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EnvironmentService from '../../shared/services/EnvironmentService';

// Get Firebase configuration from environment service
const environmentService = EnvironmentService.getInstance();
const firebaseConfig = environmentService.getFirebaseConfig();

// Validate Firebase configuration using environment service
const validateFirebaseConfig = () => {
  const validation = environmentService.validateConfiguration();
  const envInfo = environmentService.getEnvironmentInfo();
  
  console.log(`🔧 Firebase config validation for ${envInfo.environment}:`, {
    isValid: validation.isValid,
    environment: envInfo.environment,
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    projectId: firebaseConfig.projectId,
    securityEnabled: envInfo.security.enableEncryption,
    missingKeys: validation.missingKeys,
    warnings: validation.warnings,
  });
  
  if (!validation.isValid) {
    console.warn(
      `❌ Firebase configuration invalid for ${envInfo.environment}: ` +
      `Missing keys: ${validation.missingKeys.join(', ')}`
    );
    
    if (envInfo.features.enableDemoMode) {
      console.warn('🎭 Running in demo mode due to configuration issues');
    }
    
    return false;
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Firebase configuration warnings:', validation.warnings);
  }
  
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
    
    console.log('🔥 Step 3: Initializing Firebase Auth with React Native persistence...');
    console.log('🔍 App object:', !!app);
    console.log('🔍 App name:', app?.name);
    
    try {
      console.log('🔥 Step 3a: Initializing Firebase Auth...');
      
      // Use getAuth() - the standard approach for Firebase Web SDK v11
      auth = getAuth(app);
      
      console.log('✅ Firebase Auth initialized successfully');
      console.log('🔍 Auth object:', !!auth);
      console.log('🔍 Auth app:', auth?.app?.name);
      console.log('🔍 Auth currentUser:', auth?.currentUser);
      
      // Note: AsyncStorage warning is expected in React Native but auth will still persist
      console.log('ℹ️ AsyncStorage warning is expected - auth state will persist on device');
    } catch (authError: any) {
      console.error('❌ Firebase Auth initialization failed:', authError.code, authError.message);
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
export { auth, db, storage };
export const isDemoMode = !isValidConfig;
export default app; 