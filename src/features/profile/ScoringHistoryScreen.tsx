import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { CraftPost, SkillLevel, SkillProgressionEntry } from '../../shared/types';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { SkillLevelBadge, SkillProgressionHistory } from '../../shared/components';
import { UserSkillLevelService } from '../../services/scoring/UserSkillLevelService';

interface ScoringHistoryScreenProps {
  onClose?: () => void;
}

interface ProjectScore {
  id: string;
  craftType: string;
  score: number;
  skillLevel: string;
  confidence: number;
  needsReview: boolean;
  scoredAt: Date;
  description: string;
}

export default function ScoringHistoryScreen({ onClose }: ScoringHistoryScreenProps = {}) {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [skillData, setSkillData] = useState<{
    skillLevel: SkillLevel;
    averageScore: number;
    projectCount: number;
    confidence: number;
    progressionHistory: SkillProgressionEntry[];
  } | null>(null);

  useEffect(() => {
    const fetchSkillData = async () => {
      if (!user) return;

      try {
        console.log('📊 Fetching complete skill data for user:', user.id);
        const skillLevelService = UserSkillLevelService.getInstance();
        const data = await skillLevelService.calculateUserSkillLevel(user.id);
        setSkillData(data);
        console.log('✅ Complete skill data fetched:', data);
      } catch (error) {
        console.error('❌ Failed to fetch skill data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkillData();
  }, [user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Please log in to view your scoring history</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading your skill progression...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!skillData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load skill data</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🎯 Skill Progression</Text>
          <Text style={styles.headerSubtitle}>
            Track your craft journey and skill development
          </Text>
        </View>
      </View>

      {/* Current Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{skillData.projectCount}</Text>
          <Text style={styles.statLabel}>Projects</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Math.round(skillData.averageScore)}</Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Math.round(skillData.confidence * 100)}%</Text>
          <Text style={styles.statLabel}>Confidence</Text>
        </View>
      </View>

      {/* Skill Progression History */}
      <View style={styles.progressionContainer}>
        <SkillProgressionHistory
          progressionHistory={skillData.progressionHistory}
          currentLevel={skillData.skillLevel}
          currentScore={skillData.averageScore}
        />
      </View>

      {/* Tips Section */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Tips to Improve Your Skill Level</Text>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <Ionicons name="camera" size={20} color="#8B4513" />
            <Text style={styles.tipText}>
              Document your process with clear photos at each step
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="list" size={20} color="#8B4513" />
            <Text style={styles.tipText}>
              Include detailed material lists and tool information
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="time" size={20} color="#8B4513" />
            <Text style={styles.tipText}>
              Track time spent and note any challenges faced
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="shield-checkmark" size={20} color="#8B4513" />
            <Text style={styles.tipText}>
              Always follow safety guidelines and best practices
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#F5DEB3',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressionContainer: {
    flex: 1,
    marginTop: 16,
  },
  tipsContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 12,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#654321',
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#8B4513',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#8B4513',
    textAlign: 'center',
  },
}); 