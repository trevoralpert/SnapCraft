import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function TabOneScreen() {
  const handleGetStarted = () => {
    console.log('🔨 SnapCraft journey begins!');
  };

  const handleExplore = () => {
    console.log('🎨 Exploring craft knowledge!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to SnapCraft</Text>
        <Text style={styles.subtitle}>
          Where Traditional Craft Meets Modern Community
        </Text>
        
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
        
        <Text style={styles.description}>
          📸 Document your craft process with photos & timelapse{'\n'}
          🧠 AI-powered craft knowledge & technique guidance{'\n'}
          🛠️ Track your tool inventory & skill progression{'\n'}
          🤝 Connect with craftsmen in your community
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
            <Text style={styles.primaryButtonText}>Start Your Journey</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleExplore}>
            <Text style={styles.secondaryButtonText}>Explore Crafts</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Craft Specializations</Text>
          
          <View style={styles.specializations}>
            <View style={styles.specializationItem}>
              <Text style={styles.specializationIcon}>🪵</Text>
              <Text style={styles.specializationText}>Woodworking</Text>
            </View>
            
            <View style={styles.specializationItem}>
              <Text style={styles.specializationIcon}>⚒️</Text>
              <Text style={styles.specializationText}>Blacksmithing</Text>
            </View>
            
            <View style={styles.specializationItem}>
              <Text style={styles.specializationIcon}>🏺</Text>
              <Text style={styles.specializationText}>Pottery</Text>
            </View>
            
            <View style={styles.specializationItem}>
              <Text style={styles.specializationIcon}>🌿</Text>
              <Text style={styles.specializationText}>Bushcraft</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC', // Beige background - craft theme
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B4513', // Saddle brown - craft theme
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0522D',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  separator: {
    marginVertical: 20,
    height: 2,
    width: '80%',
    backgroundColor: '#8B4513',
  },
  description: {
    fontSize: 16,
    textAlign: 'left',
    color: '#654321',
    marginVertical: 20,
    lineHeight: 28,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 30,
  },
  primaryButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8B4513',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    textAlign: 'center',
    marginBottom: 16,
  },
  specializations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  specializationItem: {
    alignItems: 'center',
    marginBottom: 16,
    width: '45%',
  },
  specializationIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  specializationText: {
    fontSize: 14,
    color: '#654321',
    fontWeight: '500',
    textAlign: 'center',
  },
}); 