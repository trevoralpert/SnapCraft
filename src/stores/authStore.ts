import { create } from 'zustand';
import { User } from '../shared/types';
import { AuthService } from '../services/firebase/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetError: () => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Actions
  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      error: null,
    });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    set({ error, isLoading: false });
  },

  resetError: () => {
    set({ error: null });
  },

  clearError: () => {
    set({ error: null });
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Use real Firebase authentication
      const authUser = await AuthService.signIn(email, password);
      const userData = await AuthService.getUserData(authUser.uid);
      
      set({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('SignIn error in store:', error);
      set({
        error: error.message || 'Sign in failed',
        isLoading: false,
      });
      throw error;
    }
  },

  signUp: async (email: string, password: string, displayName: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Use real Firebase authentication
      const authUser = await AuthService.signUp(email, password, displayName);
      const userData = await AuthService.getUserData(authUser.uid);
      
      set({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('SignUp error in store:', error);
      set({
        error: error.message || 'Sign up failed',
        isLoading: false,
      });
      throw error;
    }
  },



  logout: async () => {
    try {
      set({ isLoading: true });
      
      // Use real Firebase sign out
      await AuthService.signOut();
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Logout failed',
        isLoading: false,
      });
    }
  },
})); 