import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

// Define which settings are sensitive and require SecureStore
interface SensitiveSettings {
  biometricEnabled?: boolean;
  autoLoginEnabled?: boolean;
  dataExportRequested?: boolean;
  analyticsOptOut?: boolean;
}

// Regular settings that can use encrypted AsyncStorage
interface RegularSettings {
  darkMode: boolean;
  notifications: boolean;
  soundEnabled: boolean;
  language: string;
  measurementUnit: 'metric' | 'imperial';
  defaultPrivacy: 'public' | 'friends' | 'private';
  skillDisplay: boolean;
  autoSaveProjects: boolean;
  dataSharing: boolean;
  analytics: boolean;
  locationTracking: boolean;
  profileVisibility: 'public' | 'friends' | 'private';
}

export type AllSettings = RegularSettings & SensitiveSettings;

const SETTINGS_STORAGE_KEY = '@snapcraft_settings';
const SENSITIVE_SETTINGS_KEY = 'snapcraft_sensitive_settings';
const ENCRYPTION_KEY = 'snapcraft_settings_encryption_key_v1';

class SecureSettingsService {
  private static instance: SecureSettingsService;
  private encryptionKey: string | null = null;

  public static getInstance(): SecureSettingsService {
    if (!SecureSettingsService.instance) {
      SecureSettingsService.instance = new SecureSettingsService();
    }
    return SecureSettingsService.instance;
  }

  private async getEncryptionKey(): Promise<string> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    try {
      // Try to get existing encryption key from SecureStore
      let key = await SecureStore.getItemAsync(ENCRYPTION_KEY);
      
      if (!key) {
        // Generate new encryption key if none exists
        key = CryptoJS.lib.WordArray.random(256/8).toString();
        await SecureStore.setItemAsync(ENCRYPTION_KEY, key);
      }
      
      // At this point key is guaranteed to be a string
      this.encryptionKey = key!;
      return key!;
    } catch (error) {
      console.error('Error managing encryption key:', error);
      // Fallback to a static key (less secure but functional)
      this.encryptionKey = 'fallback_key_snapcraft_2025';
      return this.encryptionKey;
    }
  }

  private async encryptData(data: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      return CryptoJS.AES.encrypt(data, key).toString();
    } catch (error) {
      console.error('Error encrypting data:', error);
      // Return unencrypted data as fallback
      return data;
    }
  }

  private async decryptData(encryptedData: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Error decrypting data:', error);
      // Return encrypted data as fallback (might be unencrypted)
      return encryptedData;
    }
  }

  private isSensitiveSetting(key: string): boolean {
    const sensitiveKeys = [
      'biometricEnabled',
      'autoLoginEnabled', 
      'dataExportRequested',
      'analyticsOptOut'
    ];
    return sensitiveKeys.includes(key);
  }

  /**
   * Load all settings (both sensitive and regular)
   */
  async loadSettings(): Promise<Partial<AllSettings>> {
    try {
      const [regularSettings, sensitiveSettings] = await Promise.all([
        this.loadRegularSettings(),
        this.loadSensitiveSettings()
      ]);

      return { ...regularSettings, ...sensitiveSettings };
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  }

  /**
   * Save all settings (automatically routes to appropriate storage)
   */
  async saveSettings(settings: Partial<AllSettings>): Promise<void> {
    try {
      const regularSettings: Partial<RegularSettings> = {};
      const sensitiveSettings: Partial<SensitiveSettings> = {};

      // Separate settings by sensitivity
      Object.entries(settings).forEach(([key, value]) => {
        if (this.isSensitiveSetting(key)) {
          (sensitiveSettings as any)[key] = value;
        } else {
          (regularSettings as any)[key] = value;
        }
      });

      // Save to appropriate storage
      await Promise.all([
        Object.keys(regularSettings).length > 0 ? this.saveRegularSettings(regularSettings) : Promise.resolve(),
        Object.keys(sensitiveSettings).length > 0 ? this.saveSensitiveSettings(sensitiveSettings) : Promise.resolve()
      ]);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  /**
   * Save a single setting
   */
  async saveSetting<K extends keyof AllSettings>(key: K, value: AllSettings[K]): Promise<void> {
    const settings = { [key]: value } as Partial<AllSettings>;
    await this.saveSettings(settings);
  }

  /**
   * Get a single setting
   */
  async getSetting<K extends keyof AllSettings>(key: K): Promise<AllSettings[K] | undefined> {
    const settings = await this.loadSettings();
    return settings[key];
  }

  /**
   * Load regular settings from encrypted AsyncStorage
   */
  private async loadRegularSettings(): Promise<Partial<RegularSettings>> {
    try {
      const encryptedData = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!encryptedData) {
        return {};
      }

      const decryptedData = await this.decryptData(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Error loading regular settings:', error);
      return {};
    }
  }

  /**
   * Save regular settings to encrypted AsyncStorage
   */
  private async saveRegularSettings(settings: Partial<RegularSettings>): Promise<void> {
    try {
      // Load existing settings first
      const existingSettings = await this.loadRegularSettings();
      const updatedSettings = { ...existingSettings, ...settings };
      
      const encryptedData = await this.encryptData(JSON.stringify(updatedSettings));
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, encryptedData);
    } catch (error) {
      console.error('Error saving regular settings:', error);
      throw error;
    }
  }

  /**
   * Load sensitive settings from SecureStore
   */
  private async loadSensitiveSettings(): Promise<Partial<SensitiveSettings>> {
    try {
      const data = await SecureStore.getItemAsync(SENSITIVE_SETTINGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error loading sensitive settings:', error);
      return {};
    }
  }

  /**
   * Save sensitive settings to SecureStore
   */
  private async saveSensitiveSettings(settings: Partial<SensitiveSettings>): Promise<void> {
    try {
      // Load existing settings first
      const existingSettings = await this.loadSensitiveSettings();
      const updatedSettings = { ...existingSettings, ...settings };
      
      await SecureStore.setItemAsync(SENSITIVE_SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving sensitive settings:', error);
      throw error;
    }
  }

  /**
   * Clear all settings (useful for logout or reset)
   */
  async clearAllSettings(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(SETTINGS_STORAGE_KEY),
        SecureStore.deleteItemAsync(SENSITIVE_SETTINGS_KEY)
      ]);
    } catch (error) {
      console.error('Error clearing settings:', error);
    }
  }

  /**
   * Get settings security status
   */
  async getSecurityStatus(): Promise<{
    encryptionEnabled: boolean;
    secureStoreAvailable: boolean;
    settingsCount: number;
    sensitiveSettingsCount: number;
  }> {
    try {
      const [regularSettings, sensitiveSettings] = await Promise.all([
        this.loadRegularSettings(),
        this.loadSensitiveSettings()
      ]);

      return {
        encryptionEnabled: !!this.encryptionKey,
        secureStoreAvailable: await SecureStore.isAvailableAsync(),
        settingsCount: Object.keys(regularSettings).length,
        sensitiveSettingsCount: Object.keys(sensitiveSettings).length
      };
    } catch (error) {
      console.error('Error getting security status:', error);
      return {
        encryptionEnabled: false,
        secureStoreAvailable: false,
        settingsCount: 0,
        sensitiveSettingsCount: 0
      };
    }
  }

  /**
   * Migrate from old AsyncStorage-only settings
   */
  async migrateFromLegacySettings(): Promise<void> {
    try {
      console.log('🔄 Migrating settings to secure storage...');
      
      // Try to load old settings
      const oldSettings = await AsyncStorage.getItem('@snapcraft_settings');
      if (!oldSettings) {
        console.log('✅ No legacy settings found');
        return;
      }

      const parsedSettings = JSON.parse(oldSettings);
      console.log('📦 Found legacy settings:', Object.keys(parsedSettings));

      // Save using new secure service
      await this.saveSettings(parsedSettings);

      // Remove old settings
      await AsyncStorage.removeItem('@snapcraft_settings');
      
      console.log('✅ Settings migration completed');
    } catch (error) {
      console.error('❌ Settings migration failed:', error);
    }
  }
}

export default SecureSettingsService; 