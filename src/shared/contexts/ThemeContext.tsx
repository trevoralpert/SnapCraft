import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Brand colors (craft-themed)
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Accent colors
  accent: string;
  success: string;
  warning: string;
  error: string;
  
  // Border and divider colors
  border: string;
  divider: string;
  
  // Interactive colors
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  
  // Craft-specific colors
  wood: string;
  leather: string;
  metal: string;
  stone: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
}

// Craft-themed Light Mode Colors
const lightTheme: Theme = {
  mode: 'light',
  colors: {
    // Background colors
    background: '#F5F5DC', // Beige - warm, natural
    surface: '#FFFFFF',
    card: '#FEFEFE',
    
    // Text colors
    text: '#2C1810', // Dark brown
    textSecondary: '#5D4E37', // Medium brown
    textTertiary: '#8B7355', // Light brown
    
    // Brand colors (craft-themed)
    primary: '#8B4513', // Saddle brown - main craft color
    primaryLight: '#A0522D', // Sienna
    primaryDark: '#654321', // Dark brown
    
    // Accent colors
    accent: '#CD853F', // Peru - warm accent
    success: '#228B22', // Forest green
    warning: '#DAA520', // Goldenrod
    error: '#B22222', // Fire brick
    
    // Border and divider colors
    border: '#E0E0E0',
    divider: '#F0F0F0',
    
    // Interactive colors
    tint: '#8B4513',
    tabIconDefault: '#8B7355',
    tabIconSelected: '#8B4513',
    
    // Craft-specific colors
    wood: '#DEB887', // Burlywood
    leather: '#8B4513', // Saddle brown
    metal: '#708090', // Slate gray
    stone: '#A9A9A9', // Dark gray
  },
};

// Craft-themed Dark Mode Colors
const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    // Background colors
    background: '#1C1611', // Very dark brown
    surface: '#2C2419', // Dark brown surface
    card: '#3C3429', // Medium dark brown
    
    // Text colors
    text: '#F5F5DC', // Beige text on dark
    textSecondary: '#D2B48C', // Tan
    textTertiary: '#BC9A6A', // Darker tan
    
    // Brand colors (craft-themed)
    primary: '#CD853F', // Peru - lighter for dark mode
    primaryLight: '#DAA520', // Goldenrod
    primaryDark: '#8B4513', // Saddle brown
    
    // Accent colors
    accent: '#F4A460', // Sandy brown
    success: '#32CD32', // Lime green
    warning: '#FFD700', // Gold
    error: '#FF6347', // Tomato
    
    // Border and divider colors
    border: '#4A4A4A',
    divider: '#3A3A3A',
    
    // Interactive colors
    tint: '#CD853F',
    tabIconDefault: '#BC9A6A',
    tabIconSelected: '#CD853F',
    
    // Craft-specific colors
    wood: '#8B4513', // Saddle brown
    leather: '#A0522D', // Sienna
    metal: '#778899', // Light slate gray
    stone: '#696969', // Dim gray
  },
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@snapcraft_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const deviceColorScheme = useDeviceColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  
  // Determine the actual theme based on mode and device preference
  const getEffectiveTheme = (mode: ThemeMode): Theme => {
    if (mode === 'system') {
      return deviceColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return mode === 'dark' ? darkTheme : lightTheme;
  };
  
  const [theme, setTheme] = useState<Theme>(getEffectiveTheme(themeMode));
  const isDark = theme.mode === 'dark';
  
  // Load saved theme mode on app start
  useEffect(() => {
    loadThemeMode();
  }, []);
  
  // Update theme when mode or device preference changes
  useEffect(() => {
    setTheme(getEffectiveTheme(themeMode));
  }, [themeMode, deviceColorScheme]);
  
  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme mode:', error);
    }
  };
  
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };
  
  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };
  
  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    toggleTheme,
    setThemeMode,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Utility function to get themed styles
export function createThemedStyles<T extends Record<string, any>>(
  styleCreator: (theme: Theme) => T
) {
  return (theme: Theme): T => styleCreator(theme);
} 