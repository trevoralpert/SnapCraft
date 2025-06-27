import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStoryAnalytics } from '../../services/firebase/stories';
import { StoryAnalytics } from '../types';

interface StoryAnalyticsDashboardProps {
  storyId: string;
  onClose?: () => void;
}

const { width } = Dimensions.get('window');

export const StoryAnalyticsDashboard: React.FC<StoryAnalyticsDashboardProps> = ({
  storyId,
  onClose,
}) => {
  const [analytics, setAnalytics] = useState<StoryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [storyId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const analyticsData = await getStoryAnalytics(storyId);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load story analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Expired';
    
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hoursLeft > 0) {
      return `${hoursLeft}h ${minutesLeft}m left`;
    }
    return `${minutesLeft}m left`;
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: keyof typeof Ionicons.glyphMap,
    color: string = '#8B4513',
    subtitle?: string
  ) => (
    <View style={[styles.metricCard, { borderTopColor: color }]}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ff4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={loadAnalytics} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="analytics" size={48} color="#ccc" />
        <Text style={styles.errorText}>No analytics data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {onClose && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Story Analytics</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      )}

      {/* Story Status */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Story Status</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Created:</Text>
            <Text style={styles.statusValue}>
              {analytics.createdAt.toLocaleDateString()} at{' '}
              {analytics.createdAt.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Expires:</Text>
            <Text style={[
              styles.statusValue,
              { color: analytics.expiresAt < new Date() ? '#ff4444' : '#4CAF50' }
            ]}>
              {getTimeRemaining(analytics.expiresAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* Key Metrics */}
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
            `${analytics.completionRate}%`,
            'checkmark-circle',
            '#FF9800',
            `${analytics.completedViews} completed`
          )}
          {renderMetricCard(
            'Avg. Watch Time',
            formatDuration(analytics.averageWatchDuration),
            'timer',
            '#9C27B0'
          )}
          {renderMetricCard(
            'Replays',
            analytics.totalReplays,
            'repeat',
            '#F44336'
          )}
        </View>
      </View>

      {/* Engagement Insights */}
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Engagement Insights</Text>
        <View style={styles.insightCard}>
          <View style={styles.insightRow}>
            <Ionicons name="trending-up" size={16} color="#4CAF50" />
            <Text style={styles.insightText}>
              {analytics.completionRate >= 70 
                ? 'High engagement! Most viewers watched to the end.'
                : analytics.completionRate >= 40
                ? 'Good engagement. Consider shorter content for better completion.'
                : 'Low completion rate. Try more engaging opening or shorter content.'
              }
            </Text>
          </View>
          
          {analytics.totalReplays > 0 && (
            <View style={styles.insightRow}>
              <Ionicons name="repeat" size={16} color="#FF9800" />
              <Text style={styles.insightText}>
                {analytics.totalReplays === 1 
                  ? '1 viewer replayed your story'
                  : `${analytics.totalReplays} replays from engaged viewers`
                }
              </Text>
            </View>
          )}
          
          <View style={styles.insightRow}>
            <Ionicons name="timer" size={16} color="#2196F3" />
            <Text style={styles.insightText}>
              Average watch time: {formatDuration(analytics.averageWatchDuration)}
              {analytics.averageWatchDuration >= 10 
                ? ' - Great retention!'
                : ' - Consider more engaging content'
              }
            </Text>
          </View>
        </View>
      </View>

      {/* Performance Score */}
      <View style={styles.scoreSection}>
        <Text style={styles.sectionTitle}>Performance Score</Text>
        <View style={styles.scoreCard}>
          {(() => {
            const score = Math.round(
              (analytics.completionRate * 0.4) +
              (Math.min(analytics.totalViews / Math.max(analytics.uniqueViewers, 1), 2) * 20) +
              (Math.min(analytics.averageWatchDuration / 15, 1) * 40)
            );
            const scoreColor = score >= 80 ? '#4CAF50' : score >= 60 ? '#FF9800' : '#F44336';
            
            return (
              <>
                <Text style={[styles.scoreValue, { color: scoreColor }]}>{score}</Text>
                <Text style={styles.scoreLabel}>Performance Score</Text>
                <Text style={styles.scoreDescription}>
                  {score >= 80 
                    ? 'Excellent! Your story is performing very well.'
                    : score >= 60
                    ? 'Good performance with room for improvement.'
                    : 'Consider optimizing content for better engagement.'
                  }
                </Text>
              </>
            );
          })()}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  statusSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
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
    borderTopWidth: 3,
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
  insightsSection: {
    margin: 16,
    marginTop: 0,
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 32,
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
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 