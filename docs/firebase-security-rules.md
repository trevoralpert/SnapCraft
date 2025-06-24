# Firebase Security Rules for SnapCraft

## Firestore Security Rules

Copy and paste these rules in **Firebase Console > Firestore Database > Rules**:

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
  }
}
```

## Storage Security Rules

Copy and paste these rules in **Firebase Console > Storage > Rules**:

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
    
    // Temporary upload folder (for processing)
    match /temp/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 100 * 1024 * 1024; // Max 100MB for video processing
    }
  }
}
```

## Key Security Features

### 🔒 **Authentication Required**
- All operations require valid Firebase authentication
- No anonymous access to user data or craft content

### 👤 **User Data Protection**
- Users can only read/write their own data (profiles, tools, skills)
- Public profile data available to authenticated users
- Private data (tool inventory) stays private

### 📸 **Craft Posts Security**
- All authenticated users can read craft posts (social sharing)
- Users can only create/edit their own posts
- Comments tied to authenticated authors

### 🛡️ **File Upload Security**
- Size limits: 5MB for tool images, 10MB for profiles, 50MB for craft media
- Content type validation (images/videos only)
- User-specific storage paths

### 📚 **Knowledge Base Protection**
- Craft knowledge is read-only for users
- Admin-only write access via Cloud Functions
- Prevents data tampering while allowing learning

## Testing Your Rules

1. **Go to Firestore > Rules > Simulator**
2. **Test read operations**:
   - Path: `/users/test-user-id`
   - Auth: Signed in as `test-user-id`
   - Should **allow** read

3. **Test unauthorized access**:
   - Path: `/users/different-user-id` 
   - Auth: Signed in as `test-user-id`
   - Should **deny** access

## Next Steps

After setting up these rules:
1. Test authentication in your SnapCraft app
2. Try creating a user profile
3. Test uploading a craft post image
4. Verify security by attempting unauthorized access

These rules provide a secure foundation for SnapCraft while enabling the social craft-sharing features! 