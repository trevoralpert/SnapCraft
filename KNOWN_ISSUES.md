# 🚨 KNOWN ISSUES - SnapCraft MVP

## Issue #1: Firebase Firestore Permission Denied (PRIORITY: HIGH)

**Status**: UNRESOLVED - Needs attention before final deployment
**Discovered**: June 24, 2025 - 6:08 PM
**Time Remaining**: 2 hours 52 minutes until 9 PM deadline

### Problem Description
- Firestore security rules are correctly configured in Firebase Console
- App still receiving `FirebaseError: [code=permission-denied]: Missing or insufficient permissions`
- Error occurs when trying to fetch posts from `craftPosts` collection
- App gracefully falls back to mock data, so functionality is preserved

### Error Details
```
Error loading posts: Error: Failed to fetch posts: 
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

### What We've Tried
1. ✅ Updated Firestore security rules in Firebase Console
2. ✅ Updated Storage security rules in Firebase Console  
3. ✅ Changed collection name from `posts` to `craftPosts` in code
4. ✅ Updated storage paths to match security rules
5. ✅ Confirmed rules are published in Firebase Console

### Current Workaround
- App falls back to mock data when Firebase fails
- All UI functionality works normally
- Users can still interact with the app

### Possible Causes
1. **Rules Propagation Delay**: Firebase rules can take 5-10 minutes to propagate globally
2. **Authentication Context**: User authentication state might not be properly passed to Firestore queries
3. **Collection Structure**: Mismatch between expected document structure and security rules
4. **Environment Variables**: Firebase config might have stale cached values

### Next Steps (POST-MVP)
1. **Wait for propagation**: Check if issue resolves after 10-15 minutes
2. **Debug authentication**: Verify user auth token is being sent with Firestore requests
3. **Test in Firebase Console**: Use Firestore simulator to test rules with actual user token
4. **Check network logs**: Inspect actual HTTP requests being sent to Firestore
5. **Verify project settings**: Ensure correct Firebase project is being used

### Impact on MVP
- **LOW IMMEDIATE IMPACT**: App functions normally with mock data
- **HIGH FUTURE IMPACT**: Real user-generated content won't persist
- **DEMO IMPACT**: Can demonstrate all features, but posts won't save

### Files Affected
- `src/services/firebase/posts.ts` - Firestore operations
- `src/features/craft-feed/CraftFeedScreen.tsx` - Error handling and fallback
- `FIREBASE_SECURITY_RULES_UPDATE.md` - Security rules documentation

---

## Development Notes
- Proceeding with Stories implementation while this resolves
- All new features will include similar fallback mechanisms
- Firebase integration code is ready and should work once permissions resolve

**REMINDER**: Test Firebase connectivity again before final demo at 9 PM 