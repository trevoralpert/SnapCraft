import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { CraftButton } from '../../../shared/components/CraftButton';
import { OnboardingScreenProps } from '../../../shared/types/onboarding';
import { CraftSpecialization } from '../../../shared/types';

const { width } = Dimensions.get('window');

const CRAFT_SPECIALIZATIONS: { key: CraftSpecialization; name: string; icon: string; description: string }[] = [
  { key: 'woodworking', name: 'Woodworking', icon: '🪵', description: 'Furniture, carving, joinery' },
  { key: 'metalworking', name: 'Metalworking', icon: '⚒️', description: 'Welding, forging, machining' },
  { key: 'leathercraft', name: 'Leathercraft', icon: '🧳', description: 'Bags, belts, tooling' },
  { key: 'pottery', name: 'Pottery', icon: '🏺', description: 'Ceramics, glazing, throwing' },
  { key: 'weaving', name: 'Weaving', icon: '🧶', description: 'Textiles, baskets, tapestry' },
  { key: 'blacksmithing', name: 'Blacksmithing', icon: '🔥', description: 'Forge work, horseshoes, tools' },
  { key: 'bushcraft', name: 'Bushcraft', icon: '🏕️', description: 'Survival skills, outdoor crafts' },
  { key: 'stonemasonry', name: 'Stonemasonry', icon: '🗿', description: 'Stone carving, building' },
  { key: 'glassblowing', name: 'Glassblowing', icon: '🫧', description: 'Glass art, vessels, ornaments' },
  { key: 'jewelry', name: 'Jewelry Making', icon: '💎', description: 'Rings, necklaces, precious metals' },
  { key: 'general', name: 'General Crafts', icon: '🎨', description: 'Mixed crafts and hobbies' },
];

export function CraftSelectionStep({ onNext, onBack, progress }: OnboardingScreenProps) {
  const [selectedCrafts, setSelectedCrafts] = useState<CraftSpecialization[]>([]);

  const toggleCraft = (craft: CraftSpecialization) => {
    setSelectedCrafts(prev => {
      if (prev.includes(craft)) {
        return prev.filter(c => c !== craft);
      } else {
        return [...prev, craft];
      }
    });
  };

  const handleNext = () => {
    if (selectedCrafts.length === 0) {
      // Default to general if nothing selected
      onNext({ selectedCraftSpecializations: ['general'] });
    } else {
      onNext({ selectedCraftSpecializations: selectedCrafts });
    }
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
        <Text style={styles.title}>Choose Your Craft Specializations</Text>
        <Text style={styles.subtitle}>
          Select the crafts you're interested in. You can change these later.
        </Text>
      </View>

      {/* Craft selection grid */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.craftGrid}>
          {CRAFT_SPECIALIZATIONS.map((craft) => (
            <TouchableOpacity
              key={craft.key}
              style={[
                styles.craftCard,
                selectedCrafts.includes(craft.key) && styles.craftCardSelected
              ]}
              onPress={() => toggleCraft(craft.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.craftIcon}>{craft.icon}</Text>
              <Text style={[
                styles.craftName,
                selectedCrafts.includes(craft.key) && styles.craftNameSelected
              ]}>
                {craft.name}
              </Text>
              <Text style={[
                styles.craftDescription,
                selectedCrafts.includes(craft.key) && styles.craftDescriptionSelected
              ]}>
                {craft.description}
              </Text>
              
              {selectedCrafts.includes(craft.key) && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Selected count */}
      <View style={styles.selectionInfo}>
        <Text style={styles.selectionText}>
          {selectedCrafts.length === 0 
            ? "Select your areas of interest" 
            : `${selectedCrafts.length} craft${selectedCrafts.length !== 1 ? 's' : ''} selected`
          }
        </Text>
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
          
          <CraftButton
            title="Continue"
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
    marginBottom: 24,
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
  craftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  craftCard: {
    width: (width - 60) / 2, // 2 columns with spacing
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    minHeight: 120,
    position: 'relative',
  },
  craftCardSelected: {
    borderColor: '#8B4513',
    backgroundColor: '#FFF8E1',
  },
  craftIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  craftName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C1810',
    textAlign: 'center',
    marginBottom: 4,
  },
  craftNameSelected: {
    color: '#8B4513',
  },
  craftDescription: {
    fontSize: 12,
    color: '#8B4513',
    textAlign: 'center',
    lineHeight: 16,
  },
  craftDescriptionSelected: {
    color: '#5D4037',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#8B4513',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectionInfo: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
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