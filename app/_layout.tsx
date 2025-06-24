import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '../src/stores/authStore';
import { NotificationSystem, useNotifications } from '../src/shared/components/NotificationSystem';

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
  const { initializeAuth } = useAuthStore();

  // Effect to handle font loading and auth initialization
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Initialize Firebase auth state listener
      initializeAuth();
    }
  }, [loaded, initializeAuth]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
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
        'Welcome to SnapCraft!',
        'Your craft journey begins here. Start exploring and sharing your creations!',
        {
          label: 'Get Started',
          onPress: () => console.log('User tapped Get Started'),
        }
      );
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <NotificationSystem
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </ThemeProvider>
  );
}
