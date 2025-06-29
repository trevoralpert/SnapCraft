import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '../src/stores/authStore';
import { NotificationSystem, useNotifications } from '../src/shared/components/NotificationSystem';
import { LoginScreen } from '../src/features/auth/LoginScreen';
import { OnboardingScreen } from '../src/features/onboarding/OnboardingScreen';
import { OnboardingService } from '../src/services/onboarding/OnboardingService';
import { ThemeProvider, useTheme } from '../src/shared/contexts/ThemeContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Initialize authentication state
  const { initializeAuth, user, isLoading } = useAuthStore();
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  // Effect to handle font loading and auth initialization
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Initialize Firebase auth state listener
      initializeAuth().then(() => {
        setIsAuthInitialized(true);
      });
    }
  }, [loaded, initializeAuth]);

  // Show loading screen while fonts load or auth initializes
  if (!loaded || !isAuthInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5DC' }}>
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  // Show auth loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5DC' }}>
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  // Check if user needs onboarding
  if (OnboardingService.needsOnboarding(user)) {
    return <OnboardingScreen />;
  }

  // Show main app if authenticated and onboarded
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { isDark } = useTheme();
  const router = useRouter();
  const {
    notifications,
    dismissNotification,
    showSuccess,
    showError,
    showAchievement,
  } = useNotifications();

  // Demo: Show welcome notification after app loads
  useEffect(() => {
    const timer = setTimeout(() => {
      showSuccess(
        'Welcome back to SnapCraft!',
        'Ready to continue your craft journey? Check out the latest community projects!',
        {
          label: 'Explore',
          onPress: () => console.log('User tapped Explore'),
        }
      );
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
      <NotificationSystem
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </NavigationThemeProvider>
  );
}
