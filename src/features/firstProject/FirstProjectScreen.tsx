import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { FirstProjectService } from '../../services/firstProject/FirstProjectService';
import { ProjectTemplate, FirstProjectGuidance, User } from '../../shared/types';
import { useAuthStore } from '../../stores/authStore';
import { CraftCard } from '../../shared/components/CraftCard';
import { CraftButton } from '../../shared/components/CraftButton';
import { Typography } from '../../shared/components/Typography';

const { width } = Dimensions.get('window');

export function FirstProjectScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [currentGuidance, setCurrentGuidance] = useState<FirstProjectGuidance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);

  useEffect(() => {
    loadFirstProjectData();
  }, [user]);

  const loadFirstProjectData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get user's current guidance progress
      const guidance = await FirstProjectService.getGuidanceProgress(user.id);
      setCurrentGuidance(guidance);

      // Get recommended templates for the user
      const recommendedTemplates = FirstProjectService.getRecommendedTemplates(user);
      setTemplates(recommendedTemplates);

      console.log(`📋 Loaded first project data for ${user.displayName}`);
      console.log(`📊 Found ${recommendedTemplates.length} recommended templates`);
      console.log(`🎯 Current guidance: ${guidance ? 'Active' : 'None'}`);
    } catch (error) {
      console.error('Error loading first project data:', error);
      Alert.alert('Error', 'Failed to load project templates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartProject = async (template: ProjectTemplate) => {
    if (!user) return;

    try {
      Alert.alert(
        'Start Your First Project',
        `Ready to begin "${template.name}"? This project will take approximately ${Math.round(template.estimatedTime / 60)} hours to complete.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Project',
            onPress: async () => {
              await FirstProjectService.startFirstProjectGuidance(user.id, template.id);
              setSelectedTemplate(template);
              router.push(`/first-project/${template.id}`);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error starting project:', error);
      Alert.alert('Error', 'Failed to start project. Please try again.');
    }
  };

  const handleContinueProject = () => {
    if (currentGuidance?.selectedTemplate) {
      router.push(`/first-project/${currentGuidance.selectedTemplate.id}`);
    }
  };

  const renderProjectTemplate = (template: ProjectTemplate) => (
    <CraftCard key={template.id} style={styles.templateCard}>
      <View style={styles.templateHeader}>
        <View style={styles.templateInfo}>
          <Typography variant="h3" style={styles.templateName}>
            {template.name}
          </Typography>
          <Typography variant="body2" style={styles.templateDescription}>
            {template.description}
          </Typography>
        </View>
        <View style={styles.templateMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color="#8B7355" />
            <Typography variant="caption" style={styles.metaText}>
              {Math.round(template.estimatedTime / 60)}h
            </Typography>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="star-outline" size={16} color="#8B7355" />
            <Typography variant="caption" style={styles.metaText}>
              {template.difficulty}
            </Typography>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#8B7355" />
            <Typography variant="caption" style={styles.metaText}>
              {template.completionRate}%
            </Typography>
          </View>
        </View>
      </View>

      <View style={styles.templateContent}>
        <View style={styles.materialsSection}>
          <Typography variant="body2" style={styles.sectionTitle}>
            Materials Needed:
          </Typography>
          {template.materials.slice(0, 3).map((material, index) => (
            <Typography key={index} variant="caption" style={styles.materialItem}>
              • {material}
            </Typography>
          ))}
          {template.materials.length > 3 && (
            <Typography variant="caption" style={styles.materialItem}>
              • +{template.materials.length - 3} more items
            </Typography>
          )}
        </View>

        <View style={styles.toolsSection}>
          <Typography variant="body2" style={styles.sectionTitle}>
            Tools Required:
          </Typography>
          {template.tools.slice(0, 3).map((tool, index) => (
            <Typography key={index} variant="caption" style={styles.toolItem}>
              • {tool}
            </Typography>
          ))}
          {template.tools.length > 3 && (
            <Typography variant="caption" style={styles.toolItem}>
              • +{template.tools.length - 3} more tools
            </Typography>
          )}
        </View>
      </View>

      <View style={styles.templateActions}>
        <CraftButton
          title="Start Project"
          onPress={() => handleStartProject(template)}
          variant="primary"
          style={styles.startButton}
        />
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => {
            // Show detailed template view
            Alert.alert(
              template.name,
              `${template.description}\n\nSteps: ${template.steps.length}\nDifficulty: ${template.difficulty}\nCraft Type: ${template.craftType}`
            );
          }}
        >
          <Ionicons name="information-circle-outline" size={20} color="#8B7355" />
        </TouchableOpacity>
      </View>
    </CraftCard>
  );

  const renderCurrentGuidance = () => {
    if (!currentGuidance || !currentGuidance.selectedTemplate) return null;

    const template = currentGuidance.selectedTemplate;
    const progress = (currentGuidance.completedSteps.length / template.steps.length) * 100;
    const isCompleted = currentGuidance.completedAt !== undefined;

    return (
      <CraftCard style={styles.guidanceCard}>
        <View style={styles.guidanceHeader}>
          <Ionicons name="hammer-outline" size={24} color="#D4AF37" />
          <Typography variant="h3" style={styles.guidanceTitle}>
            {isCompleted ? 'Project Completed!' : 'Current Project'}
          </Typography>
        </View>

        <Typography variant="h4" style={styles.currentProjectName}>
          {template.name}
        </Typography>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Typography variant="caption" style={styles.progressText}>
            {currentGuidance.completedSteps.length} of {template.steps.length} steps completed
          </Typography>
        </View>

        {isCompleted ? (
          <View style={styles.completedSection}>
            <Ionicons name="trophy-outline" size={32} color="#D4AF37" />
            <Typography variant="body1" style={styles.completedText}>
              Congratulations! You've completed your first project!
            </Typography>
            <CraftButton
              title="Share Your Achievement"
              onPress={() => router.push('/profile')}
              variant="secondary"
              style={styles.shareButton}
            />
          </View>
        ) : (
          <CraftButton
            title="Continue Project"
            onPress={handleContinueProject}
            variant="primary"
            style={styles.continueButton}
          />
        )}
      </CraftCard>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Typography variant="body1" style={styles.loadingText}>
            Loading your first project...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Typography variant="h1" style={styles.title}>
            Your First Project
          </Typography>
          <Typography variant="body1" style={styles.subtitle}>
            Choose a beginner-friendly project to start your crafting journey
          </Typography>
        </View>

        {renderCurrentGuidance()}

        {!currentGuidance && (
          <View style={styles.templatesSection}>
            <Typography variant="h2" style={styles.sectionHeader}>
              Recommended Projects
            </Typography>
            <Typography variant="body2" style={styles.sectionDescription}>
              These projects are perfect for your skill level and craft interests
            </Typography>

            {templates.map(renderProjectTemplate)}

            {templates.length === 0 && (
              <CraftCard style={styles.emptyCard}>
                <Ionicons name="construct-outline" size={48} color="#8B7355" />
                <Typography variant="h3" style={styles.emptyTitle}>
                  No Projects Available
                </Typography>
                <Typography variant="body2" style={styles.emptyDescription}>
                  Complete your onboarding to get personalized project recommendations
                </Typography>
                <CraftButton
                  title="Complete Onboarding"
                  onPress={() => router.push('/onboarding')}
                  variant="primary"
                  style={styles.onboardingButton}
                />
              </CraftCard>
            )}
          </View>
        )}

        <View style={styles.helpSection}>
          <CraftCard style={styles.helpCard}>
            <Ionicons name="help-circle-outline" size={24} color="#8B7355" />
            <Typography variant="h3" style={styles.helpTitle}>
              Need Help Getting Started?
            </Typography>
            <Typography variant="body2" style={styles.helpDescription}>
              Check out our interactive tutorials to learn the basics
            </Typography>
            <CraftButton
              title="View Tutorials"
              onPress={() => router.push('/tutorials')}
              variant="secondary"
              style={styles.tutorialsButton}
            />
          </CraftCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3F0',
  },
  scrollView: {
    flex: 1,
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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    color: '#2C1810',
    marginBottom: 8,
  },
  subtitle: {
    color: '#8B7355',
    lineHeight: 22,
  },
  guidanceCard: {
    margin: 20,
    marginTop: 10,
    padding: 20,
    backgroundColor: '#FFF8E7',
    borderColor: '#D4AF37',
    borderWidth: 1,
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guidanceTitle: {
    color: '#2C1810',
    marginLeft: 8,
  },
  currentProjectName: {
    color: '#2C1810',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E8DCC0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 4,
  },
  progressText: {
    color: '#8B7355',
    textAlign: 'center',
  },
  completedSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  completedText: {
    color: '#2C1810',
    textAlign: 'center',
    marginVertical: 12,
  },
  shareButton: {
    marginTop: 8,
  },
  continueButton: {
    width: '100%',
  },
  templatesSection: {
    padding: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    color: '#2C1810',
    marginBottom: 8,
  },
  sectionDescription: {
    color: '#8B7355',
    marginBottom: 20,
  },
  templateCard: {
    marginBottom: 20,
    padding: 16,
  },
  templateHeader: {
    marginBottom: 16,
  },
  templateInfo: {
    marginBottom: 12,
  },
  templateName: {
    color: '#2C1810',
    marginBottom: 4,
  },
  templateDescription: {
    color: '#8B7355',
    lineHeight: 20,
  },
  templateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: {
    color: '#8B7355',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  templateContent: {
    marginBottom: 16,
  },
  materialsSection: {
    marginBottom: 12,
  },
  toolsSection: {
    marginBottom: 0,
  },
  sectionTitle: {
    color: '#2C1810',
    fontWeight: '600',
    marginBottom: 4,
  },
  materialItem: {
    color: '#8B7355',
    marginLeft: 8,
    marginBottom: 2,
  },
  toolItem: {
    color: '#8B7355',
    marginLeft: 8,
    marginBottom: 2,
  },
  templateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startButton: {
    flex: 1,
    marginRight: 12,
  },
  detailsButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F3F0',
    borderWidth: 1,
    borderColor: '#E8DCC0',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#2C1810',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 20,
  },
  onboardingButton: {
    minWidth: 200,
  },
  helpSection: {
    padding: 20,
    paddingTop: 0,
  },
  helpCard: {
    alignItems: 'center',
    padding: 20,
  },
  helpTitle: {
    color: '#2C1810',
    marginTop: 12,
    marginBottom: 8,
  },
  helpDescription: {
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 16,
  },
  tutorialsButton: {
    minWidth: 150,
  },
}); 