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
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { User, CraftSpecialization, SkillLevel } from '../../shared/types';
import { CraftButton } from '../../shared/components/CraftButton';
import { AuthService } from '../../services/firebase/auth';

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
  const { user } = useAuthStore();
  
  // Debug logging (can be removed in production)
  const isAuthenticated = !!user;
  React.useEffect(() => {
    console.log('🔍 ProfileScreen - Auth State:', { 
      user: user ? { id: user.id, email: user.email, displayName: user.displayName } : null, 
      isAuthenticated 
    });
  }, [user, isAuthenticated]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    craftSpecialization: [] as CraftSpecialization[],
    skillLevel: 'novice' as SkillLevel,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        location: user.location || '',
        craftSpecialization: user.craftSpecialization || [],
        skillLevel: user.skillLevel || 'novice',
      });
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

    setIsSaving(true);
    try {
      const updatedUser = {
        ...user,
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        craftSpecialization: formData.craftSpecialization,
        skillLevel: formData.skillLevel,
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
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        location: user.location || '',
        craftSpecialization: user.craftSpecialization || [],
        skillLevel: user.skillLevel || 'novice',
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

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      // Navigation will be handled automatically by the auth listener in _layout.tsx
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
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
            Joined {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Recently'}
          </Text>
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
          <Text style={styles.sectionTitle}>Skill Level</Text>
          {skillLevels.map((level) => (
            <TouchableOpacity
              key={level.key}
              style={[
                styles.skillOption,
                (isEditing ? formData.skillLevel : user.skillLevel) === level.key && styles.skillOptionSelected,
                !isEditing && styles.skillOptionDisabled
              ]}
              onPress={() => isEditing && setFormData(prev => ({ ...prev, skillLevel: level.key }))}
              disabled={!isEditing}
            >
              <View style={styles.skillOptionContent}>
                <Text style={[
                  styles.skillLabel,
                  (isEditing ? formData.skillLevel : user.skillLevel) === level.key && styles.skillLabelSelected
                ]}>{level.label}</Text>
                <Text style={styles.skillDescription}>{level.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
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
              title={isSaving ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              disabled={isSaving}
              style={styles.actionButton}
            />
          </View>
        )}

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

        {/* Tool Inventory Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tool Inventory</Text>
          <Text style={styles.comingSoon}>
            📦 Tool inventory management coming soon! Track your tools, share with the community, and discover new additions.
          </Text>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <CraftButton
            title="Sign Out"
            onPress={handleLogout}
            style={styles.logoutButton}
            textStyle={styles.logoutButtonText}
          />
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  comingSoon: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
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
  logoutButton: {
    backgroundColor: '#DC143C', // Red color for logout
    borderColor: '#DC143C',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 