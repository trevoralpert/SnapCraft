# 🚀 Vercel Deployment Guide for SnapCraft

**Platform:** Vercel (Web Deployment)  
**Backend:** Firebase (Database, Auth, Storage)  
**Status:** Production Ready

---

## 📋 **Overview**

SnapCraft uses a **hybrid deployment approach**:
- **Frontend/Web App**: Deployed on **Vercel** for fast global CDN and automatic deployments
- **Backend Services**: **Firebase** for authentication, database, and file storage
- **AI Services**: OpenAI and Pinecone APIs for RAG functionality

This setup provides the best of both worlds: Vercel's excellent React/Next.js hosting with Firebase's robust backend services.

---

## 🌐 **Step 1: Vercel Deployment Setup**

### Connect Repository to Vercel
1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "Add New..." → "Project"**
3. **Connect your Git repository** (GitHub/GitLab/Bitbucket)
4. **Select your SnapCraft repository**
5. **Vercel will auto-detect** it's an Expo/React Native web project

### Configure Build Settings
```bash
# Vercel will automatically detect these settings:
Framework Preset: Other
Build Command: npx expo export -p web
Output Directory: dist
Install Command: npm install
```

### Environment Variables in Vercel
In your Vercel project settings, add these environment variables:

```bash
# Firebase Configuration (Backend Services)
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# AI Services (Optional for basic functionality)
OPENAI_API_KEY=your-openai-key-here
PINECONE_API_KEY=your-pinecone-key-here

# Production Environment
NODE_ENV=production
```

---

## 🔄 **Step 2: Automatic Deployments**

### Git Integration Benefits
- **Automatic Deployments**: Every push to `main` branch triggers new deployment
- **Same URL**: Your deployment URL stays consistent (e.g., `snapcraft.vercel.app`)
- **Preview Deployments**: Feature branches get unique preview URLs
- **Instant Updates**: Changes go live within 2-3 minutes of pushing code

### Deployment Workflow
```bash
# Your development workflow:
1. Make changes locally
2. Test with: npm start
3. Commit changes: git add . && git commit -m "Feature update"
4. Push to GitHub: git push origin main
5. Vercel automatically deploys to production URL
```

### Branch Previews
```bash
# Feature development workflow:
1. Create feature branch: git checkout -b new-feature
2. Make changes and commit
3. Push branch: git push origin new-feature
4. Vercel creates preview URL: snapcraft-git-new-feature.vercel.app
5. Merge to main when ready for production
```

---

## 🔥 **Step 3: Firebase Backend Configuration**

### Firebase Services (Backend Only)
Your Firebase project provides backend services:
- ✅ **Authentication**: User login/signup
- ✅ **Firestore Database**: User data, posts, stories
- ✅ **Cloud Storage**: Images and videos
- ✅ **Security Rules**: Data access control
- ❌ **Firebase Hosting**: Not used (Vercel handles hosting)

### Firebase Security Rules
Ensure your Firebase security rules are deployed:

1. **Go to Firebase Console** → Your Project
2. **Firestore Database** → **Rules** → Deploy rules from `firestore.rules`
3. **Storage** → **Rules** → Deploy rules from `storage.rules`

---

## 🌍 **Step 4: Domain Configuration (Optional)**

### Custom Domain Setup
If you want a custom domain like `snapcraft.com`:

1. **In Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. **Add your domain** (e.g., `snapcraft.com`)
3. **Configure DNS** with your domain provider:
   ```
   Type: CNAME
   Name: www
   Value: snapcraft.vercel.app
   ```
4. **Vercel handles SSL** certificates automatically

---

## 📊 **Step 5: Production Monitoring**

### Vercel Analytics
- **Built-in Analytics**: Page views, performance metrics
- **Real User Monitoring**: Core Web Vitals tracking
- **Function Logs**: Serverless function monitoring

### Firebase Analytics
- **User Engagement**: Craft posting, story views
- **Custom Events**: Tool usage, skill progression
- **Crash Reporting**: Error tracking and debugging

---

## 🚀 **Step 6: Deployment Verification**

### Test Production Deployment
1. **Visit your Vercel URL** (e.g., `snapcraft.vercel.app`)
2. **Test Authentication**: Sign up/login functionality
3. **Test Firebase Integration**: Create posts, upload images
4. **Test AI Features**: Photo analysis, tool identification
5. **Test Mobile Responsiveness**: Check on various screen sizes

### Performance Checks
```bash
# Vercel provides built-in performance monitoring:
- Lighthouse scores
- Core Web Vitals
- Bundle analysis
- Edge caching effectiveness
```

---

## 🔧 **Troubleshooting**

### Common Issues

**"Build Failed" on Vercel**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

**"Firebase not initialized"**
- Verify all `EXPO_PUBLIC_FIREBASE_*` variables are set in Vercel
- Check Firebase project configuration
- Ensure Firebase security rules allow web access

**"Images not loading"**
- Check Firebase Storage security rules
- Verify CORS configuration in Firebase Storage
- Ensure proper authentication before accessing media

### Environment Debugging
```typescript
// Add to your app to debug environment:
console.log('Environment:', process.env.NODE_ENV);
console.log('Firebase Config:', {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '❌ Missing'
});
```

---

## 🎯 **Best Practices**

### Deployment Strategy
- **Main Branch**: Always production-ready code
- **Feature Branches**: Use for development and testing
- **Environment Variables**: Never commit secrets to git
- **Testing**: Test preview deployments before merging

### Performance Optimization
- **Image Optimization**: Use Expo Image for automatic optimization
- **Bundle Splitting**: Leverage Vercel's automatic code splitting
- **Caching**: Utilize Vercel's edge caching for static assets
- **Firebase Optimization**: Use Firestore compound queries efficiently

---

## 📱 **Mobile App Deployment**

This guide covers **web deployment only**. For mobile app deployment:

- **iOS**: Use Expo EAS Build → App Store Connect
- **Android**: Use Expo EAS Build → Google Play Console
- **Same Codebase**: Your Vercel web deployment and mobile apps share the same Firebase backend

---

## 🎉 **Success!**

Your SnapCraft app is now deployed on Vercel with:
- ✅ Automatic deployments from Git
- ✅ Global CDN for fast loading
- ✅ Firebase backend integration
- ✅ Production-ready performance
- ✅ SSL certificates and security

**Your app is live and ready for users!** 🔨⚒️🪵 