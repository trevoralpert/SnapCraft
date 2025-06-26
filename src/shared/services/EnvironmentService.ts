import Constants from 'expo-constants';

export type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  name: Environment;
  displayName: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  features: {
    enableLogging: boolean;
    enableAnalytics: boolean;
    enableCrashReporting: boolean;
    enableRAGFeatures: boolean;
    enableDemoMode: boolean;
  };
  security: {
    enableEncryption: boolean;
    requireSecureStore: boolean;
    enableAPIKeyValidation: boolean;
    enableCertificatePinning: boolean;
  };
}

class EnvironmentService {
  private static instance: EnvironmentService;
  private currentEnvironment: Environment;
  private config: EnvironmentConfig;

  private constructor() {
    this.currentEnvironment = this.detectEnvironment();
    this.config = this.getEnvironmentConfig(this.currentEnvironment);
  }

  public static getInstance(): EnvironmentService {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService();
    }
    return EnvironmentService.instance;
  }

  /**
   * Detect current environment based on various factors
   */
  private detectEnvironment(): Environment {
    // Check explicit environment variable first
    const envVar = process.env.NODE_ENV as string;
    if (envVar === 'production') return 'production';
    if (envVar === 'staging') return 'staging';
    if (envVar === 'development') return 'development';

    // Check if running in Expo Go (development)
    if (Constants.appOwnership === 'expo') {
      return 'development';
    }

    // Check if this is a development build
    if (__DEV__) {
      return 'development';
    }

    // Check release channel (for Expo Updates)
    const releaseChannel = Constants.expoConfig?.extra?.releaseChannel;
    if (releaseChannel === 'production') return 'production';
    if (releaseChannel === 'staging') return 'staging';

    // Check bundle identifier for production builds
    const bundleId = Constants.expoConfig?.ios?.bundleIdentifier || 
                     Constants.expoConfig?.android?.package;
    if (bundleId?.includes('.prod')) return 'production';
    if (bundleId?.includes('.staging')) return 'staging';

    // Default to development
    return 'development';
  }

  /**
   * Get configuration for specific environment
   */
  private getEnvironmentConfig(env: Environment): EnvironmentConfig {
    const baseConfig = {
      development: {
        name: 'development' as Environment,
        displayName: 'Development',
        firebase: {
          apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY_DEV || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
          authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_DEV || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
          projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID_DEV || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
          storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET_DEV || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
          messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_DEV || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
          appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID_DEV || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
        },
        api: {
          baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
          timeout: 10000,
          retryAttempts: 3,
        },
        features: {
          enableLogging: true,
          enableAnalytics: false,
          enableCrashReporting: false,
          enableRAGFeatures: true,
          enableDemoMode: true,
        },
        security: {
          enableEncryption: true,
          requireSecureStore: false,
          enableAPIKeyValidation: false,
          enableCertificatePinning: false,
        },
      },
      staging: {
        name: 'staging' as Environment,
        displayName: 'Staging',
        firebase: {
          apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY_STAGING || '',
          authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_STAGING || '',
          projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID_STAGING || '',
          storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET_STAGING || '',
          messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_STAGING || '',
          appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID_STAGING || '',
        },
        api: {
          baseUrl: process.env.EXPO_PUBLIC_API_URL_STAGING || 'https://staging-api.snapcraft.com',
          timeout: 15000,
          retryAttempts: 2,
        },
        features: {
          enableLogging: true,
          enableAnalytics: true,
          enableCrashReporting: true,
          enableRAGFeatures: true,
          enableDemoMode: false,
        },
        security: {
          enableEncryption: true,
          requireSecureStore: true,
          enableAPIKeyValidation: true,
          enableCertificatePinning: false,
        },
      },
      production: {
        name: 'production' as Environment,
        displayName: 'Production',
        firebase: {
          apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY_PROD || '',
          authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_PROD || '',
          projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID_PROD || '',
          storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET_PROD || '',
          messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_PROD || '',
          appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID_PROD || '',
        },
        api: {
          baseUrl: process.env.EXPO_PUBLIC_API_URL_PROD || 'https://api.snapcraft.com',
          timeout: 20000,
          retryAttempts: 1,
        },
        features: {
          enableLogging: false,
          enableAnalytics: true,
          enableCrashReporting: true,
          enableRAGFeatures: true,
          enableDemoMode: false,
        },
        security: {
          enableEncryption: true,
          requireSecureStore: true,
          enableAPIKeyValidation: true,
          enableCertificatePinning: true,
        },
      },
    };

    return baseConfig[env];
  }

  /**
   * Get current environment
   */
  getEnvironment(): Environment {
    return this.currentEnvironment;
  }

  /**
   * Get current configuration
   */
  getConfig(): EnvironmentConfig {
    return this.config;
  }

  /**
   * Get Firebase configuration for current environment
   */
  getFirebaseConfig() {
    return this.config.firebase;
  }

  /**
   * Get API configuration for current environment
   */
  getAPIConfig() {
    return this.config.api;
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    return this.config.features[feature];
  }

  /**
   * Check if a security feature is enabled
   */
  isSecurityFeatureEnabled(feature: keyof EnvironmentConfig['security']): boolean {
    return this.config.security[feature];
  }

  /**
   * Validate current environment configuration
   */
  validateConfiguration(): {
    isValid: boolean;
    missingKeys: string[];
    warnings: string[];
  } {
    const missingKeys: string[] = [];
    const warnings: string[] = [];

    // Check Firebase configuration
    const firebaseKeys = [
      'apiKey', 'authDomain', 'projectId', 
      'storageBucket', 'messagingSenderId', 'appId'
    ];

    firebaseKeys.forEach(key => {
      const value = this.config.firebase[key as keyof typeof this.config.firebase];
      if (!value || value.includes('your-') || value.includes('demo-')) {
        missingKeys.push(`firebase.${key}`);
      }
    });

    // Check API configuration
    if (!this.config.api.baseUrl) {
      missingKeys.push('api.baseUrl');
    }

    // Environment-specific warnings
    if (this.currentEnvironment === 'production') {
      if (this.config.features.enableLogging) {
        warnings.push('Logging is enabled in production');
      }
      if (this.config.features.enableDemoMode) {
        warnings.push('Demo mode is enabled in production');
      }
      if (!this.config.security.enableEncryption) {
        warnings.push('Encryption is disabled in production');
      }
    }

    if (this.currentEnvironment === 'development') {
      if (!this.config.features.enableLogging) {
        warnings.push('Logging is disabled in development');
      }
    }

    return {
      isValid: missingKeys.length === 0,
      missingKeys,
      warnings,
    };
  }

  /**
   * Get environment info for debugging
   */
  getEnvironmentInfo() {
    const validation = this.validateConfiguration();
    
    return {
      environment: this.currentEnvironment,
      displayName: this.config.displayName,
      isValid: validation.isValid,
      features: this.config.features,
      security: this.config.security,
      validation,
      debugInfo: {
        appOwnership: Constants.appOwnership,
        isDev: __DEV__,
        releaseChannel: Constants.expoConfig?.extra?.releaseChannel,
        bundleId: Constants.expoConfig?.ios?.bundleIdentifier || 
                  Constants.expoConfig?.android?.package,
      },
    };
  }

  /**
   * Force environment for testing
   */
  setEnvironment(env: Environment) {
    console.warn(`🔧 Forcing environment to: ${env}`);
    this.currentEnvironment = env;
    this.config = this.getEnvironmentConfig(env);
  }
}

export default EnvironmentService; 