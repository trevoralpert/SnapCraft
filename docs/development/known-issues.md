# 🚨 KNOWN ISSUES - SnapCraft MVP

## Issue #1: Firebase Storage Permission Denied (PRIORITY: HIGH)

**Status**: MAJOR PROGRESS - Authentication FIXED, Storage Rules Need Update
**Discovered**: June 24, 2025 - 6:08 PM  
**Updated**: June 25, 2025 - 4:00 PM

### 🎉 BREAKTHROUGH: What's Now Working!
- ✅ **Authentication State Persistence**: Users stay logged in between sessions
- ✅ **Profile Management**: Profile screen shows real user data 
- ✅ **Firestore Database Access**: Posts save and load from Firebase successfully
- ✅ **Post Creation**: Posts without images work perfectly
- ✅ **Real-time Data**: Feed shows actual Firebase data, not mock data

### ❌ Remaining Issue: Firebase Storage Permissions
- **SPECIFIC PROBLEM**: Image and video uploads fail with permission errors
- **ROOT CAUSE**: Firebase Storage security rules are too restrictive
- **IMPACT**: Stories with photos and posts with images cannot upload media

### Error Details (Storage Only)
```
Firebase Storage: User does not have permission to access 'stories/gRiUWvFO3dMk5lzqMvvSPQTl5z82/1750880955729.jpg'. (storage/unauthorized)

Firebase Storage: User does not have permission to access 'craftPosts/gRiUWvFO3dMk5lzqMvvSPQTl5z82/post_1750881456990/image_1750881456991_0.jpg'. (storage/unauthorized)
```

### Evidence of Success
```
✅ Firebase Auth initialized successfully
✅ User data retrieved: {"email": "test@snapcraft.com", "id": "gRiUWvFO3dMk5lzqMvvSPQTl5z82"}
✅ Post created successfully: aoLFB9b5lnI02AS03tau
✅ Retrieved 3 posts from Firestore
✅ Firestore access successful: 1
```

### IMMEDIATE SOLUTION REQUIRED
**Update Firebase Storage Rules** - See FIREBASE_SECURITY_RULES_UPDATE.md for exact rules to copy/paste

### Current Status Summary
- 🟢 **Authentication**: WORKING 
- 🟢 **Database (Firestore)**: WORKING
- 🔴 **Storage (Files)**: BLOCKED by security rules
- 🟢 **UI/UX**: WORKING perfectly

---

## Issue #2: Firestore Database Index Missing (PRIORITY: MEDIUM)

**Status**: IDENTIFIED - Requires Firebase Console configuration  
**Error**: `The query requires an index for stories collection`

### Problem Description
- Firestore queries for stories require composite indexes
- Error provides direct link to create index: https://console.firebase.google.com/v1/r/project/snapcraft-app-14ae7/firestore/indexes?create_composite=...
- This is normal for complex queries with multiple sort fields

### Solution
1. Click the index creation link from the error message
2. Click "Create Index" in Firebase Console  
3. Wait 2-3 minutes for index to build
4. Stories will then load properly

---

## Issue #3: Story Creation Interface Consolidation (PRIORITY: LOW)

**Status**: DESIGN IMPROVEMENT NEEDED

### Problem Description
- Two different story creation paths exist:
  1. ✅ Plus button next to "Craft Feed" (WORKING)
  2. ❌ "Your Story" dotted circle with camera (FAILING due to storage)
- Both should create the same type of content but use different interfaces

### Solution Options
1. **Quick Fix**: Disable camera story creation until storage rules are fixed
2. **Better Fix**: Consolidate both interfaces to use the same backend logic
3. **Best Fix**: Make camera stories work by fixing storage permissions

---

## Development Notes
- **MAJOR WIN**: Authentication and database access are now fully working!
- **NEXT STEP**: Update Firebase Storage rules to enable image/video uploads
- **DEMO READY**: App is fully functional for demonstration purposes
- All core features work - just need to enable media uploads 