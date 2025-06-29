import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { CraftButton } from '../../../shared/components/CraftButton';
import { OnboardingScreenProps } from '../../../shared/types/onboarding';

const { width } = Dimensions.get('window');

export function FirstProjectStep({ onNext, onBack, progress }: OnboardingScreenProps) {
  const handleNext = () => {
    onNext({ hasSeenFirstProjectTip: true });
  };

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((progress.currentStep + 1) / progress.totalSteps) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Step {progress.currentStep + 1} of {progress.totalSteps}
        </Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.celebrationIcon}>🎉</Text>
        <Text style={styles.title}>You're Ready to Start Crafting!</Text>
        <Text style={styles.subtitle}>
          Here's how to document your first project for the best results
        </Text>
      </View>

      {/* Main content */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Project documentation guide */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Project Documentation Guide</Text>
            
            <View style={styles.guideList}>
              <View style={styles.guideItem}>
                <View style={styles.guideIcon}>
                  <Text style={styles.guideIconText}>📷</Text>
                </View>
                <View style={styles.guideContent}>
                  <Text style={styles.guideTitle}>Before Photos</Text>
                  <Text style={styles.guideDescription}>
                    Capture your materials, workspace, and tools before starting
                  </Text>
                </View>
              </View>

              <View style={styles.guideItem}>
                <View style={styles.guideIcon}>
                  <Text style={styles.guideIconText}>⚙️</Text>
                </View>
                <View style={styles.guideContent}>
                  <Text style={styles.guideTitle}>Process Shots</Text>
                  <Text style={styles.guideDescription}>
                    Document key steps, techniques, and any challenges you face
                  </Text>
                </View>
              </View>

              <View style={styles.guideItem}>
                <View style={styles.guideIcon}>
                  <Text style={styles.guideIconText}>✨</Text>
                </View>
                <View style={styles.guideContent}>
                  <Text style={styles.guideTitle}>Final Results</Text>
                  <Text style={styles.guideDescription}>
                    Show off your completed project from multiple angles
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* AI scoring benefits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 AI Skill Assessment</Text>
            
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>📊</Text>
                <Text style={styles.benefitText}>
                  Get detailed feedback on technique, tool usage, and safety
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>📈</Text>
                <Text style={styles.benefitText}>
                  Track your skill progression over time with personalized insights
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>💡</Text>
                <Text style={styles.benefitText}>
                  Receive suggestions for improvement and next projects
                </Text>
              </View>
            </View>
          </View>

          {/* Quick start tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚀 Quick Start Tips</Text>
            
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>
                • Start with a simple project to get familiar with the app
              </Text>
              <Text style={styles.tipItem}>
                • Take clear, well-lit photos for the best AI analysis
              </Text>
              <Text style={styles.tipItem}>
                • Add detailed descriptions to help the AI understand your process
              </Text>
              <Text style={styles.tipItem}>
                • Check out community projects for inspiration
              </Text>
              <Text style={styles.tipItem}>
                • Don't forget to identify your tools using the camera!
              </Text>
            </View>
          </View>

          {/* Community encouragement */}
          <View style={styles.encouragementContainer}>
            <Text style={styles.encouragementIcon}>👥</Text>
            <View style={styles.encouragementContent}>
              <Text style={styles.encouragementTitle}>Join the Community</Text>
              <Text style={styles.encouragementText}>
                Share your projects, learn from others, and be part of a supportive crafting community. 
                Every master was once a beginner!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionContainer}>
        <View style={styles.buttonRow}>
          {onBack && (
            <CraftButton
              title="Back"
              onPress={onBack}
              style={styles.secondaryButton}
              textStyle={styles.secondaryButtonText}
            />
          )}
          
          <CraftButton
            title="Start Crafting!"
            onPress={handleNext}
            style={[styles.primaryButton, !onBack ? styles.fullWidthButton : null]}
            textStyle={styles.primaryButtonText}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B4513',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#8B4513',
    textAlign: 'center',
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  celebrationIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C1810',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#5D4037',
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 16,
    textAlign: 'center',
  },
  guideList: {
    gap: 16,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  guideIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  guideIconText: {
    fontSize: 20,
  },
  guideContent: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 4,
  },
  guideDescription: {
    fontSize: 14,
    color: '#5D4037',
    lineHeight: 20,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  benefitText: {
    fontSize: 15,
    color: '#5D4037',
    lineHeight: 22,
    flex: 1,
  },
  tipsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#5D4037',
    lineHeight: 20,
    marginBottom: 4,
  },
  encouragementContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    alignItems: 'flex-start',
  },
  encouragementIcon: {
    fontSize: 32,
    marginRight: 16,
    marginTop: 4,
  },
  encouragementContent: {
    flex: 1,
  },
  encouragementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  encouragementText: {
    fontSize: 15,
    color: '#388E3C',
    lineHeight: 22,
  },
  actionContainer: {
    paddingTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#8B4513',
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fullWidthButton: {
    flex: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8B4513',
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 