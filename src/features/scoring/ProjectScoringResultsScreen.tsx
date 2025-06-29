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
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProjectScoringResult, CraftSpecialization } from '../../shared/types';
import { CraftButton } from '../../shared/components';

interface ProjectScoringResultsScreenProps {
  scoringResult: ProjectScoringResult;
  projectImages?: string[];
  onClose: () => void;
  onViewProject?: () => void;
  onRequestReview?: () => void;
}

const { width } = Dimensions.get('window');

export default function ProjectScoringResultsScreen({
  scoringResult,
  projectImages,
  onClose,
  onViewProject,
  onRequestReview
}: ProjectScoringResultsScreenProps) {

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getSkillLevelEmoji = (skillLevel: string): string => {
    switch (skillLevel) {
      case 'novice': return '🌱';
      case 'apprentice': return '🔨';
      case 'journeyman': return '⚒️';
      case 'craftsman': return '🏆';
      case 'master': return '👑';
      default: return '🔨';
    }
  };

  const getCriteriaIcon = (criterion: string): string => {
    switch (criterion) {
      case 'technicalExecution': return '⚙️';
      case 'documentationCompleteness': return '📋';
      case 'toolUsageAppropriateness': return '🔧';
      case 'safetyAdherence': return '🛡️';
      case 'innovationCreativity': return '💡';
      default: return '📊';
    }
  };

  const getCriteriaName = (criterion: string): string => {
    switch (criterion) {
      case 'technicalExecution': return 'Technical Execution';
      case 'documentationCompleteness': return 'Documentation';
      case 'toolUsageAppropriateness': return 'Tool Usage';
      case 'safetyAdherence': return 'Safety Adherence';
      case 'innovationCreativity': return 'Innovation';
      default: return criterion;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Scoring Results</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreTitle}>Overall Project Score</Text>
            {scoringResult.aiScoringMetadata.needsHumanReview && (
              <View style={styles.reviewFlag}>
                <Ionicons name="flag" size={16} color="#FF9800" />
                <Text style={styles.reviewText}>Under Review</Text>
              </View>
            )}
          </View>
          
          <View style={styles.scoreDisplay}>
            <Text style={[styles.scoreValue, { color: getScoreColor(scoringResult.individualSkillScore) }]}>
              {scoringResult.individualSkillScore}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>

          <View style={styles.skillLevelBadge}>
            <Text style={styles.skillEmoji}>{getSkillLevelEmoji(scoringResult.skillLevelCategory)}</Text>
            <Text style={styles.skillLevel}>{scoringResult.skillLevelCategory.toUpperCase()}</Text>
          </View>

          <Text style={styles.overallFeedback}>{scoringResult.overallFeedback}</Text>
        </View>

        {/* Criteria Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Scoring Breakdown</Text>
          {Object.entries(scoringResult.scoringCriteria).map(([criterion, data]) => (
            <View key={criterion} style={styles.criteriaCard}>
              <View style={styles.criteriaHeader}>
                <View style={styles.criteriaTitle}>
                  <Text style={styles.criteriaIcon}>{getCriteriaIcon(criterion)}</Text>
                  <Text style={styles.criteriaName}>{getCriteriaName(criterion)}</Text>
                </View>
                <View style={styles.criteriaScore}>
                  <Text style={[styles.criteriaScoreText, { color: getScoreColor(data.score) }]}>
                    {data.score}
                  </Text>
                  <Text style={styles.criteriaWeight}>({Math.round(data.weight * 100)}%)</Text>
                </View>
              </View>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${data.score}%`,
                      backgroundColor: getScoreColor(data.score)
                    }
                  ]} 
                />
              </View>
              
              <Text style={styles.criteriaFeedback}>{data.feedback}</Text>
              
              <View style={styles.confidenceIndicator}>
                <Text style={styles.confidenceText}>
                  Confidence: {data.confidence}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Strengths */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💪 Your Strengths</Text>
          {scoringResult.strengths.map((strength, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.listBullet}>✅</Text>
              <Text style={styles.listText}>{strength}</Text>
            </View>
          ))}
        </View>

        {/* Improvement Areas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Areas for Improvement</Text>
          {scoringResult.improvementAreas.map((area, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.listBullet}>🔄</Text>
              <Text style={styles.listText}>{area}</Text>
            </View>
          ))}
        </View>

        {/* Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Next Steps</Text>
          {scoringResult.nextStepSuggestions.map((step, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.listBullet}>📈</Text>
              <Text style={styles.listText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* AI Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI Analysis Details</Text>
          <View style={styles.metadataCard}>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Model Version:</Text>
              <Text style={styles.metadataValue}>{scoringResult.aiScoringMetadata.modelVersion}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Processing Time:</Text>
              <Text style={styles.metadataValue}>{scoringResult.aiScoringMetadata.processingTime}ms</Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Confidence:</Text>
              <Text style={styles.metadataValue}>{scoringResult.aiScoringMetadata.confidence}%</Text>
            </View>
            {scoringResult.aiScoringMetadata.needsHumanReview && (
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Review Reason:</Text>
                <Text style={[styles.metadataValue, styles.reviewReason]}>
                  {scoringResult.aiScoringMetadata.reviewReason}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {onViewProject && (
            <CraftButton
              title="View Project"
              onPress={onViewProject}
              variant="secondary"
              style={styles.actionButton}
            />
          )}
          
          {scoringResult.aiScoringMetadata.needsHumanReview && onRequestReview && (
            <CraftButton
              title="Request Manual Review"
              onPress={onRequestReview}
              variant="primary"
              style={styles.actionButton}
            />
          )}
          
          <CraftButton
            title="Done"
            onPress={onClose}
            variant="primary"
            style={styles.actionButton}
          />
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    backgroundColor: '#FFF',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scoreCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  reviewFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reviewText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 4,
    fontWeight: '500',
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 24,
    color: '#666',
    marginLeft: 4,
  },
  skillLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B4513',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  skillEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  skillLevel: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  overallFeedback: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  criteriaCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  criteriaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  criteriaTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  criteriaIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  criteriaName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  criteriaScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criteriaScoreText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  criteriaWeight: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  criteriaFeedback: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
  confidenceIndicator: {
    alignSelf: 'flex-end',
  },
  confidenceText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
  },
  listBullet: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  listText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
    flex: 1,
  },
  metadataCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  metadataLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  metadataValue: {
    fontSize: 14,
    color: '#333',
  },
  reviewReason: {
    color: '#FF9800',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  actionSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  actionButton: {
    marginBottom: 12,
  },
  bottomSpacing: {
    height: 40,
  },
}); 