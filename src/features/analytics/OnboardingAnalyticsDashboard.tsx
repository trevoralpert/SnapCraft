import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { OnboardingAnalytics, OnboardingAnalyticsData, UserJourneyMetrics } from '../../services/analytics/OnboardingAnalytics';
import { useAuthStore } from '../../stores/authStore';
import { CraftCard } from '../../shared/components/CraftCard';
import { Typography } from '../../shared/components/Typography';

const { width } = Dimensions.get('window');

interface AnalyticsDashboardProps {
  onBack?: () => void;
}

export function OnboardingAnalyticsDashboard({ onBack }: AnalyticsDashboardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [analyticsData, setAnalyticsData] = useState<OnboardingAnalyticsData | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserJourneyMetrics | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'funnel' | 'cohorts' | 'insights'>('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [user]);

  const loadAnalyticsData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Load analytics data
      const [analytics, userJourney, analyticsInsights] = await Promise.all([
        OnboardingAnalytics.getOnboardingAnalytics(),
        OnboardingAnalytics.getUserJourneyMetrics(user.id),
        OnboardingAnalytics.generateInsights(),
      ]);

      setAnalyticsData(analytics);
      setUserMetrics(userJourney);
      setInsights(analyticsInsights);

      console.log('📊 Analytics dashboard loaded successfully');
    } catch (error) {
      try {
        console.error('Error loading analytics data:', error);
      } catch (logError) {
        // Fallback if console.error itself causes issues
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderOverviewTab = () => {
    if (!analyticsData) return null;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Key Metrics */}
        <CraftCard style={styles.metricsCard}>
          <Typography variant="headlineSmall" style={styles.cardTitle}>
            📊 Key Metrics
          </Typography>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Typography variant="headlineMedium" style={styles.metricValue}>
                {analyticsData.totalUsers}
              </Typography>
              <Typography variant="labelSmall" style={styles.metricLabel}>
                Total Users
              </Typography>
            </View>
            <View style={styles.metricItem}>
              <Typography variant="headlineMedium" style={[styles.metricValue, { color: '#4CAF50' }]}>
                {analyticsData.completionStats.completionRate.toFixed(1)}%
              </Typography>
              <Typography variant="labelSmall" style={styles.metricLabel}>
                Completion Rate
              </Typography>
            </View>
            <View style={styles.metricItem}>
              <Typography variant="headlineMedium" style={styles.metricValue}>
                {analyticsData.completionStats.averageCompletionTime.toFixed(1)}m
              </Typography>
              <Typography variant="labelSmall" style={styles.metricLabel}>
                Avg. Time
              </Typography>
            </View>
            <View style={styles.metricItem}>
              <Typography variant="headlineMedium" style={styles.metricValue}>
                {analyticsData.timeToFirstProject.average.toFixed(1)}h
              </Typography>
              <Typography variant="labelSmall" style={styles.metricLabel}>
                Time to Project
              </Typography>
            </View>
          </View>
        </CraftCard>

        {/* Step Performance */}
        <CraftCard style={styles.stepsCard}>
          <Typography variant="headlineSmall" style={styles.cardTitle}>
            📋 Step Performance
          </Typography>
          {analyticsData.stepAnalytics.map((step, index) => (
            <View key={step.stepId} style={styles.stepItem}>
              <View style={styles.stepHeader}>
                <View style={styles.stepInfo}>
                  <Typography variant="bodyLarge" style={styles.stepName}>
                    {step.stepName}
                  </Typography>
                  <Typography variant="labelSmall" style={styles.stepStats}>
                    {step.completionCount}/{step.viewCount} completed
                  </Typography>
                </View>
                <View style={styles.stepMetrics}>
                  <Typography variant="bodyMedium" style={[
                    styles.dropOffRate,
                    { color: step.dropOffRate > 10 ? '#FF6B35' : step.dropOffRate > 5 ? '#FF9800' : '#4CAF50' }
                  ]}>
                    {step.dropOffRate.toFixed(1)}% drop-off
                  </Typography>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${(step.completionCount / step.viewCount) * 100}%`,
                      backgroundColor: step.dropOffRate > 10 ? '#FF6B35' : '#4CAF50'
                    }
                  ]} 
                />
              </View>
              {step.skipCount > 0 && (
                <Typography variant="labelSmall" style={styles.skipInfo}>
                  {step.skipCount} users skipped this step
                </Typography>
              )}
            </View>
          ))}
        </CraftCard>

        {/* User Journey (if available) */}
        {userMetrics && (
          <CraftCard style={styles.userJourneyCard}>
            <Typography variant="headlineSmall" style={styles.cardTitle}>
              👤 Your Journey
            </Typography>
            <View style={styles.journeyMetrics}>
              <View style={styles.journeyItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Typography variant="bodyMedium" style={styles.journeyText}>
                  Completed {userMetrics.stepsCompleted}/5 onboarding steps
                </Typography>
              </View>
              <View style={styles.journeyItem}>
                <Ionicons name="school" size={20} color="#2E7D32" />
                <Typography variant="bodyMedium" style={styles.journeyText}>
                  Finished {userMetrics.tutorialsCompleted} tutorials
                </Typography>
              </View>
              <View style={styles.journeyItem}>
                <Ionicons 
                  name={userMetrics.firstProjectStarted ? "hammer" : "hammer-outline"} 
                  size={20} 
                  color={userMetrics.firstProjectStarted ? "#D4AF37" : "#8B7355"} 
                />
                <Typography variant="bodyMedium" style={styles.journeyText}>
                  First project: {userMetrics.firstProjectCompleted ? 'Completed' : userMetrics.firstProjectStarted ? 'In Progress' : 'Not Started'}
                </Typography>
              </View>
              {userMetrics.totalDuration && (
                <View style={styles.journeyItem}>
                  <Ionicons name="time" size={20} color="#8B7355" />
                  <Typography variant="bodyMedium" style={styles.journeyText}>
                    Total onboarding time: {userMetrics.totalDuration} minutes
                  </Typography>
                </View>
              )}
            </View>
          </CraftCard>
        )}
      </ScrollView>
    );
  };

  const renderFunnelTab = () => {
    if (!analyticsData) return null;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <CraftCard style={styles.funnelCard}>
          <Typography variant="headlineSmall" style={styles.cardTitle}>
            🔄 Conversion Funnel
          </Typography>
          {analyticsData.funnelAnalysis.map((step, index) => (
            <View key={index} style={styles.funnelStep}>
              <View style={styles.funnelStepHeader}>
                <Typography variant="bodyLarge" style={styles.funnelStepName}>
                  {step.step}
                </Typography>
                <Typography variant="bodyMedium" style={styles.funnelStepRate}>
                  {step.conversionRate.toFixed(1)}%
                </Typography>
              </View>
              <View style={styles.funnelBar}>
                <View 
                  style={[
                    styles.funnelBarFill,
                    { 
                      width: `${step.conversionRate}%`,
                      backgroundColor: step.conversionRate > 95 ? '#4CAF50' : step.conversionRate > 90 ? '#FF9800' : '#FF6B35'
                    }
                  ]} 
                />
              </View>
              <View style={styles.funnelStats}>
                <Typography variant="labelSmall" style={styles.funnelStatText}>
                  {step.entered} entered • {step.completed} completed
                </Typography>
                {step.dropOffCount > 0 && (
                  <Typography variant="labelSmall" style={[styles.funnelStatText, { color: '#FF6B35' }]}>
                    {step.dropOffCount} dropped off
                  </Typography>
                )}
              </View>
            </View>
          ))}
        </CraftCard>
      </ScrollView>
    );
  };

  const renderCohortsTab = () => {
    if (!analyticsData) return null;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <CraftCard style={styles.cohortsCard}>
          <Typography variant="headlineSmall" style={styles.cardTitle}>
            📅 Weekly Cohorts
          </Typography>
          {analyticsData.cohortAnalysis.cohorts.map((cohort, index) => (
            <View key={index} style={styles.cohortItem}>
              <View style={styles.cohortHeader}>
                <Typography variant="bodyLarge" style={styles.cohortDate}>
                  Week of {new Date(cohort.startDate).toLocaleDateString()}
                </Typography>
                <Typography variant="bodyMedium" style={styles.cohortUsers}>
                  {cohort.userCount} users
                </Typography>
              </View>
              <View style={styles.cohortMetrics}>
                <View style={styles.cohortMetric}>
                  <Typography variant="labelSmall" style={styles.cohortMetricLabel}>
                    Completion Rate
                  </Typography>
                  <Typography variant="bodyMedium" style={[
                    styles.cohortMetricValue,
                    { color: cohort.completionRate > 85 ? '#4CAF50' : '#FF9800' }
                  ]}>
                    {cohort.completionRate.toFixed(1)}%
                  </Typography>
                </View>
                <View style={styles.cohortMetric}>
                  <Typography variant="labelSmall" style={styles.cohortMetricLabel}>
                    Avg. Time
                  </Typography>
                  <Typography variant="bodyMedium" style={styles.cohortMetricValue}>
                    {cohort.averageTime.toFixed(1)}m
                  </Typography>
                </View>
              </View>
            </View>
          ))}
        </CraftCard>
      </ScrollView>
    );
  };

  const renderInsightsTab = () => {
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <CraftCard style={styles.insightsCard}>
          <Typography variant="headlineSmall" style={styles.cardTitle}>
            💡 Analytics Insights
          </Typography>
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Typography variant="bodyMedium" style={styles.insightText}>
                  {insight}
                </Typography>
              </View>
            ))
          ) : (
            <View style={styles.noInsights}>
              <Ionicons name="analytics" size={48} color="#8B7355" />
              <Typography variant="bodyLarge" style={styles.noInsightsText}>
                Gathering insights from user data...
              </Typography>
            </View>
          )}
        </CraftCard>

        {/* Recommendations */}
        <CraftCard style={styles.recommendationsCard}>
          <Typography variant="headlineSmall" style={styles.cardTitle}>
            🎯 Recommendations
          </Typography>
          <View style={styles.recommendationItem}>
            <Ionicons name="bulb" size={20} color="#D4AF37" />
            <Typography variant="bodyMedium" style={styles.recommendationText}>
              Consider adding progress indicators to reduce drop-off anxiety
            </Typography>
          </View>
          <View style={styles.recommendationItem}>
            <Ionicons name="people" size={20} color="#D4AF37" />
            <Typography variant="bodyMedium" style={styles.recommendationText}>
              A/B test different craft selection layouts to improve engagement
            </Typography>
          </View>
          <View style={styles.recommendationItem}>
            <Ionicons name="time" size={20} color="#D4AF37" />
            <Typography variant="bodyMedium" style={styles.recommendationText}>
              Add time estimates to each step to set proper expectations
            </Typography>
          </View>
        </CraftCard>
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview': return renderOverviewTab();
      case 'funnel': return renderFunnelTab();
      case 'cohorts': return renderCohortsTab();
      case 'insights': return renderInsightsTab();
      default: return renderOverviewTab();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Typography variant="bodyLarge" style={styles.loadingText}>
            Loading analytics data...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#8B7355" />
          </TouchableOpacity>
        )}
        <Typography variant="headlineMedium" style={styles.headerTitle}>
          📊 Onboarding Analytics
        </Typography>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'overview', label: 'Overview', icon: 'analytics' },
            { id: 'funnel', label: 'Funnel', icon: 'funnel' },
            { id: 'cohorts', label: 'Cohorts', icon: 'calendar' },
            { id: 'insights', label: 'Insights', icon: 'bulb' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                selectedTab === tab.id && styles.tabButtonActive,
              ]}
              onPress={() => setSelectedTab(tab.id as any)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={selectedTab === tab.id ? '#FFFFFF' : '#8B7355'} 
              />
              <Typography 
                variant="labelSmall" 
                style={[
                  styles.tabButtonText,
                  selectedTab === tab.id && styles.tabButtonTextActive,
                ]}
              >
                {tab.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      {renderTabContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    color: '#2C1810',
    flex: 1,
  },
  tabNavigation: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC0',
    paddingVertical: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F5F3F0',
  },
  tabButtonActive: {
    backgroundColor: '#D4AF37',
  },
  tabButtonText: {
    marginLeft: 4,
    color: '#8B7355',
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#8B7355',
  },
  metricsCard: {
    marginBottom: 16,
    padding: 20,
  },
  cardTitle: {
    color: '#2C1810',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricValue: {
    color: '#2C1810',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    color: '#8B7355',
    textAlign: 'center',
  },
  stepsCard: {
    marginBottom: 16,
    padding: 20,
  },
  stepItem: {
    marginBottom: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    color: '#2C1810',
    fontWeight: '600',
  },
  stepStats: {
    color: '#8B7355',
    marginTop: 2,
  },
  stepMetrics: {
    alignItems: 'flex-end',
  },
  dropOffRate: {
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E8DCC0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  skipInfo: {
    color: '#8B7355',
    fontStyle: 'italic',
  },
  userJourneyCard: {
    marginBottom: 16,
    padding: 20,
  },
  journeyMetrics: {
    gap: 12,
  },
  journeyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journeyText: {
    color: '#2C1810',
    marginLeft: 8,
    flex: 1,
  },
  funnelCard: {
    padding: 20,
  },
  funnelStep: {
    marginBottom: 20,
  },
  funnelStepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  funnelStepName: {
    color: '#2C1810',
    fontWeight: '600',
  },
  funnelStepRate: {
    color: '#8B7355',
    fontWeight: '600',
  },
  funnelBar: {
    height: 8,
    backgroundColor: '#E8DCC0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  funnelBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  funnelStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  funnelStatText: {
    color: '#8B7355',
  },
  cohortsCard: {
    padding: 20,
  },
  cohortItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F5F3F0',
    borderRadius: 8,
  },
  cohortHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cohortDate: {
    color: '#2C1810',
    fontWeight: '600',
  },
  cohortUsers: {
    color: '#8B7355',
  },
  cohortMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cohortMetric: {
    alignItems: 'center',
  },
  cohortMetricLabel: {
    color: '#8B7355',
    marginBottom: 4,
  },
  cohortMetricValue: {
    color: '#2C1810',
    fontWeight: '600',
  },
  insightsCard: {
    marginBottom: 16,
    padding: 20,
  },
  insightItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFF8E7',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
  },
  insightText: {
    color: '#2C1810',
    lineHeight: 20,
  },
  noInsights: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noInsightsText: {
    color: '#8B7355',
    marginTop: 16,
  },
  recommendationsCard: {
    padding: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F5F3F0',
    borderRadius: 8,
  },
  recommendationText: {
    color: '#2C1810',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
}); 