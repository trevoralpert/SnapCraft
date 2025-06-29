import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../stores/authStore';
import { AuthService } from '../../services/firebase/auth';
import { useTheme } from '../../shared/contexts/ThemeContext';
import { formatFirebaseDate } from '../../shared/utils/date';

interface SettingsState {
  // App Preferences
  darkMode: boolean;
  notifications: boolean;
  soundEnabled: boolean;
  language: string;
  
  // Craft Settings
  measurementUnit: 'metric' | 'imperial';
  defaultPrivacy: 'public' | 'friends' | 'private';
  skillDisplay: boolean;
  autoSaveProjects: boolean;
  
  // Privacy & Security
  dataSharing: boolean;
  analytics: boolean;
  locationTracking: boolean;
  profileVisibility: 'public' | 'friends' | 'private';
}

interface SettingsScreenProps {
  onClose?: () => void;
}

const SETTINGS_STORAGE_KEY = '@snapcraft_settings';

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { user } = useAuthStore();
  const { theme, isDark, toggleTheme, setThemeMode } = useTheme();
  const [settings, setSettings] = useState<SettingsState>({
    // App Preferences
    darkMode: false,
    notifications: true,
    soundEnabled: true,
    language: 'English',
    
    // Craft Settings
    measurementUnit: 'metric',
    defaultPrivacy: 'public',
    skillDisplay: true,
    autoSaveProjects: true,
    
    // Privacy & Security
    dataSharing: false,
    analytics: true,
    locationTracking: false,
    profileVisibility: 'public',
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  // Load settings from storage on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: Partial<SettingsState>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      // In a real app, you would validate current password and update
      // For now, we'll show a success message
      Alert.alert('Success', 'Password updated successfully');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update password');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This action cannot be undone and will permanently delete all your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, you would delete the user account
              Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
              // Navigate to login screen
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const dynamicStyles = {
    container: { ...styles.container, backgroundColor: theme.colors.background },
    header: { ...styles.header, backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
    headerTitle: { ...styles.headerTitle, color: theme.colors.primary },
    section: { ...styles.section, backgroundColor: theme.colors.surface },
    sectionTitle: { ...styles.sectionTitle, color: theme.colors.primary },
    settingTitle: { ...styles.settingTitle, color: theme.colors.text },
    settingSubtitle: { ...styles.settingSubtitle, color: theme.colors.textSecondary },
    accountEmail: { ...styles.accountEmail, color: theme.colors.text },
    accountMember: { ...styles.accountMember, color: theme.colors.textSecondary },
    modalContainer: { ...styles.modalContainer, backgroundColor: theme.colors.background },
    modalHeader: { ...styles.modalHeader, backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
    modalTitle: { ...styles.modalTitle, color: theme.colors.primary },
    modalInput: { ...styles.modalInput, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text },
    inputLabel: { ...styles.inputLabel, color: theme.colors.text },
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={dynamicStyles.section}>
      <Text style={dynamicStyles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderSettingItem = (
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    icon?: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        {icon && <Ionicons name={icon as any} size={20} color={theme.colors.primary} style={styles.settingIcon} />}
        <View style={styles.settingText}>
          <Text style={dynamicStyles.settingTitle}>{title}</Text>
          <Text style={dynamicStyles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
      />
    </View>
  );

  const renderActionItem = (
    title: string,
    subtitle: string,
    onPress: () => void,
    icon: string,
    destructive?: boolean
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingInfo}>
        <Ionicons 
          name={icon as any} 
          size={20} 
          color={destructive ? '#FF4444' : '#8B4513'} 
          style={styles.settingIcon} 
        />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, destructive && styles.destructiveText]}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const renderSelectItem = (
    title: string,
    subtitle: string,
    currentValue: string,
    options: string[],
    onSelect: (value: string) => void,
    icon: string
  ) => {
    const showPicker = () => {
      Alert.alert(
        title,
        subtitle,
        [
          ...options.map(option => ({
            text: option,
            onPress: () => onSelect(option),
            style: option === currentValue ? 'default' as const : 'default' as const
          })),
          {
            text: 'Cancel',
            style: 'cancel' as const
          }
        ]
      );
    };

    return (
      <TouchableOpacity style={styles.settingItem} onPress={showPicker}>
        <View style={styles.settingInfo}>
          <Ionicons name={icon as any} size={20} color="#8B4513" style={styles.settingIcon} />
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{title}</Text>
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <View style={styles.selectButton}>
          <Text style={styles.selectButtonText}>{currentValue}</Text>
          <Ionicons name="chevron-down" size={16} color="#8B4513" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Account Settings */}
        {renderSection('Account Settings', (
          <>
            <View style={styles.accountInfo}>
              <Text style={styles.accountEmail}>{user?.email}</Text>
              <Text style={styles.accountMember}>Member since {user?.joinedAt ? formatFirebaseDate(user.joinedAt) : 'Recently'}</Text>
            </View>
            
            {renderActionItem(
              'Change Password',
              'Update your account password',
              () => setShowPasswordModal(true),
              'key'
            )}
            
            {renderActionItem(
              'Email Settings',
              'Manage email preferences',
              () => Alert.alert('Coming Soon', 'Email settings will be available in a future update'),
              'mail'
            )}
            
            {renderActionItem(
              'Delete Account',
              'Permanently delete your account and data',
              handleDeleteAccount,
              'trash',
              true
            )}
          </>
        ))}

        {/* App Preferences */}
        {renderSection('App Preferences', (
          <>
            {renderSettingItem(
              'Dark Mode',
              'Use dark theme throughout the app',
              isDark,
              (value) => {
                setThemeMode(value ? 'dark' : 'light');
                saveSettings({ darkMode: value });
              },
              'moon'
            )}
            
            {renderSettingItem(
              'Notifications',
              'Receive push notifications',
              settings.notifications,
              (value) => saveSettings({ notifications: value }),
              'notifications'
            )}
            
            {renderSettingItem(
              'Sound Effects',
              'Play sounds for app interactions',
              settings.soundEnabled,
              (value) => saveSettings({ soundEnabled: value }),
              'volume-high'
            )}
            
            {renderSelectItem(
              'Language',
              'Choose your preferred language',
              settings.language,
              ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Chinese'],
              (value) => saveSettings({ language: value }),
              'language'
            )}
          </>
        ))}

        {/* Craft Settings */}
        {renderSection('Craft Settings', (
          <>
            {renderSelectItem(
              'Measurement Units',
              'Default units for measurements',
              settings.measurementUnit === 'metric' ? 'Metric (cm, kg)' : 'Imperial (in, lb)',
              ['Metric (cm, kg)', 'Imperial (in, lb)'],
              (value) => saveSettings({ measurementUnit: value.includes('Metric') ? 'metric' : 'imperial' }),
              'resize'
            )}
            
            {renderSelectItem(
              'Default Privacy',
              'Default privacy setting for new posts',
              settings.defaultPrivacy.charAt(0).toUpperCase() + settings.defaultPrivacy.slice(1),
              ['Public', 'Friends Only', 'Private'],
              (value) => {
                const privacyValue = value === 'Friends Only' ? 'friends' : value.toLowerCase();
                saveSettings({ defaultPrivacy: privacyValue as any });
              },
              'shield'
            )}
            
            {renderSettingItem(
              'Show Skill Level',
              'Display your skill level on posts',
              settings.skillDisplay,
              (value) => saveSettings({ skillDisplay: value }),
              'star'
            )}
            
            {renderSettingItem(
              'Auto-Save Projects',
              'Automatically save work in progress',
              settings.autoSaveProjects,
              (value) => saveSettings({ autoSaveProjects: value }),
              'save'
            )}
          </>
        ))}

        {/* Privacy & Security */}
        {renderSection('Privacy & Security', (
          <>
            {renderSelectItem(
              'Profile Visibility',
              'Who can see your profile',
              settings.profileVisibility.charAt(0).toUpperCase() + settings.profileVisibility.slice(1),
              ['Public', 'Friends Only', 'Private'],
              (value) => {
                const visibilityValue = value === 'Friends Only' ? 'friends' : value.toLowerCase();
                saveSettings({ profileVisibility: visibilityValue as any });
              },
              'eye'
            )}
            
            {renderSettingItem(
              'Data Sharing',
              'Share usage data to improve the app',
              settings.dataSharing,
              (value) => saveSettings({ dataSharing: value }),
              'share'
            )}
            
            {renderSettingItem(
              'Analytics',
              'Help improve the app with anonymous usage data',
              settings.analytics,
              (value) => saveSettings({ analytics: value }),
              'analytics'
            )}
            
            {renderSettingItem(
              'Location Tracking',
              'Allow location access for local features',
              settings.locationTracking,
              (value) => saveSettings({ locationTracking: value }),
              'location'
            )}
          </>
        ))}

        {/* App Information */}
        {renderSection('About', (
          <>
            {renderActionItem(
              'Privacy Policy',
              'Read our privacy policy',
              () => Alert.alert('Privacy Policy', 'Privacy policy will be available soon'),
              'document-text'
            )}
            
            {renderActionItem(
              'Terms of Service',
              'Read our terms of service',
              () => Alert.alert('Terms of Service', 'Terms of service will be available soon'),
              'document'
            )}
            
            {renderActionItem(
              'Help & Support',
              'Get help or contact support',
              () => Alert.alert('Support', 'Support options will be available soon'),
              'help-circle'
            )}
            
            <View style={styles.versionInfo}>
              <Text style={styles.versionText}>SnapCraft v1.0.0</Text>
              <Text style={styles.versionSubtext}>Built with ❤️ for craftspeople</Text>
            </View>
          </>
        ))}
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={handlePasswordChange}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.modalInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Enter current password"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.modalInput}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Enter new password"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.modalInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirm new password"
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC', // This will be overridden by themed styles
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  headerSpacer: {
    width: 34,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  accountInfo: {
    paddingHorizontal: 20,
    marginBottom: 15,
    paddingVertical: 10,
    backgroundColor: '#F8F8F8',
    marginHorizontal: 20,
    borderRadius: 8,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  accountMember: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  destructiveText: {
    color: '#FF4444',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
  },
  selectButtonText: {
    fontSize: 14,
    color: '#8B4513',
    marginRight: 5,
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
  },
  versionSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  modalSave: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
}); 