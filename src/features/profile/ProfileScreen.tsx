import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { User, CraftSpecialization, SkillLevel } from '../../shared/types';
import { CraftButton } from '../../shared/components/CraftButton';
import { SkillLevelBadge } from '../../shared/components';
import { UserSkillLevelService } from '../../services/scoring/UserSkillLevelService';
import { AuthService } from '../../services/firebase/auth';
import { formatFirebaseDate } from '../../shared/utils/date';
import ScoringHistoryScreen from './ScoringHistoryScreen';
import { Ionicons } from '@expo/vector-icons';
import { AchievementService } from '../../services/achievements/AchievementService';
import { OnboardingService } from '../../services/onboarding/OnboardingService';
import { TutorialService } from '../../services/tutorials/TutorialService';

const craftSpecializations: { key: CraftSpecialization; label: string; emoji: string }[] = [
  { key: 'woodworking', label: 'Woodworking', emoji: '🪵' },
  { key: 'metalworking', label: 'Metalworking', emoji: '🔧' },
  { key: 'blacksmithing', label: 'Blacksmithing', emoji: '⚒️' },
  { key: 'leathercraft', label: 'Leathercraft', emoji: '🏺' },
  { key: 'pottery', label: 'Pottery', emoji: '🏺' },
  { key: 'weaving', label: 'Weaving', emoji: '🧶' },
  { key: 'bushcraft', label: 'Bushcraft', emoji: '🌿' },
  { key: 'stonemasonry', label: 'Stonemasonry', emoji: '🪨' },
  { key: 'glassblowing', label: 'Glassblowing', emoji: '🫧' },
  { key: 'jewelry', label: 'Jewelry', emoji: '💍' },
  { key: 'general', label: 'General Crafts', emoji: '🛠️' },
];

const skillLevels: { key: SkillLevel; label: string; description: string }[] = [
  { key: 'novice', label: 'Novice', description: 'Just starting my craft journey' },
  { key: 'apprentice', label: 'Apprentice', description: 'Learning the fundamentals' },
  { key: 'journeyman', label: 'Journeyman', description: 'Comfortable with basic techniques' },
  { key: 'craftsman', label: 'Craftsman', description: 'Skilled and experienced' },
  { key: 'master', label: 'Master', description: 'Expert level practitioner' },
];

export function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showScoringHistory, setShowScoringHistory] = useState(false);
  const [calculatedSkillLevel, setCalculatedSkillLevel] = useState<SkillLevel | null>(null);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [achievementStats, setAchievementStats] = useState({
    unlockedCount: 0,
    totalCount: 0,
    totalPoints: 0,
    recentAchievements: [] as any[]
  });
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    craftSpecialization: [] as CraftSpecialization[],
  });

  // Analytics preview state
  const [analyticsPreview, setAnalyticsPreview] = useState({
    onboardingProgress: '0/5',
    tutorialProgress: '0/3',
    hasInsights: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        location: user.location || '',
        craftSpecialization: user.craftSpecialization || [],
      });
    }
  }, [user]);

  // Fetch analytics preview data
  const fetchAnalyticsPreview = async () => {
    if (!user) return;

    try {
      // Get onboarding progress using the static method
      const onboardingProgress = OnboardingService.getProgress(user);
      
      // Get tutorial progress using the static method
      const tutorialProgress = await TutorialService.getTutorialProgress(user.id);
      
      // Calculate completed steps
      const completedOnboardingSteps = onboardingProgress.stepsCompleted?.length || 0;
      const totalOnboardingSteps = 5; // We have 5 onboarding steps
      
      // Calculate completed tutorials
      const completedTutorials = Object.values(tutorialProgress || {})
        .filter((tutorial: any) => tutorial.completed).length;
      const totalTutorials = 3; // We have 3 tutorials
      
      // Update analytics preview
      setAnalyticsPreview({
        onboardingProgress: `${completedOnboardingSteps}/${totalOnboardingSteps}`,
        tutorialProgress: `${completedTutorials}/${totalTutorials}`,
        hasInsights: completedOnboardingSteps > 0 || completedTutorials > 0,
      });
      
    } catch (error) {
      console.error('Error fetching analytics preview:', error);
      // Keep default values on error
    }
  };

  const fetchSkillLevel = async () => {
    if (!user) return;
    
    try {
      const skillLevelService = UserSkillLevelService.getInstance();
      const calculatedLevel = await skillLevelService.calculateUserSkillLevel(user.id);
      setCalculatedSkillLevel(calculatedLevel);
    } catch (error) {
      console.error('Error fetching skill level:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSkillLevel();
      fetchAnalyticsPreview();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    if (formData.displayName.trim().length < 2) {
      // Use web-compatible error notification
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Error: Display name must be at least 2 characters long');
      } else {
        Alert.alert('Error', 'Display name must be at least 2 characters long');
      }
      return;
    }

    if (formData.craftSpecialization.length === 0) {
      // Use web-compatible error notification
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Error: Please select at least one craft specialization');
      } else {
        Alert.alert('Error', 'Please select at least one craft specialization');
      }
      return;
    }

    setIsLoading(true);
    try {
      const updatedUser = {
        ...user,
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        craftSpecialization: formData.craftSpecialization,
        // skillLevel is now AI-determined, don't update it manually
      };

      await AuthService.updateUserProfile(updatedUser);
      // Note: User state will be updated by the auth listener
      setIsEditing(false);
      // Use web-compatible success notification
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Success: Profile updated successfully!');
      } else {
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Use web-compatible error notification
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Error: Failed to update profile. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        location: user.location || '',
        craftSpecialization: user.craftSpecialization || [],
      });
    }
    setIsEditing(false);
  };

  const toggleCraftSpecialization = (craft: CraftSpecialization) => {
    setFormData(prev => ({
      ...prev,
      craftSpecialization: prev.craftSpecialization.includes(craft)
        ? prev.craftSpecialization.filter(c => c !== craft)
        : [...prev.craftSpecialization, craft]
    }));
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Please log in to view your profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={user.avatar ? { uri: user.avatar } : require('../../../assets/images/adaptive-icon.png')}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.joinedDate}>
            Joined {formatFirebaseDate(user.joinedAt, 'Recently')}
          </Text>
          
          {/* Calculated Skill Level Badge */}
          {calculatedSkillLevel && (
            <View style={styles.skillBadgeContainer}>
              <SkillLevelBadge
                skillLevel={calculatedSkillLevel}
                averageScore={0}
                showProgress={true}
                size="large"
                onPress={() => {
                  // Open scoring history modal
                  setShowScoringHistory(true);
                }}
              />
            </View>
          )}
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Display Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Display Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.displayName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
                placeholder="Enter your display name"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.value}>{user.displayName || 'Not set'}</Text>
            )}
          </View>

          {/* Bio */}
          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                placeholder="Tell us about your craft journey..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            ) : (
              <Text style={styles.value}>{user.bio || 'No bio provided'}</Text>
            )}
          </View>

          {/* Location */}
          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                placeholder="Enter your location"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.value}>{user.location || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Craft Specializations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Craft Specializations</Text>
          <View style={styles.craftGrid}>
            {craftSpecializations.map((craft) => (
              <TouchableOpacity
                key={craft.key}
                style={[
                  styles.craftCard,
                  (isEditing ? formData.craftSpecialization : user.craftSpecialization)?.includes(craft.key) && styles.craftCardSelected,
                  !isEditing && styles.craftCardDisabled
                ]}
                onPress={() => isEditing && toggleCraftSpecialization(craft.key)}
                disabled={!isEditing}
              >
                <Text style={styles.craftEmoji}>{craft.emoji}</Text>
                <Text style={[
                  styles.craftLabel,
                  (isEditing ? formData.craftSpecialization : user.craftSpecialization)?.includes(craft.key) && styles.craftLabelSelected
                ]}>{craft.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Skill Level */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Skill Level</Text>
            <View style={styles.aiIndicator}>
              <Text style={styles.aiIndicatorText}>🤖 AI-Determined</Text>
            </View>
          </View>
          
          {/* Display current skill level (read-only) */}
          <View style={styles.skillLevelDisplay}>
            <View style={styles.skillLevelCard}>
              <Text style={styles.currentSkillLabel}>
                {skillLevels.find(level => level.key === calculatedSkillLevel)?.label || 'Novice'}
              </Text>
              <Text style={styles.currentSkillDescription}>
                {skillLevels.find(level => level.key === calculatedSkillLevel)?.description || 'Just starting my craft journey'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.aiExplanation}>
            Your skill level is automatically calculated based on your project submissions, 
            scoring results, and craft progression. Complete more projects to advance your level.
          </Text>
        </View>

        {/* Edit Actions */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <CraftButton
              title="Cancel"
              onPress={handleCancel}
              variant="secondary"
              style={styles.actionButton}
            />
            <CraftButton
              title={isLoading ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              disabled={isLoading}
              style={styles.actionButton}
            />
          </View>
        )}

        {/* AI Scoring Test Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🧠 AI Scoring</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                onPress={() => {
                  // Navigate to scoring history - for now just show alert
                  if (typeof window !== 'undefined' && window.alert) {
                    window.alert('📊 Scoring History feature coming soon! This will show your project scores, skill progression, and AI feedback history.');
                  } else {
                    Alert.alert('📊 Scoring History', 'Feature coming soon! This will show your project scores, skill progression, and AI feedback history.');
                  }
                }} 
                style={styles.historyButton}
              >
                <Text style={styles.historyButtonText}>History</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={async () => {
                  try {
                    console.log('🧪 Starting AI Scoring Test...');
                    
                    // Import the test function dynamically
                    const { testProjectScoring } = await import('../../services/scoring/test-scoring');
                    
                    // Show loading alert
                    if (typeof window !== 'undefined' && window.alert) {
                      window.alert('🧪 Running AI Scoring Test... Check console for detailed results!');
                    } else {
                      Alert.alert('🧪 AI Scoring Test', 'Running test... Check console for detailed results!');
                    }
                    
                    // Run the test
                    await testProjectScoring();
                    
                    // Show success
                    if (typeof window !== 'undefined' && window.alert) {
                      window.alert('✅ AI Scoring Test completed! Check console for full results.');
                    } else {
                      Alert.alert('✅ Test Complete', 'AI Scoring Test completed! Check console for full results.');
                    }
                    
                  } catch (error) {
                    console.error('❌ AI Scoring Test failed:', error);
                    if (typeof window !== 'undefined' && window.alert) {
                      window.alert('❌ Test failed: ' + (error as Error).message);
                    } else {
                      Alert.alert('❌ Test Failed', (error as Error).message);
                    }
                  }
                }} 
                style={styles.testButton}
              >
                <Text style={styles.testButtonText}>Test</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.testDescription}>
            🎯 Test the new AI project scoring system with a sample woodworking project. 
            Results will appear in the console with detailed scoring breakdown.
          </Text>
        </View>

        {/* Achievements Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏆 Achievements</Text>
            <TouchableOpacity 
              onPress={() => {
                // For now, just show an alert - later we'll navigate to achievements screen
                if (typeof window !== 'undefined' && window.alert) {
                  window.alert('🎉 Achievement system is ready! You have 3 unlocked achievements.');
                } else {
                  Alert.alert('🎉 Achievements', 'Achievement system is ready! You have 3 unlocked achievements.');
                }
              }} 
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.achievementPreview}>
            <View style={styles.achievementStat}>
              <Text style={styles.achievementNumber}>3</Text>
              <Text style={styles.achievementLabel}>Unlocked</Text>
            </View>
            <View style={styles.achievementStat}>
              <Text style={styles.achievementNumber}>75</Text>
              <Text style={styles.achievementLabel}>Points</Text>
            </View>
            <View style={styles.achievementStat}>
              <Text style={styles.achievementNumber}>38%</Text>
              <Text style={styles.achievementLabel}>Complete</Text>
            </View>
          </View>
          <View style={styles.recentAchievements}>
            <Text style={styles.recentTitle}>Recent Achievements:</Text>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementEmoji}>🧰</Text>
              <Text style={styles.achievementText}>Tool Collector - Add 5 tools to your inventory</Text>
            </View>
            <View style={styles.achievementItem}>
              <Text style={styles.achievementEmoji}>🥽</Text>
              <Text style={styles.achievementText}>Safety First - Read all safety articles</Text>
            </View>
          </View>
        </View>

        {/* Projects Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎨 Projects</Text>
            <TouchableOpacity 
              onPress={() => {
                // Navigate to Craft Feed - for now just show alert
                if (typeof window !== 'undefined' && window.alert) {
                  window.alert('📸 Navigate to Craft Feed to create new projects!');
                } else {
                  Alert.alert('📸 Projects', 'Navigate to Craft Feed to create new projects!');
                }
              }} 
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.projectsPreview}>
            <Text style={styles.projectsDescription}>
              Your craft projects and documentation will appear here. 
              Use the Camera tab to capture and share your work!
            </Text>
            
            {/* Project Stats */}
            <View style={styles.projectStats}>
              <View style={styles.projectStat}>
                <Text style={styles.projectStatNumber}>0</Text>
                <Text style={styles.projectStatLabel}>Projects</Text>
              </View>
              <View style={styles.projectStat}>
                <Text style={styles.projectStatNumber}>0</Text>
                <Text style={styles.projectStatLabel}>Photos</Text>
              </View>
              <View style={styles.projectStat}>
                <Text style={styles.projectStatNumber}>-</Text>
                <Text style={styles.projectStatLabel}>Avg Score</Text>
              </View>
            </View>
            
            {/* Recent Projects Preview */}
            <View style={styles.recentProjects}>
              <Text style={styles.recentProjectsTitle}>Recent Projects:</Text>
              <View style={styles.noProjectsMessage}>
                <Text style={styles.noProjectsText}>📷 No projects yet</Text>
                <Text style={styles.noProjectsSubtext}>
                  Start documenting your craft journey by taking photos of your work!
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Project Creation Walkthrough */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Project Creation Walkthrough</Text>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>GUIDE</Text>
            </View>
          </View>
          
          <Text style={styles.walkthroughDescription}>
            Get step-by-step guidance for your first craft project. Choose from beginner-friendly templates designed to help you learn fundamental skills.
          </Text>
          
          <TouchableOpacity 
            style={styles.walkthroughCard}
            onPress={() => {
              // Navigate to first project
              router.push('/first-project');
            }}
          >
            <View style={styles.walkthroughHeader}>
              <Ionicons name="hammer" size={24} color="#8B4513" />
              <Text style={styles.walkthroughTitle}>Start Your First Project</Text>
            </View>
            <Text style={styles.walkthroughSubtitle}>
              Choose from woodworking, leathercraft, or metalworking templates
            </Text>
            <View style={styles.walkthroughStats}>
              <View style={styles.walkthroughStat}>
                <Text style={styles.walkthroughStatNumber}>3</Text>
                <Text style={styles.walkthroughStatLabel}>Templates</Text>
              </View>
              <View style={styles.walkthroughStat}>
                <Text style={styles.walkthroughStatNumber}>~2h</Text>
                <Text style={styles.walkthroughStatLabel}>Duration</Text>
              </View>
              <View style={styles.walkthroughStat}>
                <Text style={styles.walkthroughStatNumber}>📚</Text>
                <Text style={styles.walkthroughStatLabel}>Beginner</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Analytics Dashboard */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 Analytics Dashboard</Text>
            <View style={styles.dataBadge}>
              <Text style={styles.dataBadgeText}>INSIGHTS</Text>
            </View>
          </View>
          
          <Text style={styles.analyticsDescription}>
            Track your onboarding progress, tutorial completion, and learning journey with detailed analytics and insights.
          </Text>
          
          <TouchableOpacity 
            style={styles.analyticsCard}
            onPress={() => {
              router.push('/analytics');
            }}
          >
            <View style={styles.analyticsHeader}>
              <Ionicons name="analytics" size={24} color="#2196F3" />
              <Text style={styles.analyticsTitle}>View Full Dashboard</Text>
            </View>
            <Text style={styles.analyticsSubtitle}>
              Onboarding analytics, tutorial progress, and user journey insights
            </Text>
            <View style={styles.analyticsPreview}>
              <View style={styles.analyticsStat}>
                <Text style={styles.analyticsStatNumber}>{analyticsPreview.onboardingProgress}</Text>
                <Text style={styles.analyticsStatLabel}>Onboarding</Text>
              </View>
              <View style={styles.analyticsStat}>
                <Text style={styles.analyticsStatNumber}>{analyticsPreview.tutorialProgress}</Text>
                <Text style={styles.analyticsStatLabel}>Tutorials</Text>
              </View>
              <View style={styles.analyticsStat}>
                <Text style={styles.analyticsStatNumber}>{analyticsPreview.hasInsights ? '✨' : '📊'}</Text>
                <Text style={styles.analyticsStatLabel}>Insights</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Scoring History Modal */}
      <Modal
        visible={showScoringHistory}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <ScoringHistoryScreen onClose={() => setShowScoringHistory(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC', // Beige background
  },
  scrollView: {
    flex: 1,
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
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8E8E8',
  },
  email: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '500',
    marginBottom: 4,
  },
  joinedDate: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#8B4513',
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  craftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  craftCard: {
    width: '48%',
    margin: '1%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  craftCardSelected: {
    borderColor: '#8B4513',
    backgroundColor: '#FFF8DC',
  },
  craftCardDisabled: {
    opacity: 0.7,
  },
  craftEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  craftLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  craftLabelSelected: {
    color: '#8B4513',
    fontWeight: '600',
  },
  skillOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  skillOptionSelected: {
    borderColor: '#8B4513',
    backgroundColor: '#FFF8DC',
  },
  skillOptionDisabled: {
    opacity: 0.7,
  },
  skillOptionContent: {
    flexDirection: 'column',
  },
  skillLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  skillLabelSelected: {
    color: '#8B4513',
  },
  skillDescription: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },

  bottomSpacing: {
    height: 20,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#8B4513',
    borderRadius: 6,
  },
  viewAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  achievementPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F5F1',
    borderRadius: 8,
  },
  achievementStat: {
    alignItems: 'center',
  },
  achievementNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  achievementLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  recentAchievements: {
    marginTop: 8,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  achievementEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  achievementText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  testButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  testDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  historyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2196F3',
    borderRadius: 6,
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  skillBadgeContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF8DC',
    borderRadius: 8,
  },
  aiIndicator: {
    padding: 6,
    backgroundColor: '#2196F3',
    borderRadius: 6,
  },
  aiIndicatorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  skillLevelDisplay: {
    marginBottom: 16,
  },
  skillLevelCard: {
    padding: 12,
    backgroundColor: '#F9F5F1',
    borderRadius: 8,
  },
  currentSkillLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 4,
  },
  currentSkillDescription: {
    fontSize: 14,
    color: '#666',
  },
  aiExplanation: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  projectsPreview: {
    padding: 16,
    backgroundColor: '#F9F5F1',
    borderRadius: 8,
  },
  projectsDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  projectStat: {
    alignItems: 'center',
  },
  projectStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  projectStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  recentProjects: {
    marginTop: 8,
  },
  recentProjectsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 8,
  },
  noProjectsMessage: {
    alignItems: 'center',
  },
  noProjectsText: {
    fontSize: 14,
    color: '#666',
  },
  noProjectsSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  newBadge: {
    padding: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  walkthroughDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  walkthroughCard: {
    padding: 12,
    backgroundColor: '#F9F5F1',
    borderRadius: 8,
  },
  walkthroughHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  walkthroughTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginLeft: 8,
  },
  walkthroughSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  walkthroughStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  walkthroughStat: {
    alignItems: 'center',
  },
  walkthroughStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  walkthroughStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  dataBadge: {
    padding: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  dataBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  analyticsDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  analyticsCard: {
    padding: 12,
    backgroundColor: '#F9F5F1',
    borderRadius: 8,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginLeft: 8,
  },
  analyticsSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  analyticsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  analyticsStat: {
    alignItems: 'center',
  },
  analyticsStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  analyticsStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
}); 