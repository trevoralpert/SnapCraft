import { create } from 'zustand';
import { User } from '../shared/types';
import { AuthService } from '../services/firebase/auth';
import { isDemoMode } from '../services/firebase/config';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  signIn: async (email: string, password: string) => {
    if (isDemoMode) {
      // Demo mode - create mock user
      set({ isLoading: true, error: null });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      const mockUser: User = {
        id: 'demo-user-123',
        email: email,
        displayName: 'Demo Crafter',
        craftSpecialization: ['woodworking', 'blacksmithing'],
        skillLevel: 'journeyman',
        bio: 'Demo user for testing SnapCraft features',
        location: 'Demo Workshop',
        joinedAt: new Date(),
        toolInventory: [],
      };
      set({ user: mockUser, isLoading: false });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const authUser = await AuthService.signIn(email, password);
      const userData = await AuthService.getUserData(authUser.uid);
      if (userData) {
        set({ user: userData, isLoading: false });
      } else {
        throw new Error('User data not found');
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string, displayName: string) => {
    if (isDemoMode) {
      // Demo mode - create mock user
      set({ isLoading: true, error: null });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      const mockUser: User = {
        id: 'demo-user-456',
        email: email,
        displayName: displayName,
        craftSpecialization: [],
        skillLevel: 'novice',
        bio: '',
        location: '',
        joinedAt: new Date(),
        toolInventory: [],
      };
      set({ user: mockUser, isLoading: false });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const authUser = await AuthService.signUp(email, password, displayName);
      const userData = await AuthService.getUserData(authUser.uid);
      if (userData) {
        set({ user: userData, isLoading: false });
      } else {
        throw new Error('User data not found after signup');
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    if (isDemoMode) {
      set({ user: null });
      return;
    }

    try {
      await AuthService.signOut();
      set({ user: null, error: null });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  initializeAuth: async () => {
    if (isDemoMode) {
      console.log('🎭 Auth initialized in demo mode');
      return;
    }

    try {
      // Set up Firebase auth state listener
      AuthService.onAuthStateChanged((user) => {
        set({ user });
      });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ user: null });
    }
  },
})); 