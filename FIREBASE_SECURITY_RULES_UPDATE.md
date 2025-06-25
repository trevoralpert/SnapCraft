# 🚨 URGENT: Firebase Security Rules Update Required

## Issue
The app is showing permission errors because the Firestore security rules need to be updated to allow posts access.

## Quick Fix (5 minutes)

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com
2. Select your project: `snapcraft-app-14ae7`
3. Go to **Firestore Database** in the left sidebar
4. Click **Rules** tab

### Step 2: Update Firestore Rules
Replace the existing rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Craft posts - authenticated users can read all, write their own
    match /craftPosts/{postId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == request.resource.data.userId);
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // User profiles (public read, own write)
    match /profiles/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Tool inventory - users can only access their own
    match /toolInventory/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Craft knowledge (read-only for authenticated users)
    match /craftKnowledge/{knowledgeId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin functions can write
    }
    
    // Skills and achievements
    match /userSkills/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Comments on craft posts
    match /craftPosts/{postId}/comments/{commentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == request.resource.data.authorId;
    }
    
    // Craft stories - authenticated users can read all active stories, write their own
    match /craftStories/{storyId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == request.resource.data.userId);
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Step 3: Update Storage Rules
1. Go to **Storage** in the left sidebar
2. Click **Rules** tab
3. Replace with this:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User profile images
    match /users/{userId}/profile/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 10 * 1024 * 1024  // Max 10MB
        && request.resource.contentType.matches('image/.*');
    }
    
    // Craft post media (images and videos)
    match /craftPosts/{userId}/{postId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 50 * 1024 * 1024  // Max 50MB
        && (request.resource.contentType.matches('image/.*') || 
            request.resource.contentType.matches('video/.*'));
    }
    
    // Tool images in user inventory
    match /tools/{userId}/{toolId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024   // Max 5MB
        && request.resource.contentType.matches('image/.*');
    }
    
    // Stories media (24-hour ephemeral content)
    match /stories/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 10 * 1024 * 1024  // Max 10MB for stories
        && (request.resource.contentType.matches('image/.*') || 
            request.resource.contentType.matches('video/.*'));
    }
    
    // Temporary upload folder (for processing)
    match /temp/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 100 * 1024 * 1024; // Max 100MB for video processing
    }
  }
}
```

### Step 4: Publish Rules
1. Click **Publish** for both Firestore and Storage rules
2. Wait for confirmation

## After Updating Rules

1. **Refresh your app** - the permission errors should be gone
2. **Test creating a post** - should work with real Firebase integration
3. **Test viewing feed** - should load real posts from Firestore

## What This Fixes

- ✅ Allows authenticated users to read all craft posts
- ✅ Allows users to create their own posts  
- ✅ Allows image uploads to Firebase Storage
- ✅ Maintains security (users can only edit their own content)

**Once you update the rules, we can continue with Stories implementation!** 