import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions } from 'react-native';
import { Camera } from 'expo-camera';
import { CraftButton } from '../../../shared/components/CraftButton';
import { OnboardingScreenProps } from '../../../shared/types/onboarding';

const { width } = Dimensions.get('window');

export function CameraPermissionsStep({ onNext, onBack, progress }: OnboardingScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Camera.getCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const requestPermissions = async () => {
    setIsLoading(true);
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        // Permission granted, can proceed
      } else {
        Alert.alert(
          'Camera Permission Required',
          'SnapCraft needs camera access to help you document your craft projects. You can enable this in Settings later.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      Alert.alert('Error', 'Failed to request camera permissions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    onNext({ cameraPermissionGranted: hasPermission === true });
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

      {/* Main content */}
      <View style={styles.content}>
        {/* Camera icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.cameraIcon}>📸</Text>
        </View>

        {/* Title and description */}
        <Text style={styles.title}>Camera Permissions & Tutorial</Text>
        <Text style={styles.description}>
          SnapCraft uses your camera to help document your craft projects and identify tools using AI vision.
        </Text>

        {/* Features list */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔍</Text>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Tool Identification</Text>
              <Text style={styles.featureDescription}>
                Point your camera at tools to automatically identify and add them to your inventory
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📊</Text>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Project Documentation</Text>
              <Text style={styles.featureDescription}>
                Capture before, during, and after photos for AI-powered skill assessment
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📖</Text>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Story Creation</Text>
              <Text style={styles.featureDescription}>
                Share your craft journey with the community through visual stories
              </Text>
            </View>
          </View>
        </View>

        {/* Permission status */}
        <View style={styles.permissionStatus}>
          {hasPermission === null ? (
            <Text style={styles.statusText}>Checking camera permissions...</Text>
          ) : hasPermission ? (
            <View style={styles.statusContainer}>
              <Text style={styles.statusIcon}>✅</Text>
              <Text style={styles.statusTextSuccess}>Camera permission granted!</Text>
            </View>
          ) : (
            <View style={styles.statusContainer}>
              <Text style={styles.statusIcon}>📷</Text>
              <Text style={styles.statusTextPending}>Camera permission needed</Text>
            </View>
          )}
        </View>
      </View>

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
          
          {hasPermission ? (
            <CraftButton
              title="Continue"
              onPress={handleNext}
              style={!onBack ? styles.fullWidthButton : styles.primaryButton}
              textStyle={styles.primaryButtonText}
            />
          ) : (
            <CraftButton
              title={isLoading ? "Requesting..." : "Grant Camera Access"}
              onPress={requestPermissions}
              disabled={isLoading}
              style={!onBack ? styles.fullWidthButton : styles.primaryButton}
              textStyle={styles.primaryButtonText}
            />
          )}
        </View>

        {!hasPermission && (
          <CraftButton
            title="Skip for Now"
            onPress={handleNext}
            style={styles.skipButton}
            textStyle={styles.skipButtonText}
          />
        )}
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
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  cameraIcon: {
    fontSize: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C1810',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#5D4037',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: width * 0.85,
  },
  featuresList: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
    marginTop: 2,
  },
  featureTextContainer: {
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
  permissionStatus: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#8B4513',
  },
  statusTextSuccess: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  statusTextPending: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: '600',
  },
  actionContainer: {
    paddingTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#8B4513',
    fontSize: 14,
    opacity: 0.8,
  },
}); 