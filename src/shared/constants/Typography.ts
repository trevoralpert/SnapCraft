// Task 3.3: Visual Hierarchy Improvements - Typography System
import { Platform } from 'react-native';

// Font families (craft-themed)
export const FONT_FAMILIES = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
  // Craft-specific display font (if available)
  display: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),
} as const;

// Typography scale (craft-themed hierarchy)
export const FONT_SIZES = {
  // Display sizes (hero content)
  display1: 48,
  display2: 40,
  display3: 32,
  
  // Heading sizes
  h1: 28,
  h2: 24,
  h3: 20,
  h4: 18,
  h5: 16,
  h6: 14,
  
  // Body text
  bodyLarge: 16,
  bodyMedium: 14,
  bodySmall: 12,
  
  // UI elements
  button: 16,
  caption: 11,
  overline: 10,
} as const;

// Line heights (optimized for readability)
export const LINE_HEIGHTS = {
  display1: 56,
  display2: 48,
  display3: 40,
  
  h1: 36,
  h2: 32,
  h3: 28,
  h4: 24,
  h5: 22,
  h6: 20,
  
  bodyLarge: 24,
  bodyMedium: 20,
  bodySmall: 16,
  
  button: 24,
  caption: 16,
  overline: 16,
} as const;

// Font weights
export const FONT_WEIGHTS = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

// Letter spacing (craft-themed)
export const LETTER_SPACING = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2,
} as const;

// Spacing scale (8pt grid system)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// Border radius (craft-themed)
export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Shadows (craft-themed elevation)
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

// Typography presets (ready-to-use styles)
export const TYPOGRAPHY_PRESETS = {
  displayLarge: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.display1,
    lineHeight: LINE_HEIGHTS.display1,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: LETTER_SPACING.tight,
  },
  displayMedium: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.display2,
    lineHeight: LINE_HEIGHTS.display2,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: LETTER_SPACING.tight,
  },
  displaySmall: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.display3,
    lineHeight: LINE_HEIGHTS.display3,
    fontWeight: FONT_WEIGHTS.semiBold,
    letterSpacing: LETTER_SPACING.normal,
  },
  
  headlineLarge: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: FONT_SIZES.h1,
    lineHeight: LINE_HEIGHTS.h1,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: LETTER_SPACING.normal,
  },
  headlineMedium: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: FONT_SIZES.h2,
    lineHeight: LINE_HEIGHTS.h2,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: LETTER_SPACING.normal,
  },
  headlineSmall: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.h3,
    lineHeight: LINE_HEIGHTS.h3,
    fontWeight: FONT_WEIGHTS.semiBold,
    letterSpacing: LETTER_SPACING.normal,
  },
  
  titleLarge: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.h4,
    lineHeight: LINE_HEIGHTS.h4,
    fontWeight: FONT_WEIGHTS.semiBold,
    letterSpacing: LETTER_SPACING.normal,
  },
  titleMedium: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.h5,
    lineHeight: LINE_HEIGHTS.h5,
    fontWeight: FONT_WEIGHTS.medium,
    letterSpacing: LETTER_SPACING.normal,
  },
  titleSmall: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.h6,
    lineHeight: LINE_HEIGHTS.h6,
    fontWeight: FONT_WEIGHTS.medium,
    letterSpacing: LETTER_SPACING.wide,
  },
  
  bodyLarge: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.bodyLarge,
    lineHeight: LINE_HEIGHTS.bodyLarge,
    fontWeight: FONT_WEIGHTS.regular,
    letterSpacing: LETTER_SPACING.normal,
  },
  bodyMedium: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.bodyMedium,
    lineHeight: LINE_HEIGHTS.bodyMedium,
    fontWeight: FONT_WEIGHTS.regular,
    letterSpacing: LETTER_SPACING.normal,
  },
  bodySmall: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.bodySmall,
    lineHeight: LINE_HEIGHTS.bodySmall,
    fontWeight: FONT_WEIGHTS.regular,
    letterSpacing: LETTER_SPACING.normal,
  },
  
  labelLarge: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.button,
    lineHeight: LINE_HEIGHTS.button,
    fontWeight: FONT_WEIGHTS.semiBold,
    letterSpacing: LETTER_SPACING.wide,
  },
  labelMedium: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.bodyMedium,
    lineHeight: LINE_HEIGHTS.bodyMedium,
    fontWeight: FONT_WEIGHTS.medium,
    letterSpacing: LETTER_SPACING.wide,
  },
  labelSmall: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.caption,
    lineHeight: LINE_HEIGHTS.caption,
    fontWeight: FONT_WEIGHTS.medium,
    letterSpacing: LETTER_SPACING.wider,
  },
} as const;

// Animation durations (craft-themed micro-interactions)
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800,
} as const;

// Animation easings
export const ANIMATION_EASINGS = {
  easeInOut: 'ease-in-out',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  linear: 'linear',
} as const; 