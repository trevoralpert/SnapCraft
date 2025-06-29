import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KnowledgeBaseScreen, SmartCraftAssistant, PhotoAnalysisScreen } from '../../src/features/knowledge';

type KnowledgeView = 'hub' | 'assistant' | 'knowledgeBase' | 'photoAnalysis';

export default function KnowledgeTab() {
  const [currentView, setCurrentView] = useState<KnowledgeView>('hub');
  const router = useRouter();

  if (currentView === 'assistant') {
    return <SmartCraftAssistant onBack={() => setCurrentView('hub')} />;
  }

  if (currentView === 'knowledgeBase') {
    return <KnowledgeBaseScreen onBack={() => setCurrentView('hub')} />;
  }

  if (currentView === 'photoAnalysis') {
    return <PhotoAnalysisScreen onBack={() => setCurrentView('hub')} />;
  }

  // Knowledge Hub - Main navigation
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="library" size={32} color="#8B4513" />
        <Text style={styles.title}>Craft Knowledge Hub</Text>
        <Text style={styles.subtitle}>AI-powered learning and guidance</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.featuresContainer}>
        {/* Smart Craft Assistant */}
        <TouchableOpacity
          style={[styles.featureCard, styles.primaryFeature]}
          onPress={() => setCurrentView('assistant')}
        >
          <View style={styles.featureHeader}>
            <Ionicons name="construct" size={28} color="#FFFFFF" />
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </View>
          <Text style={[styles.featureTitle, { color: '#FFFFFF' }]}>Smart Craft Assistant</Text>
          <Text style={[styles.featureDescription, { color: '#E0E0E0' }]}>
            Get AI-powered guidance tailored to your tools and skill level. 
            Ask questions, get project suggestions, and troubleshoot problems.
          </Text>
          <View style={styles.featureFooter}>
            <Text style={styles.featureTag}>🤖 RAG-Powered</Text>
            <Text style={styles.featureTag}>🔨 Tool-Aware</Text>
          </View>
        </TouchableOpacity>

        {/* First Project Assistance */}
        <TouchableOpacity
          style={[styles.featureCard, styles.firstProjectFeature]}
          onPress={() => router.push('/first-project')}
        >
          <View style={styles.featureHeader}>
            <Ionicons name="hammer" size={24} color="#FFFFFF" />
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </View>
          <Text style={[styles.featureTitle, { color: '#FFFFFF' }]}>Your First Project</Text>
          <Text style={[styles.featureDescription, { color: '#E0E0E0' }]}>
            Get guided through your first craft project with step-by-step instructions, 
            tips, and documentation assistance.
          </Text>
          <View style={styles.featureFooter}>
            <Text style={styles.featureTag}>🎯 Guided</Text>
            <Text style={styles.featureTag}>📋 Templates</Text>
          </View>
        </TouchableOpacity>

        {/* Interactive Tutorials */}
        <TouchableOpacity
          style={[styles.featureCard, styles.tutorialFeature]}
          onPress={() => router.push('/tutorials')}
        >
          <View style={styles.featureHeader}>
            <Ionicons name="school" size={24} color="#FFFFFF" />
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </View>
          <Text style={[styles.featureTitle, { color: '#FFFFFF' }]}>Interactive Tutorials</Text>
          <Text style={[styles.featureDescription, { color: '#E0E0E0' }]}>
            Learn SnapCraft's features with hands-on tutorials. Master camera modes, 
            tool identification, and project documentation.
          </Text>
          <View style={styles.featureFooter}>
            <Text style={styles.featureTag}>🎓 Step-by-Step</Text>
            <Text style={styles.featureTag}>📱 Interactive</Text>
          </View>
        </TouchableOpacity>

        {/* Photo Analysis */}
        <TouchableOpacity
          style={[styles.featureCard, styles.secondaryFeature]}
          onPress={() => setCurrentView('photoAnalysis')}
        >
          <View style={styles.featureHeader}>
            <Ionicons name="camera" size={24} color="#FFFFFF" />
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </View>
          <Text style={[styles.featureTitle, { color: '#FFFFFF' }]}>Smart Photo Analysis</Text>
          <Text style={[styles.featureDescription, { color: '#E0E0E0' }]}>
            Take photos of your projects and get AI-powered feedback, 
            technique identification, and improvement suggestions.
          </Text>
          <View style={styles.featureFooter}>
            <Text style={styles.featureTag}>📸 GPT-4 Vision</Text>
            <Text style={styles.featureTag}>🎯 Technique ID</Text>
          </View>
        </TouchableOpacity>

        {/* Onboarding Analytics */}
        <TouchableOpacity
          style={[styles.featureCard, styles.analyticsFeature]}
          onPress={() => router.push('/analytics')}
        >
          <View style={styles.featureHeader}>
            <Ionicons name="analytics" size={24} color="#FFFFFF" />
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </View>
          <Text style={[styles.featureTitle, { color: '#FFFFFF' }]}>Analytics Dashboard</Text>
          <Text style={[styles.featureDescription, { color: '#E0E0E0' }]}>
            Track your onboarding progress, tutorial completion, and learning journey. 
            See insights and recommendations for improvement.
          </Text>
          <View style={styles.featureFooter}>
            <Text style={styles.featureTag}>📊 Progress Tracking</Text>
            <Text style={styles.featureTag}>💡 Insights</Text>
          </View>
        </TouchableOpacity>

        {/* Knowledge Base */}
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => setCurrentView('knowledgeBase')}
        >
          <View style={styles.featureHeader}>
            <Ionicons name="library" size={24} color="#8B4513" />
          </View>
          <Text style={styles.featureTitle}>Knowledge Base</Text>
          <Text style={styles.featureDescription}>
            Browse traditional craft techniques, tools, and methods. 
            Searchable database of multi-craft knowledge.
          </Text>
          <View style={styles.featureFooter}>
            <Text style={styles.featureTag}>📚 Traditional</Text>
            <Text style={styles.featureTag}>🔍 Searchable</Text>
          </View>
        </TouchableOpacity>

        {/* Coming Soon Features */}
        <View style={[styles.featureCard, styles.comingSoonCard]}>
          <View style={styles.featureHeader}>
            <Ionicons name="scan" size={24} color="#666666" />
            <Text style={styles.comingSoonBadge}>COMING SOON</Text>
          </View>
          <Text style={[styles.featureTitle, styles.comingSoonText]}>Tool Recognition</Text>
          <Text style={[styles.featureDescription, styles.comingSoonText]}>
            Photograph your tool collection to automatically update 
            your inventory and get personalized recommendations.
          </Text>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  featuresContainer: {
    padding: 16,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryFeature: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  secondaryFeature: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  newBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 12,
  },
  featureFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureTag: {
    fontSize: 12,
    color: '#8B4513',
    backgroundColor: '#F5F5DC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  comingSoonCard: {
    opacity: 0.6,
  },
  comingSoonBadge: {
    fontSize: 10,
    color: '#666666',
    fontWeight: 'bold',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonText: {
    color: '#999999',
  },
  tutorialFeature: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  firstProjectFeature: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  analyticsFeature: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
}); 