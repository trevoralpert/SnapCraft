import { create } from 'zustand';
import { User } from '../shared/types';

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetError: () => void;
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

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // TODO: Implement Firebase authentication
      // This is a placeholder for now
      console.log('Login attempt:', { email });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, create a mock user
      const mockUser: User = {
        id: '1',
        email,
        displayName: email.split('@')[0],
        craftSpecialization: ['woodworking'],
        skillLevel: 'novice',
        toolInventory: [],
        joinedAt: new Date(),
      };
      
      set({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      
      // TODO: Implement Firebase sign out
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Logout failed',
        isLoading: false,
      });
    }
  },
})); 