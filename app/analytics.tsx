import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardingAnalyticsDashboard } from '../src/features/analytics/OnboardingAnalyticsDashboard';

export default function AnalyticsScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <OnboardingAnalyticsDashboard onBack={handleBack} />
  );
} 