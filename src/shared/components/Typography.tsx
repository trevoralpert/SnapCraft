// Task 3.3: Visual Hierarchy Improvements - Typography Components
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { TYPOGRAPHY_PRESETS } from '../constants/Typography';
import { useTheme } from '../contexts/ThemeContext';

// Typography component props
interface TypographyProps extends TextProps {
  variant?: keyof typeof TYPOGRAPHY_PRESETS;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  children: React.ReactNode;
}

// Main Typography component
export function Typography({
  variant = 'bodyMedium',
  color,
  textAlign = 'left',
  style,
  children,
  ...props
}: TypographyProps) {
  const { theme } = useTheme();
  
  const textStyle = [
    TYPOGRAPHY_PRESETS[variant],
    {
      color: color || theme.colors.text,
      textAlign,
    },
    style,
  ];

  // Ensure children is safe to render
  const renderableChildren = React.useMemo(() => {
    if (children === null || children === undefined) {
      return '';
    }
    if (typeof children === 'string' || typeof children === 'number') {
      return children;
    }
    if (typeof children === 'boolean') {
      return children.toString();
    }
    return String(children);
  }, [children]);

  return (
    <Text style={textStyle} {...props}>
      {renderableChildren}
    </Text>
  );
}

// Specialized typography components for common use cases
export function DisplayText({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  return (
    <Typography variant="displayLarge" {...props}>
      {children}
    </Typography>
  );
}

export function HeadlineText({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  return (
    <Typography variant="headlineLarge" {...props}>
      {children}
    </Typography>
  );
}

export function TitleText({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  return (
    <Typography variant="titleLarge" {...props}>
      {children}
    </Typography>
  );
}

export function BodyText({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  return (
    <Typography variant="bodyMedium" {...props}>
      {children}
    </Typography>
  );
}

export function CaptionText({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  return (
    <Typography variant="labelSmall" {...props}>
      {children}
    </Typography>
  );
}

// Craft-specific typography components
export function CraftTitle({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  const { theme } = useTheme();
  
  return (
    <Typography 
      variant="headlineMedium" 
      color={theme.colors.primary}
      {...props}
    >
      {children}
    </Typography>
  );
}

export function CraftSubtitle({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  const { theme } = useTheme();
  
  return (
    <Typography 
      variant="titleMedium" 
      color={theme.colors.textSecondary}
      {...props}
    >
      {children}
    </Typography>
  );
}

export function CraftLabel({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  const { theme } = useTheme();
  
  return (
    <Typography 
      variant="labelMedium" 
      color={theme.colors.primary}
      {...props}
    >
      {children}
    </Typography>
  );
}

// Error/success/warning text variants
export function ErrorText({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  const { theme } = useTheme();
  
  return (
    <Typography 
      variant="bodySmall" 
      color={theme.colors.error}
      {...props}
    >
      {children}
    </Typography>
  );
}

export function SuccessText({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  const { theme } = useTheme();
  
  return (
    <Typography 
      variant="bodySmall" 
      color={theme.colors.success}
      {...props}
    >
      {children}
    </Typography>
  );
}

export function WarningText({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  const { theme } = useTheme();
  
  return (
    <Typography 
      variant="bodySmall" 
      color={theme.colors.warning}
      {...props}
    >
      {children}
    </Typography>
  );
}

const styles = StyleSheet.create({
  // Additional utility styles can be added here
}); 