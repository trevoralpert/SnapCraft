import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Tutorial, TutorialStep, TutorialProgress } from '../../shared/types';
import { TutorialService } from '../../services/tutorials/TutorialService';
import { useAuthStore } from '../../stores/authStore';
import { CraftButton } from '../../shared/components/CraftButton';

const { width: screenWidth } = Dimensions.get('window');

export function TutorialRunner() {
  const router = useRouter();
  const { tutorialId } = useLocalSearchParams<{ tutorialId: string }>();
  const { user } = useAuthStore();
  
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState<TutorialProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepStartTime, setStepStartTime] = useState<Date>(new Date());
  
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tutorialId && user) {
      loadTutorial();
    }
  }, [tutorialId, user]);

  useEffect(() => {
    // Animate progress bar
    const progressPercent = tutorial ? (currentStepIndex / tutorial.steps.length) : 0;
    Animated.timing(progressAnimation, {
      toValue: progressPercent,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Fade in content
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentStepIndex, tutorial]);

  const loadTutorial = async () => {
    if (!tutorialId || !user) return;

    try {
      setLoading(true);
      const tutorials = TutorialService.getAvailableTutorials();
      const foundTutorial = tutorials.find(t => t.id === tutorialId);
      
      if (!foundTutorial) {
        Alert.alert('Error', 'Tutorial not found');
        router.back();
        return;
      }

      const userProgress = await TutorialService.getTutorialProgress(user.id);
      const tutorialProgress = userProgress[tutorialId];

      setTutorial(foundTutorial);
      setProgress(tutorialProgress);

      // Set current step based on progress
      if (tutorialProgress?.currentStepId) {
        const stepIndex = foundTutorial.steps.findIndex(
          step => step.id === tutorialProgress.currentStepId
        );
        setCurrentStepIndex(Math.max(0, stepIndex));
      }

      setStepStartTime(new Date());
    } catch (error) {
      console.error('Error loading tutorial:', error);
      Alert.alert('Error', 'Failed to load tutorial');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const completeCurrentStep = async () => {
    if (!tutorial || !user) return;

    try {
      const currentStep = tutorial.steps[currentStepIndex];
      await TutorialService.completeStep(user.id, tutorial.id, currentStep.id);
      
      // Update local progress
      const userProgress = await TutorialService.getTutorialProgress(user.id);
      setProgress(userProgress[tutorial.id]);

      // Move to next step or complete tutorial
      if (currentStepIndex < tutorial.steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
        setStepStartTime(new Date());
      } else {
        // Tutorial completed
        Alert.alert(
          'Tutorial Complete! 🎉',
          `Congratulations! You've completed the "${tutorial.name}" tutorial.`,
          [
            {
              text: 'Back to Tutorials',
              onPress: () => router.replace('/tutorials'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error completing step:', error);
      Alert.alert('Error', 'Failed to complete step');
    }
  };

  const skipTutorial = async () => {
    if (!tutorial || !user) return;

    Alert.alert(
      'Skip Tutorial?',
      'Are you sure you want to skip this tutorial? You can always come back to it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            try {
              await TutorialService.skipTutorial(user.id, tutorial.id);
              router.replace('/tutorials');
            } catch (error) {
              console.error('Error skipping tutorial:', error);
              Alert.alert('Error', 'Failed to skip tutorial');
            }
          },
        },
      ]
    );
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setStepStartTime(new Date());
    }
  };

  const getStepIcon = (step: TutorialStep) => {
    switch (step.type) {
      case 'camera': return '📸';
      case 'tool-identification': return '🔍';
      case 'documentation': return '📝';
      case 'vision-mode': return '👁️';
      default: return '📚';
    }
  };

  const getStepContent = (step: TutorialStep) => {
    // This would be expanded with actual interactive content based on step type
    switch (step.type) {
      case 'camera':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepIcon}>{getStepIcon(step)}</Text>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
            
            {step.interactionRequired && (
              <View style={styles.interactionHint}>
                <Text style={styles.interactionText}>
                  📱 Try taking a photo using the camera to continue
                </Text>
              </View>
            )}
          </View>
        );

      case 'tool-identification':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepIcon}>{getStepIcon(step)}</Text>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
            
            {step.interactionRequired && (
              <View style={styles.interactionHint}>
                <Text style={styles.interactionText}>
                  🔨 Point your camera at a tool to see AI identification in action
                </Text>
              </View>
            )}
          </View>
        );

      case 'vision-mode':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepIcon}>{getStepIcon(step)}</Text>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
            
            <View style={styles.visionModeExplanation}>
              <Text style={styles.visionModeTitle}>Available Vision Modes:</Text>
              <Text style={styles.visionModeItem}>• 👁️ General - Overall project analysis</Text>
              <Text style={styles.visionModeItem}>• 🔍 Tool ID - Identify tools in photos</Text>
              <Text style={styles.visionModeItem}>• ⚙️ Process - Analyze craft techniques</Text>
              <Text style={styles.visionModeItem}>• ✅ Quality - Check work quality</Text>
            </View>
          </View>
        );

      case 'documentation':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepIcon}>{getStepIcon(step)}</Text>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
            
            <View style={styles.documentationTips}>
              <Text style={styles.tipsTitle}>Documentation Best Practices:</Text>
              <Text style={styles.tipItem}>📷 Take before, during, and after photos</Text>
              <Text style={styles.tipItem}>📝 Describe your process and challenges</Text>
              <Text style={styles.tipItem}>🔨 List tools and materials used</Text>
              <Text style={styles.tipItem}>⏱️ Track time spent on the project</Text>
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepIcon}>{getStepIcon(step)}</Text>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
          </View>
        );
    }
  };

  if (loading || !tutorial) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tutorial...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStep = tutorial.steps[currentStepIndex];
  const isLastStep = currentStepIndex === tutorial.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.tutorialTitle}>{tutorial.name}</Text>
          <Text style={styles.stepCounter}>
            Step {currentStepIndex + 1} of {tutorial.steps.length}
          </Text>
        </View>

        <TouchableOpacity onPress={skipTutorial} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* Step Content */}
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnimation }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {getStepContent(currentStep)}
        </ScrollView>
      </Animated.View>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <View style={styles.navigationButtons}>
          {!isFirstStep && (
            <CraftButton
              title="Previous"
              onPress={goToPreviousStep}
              variant="secondary"
              style={styles.navButton}
            />
          )}
          
          <CraftButton
            title={isLastStep ? 'Complete Tutorial' : 'Next Step'}
            onPress={completeCurrentStep}
            style={[styles.navButton, styles.nextButton]}
          />
        </View>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0D5C7',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F1E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  tutorialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1810',
    textAlign: 'center',
  },
  stepCounter: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 2,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F1E8',
  },
  skipButtonText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E0D5C7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B4513',
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  stepIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1810',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: '#5D4E37',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  interactionHint: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    marginTop: 16,
  },
  interactionText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
    textAlign: 'center',
  },
  visionModeExplanation: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignSelf: 'stretch',
  },
  visionModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1810',
    marginBottom: 12,
  },
  visionModeItem: {
    fontSize: 14,
    color: '#5D4E37',
    marginBottom: 8,
    lineHeight: 20,
  },
  documentationTips: {
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignSelf: 'stretch',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1810',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: '#5D4E37',
    marginBottom: 8,
    lineHeight: 20,
  },
  navigationContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0D5C7',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flex: 1,
    marginTop: 0,
  },
  nextButton: {
    flex: 2,
  },
}); 