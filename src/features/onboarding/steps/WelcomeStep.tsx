import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { CraftButton } from '../../../shared/components/CraftButton';
import { OnboardingScreenProps } from '../../../shared/types/onboarding';

const { width, height } = Dimensions.get('window');

export function WelcomeStep({ onNext, progress }: OnboardingScreenProps) {
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

      {/* Main content */}
      <View style={styles.content}>
        {/* App logo/icon */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🔨</Text>
          <Text style={styles.appName}>SnapCraft</Text>
        </View>

        {/* Welcome message */}
        <View style={styles.messageContainer}>
          <Text style={styles.welcomeTitle}>Welcome to SnapCraft!</Text>
          <Text style={styles.welcomeSubtitle}>
            Your journey into craft mastery begins here
          </Text>
          
          <Text style={styles.description}>
            SnapCraft helps you document, learn, and master traditional crafts through:
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📸</Text>
              <Text style={styles.featureText}>AI-powered project documentation</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureText}>Skill assessment and progression tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🛠️</Text>
              <Text style={styles.featureText}>Smart tool inventory management</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>👥</Text>
              <Text style={styles.featureText}>Community sharing and inspiration</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionContainer}>
        <CraftButton
          title="Let's Get Started!"
          onPress={() => onNext()}
          style={styles.primaryButton}
          textStyle={styles.primaryButtonText}
        />
        
        <Text style={styles.timeEstimate}>
          This setup takes about 2 minutes
        </Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B4513',
    textAlign: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    maxWidth: width * 0.85,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C1810',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#8B4513',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 16,
    color: '#5D4037',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresList: {
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
  },
  featureText: {
    fontSize: 16,
    color: '#5D4037',
    flex: 1,
    lineHeight: 22,
  },
  actionContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  primaryButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeEstimate: {
    fontSize: 14,
    color: '#8B4513',
    textAlign: 'center',
    opacity: 0.8,
  },
}); 