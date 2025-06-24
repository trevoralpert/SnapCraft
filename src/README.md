# SnapCraft Project Structure

## Overview
SnapCraft is a RAG-enhanced social platform for craftsmen and artisans, combining traditional craft knowledge with modern mobile technology.

## Architecture

### 📁 Features (Domain-based organization)
- **`auth/`** - User authentication & onboarding
- **`craft-feed/`** - Main social feed with craft posts
- **`camera/`** - Photo/video capture for craft documentation
- **`knowledge/`** - RAG-powered craft knowledge base
- **`profile/`** - User profiles with skill progression
- **`tools/`** - Tool inventory management

### 🔧 Services (External integrations)
- **`firebase/`** - Database, auth, storage configuration
- **`api/`** - API calls and data fetching
- **`rag/`** - OpenAI integration for craft knowledge

### 🔄 Shared (Reusable across features)
- **`components/`** - Common UI components
- **`hooks/`** - Custom React hooks
- **`types/`** - TypeScript interfaces
- **`utils/`** - Helper functions

### 📊 Stores (State management)
- **`authStore.ts`** - User authentication state
- Future stores for craft posts, tools, knowledge, etc.

## Tech Stack

### Core
- **React Native** with **Expo 53.0.0**
- **TypeScript** with strict mode
- **Firebase** (Auth, Firestore, Storage)

### State Management
- **Zustand** - Global state management
- **React Query** - Server state and caching

### AI/RAG
- **OpenAI GPT-4** - Content generation
- **Pinecone** - Vector database (planned)

### Media
- **Expo Camera** - Photo/video capture
- **Expo AV** - Video processing
- **Expo Image** - Optimized image handling

## Key Types

### User Management
```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  craftSpecialization: CraftSpecialization[];
  skillLevel: SkillLevel;
  toolInventory: Tool[];
  // ... more fields
}
```

### Craft Content
```typescript
interface CraftPost {
  id: string;
  userId: string;
  content: {
    description: string;
    images: string[];
    materials: string[];
    difficulty: DifficultyLevel;
  };
  craftType: CraftSpecialization;
  isEphemeral: boolean;
  // ... more fields
}
```

### Tools & Skills
```typescript
interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  condition: ToolCondition;
  // ... more fields
}
```

## Development Status

### ✅ Completed
- Project initialization with Expo
- Dependencies installation
- Folder structure setup
- Core TypeScript types
- Firebase configuration structure
- Authentication store (Zustand)
- Craft-themed UI components

### 🚧 Next Steps
1. Firebase project setup and environment variables
2. Authentication flow implementation
3. Camera functionality for craft documentation
4. RAG integration with OpenAI
5. Craft feed UI and functionality
6. Tool inventory management
7. User profile and skill tracking

## Environment Setup

Required environment variables (see `.env.example`):
```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
OPENAI_API_KEY=
PINECONE_API_KEY=
```

## Craft Specializations Supported
- Woodworking
- Metalworking/Blacksmithing
- Leathercraft
- Pottery
- Weaving
- Bushcraft
- Stonemasonry
- Glassblowing
- Jewelry making
- General crafts 