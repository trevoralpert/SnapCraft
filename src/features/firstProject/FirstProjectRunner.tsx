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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { FirstProjectService } from '../../services/firstProject/FirstProjectService';
import { ProjectTemplate, ProjectStep, FirstProjectGuidance } from '../../shared/types';
import { useAuthStore } from '../../stores/authStore';
import { CraftCard } from '../../shared/components/CraftCard';
import { CraftButton } from '../../shared/components/CraftButton';
import { Typography } from '../../shared/components/Typography';

const { width } = Dimensions.get('window');

export function FirstProjectRunner() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const { user } = useAuthStore();
  
  const [template, setTemplate] = useState<ProjectTemplate | null>(null);
  const [guidance, setGuidance] = useState<FirstProjectGuidance | null>(null);
  const [currentStep, setCurrentStep] = useState<ProjectStep | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTips, setShowTips] = useState(false);
  const [showSafety, setShowSafety] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [templateId, user]);

  const loadProjectData = async () => {
    if (!templateId || !user) return;

    try {
      setIsLoading(true);

      // Get the template
      const templates = FirstProjectService.getProjectTemplates();
      const foundTemplate = templates.find(t => t.id === templateId);
      
      if (!foundTemplate) {
        Alert.alert('Error', 'Project template not found');
        router.back();
        return;
      }

      setTemplate(foundTemplate);

      // Get user's guidance progress
      const userGuidance = await FirstProjectService.getGuidanceProgress(user.id);
      
      if (!userGuidance) {
        // Start guidance if not already started
        await FirstProjectService.startFirstProjectGuidance(user.id, templateId);
        const newGuidance = await FirstProjectService.getGuidanceProgress(user.id);
        setGuidance(newGuidance);
      } else {
        setGuidance(userGuidance);
      }

      // Set current step
      const stepIndex = userGuidance?.currentStep || 0;
      setCurrentStep(foundTemplate.steps[stepIndex] || foundTemplate.steps[0]);

      console.log(`📋 Loaded project: ${foundTemplate.name}`);
      console.log(`🎯 Current step: ${stepIndex + 1}/${foundTemplate.steps.length}`);
    } catch (error) {
      console.error('Error loading project data:', error);
      Alert.alert('Error', 'Failed to load project. Please try again.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteStep = async () => {
    if (!currentStep || !guidance || !template || !user) return;

    try {
      // Complete the current step
      await FirstProjectService.completeStep(user.id, currentStep.id);
      
      // Reload guidance to get updated progress
      const updatedGuidance = await FirstProjectService.getGuidanceProgress(user.id);
      setGuidance(updatedGuidance);

      // Check if project is completed
      if (updatedGuidance?.completedAt) {
        Alert.alert(
          '🎉 Project Completed!',
          'Congratulations! You\'ve completed your first project. Take a moment to admire your work!',
          [
            {
              text: 'Share Achievement',
              onPress: () => router.push('/profile'),
            },
            {
              text: 'Continue',
              onPress: () => router.push('/first-project'),
              style: 'default',
            },
          ]
        );
        return;
      }

      // Move to next step
      const nextStepIndex = updatedGuidance?.currentStep || 0;
      const nextStep = template.steps[nextStepIndex];
      
      if (nextStep) {
        setCurrentStep(nextStep);
        Alert.alert(
          'Step Completed!',
          `Great work! Moving on to: ${nextStep.title}`,
          [{ text: 'Continue', style: 'default' }]
        );
      }

      console.log(`✅ Step ${currentStep.id} completed`);
    } catch (error) {
      console.error('Error completing step:', error);
      Alert.alert('Error', 'Failed to complete step. Please try again.');
    }
  };

  const handleTakePhoto = () => {
    // Navigate to camera with project context
    router.push({
      pathname: '/camera',
      params: {
        projectId: template?.id,
        stepId: currentStep?.id,
        context: 'first-project',
      },
    });
  };

  const handlePreviousStep = () => {
    if (!template || !guidance) return;

    const currentIndex = template.steps.findIndex(s => s.id === currentStep?.id);
    if (currentIndex > 0) {
      setCurrentStep(template.steps[currentIndex - 1]);
    }
  };

  const handleNextStep = () => {
    if (!template || !guidance) return;

    const currentIndex = template.steps.findIndex(s => s.id === currentStep?.id);
    if (currentIndex < template.steps.length - 1) {
      setCurrentStep(template.steps[currentIndex + 1]);
    }
  };

  const renderProgressBar = () => {
    if (!template || !guidance) return null;

    const progress = (guidance.completedSteps.length / template.steps.length) * 100;
    const currentStepIndex = template.steps.findIndex(s => s.id === currentStep?.id) + 1;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Typography variant="body2" style={styles.progressLabel}>
            Step {currentStepIndex} of {template.steps.length}
          </Typography>
          <Typography variant="caption" style={styles.progressPercent}>
            {Math.round(progress)}% Complete
          </Typography>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    );
  };

  const renderStepContent = () => {
    if (!currentStep) return null;

    const isCompleted = guidance?.completedSteps.includes(currentStep.id) || false;

    return (
      <CraftCard style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <View style={styles.stepTitleContainer}>
            <Ionicons 
              name={isCompleted ? "checkmark-circle" : "radio-button-off"} 
              size={24} 
              color={isCompleted ? "#4CAF50" : "#8B7355"} 
            />
            <Typography variant="h2" style={styles.stepTitle}>
              {currentStep.title}
            </Typography>
          </View>
          <Typography variant="caption" style={styles.stepDuration}>
            ~{currentStep.estimatedTime} min
          </Typography>
        </View>

        <Typography variant="body1" style={styles.stepDescription}>
          {currentStep.description}
        </Typography>

        <View style={styles.instructionsSection}>
          <Typography variant="h3" style={styles.sectionTitle}>
            Instructions:
          </Typography>
          {currentStep.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>{index + 1}</Text>
              <Typography variant="body2" style={styles.instructionText}>
                {instruction}
              </Typography>
            </View>
          ))}
        </View>

        {currentStep.photoRequired && (
          <View style={styles.photoSection}>
            <View style={styles.photoPrompt}>
              <Ionicons name="camera-outline" size={20} color="#D4AF37" />
              <Typography variant="body2" style={styles.photoText}>
                Photo documentation required for this step
              </Typography>
            </View>
            <CraftButton
              title="Take Photo"
              onPress={handleTakePhoto}
              variant="secondary"
              style={styles.photoButton}
              icon="camera-outline"
            />
          </View>
        )}

        <View style={styles.helpButtons}>
          {currentStep.tips.length > 0 && (
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => setShowTips(true)}
            >
              <Ionicons name="bulb-outline" size={20} color="#D4AF37" />
              <Typography variant="body2" style={styles.helpButtonText}>
                Tips ({currentStep.tips.length})
              </Typography>
            </TouchableOpacity>
          )}

          {currentStep.safetyNotes && currentStep.safetyNotes.length > 0 && (
            <TouchableOpacity
              style={[styles.helpButton, styles.safetyButton]}
              onPress={() => setShowSafety(true)}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color="#FF6B35" />
              <Typography variant="body2" style={[styles.helpButtonText, styles.safetyText]}>
                Safety
              </Typography>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.stepActions}>
          <CraftButton
            title={isCompleted ? "Mark Complete Again" : "Complete Step"}
            onPress={handleCompleteStep}
            variant="primary"
            style={styles.completeButton}
            disabled={isCompleted}
          />
        </View>
      </CraftCard>
    );
  };

  const renderNavigationButtons = () => {
    if (!template || !currentStep) return null;

    const currentIndex = template.steps.findIndex(s => s.id === currentStep.id);
    const canGoPrevious = currentIndex > 0;
    const canGoNext = currentIndex < template.steps.length - 1;

    return (
      <View style={styles.navigationContainer}>
        <CraftButton
          title="Previous"
          onPress={handlePreviousStep}
          variant="secondary"
          style={[styles.navButton, !canGoPrevious && styles.disabledButton]}
          disabled={!canGoPrevious}
          icon="chevron-back-outline"
        />
        <CraftButton
          title="Next"
          onPress={handleNextStep}
          variant="secondary"
          style={[styles.navButton, !canGoNext && styles.disabledButton]}
          disabled={!canGoNext}
          icon="chevron-forward-outline"
        />
      </View>
    );
  };

  const renderTipsModal = () => (
    <Modal
      visible={showTips}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowTips(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Typography variant="h2" style={styles.modalTitle}>
            💡 Helpful Tips
          </Typography>
          <TouchableOpacity
            onPress={() => setShowTips(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#8B7355" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          {currentStep?.tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Ionicons name="bulb" size={16} color="#D4AF37" />
              <Typography variant="body2" style={styles.tipText}>
                {tip}
              </Typography>
            </View>
          ))}
          {currentStep?.commonMistakes && (
            <View style={styles.mistakesSection}>
              <Typography variant="h3" style={styles.mistakesTitle}>
                Common Mistakes to Avoid:
              </Typography>
              {currentStep.commonMistakes.map((mistake, index) => (
                <View key={index} style={styles.mistakeItem}>
                  <Ionicons name="warning" size={16} color="#FF6B35" />
                  <Typography variant="body2" style={styles.mistakeText}>
                    {mistake}
                  </Typography>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderSafetyModal = () => (
    <Modal
      visible={showSafety}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowSafety(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Typography variant="h2" style={styles.modalTitle}>
            🛡️ Safety Notes
          </Typography>
          <TouchableOpacity
            onPress={() => setShowSafety(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#8B7355" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          {currentStep?.safetyNotes?.map((note, index) => (
            <View key={index} style={styles.safetyItem}>
              <Ionicons name="shield-checkmark" size={16} color="#FF6B35" />
              <Typography variant="body2" style={styles.safetyNoteText}>
                {note}
              </Typography>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Typography variant="body1" style={styles.loadingText}>
            Loading your project...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  if (!template || !currentStep) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B35" />
          <Typography variant="h3" style={styles.errorTitle}>
            Project Not Found
          </Typography>
          <CraftButton
            title="Go Back"
            onPress={() => router.back()}
            variant="primary"
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButtonHeader}
        >
          <Ionicons name="chevron-back" size={24} color="#8B7355" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Typography variant="h3" style={styles.projectTitle}>
            {template.name}
          </Typography>
        </View>
      </View>

      {renderProgressBar()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
        {renderNavigationButtons()}
      </ScrollView>

      {renderTipsModal()}
      {renderSafetyModal()}
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
  backButtonHeader: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  projectTitle: {
    color: '#2C1810',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#2C1810',
    fontWeight: '600',
  },
  progressPercent: {
    color: '#8B7355',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E8DCC0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  stepCard: {
    margin: 16,
    padding: 20,
  },
  stepHeader: {
    marginBottom: 16,
  },
  stepTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepTitle: {
    color: '#2C1810',
    marginLeft: 8,
    flex: 1,
  },
  stepDuration: {
    color: '#8B7355',
  },
  stepDescription: {
    color: '#8B7355',
    lineHeight: 22,
    marginBottom: 20,
  },
  instructionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#2C1810',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D4AF37',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    color: '#2C1810',
    lineHeight: 20,
  },
  photoSection: {
    backgroundColor: '#FFF8E7',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
    marginBottom: 20,
  },
  photoPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoText: {
    color: '#2C1810',
    marginLeft: 8,
    flex: 1,
  },
  photoButton: {
    alignSelf: 'flex-start',
  },
  helpButtons: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF8E7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
    marginRight: 12,
  },
  safetyButton: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF6B35',
  },
  helpButtonText: {
    color: '#2C1810',
    marginLeft: 4,
    fontSize: 14,
  },
  safetyText: {
    color: '#FF6B35',
  },
  stepActions: {
    marginTop: 8,
  },
  completeButton: {
    width: '100%',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 0,
  },
  navButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  disabledButton: {
    opacity: 0.5,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#2C1810',
    marginTop: 16,
    marginBottom: 20,
  },
  backButton: {
    minWidth: 120,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F3F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC0',
  },
  modalTitle: {
    color: '#2C1810',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFF8E7',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
  },
  tipText: {
    flex: 1,
    color: '#2C1810',
    marginLeft: 8,
    lineHeight: 20,
  },
  mistakesSection: {
    marginTop: 20,
  },
  mistakesTitle: {
    color: '#2C1810',
    marginBottom: 12,
  },
  mistakeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  mistakeText: {
    flex: 1,
    color: '#2C1810',
    marginLeft: 8,
    lineHeight: 20,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  safetyNoteText: {
    flex: 1,
    color: '#2C1810',
    marginLeft: 8,
    lineHeight: 20,
  },
}); 