import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { CraftButton } from '../../../shared/components/CraftButton';
import { OnboardingScreenProps } from '../../../shared/types/onboarding';

const { width } = Dimensions.get('window');

export function ToolIntroductionStep({ onNext, onBack, progress }: OnboardingScreenProps) {
  const handleNext = () => {
    onNext({ hasSeenToolIntro: true });
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
        <Text style={styles.toolIcon}>🛠️</Text>
        <Text style={styles.title}>Tool Inventory Management</Text>
        <Text style={styles.subtitle}>
          Keep track of your craft tools and get smart recommendations
        </Text>
      </View>

      {/* Main content */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* How it works section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            
            <View style={styles.stepsList}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Point & Identify</Text>
                  <Text style={styles.stepDescription}>
                    Use the camera to identify tools automatically with AI vision
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Add & Organize</Text>
                  <Text style={styles.stepDescription}>
                    Tools are automatically added to your inventory with details
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Track & Improve</Text>
                  <Text style={styles.stepDescription}>
                    Monitor usage patterns and get recommendations for new tools
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Features section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Smart Features</Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🔍</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>AI Tool Recognition</Text>
                  <Text style={styles.featureDescription}>
                    Instantly identify tools from photos with high accuracy
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📊</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Usage Analytics</Text>
                  <Text style={styles.featureDescription}>
                    See which tools you use most and track project associations
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>💡</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Smart Recommendations</Text>
                  <Text style={styles.featureDescription}>
                    Get suggestions for tools that complement your craft style
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🔧</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Maintenance Reminders</Text>
                  <Text style={styles.featureDescription}>
                    Keep your tools in top condition with care notifications
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Getting started tip */}
          <View style={styles.tipContainer}>
            <Text style={styles.tipIcon}>💡</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Getting Started Tip</Text>
              <Text style={styles.tipText}>
                After onboarding, visit the Tools tab and tap the camera icon to start building your inventory!
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
            title="Got It!"
            onPress={handleNext}
            style={[styles.primaryButton, !onBack && styles.fullWidthButton]}
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
  toolIcon: {
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
  stepsList: {
    gap: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#5D4037',
    lineHeight: 20,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#5D4037',
    lineHeight: 20,
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD54F',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#5D4037',
    lineHeight: 20,
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
  },
  fullWidthButton: {
    flex: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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