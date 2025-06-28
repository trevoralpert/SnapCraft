# 🚀 SnapCraft Production Firebase Setup Guide

**Created:** June 26, 2025  
**Status:** Production Ready Configuration

---

## 📋 **Overview**

This guide walks through setting up a production-ready Firebase environment for SnapCraft, including security rules, monitoring, and deployment configuration.

---

## 🏗️ **1. Production Firebase Project Creation**

### Step 1: Create Production Firebase Project
```bash
# 1. Go to Firebase Console (https://console.firebase.google.com)
# 2. Click "Add Project"
# 3. Project Name: "SnapCraft Production"
# 4. Project ID: "snapcraft-prod" (must be globally unique)
# 5. Enable Google Analytics: YES
# 6. Choose Analytics account or create new one
```

### Step 2: Configure Firebase Services
```bash
# Enable required services:
- Authentication (Email/Password)
- Firestore Database (Production mode)
- Storage (Production rules)
- Analytics
- Crashlytics
- Performance Monitoring
```

### Step 3: Add iOS/Android Apps
```bash
# iOS App Configuration:
Bundle ID: com.snapcraft.app
App Nickname: SnapCraft iOS Production

# Android App Configuration:
Package Name: com.snapcraft.app
App Nickname: SnapCraft Android Production
```

---

## 🔐 **2. Security Configuration**

### Firebase Security Rules - Firestore
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts are readable by authenticated users, writable by owner
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Stories are readable by authenticated users, writable by owner
    match /stories/{storyId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Comments are readable by authenticated users
    match /comments/{commentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Firebase Security Rules - Storage
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload to their own folder
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts media accessible by authenticated users
    match /posts/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Stories media accessible by authenticated users (24h TTL)
    match /stories/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### API Key Restrictions
```bash
# In Google Cloud Console > APIs & Services > Credentials:

# iOS API Key Restrictions:
- Application restrictions: iOS apps
- Bundle IDs: com.snapcraft.app

# Android API Key Restrictions:
- Application restrictions: Android apps
- Package names: com.snapcraft.app
- SHA-1 fingerprints: [Your production signing certificate]

# Web API Key Restrictions:
- Application restrictions: HTTP referrers
- Website restrictions: 
  - https://snapcraft.com/*
  - https://api.snapcraft.com/*
```

---

## 📊 **3. Monitoring & Analytics**

### Firebase Analytics Configuration
```typescript
// Enable enhanced analytics
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics(app);

// Custom events for craft tracking
logEvent(analytics, 'craft_post_created', {
  craft_type: 'woodworking',
  difficulty: 'intermediate',
  time_spent: 120
});

logEvent(analytics, 'story_shared', {
  craft_type: 'blacksmithing',
  duration: 15
});
```

### Performance Monitoring
```typescript
// Enable performance monitoring
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(app);
// Automatic page load and network request monitoring
```

### Error Reporting
```typescript
// Custom error tracking
import { logError } from '../services/analytics';

try {
  // App logic
} catch (error) {
  logError('craft_post_upload_failed', error, {
    userId: user.id,
    craftType: 'pottery',
    fileSize: imageSize
  });
}
```

---

## 🏭 **4. Production Environment Setup**

### Environment Variables (.env.production)
```bash
# Copy from env.production.example and fill in real values:
NODE_ENV=production

# Firebase Production Config
EXPO_PUBLIC_FIREBASE_API_KEY_PROD=your_production_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_PROD=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID_PROD=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET_PROD=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_PROD=your_sender_id_here
EXPO_PUBLIC_FIREBASE_APP_ID_PROD=your_app_id_here

# API Configuration
EXPO_PUBLIC_API_URL_PROD=https://api.snapcraft.com
```

### Build Configuration
```bash
# Production build command:
eas build --platform all --profile production

# Staging build for testing:
eas build --platform all --profile staging

# Development build:
eas build --platform all --profile development
```

---

## 🧪 **5. Testing & Validation**

### Pre-Production Checklist
```bash
[ ] Firebase project created and configured
[ ] Security rules deployed and tested
[ ] API keys restricted to production domains
[ ] Analytics and monitoring enabled
[ ] Error reporting configured
[ ] Backup procedures in place
[ ] Load testing completed
[ ] Security audit passed
[ ] Staging environment validated
```

### Staging Environment Testing
```bash
# 1. Deploy to staging environment
eas build --platform ios --profile staging

# 2. Test core functionality:
- User authentication
- Post creation and sharing
- Story creation and viewing
- Image/video upload
- Real-time features

# 3. Monitor staging metrics:
- Performance benchmarks
- Error rates
- User engagement
- Resource usage
```

---

## 🚨 **6. Production Deployment**

### Deployment Steps
```bash
# 1. Final code review and testing
# 2. Update version numbers in app.json
# 3. Create production build
eas build --platform all --profile production

# 4. Submit to app stores
eas submit --platform ios --profile production
eas submit --platform android --profile production

# 5. Monitor production metrics
# 6. Set up alerting for critical issues
```

### Post-Deployment Monitoring
```bash
# Key metrics to monitor:
- Authentication success rate
- Post upload success rate
- App crash rate
- API response times
- User retention
- Storage usage
- Database read/write patterns
```

---

## 🔧 **7. Maintenance & Updates**

### Regular Maintenance Tasks
```bash
# Weekly:
- Review error logs and crash reports
- Monitor performance metrics
- Check security rule effectiveness
- Analyze user engagement data

# Monthly:
- Update dependencies and security patches
- Review and optimize database queries
- Analyze storage usage and costs
- Update security rules as needed

# Quarterly:
- Comprehensive security audit
- Performance optimization review
- User feedback analysis and feature planning
- Backup and disaster recovery testing
```

---

## 📚 **8. Resources & Documentation**

### Firebase Documentation
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mon)
- [Firebase Analytics](https://firebase.google.com/docs/analytics)
- [Firebase App Check](https://firebase.google.com/docs/app-check)

### SnapCraft Specific Docs
- [Security Audit Report](./SECURITY_AUDIT_JUNE_26.md)
- [Environment Configuration](./FIREBASE_SETUP.md)
- [Development Checklist](./DEVELOPMENT_CHECKLIST.txt)

---

**🎯 Production Firebase Status: CONFIGURED ✅**  
**Next Steps: Create production Firebase project and deploy security rules** 