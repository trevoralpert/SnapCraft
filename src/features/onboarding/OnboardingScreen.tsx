import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { OnboardingService } from '../../services/onboarding/OnboardingService';
import { OnboardingProgress, OnboardingData } from '../../shared/types/onboarding';
import { WelcomeStep } from './steps/WelcomeStep';
import { CraftSelectionStep } from './steps/CraftSelectionStep';
import { CameraPermissionsStep } from './steps/CameraPermissionsStep';
import { ToolIntroductionStep } from './steps/ToolIntroductionStep';
import { FirstProjectStep } from './steps/FirstProjectStep';
import { useRouter } from 'expo-router';

export function OnboardingScreen() {
  const { user, initializeAuth } = useAuthStore();
  const router = useRouter();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const userProgress = OnboardingService.getProgress(user);
      setProgress(userProgress);
      setIsLoading(false);

      // Start onboarding analytics tracking
      OnboardingService.startOnboarding(user.id);
    }
  }, [user]);

  useEffect(() => {
    // Track step view when current step changes
    if (user && progress && !isLoading) {
      OnboardingService.startStep(user.id, progress.currentStep);
    }
  }, [user, progress?.currentStep, isLoading]);

  const handleNext = async (data?: Partial<OnboardingData>) => {
    if (!user || !progress) return;

    try {
      await OnboardingService.completeStep(user, progress.currentStep, data);
      
      // Refresh user data to get updated onboarding status
      await initializeAuth();
      
      // Check if onboarding is complete
      const updatedUser = useAuthStore.getState().user;
      if (updatedUser && OnboardingService.isOnboardingComplete(updatedUser)) {
        // Navigate to main app
        router.replace('/(tabs)');
      } else if (updatedUser) {
        // Update progress for next step
        const newProgress = OnboardingService.getProgress(updatedUser);
        setProgress(newProgress);
      }
    } catch (error) {
      console.error('Error completing onboarding step:', error);
      
      // Track error with analytics
      if (user) {
        OnboardingService.trackError(
          user.id, 
          progress.currentStep, 
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  };

  const handleSkip = async () => {
    if (!user) return;

    try {
      await OnboardingService.skipOnboarding(user);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  const handleBack = () => {
    if (!progress || progress.currentStep <= 0) return;

    setProgress(prev => prev ? {
      ...prev,
      currentStep: prev.currentStep - 1
    } : null);
  };

  if (isLoading || !progress) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* Loading indicator */}
        </View>
      </SafeAreaView>
    );
  }

  const renderCurrentStep = () => {
    const stepProps = {
      onNext: handleNext,
      onSkip: progress.canSkip ? handleSkip : undefined,
      onBack: progress.currentStep > 0 ? handleBack : undefined,
      progress
    };

    switch (progress.currentStep) {
      case 0:
        return <WelcomeStep {...stepProps} />;
      case 1:
        return <CraftSelectionStep {...stepProps} />;
      case 2:
        return <CameraPermissionsStep {...stepProps} />;
      case 3:
        return <ToolIntroductionStep {...stepProps} />;
      case 4:
        return <FirstProjectStep {...stepProps} />;
      default:
        // Fallback - should not happen
        router.replace('/(tabs)');
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5DC" />
      {renderCurrentStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC', // Craft-themed beige background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 