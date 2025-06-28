import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SkillProgressionEntry } from '../types';
import { UserSkillLevelService } from '../../services/scoring/UserSkillLevelService';
import SkillLevelBadge from './SkillLevelBadge';

interface SkillProgressionHistoryProps {
  progressionHistory: SkillProgressionEntry[];
  currentLevel: string;
  currentScore: number;
}

export default function SkillProgressionHistory({ 
  progressionHistory, 
  currentLevel, 
  currentScore 
}: SkillProgressionHistoryProps) {
  const skillLevelService = UserSkillLevelService.getInstance();
  
  // Sort progression history by date (most recent first)
  const sortedHistory = [...progressionHistory].sort((a, b) => 
    new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  if (sortedHistory.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🌱 Your Skill Journey</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Complete more projects to see your skill progression!
          </Text>
          <Text style={styles.emptySubtext}>
            Your skill level is calculated based on the quality and consistency of your craft projects.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌱 Your Skill Journey</Text>
      
      {/* Current Level */}
      <View style={styles.currentLevelContainer}>
        <Text style={styles.sectionTitle}>Current Level</Text>
        <SkillLevelBadge 
          skillLevel={currentLevel as any}
          averageScore={currentScore}
          showProgress={true}
          size="large"
        />
      </View>

      {/* Progression Timeline */}
      <View style={styles.timelineContainer}>
        <Text style={styles.sectionTitle}>Progression History</Text>
        <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
          {sortedHistory.map((entry, index) => {
            const badge = skillLevelService.getSkillLevelBadge(entry.skillLevel);
            const isLatest = index === 0;
            
            return (
              <View key={`${entry.achievedAt}-${index}`} style={styles.timelineItem}>
                {/* Timeline line */}
                <View style={styles.timelineLine}>
                  <View style={[
                    styles.timelineDot, 
                    { backgroundColor: badge.color },
                    isLatest && styles.timelineDotLatest
                  ]}>
                    <Text style={styles.timelineDotEmoji}>{badge.emoji}</Text>
                  </View>
                  {index < sortedHistory.length - 1 && (
                    <View style={styles.timelineConnector} />
                  )}
                </View>

                {/* Timeline content */}
                <View style={styles.timelineContent}>
                  <View style={[
                    styles.levelCard,
                    { borderColor: badge.color, backgroundColor: badge.color + '10' }
                  ]}>
                    <View style={styles.levelHeader}>
                      <Text style={[styles.levelTitle, { color: badge.color }]}>
                        {badge.title}
                      </Text>
                      <Text style={styles.levelDate}>
                        {formatTimeAgo(entry.achievedAt)}
                      </Text>
                    </View>
                    
                    <View style={styles.levelStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Score</Text>
                        <Text style={styles.statValue}>
                          {Math.round(entry.averageScore)}/100
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Projects</Text>
                        <Text style={styles.statValue}>{entry.projectCount}</Text>
                      </View>
                    </View>

                    <Text style={styles.levelDescription}>
                      {badge.description}
                    </Text>
                    
                    <Text style={styles.levelDateFull}>
                      Achieved on {formatDate(entry.achievedAt)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 20,
    textAlign: 'center',
  },
  currentLevelContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 12,
  },
  timelineContainer: {
    flex: 1,
  },
  timeline: {
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLine: {
    width: 40,
    alignItems: 'center',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  timelineDotLatest: {
    transform: [{ scale: 1.2 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  timelineDotEmoji: {
    fontSize: 16,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#DDD',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
  },
  levelCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelDate: {
    fontSize: 12,
    color: '#666',
  },
  levelStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  levelDescription: {
    fontSize: 14,
    color: '#654321',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  levelDateFull: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#8B4513',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#654321',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 