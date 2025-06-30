# 🔥 Firebase Setup for SnapCraft

## Step 1: Create Firebase Project

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Click "Create a project"**
3. **Enter project name**: `snapcraft-app` (or your preferred name)
4. **Enable Google Analytics** (recommended for craft engagement tracking)
5. **Wait for project creation**

## Step 2: Configure Firebase Services

### Authentication Setup
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication
3. Consider enabling **Google Sign-In** for better UX

### Firestore Database Setup
1. Go to **Firestore Database** → **Create database**
2. Choose **Start in production mode** (we'll configure rules later)
3. Select your preferred **location** (closest to your users)

### Storage Setup
1. Go to **Storage** → **Get started**
2. Use default security rules for now
3. Note: This will store craft images and videos

## Step 3: Get Configuration Keys

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Add app** → **Web** (</>) icon
4. Enter app nickname: `SnapCraft Web`
5. **Don't** check "Also set up Firebase Hosting"
6. Click **Register app**
7. **Copy the configuration object**

## Step 4: Environment Variables

Create a `.env` file in your project root with:

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# OpenAI for RAG (optional for basic testing)
OPENAI_API_KEY=your-openai-key-here

# Pinecone for Vector Search (optional for basic testing)
PINECONE_API_KEY=your-pinecone-key-here
```

## Step 5: Security Rules

### Firestore Rules
Go to **Firestore Database** → **Rules** and update:

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
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Public craft knowledge (for RAG)
    match /craftKnowledge/{knowledgeId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins via backend functions
    }
  }
}
```

### Storage Rules
Go to **Storage** → **Rules** and update:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User profile images
    match /users/{userId}/profile/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Craft post media
    match /craftPosts/{userId}/{postId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 6: Testing the Integration

1. **Start your development server**:
   ```bash
   npm start
   ```

2. **Navigate to "Auth Demo" tab**

3. **Try creating an account**:
   - Use a test email like `test@snapcraft.app`
   - Use a strong password
   - Enter a display name

4. **Check Firebase Console**:
   - **Authentication** → **Users** (should see new user)
   - **Firestore Database** → **Data** (should see user document)

## Step 7: Mobile Testing

### iOS Simulator
```bash
npm run ios
```

### Real Device (Recommended)
1. Install **Expo Go** app on your phone
2. Scan QR code from development server
3. Test authentication on actual device

## Troubleshooting

### Common Issues

**"Firebase not initialized"**
- Check that all environment variables are set
- Ensure `.env` file is in project root
- Restart development server after adding variables

**"Auth domain not authorized"**
- Go to Firebase Console → Authentication → Settings
- Add your domains to authorized domains
- For Expo: add `exp.direct` and your tunnel URL

**"Permission denied"**
- Check Firestore security rules
- Ensure user is authenticated before accessing data
- Review console errors for specific rule violations

### Environment Check

The app will show a "Demo Mode" message if Firebase isn't configured. Check the console for detailed error messages.

## Next Steps

Once Firebase is working:

1. **Set up Cloud Functions** for RAG processing
2. **Configure OpenAI integration** for craft knowledge
3. **Add Pinecone** for vector search
4. **Implement image upload** for craft documentation
5. **Add real-time features** with Firestore listeners

## 📱 Mobile Development Notes

- **EXPO_PUBLIC_** prefix is required for Expo environment variables
- Variables are embedded in the app bundle (don't put secrets here)
- Use Expo SecureStore for sensitive data storage
- Test on real devices early and often
- Firebase works great with Expo's managed workflow

Happy crafting! 🔨⚒️🪵 