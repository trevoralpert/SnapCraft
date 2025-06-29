import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStoryAnalytics, debugStoryAnalytics } from '../../services/firebase/stories';
import { StoryAnalytics } from '../types';

const { width } = Dimensions.get('window');

interface StoryAnalyticsDashboardProps {
  storyId: string;
  onClose: () => void;
}

export const StoryAnalyticsDashboard: React.FC<StoryAnalyticsDashboardProps> = ({
  storyId,
  onClose,
}) => {
  const [analytics, setAnalytics] = useState<StoryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [storyId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 Loading analytics for story:', storyId);
      
      const analyticsData = await getStoryAnalytics(storyId);
      setAnalytics(analyticsData);
      console.log('✅ Analytics loaded successfully:', analyticsData);
    } catch (err) {
      console.error('❌ Failed to load story analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const runDebugAnalysis = async () => {
    try {
      console.log('🔍 Running debug analysis for story:', storyId);
      const debugData = await debugStoryAnalytics(storyId);
      
      Alert.alert(
        '🔍 Debug Analysis',
        `Story exists: ${debugData.exists}\n` +
        `Views: ${debugData.analytics?.uniqueViewers || 0}\n` +
        `Total views: ${debugData.analytics?.totalViews || 0}\n` +
        `Active: ${debugData.debugInfo?.isActive}\n` +
        `Expired: ${debugData.debugInfo?.isExpired}`,
        [
          { text: 'View Console', onPress: () => console.log('🔍 Full debug data:', debugData) },
          { text: 'OK', style: 'default' }
        ]
      );
    } catch (err) {
      Alert.alert('Debug Error', err instanceof Error ? err.message : 'Debug failed');
    }
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: string,
    color: string,
    subtitle?: string
  ) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#8B4513" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Story Analytics</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#8B4513" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Story Analytics</Text>
          <TouchableOpacity onPress={runDebugAnalysis} style={styles.debugButton}>
            <Ionicons name="bug" size={20} color="#8B4513" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff4444" />
          <Text style={styles.errorTitle}>Analytics Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadAnalytics} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={runDebugAnalysis} style={styles.debugButtonLarge}>
            <Text style={styles.debugText}>Debug Analysis</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#8B4513" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Story Analytics</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No analytics data available</Text>
          <TouchableOpacity onPress={loadAnalytics} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={24} color="#8B4513" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Story Analytics</Text>
        <TouchableOpacity onPress={runDebugAnalysis} style={styles.debugButton}>
          <Ionicons name="bug" size={20} color="#8B4513" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <Text style={styles.overviewText}>
            Your story has been viewed {analytics.totalViews} times by {analytics.uniqueViewers} unique viewers
          </Text>
        </View>

        {/* Performance Metrics */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Total Views',
              analytics.totalViews,
              'eye',
              '#2196F3'
            )}
            {renderMetricCard(
              'Unique Viewers',
              analytics.uniqueViewers,
              'people',
              '#4CAF50'
            )}
            {renderMetricCard(
              'Completion Rate',
              `${Math.round(analytics.completionRate * 100)}%`,
              'checkmark-circle',
              '#FF9800'
            )}
            {renderMetricCard(
              'Avg. Watch Time',
              `${Math.round(analytics.averageWatchDuration)}s`,
              'time',
              '#9C27B0'
            )}
          </View>
        </View>

        {/* Engagement Score */}
        <View style={styles.scoreSection}>
          <Text style={styles.sectionTitle}>Engagement Score</Text>
          <View style={styles.scoreCard}>
            {(() => {
              // Calculate engagement score based on available metrics
              const engagementScore = Math.round(
                (analytics.completionRate * 0.4) + // 40% weight for completion rate
                (Math.min(analytics.totalViews / Math.max(analytics.uniqueViewers, 1), 2) * 20) + // 20% for replay rate
                (Math.min(analytics.averageWatchDuration / 15, 1) * 40) // 40% for watch duration
              );
              
              return (
                <>
                  <Text style={[styles.scoreValue, { color: engagementScore >= 80 ? '#4CAF50' : engagementScore >= 60 ? '#FF9800' : '#ff4444' }]}>
                    {engagementScore}
                  </Text>
                  <Text style={styles.scoreLabel}>out of 100</Text>
                  <Text style={styles.scoreDescription}>
                    {engagementScore >= 80 ? 'Excellent engagement! Your story is performing very well.' :
                     engagementScore >= 60 ? 'Good engagement. Consider optimizing for better retention.' :
                     'Low engagement. Try shorter, more focused content.'}
                  </Text>
                </>
              );
            })()}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  debugButton: {
    padding: 4,
  },
  debugButtonLarge: {
    padding: 12,
  },
  debugText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '500',
  },
  overviewSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 14,
    color: '#666',
  },
  metricsSection: {
    margin: 16,
    marginTop: 0,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: (width - 48) / 2,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 11,
    color: '#999',
  },
  scoreSection: {
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
  },
  scoreCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
}); 