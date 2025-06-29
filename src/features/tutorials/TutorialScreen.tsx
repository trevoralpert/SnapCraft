import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Tutorial, TutorialProgress, User } from '../../shared/types';
import { TutorialService } from '../../services/tutorials/TutorialService';
import { useAuthStore } from '../../stores/authStore';
import { CraftButton } from '../../shared/components/CraftButton';

export function TutorialScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [userProgress, setUserProgress] = useState<{ [tutorialId: string]: TutorialProgress }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTutorials();
  }, [user]);

  const loadTutorials = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const availableTutorials = TutorialService.getAvailableTutorials();
      const progress = await TutorialService.getTutorialProgress(user.id);
      
      setTutorials(availableTutorials);
      setUserProgress(progress);
    } catch (error) {
      console.error('Error loading tutorials:', error);
      Alert.alert('Error', 'Failed to load tutorials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startTutorial = async (tutorialId: string) => {
    if (!user) return;

    try {
      await TutorialService.startTutorial(user.id, tutorialId);
      router.push(`/tutorial/${tutorialId}`);
    } catch (error) {
      console.error('Error starting tutorial:', error);
      Alert.alert('Error', 'Failed to start tutorial. Please try again.');
    }
  };

  const getTutorialStatusIcon = (tutorial: Tutorial) => {
    const progress = userProgress[tutorial.id];
    if (progress?.completedAt) return '✅';
    if (progress?.startedAt) return '⏳';
    return '🎯';
  };

  const getTutorialStatusText = (tutorial: Tutorial) => {
    const progress = userProgress[tutorial.id];
    if (progress?.completedAt) return 'Completed';
    if (progress?.startedAt) {
      const completedSteps = progress.completedSteps.length;
      const totalSteps = tutorial.steps.length;
      return `${completedSteps}/${totalSteps} steps`;
    }
    return 'Not started';
  };

  const canStartTutorial = (tutorial: Tutorial) => {
    if (!tutorial.prerequisites) return true;
    
    return tutorial.prerequisites.every(prereqId => {
      const prereqProgress = userProgress[prereqId];
      return prereqProgress?.completedAt;
    });
  };

  const getDifficultyColor = (difficulty: Tutorial['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#757575';
    }
  };

  const getCategoryIcon = (category: Tutorial['category']) => {
    switch (category) {
      case 'camera': return '📸';
      case 'tools': return '🔨';
      case 'documentation': return '📝';
      case 'general': return '🎓';
      default: return '📚';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tutorials...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Interactive Tutorials</Text>
          <Text style={styles.subtitle}>
            Master SnapCraft's features with hands-on tutorials
          </Text>
        </View>

        <View style={styles.tutorialsList}>
          {tutorials.map((tutorial) => {
            const isCompleted = userProgress[tutorial.id]?.completedAt;
            const canStart = canStartTutorial(tutorial);
            const progress = userProgress[tutorial.id];

            return (
              <View key={tutorial.id} style={styles.tutorialCard}>
                <View style={styles.tutorialHeader}>
                  <View style={styles.tutorialInfo}>
                    <View style={styles.tutorialTitleRow}>
                      <Text style={styles.categoryIcon}>
                        {getCategoryIcon(tutorial.category)}
                      </Text>
                      <Text style={styles.tutorialTitle}>{tutorial.name}</Text>
                      <Text style={styles.statusIcon}>
                        {getTutorialStatusIcon(tutorial)}
                      </Text>
                    </View>
                    <Text style={styles.tutorialDescription}>
                      {tutorial.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.tutorialMeta}>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Duration</Text>
                      <Text style={styles.metaValue}>{tutorial.estimatedDuration} min</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Difficulty</Text>
                      <Text style={[
                        styles.metaValue,
                        { color: getDifficultyColor(tutorial.difficulty) }
                      ]}>
                        {tutorial.difficulty}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Steps</Text>
                      <Text style={styles.metaValue}>{tutorial.steps.length}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.statusRow}>
                    <Text style={styles.statusText}>
                      {getTutorialStatusText(tutorial)}
                    </Text>
                    {tutorial.isRequired && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>Required</Text>
                      </View>
                    )}
                  </View>
                </View>

                {!canStart && (
                  <View style={styles.prerequisiteWarning}>
                    <Text style={styles.prerequisiteText}>
                      Complete prerequisites first: {
                        tutorial.prerequisites?.map(prereqId => {
                          const prereq = tutorials.find(t => t.id === prereqId);
                          return prereq?.name;
                        }).join(', ')
                      }
                    </Text>
                  </View>
                )}

                <View style={styles.tutorialActions}>
                  {isCompleted ? (
                    <CraftButton
                      title="Review Tutorial"
                      onPress={() => router.push(`/tutorial/${tutorial.id}`)}
                      variant="secondary"
                      style={styles.actionButton}
                    />
                  ) : progress?.startedAt ? (
                    <CraftButton
                      title="Continue Tutorial"
                      onPress={() => router.push(`/tutorial/${tutorial.id}`)}
                      disabled={!canStart}
                      style={styles.actionButton}
                    />
                  ) : (
                    <CraftButton
                      title="Start Tutorial"
                      onPress={() => startTutorial(tutorial.id)}
                      disabled={!canStart}
                      style={styles.actionButton}
                    />
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Complete all required tutorials to unlock advanced features
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0522D',
    lineHeight: 22,
  },
  tutorialsList: {
    padding: 20,
    paddingTop: 10,
  },
  tutorialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tutorialHeader: {
    marginBottom: 12,
  },
  tutorialInfo: {
    flex: 1,
  },
  tutorialTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  tutorialTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1810',
  },
  statusIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  tutorialDescription: {
    fontSize: 14,
    color: '#5D4E37',
    lineHeight: 20,
  },
  tutorialMeta: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1810',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#5D4E37',
    fontWeight: '500',
  },
  requiredBadge: {
    backgroundColor: '#FFA726',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  prerequisiteWarning: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  prerequisiteText: {
    fontSize: 12,
    color: '#E65100',
    fontStyle: 'italic',
  },
  tutorialActions: {
    marginTop: 8,
  },
  actionButton: {
    marginTop: 0,
  },
  footer: {
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 