import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SkillLevel } from '../types';
import { UserSkillLevelService } from '../../services/scoring/UserSkillLevelService';

interface SkillLevelBadgeProps {
  skillLevel: SkillLevel;
  averageScore?: number;
  showProgress?: boolean;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

export default function SkillLevelBadge({ 
  skillLevel, 
  averageScore, 
  showProgress = false, 
  size = 'medium',
  onPress 
}: SkillLevelBadgeProps) {
  const skillLevelService = UserSkillLevelService.getInstance();
  const badge = skillLevelService.getSkillLevelBadge(skillLevel);
  
  // Calculate progress to next level if score is provided
  const progress = averageScore && showProgress 
    ? skillLevelService.calculateProgressToNextLevel(averageScore, skillLevel)
    : null;

  const sizeStyles = {
    small: {
      container: { paddingHorizontal: 8, paddingVertical: 4 },
      emoji: { fontSize: 16 },
      title: { fontSize: 12 },
      score: { fontSize: 10 }
    },
    medium: {
      container: { paddingHorizontal: 12, paddingVertical: 6 },
      emoji: { fontSize: 20 },
      title: { fontSize: 14 },
      score: { fontSize: 12 }
    },
    large: {
      container: { paddingHorizontal: 16, paddingVertical: 8 },
      emoji: { fontSize: 24 },
      title: { fontSize: 16 },
      score: { fontSize: 14 }
    }
  };

  const currentSize = sizeStyles[size];

  const BadgeContent = () => (
    <View style={[
      styles.container,
      { backgroundColor: badge.color + '20', borderColor: badge.color },
      currentSize.container
    ]}>
      <View style={styles.badgeContent}>
        <Text style={[styles.emoji, currentSize.emoji]}>{badge.emoji}</Text>
        <View style={styles.textContent}>
          <Text style={[styles.title, currentSize.title, { color: badge.color }]}>
            {badge.title}
          </Text>
          {averageScore !== undefined && (
            <Text style={[styles.score, currentSize.score]}>
              Score: {Math.round(averageScore)}/100
            </Text>
          )}
        </View>
      </View>
      
      {progress && showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progress.progressPercentage}%`,
                  backgroundColor: badge.color
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {progress.pointsToNext > 0 
              ? `${progress.pointsToNext} pts to ${badge.nextLevel}`
              : 'Max Level!'
            }
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <BadgeContent />
      </TouchableOpacity>
    );
  }

  return <BadgeContent />;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#F5F5DC',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    marginRight: 8,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    color: '#8B4513',
  },
  score: {
    color: '#654321',
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
}); 