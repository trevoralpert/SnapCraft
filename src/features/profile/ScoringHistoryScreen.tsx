import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { CraftPost } from '../../shared/types';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase/config';

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

export function ScoringHistoryScreen({ onClose }: ScoringHistoryScreenProps) {
  const { user } = useAuthStore();
  const [projectScores, setProjectScores] = useState<ProjectScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [totalProjects, setTotalProjects] = useState<number>(0);

  useEffect(() => {
    if (user) {
      loadScoringHistory();
    }
  }, [user]);

  const loadScoringHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('📊 Loading scoring history for user:', user.id);

      // Query user's posts with scoring data
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const scores: ProjectScore[] = [];

      snapshot.forEach((doc) => {
        const post = doc.data() as CraftPost;
        if (post.scoring) {
          scores.push({
            id: doc.id,
            craftType: post.craftType,
            score: post.scoring.individualSkillScore,
            skillLevel: post.scoring.skillLevelCategory,
            confidence: Math.round(post.scoring.aiScoringMetadata.confidence * 100),
            needsReview: post.scoring.aiScoringMetadata.reviewRequired,
            scoredAt: post.scoring.aiScoringMetadata.scoredAt,
            description: post.content.description.substring(0, 100) + '...'
          });
        }
      });

      setProjectScores(scores);
      setTotalProjects(scores.length);

      // Calculate average score
      if (scores.length > 0) {
        const avg = scores.reduce((sum, score) => sum + score.score, 0) / scores.length;
        setAverageScore(Math.round(avg));
      }

      console.log('📊 Loaded', scores.length, 'scored projects');
    } catch (error) {
      console.error('❌ Error loading scoring history:', error);
      Alert.alert('Error', 'Failed to load scoring history');
    } finally {
      setLoading(false);
    }
  };

  const getSkillLevelColor = (skillLevel: string): string => {
    switch (skillLevel) {
      case 'novice': return '#4CAF50';
      case 'apprentice': return '#2196F3';
      case 'journeyman': return '#FF9800';
      case 'craftsman': return '#9C27B0';
      case 'master': return '#F44336';
      default: return '#757575';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#4CAF50';
    if (score >= 80) return '#8BC34A';
    if (score >= 70) return '#FFC107';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const renderScoreCard = (projectScore: ProjectScore) => (
    <View key={projectScore.id} style={styles.scoreCard}>
      <View style={styles.scoreHeader}>
        <View style={styles.scoreInfo}>
          <Text style={[styles.scoreValue, { color: getScoreColor(projectScore.score) }]}>
            {projectScore.score}/100
          </Text>
          <Text style={styles.craftType}>{projectScore.craftType}</Text>
        </View>
        <View style={styles.skillBadge}>
          <Text style={[styles.skillLevel, { color: getSkillLevelColor(projectScore.skillLevel) }]}>
            {projectScore.skillLevel.charAt(0).toUpperCase() + projectScore.skillLevel.slice(1)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.description}>{projectScore.description}</Text>
      
      <View style={styles.scoreFooter}>
        <View style={styles.confidenceContainer}>
          <Ionicons name="analytics" size={14} color="#666" />
          <Text style={styles.confidence}>{projectScore.confidence}% confidence</Text>
        </View>
        {projectScore.needsReview && (
          <View style={styles.reviewFlag}>
            <Ionicons name="flag" size={14} color="#FF9800" />
            <Text style={styles.reviewText}>Review Required</Text>
          </View>
        )}
        <Text style={styles.scoredDate}>
          {new Date(projectScore.scoredAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please log in to view scoring history</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={24} color="#8B4513" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scoring History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalProjects}</Text>
          <Text style={styles.statLabel}>Projects Scored</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: getScoreColor(averageScore) }]}>
            {averageScore}/100
          </Text>
          <Text style={styles.statLabel}>Average Score</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {user.scoring?.calculatedSkillLevel?.charAt(0).toUpperCase() + 
             (user.scoring?.calculatedSkillLevel?.slice(1) || 'pending')}
          </Text>
          <Text style={styles.statLabel}>Current Level</Text>
        </View>
      </View>

      {/* Scoring History */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading scoring history...</Text>
          </View>
        ) : projectScores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics" size={48} color="#CCC" />
            <Text style={styles.emptyTitle}>No Scored Projects Yet</Text>
            <Text style={styles.emptyText}>
              Create and share craft projects to see your AI scoring history here.
            </Text>
          </View>
        ) : (
          <View style={styles.scoresContainer}>
            <Text style={styles.sectionTitle}>Recent Project Scores</Text>
            {projectScores.map(renderScoreCard)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  headerSpacer: {
    width: 34,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4513',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '500',
  },
  scoresContainer: {
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 16,
  },
  scoreCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 12,
  },
  craftType: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  skillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
  },
  skillLevel: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  scoreFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidence: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  reviewFlag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 4,
  },
  scoredDate: {
    fontSize: 12,
    color: '#999',
  },
}); 