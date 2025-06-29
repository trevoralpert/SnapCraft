import { Platform, Linking } from 'react-native';
import { CraftPost } from '../../shared/types';

// Dynamic imports for optional native modules
let Sharing: any = null;
let Clipboard: any = null;

// Callback type for showing custom alerts
type ShowAlertCallback = (
  title: string, 
  message: string, 
  buttons?: Array<{
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
  }>,
  copyable?: boolean
) => void;

// Global alert callback (will be set by the app)
let showCustomAlert: ShowAlertCallback | null = null;

// Try to import native modules with fallbacks
const initializeModules = async () => {
  try {
    const sharingModule = await import('expo-sharing');
    Sharing = sharingModule;
    console.log('✅ expo-sharing loaded successfully');
  } catch (error) {
    console.warn('⚠️ expo-sharing not available, using fallback');
    Sharing = null;
  }

  try {
    const clipboardModule = await import('expo-clipboard');
    Clipboard = clipboardModule;
    console.log('✅ expo-clipboard loaded successfully');
  } catch (error) {
    console.warn('⚠️ expo-clipboard not available, using fallback');
    Clipboard = null;
  }
};

// Initialize modules on first use
let modulesInitialized = false;
const ensureModulesInitialized = async () => {
  if (!modulesInitialized) {
    await initializeModules();
    modulesInitialized = true;
  }
};

export interface ShareOptions {
  title?: string;
  message?: string;
  url?: string;
  dialogTitle?: string;
}

export interface ShareResult {
  success: boolean;
  activityType?: string;
  error?: string;
}

export class SharingService {
  // Set the custom alert callback
  static setCustomAlertHandler(callback: ShowAlertCallback) {
    showCustomAlert = callback;
  }

  // Show alert using custom handler or fallback to console
  private static showAlert(
    title: string, 
    message: string, 
    buttons?: Array<{
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }>,
    copyable?: boolean
  ) {
    if (showCustomAlert) {
      showCustomAlert(title, message, buttons, copyable);
    } else {
      console.log(`Alert: ${title}\n${message}`);
      // Fallback: execute first button action if available
      if (buttons && buttons.length > 0 && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress();
      }
    }
  }

  // Check if sharing is available on the platform
  static async isAvailable(): Promise<boolean> {
    await ensureModulesInitialized();
    
    if (Sharing && Sharing.isAvailableAsync) {
      try {
        return await Sharing.isAvailableAsync();
      } catch (error) {
        console.error('Error checking sharing availability:', error);
      }
    }
    
    // Always return true for fallback sharing methods
    return true;
  }

  // Generate shareable content for a craft post
  static generatePostShareContent(post: CraftPost): ShareOptions {
    const { author, content, craftType, techniques } = post;
    
    const title = `${author.displayName}'s ${craftType} project`;
    const message = [
      `Check out this amazing ${craftType} project by ${author.displayName}! 🔨`,
      '',
      `"${content.description}"`,
      '',
      `⏱️ Time spent: ${this.formatTimeSpent(content.timeSpent)}`,
      `🎯 Difficulty: ${content.difficulty}`,
      `🛠️ Techniques: ${techniques.join(', ')}`,
      '',
      `Shared via SnapCraft - The Craftsman's Social Platform`,
    ].join('\n');

    const url = this.generatePostUrl(post.id);

    return {
      title,
      message,
      url,
      dialogTitle: 'Share Craft Project',
    };
  }

  // Generate a shareable URL for a post
  static generatePostUrl(postId: string): string {
    // In production, this would be your app's deep link or web URL
    return `https://snapcraft.app/posts/${postId}`;
  }

  // Native share functionality with fallback
  static async sharePost(post: CraftPost): Promise<ShareResult> {
    await ensureModulesInitialized();
    
    try {
      const shareContent = this.generatePostShareContent(post);
      
      // Try native sharing first
      if (Sharing && Sharing.isAvailableAsync) {
        try {
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(shareContent.url || '', {
              dialogTitle: shareContent.dialogTitle,
            });
            return { success: true, activityType: 'native-share' };
          }
        } catch (error) {
          console.warn('Native sharing failed, trying fallback:', error);
        }
      }

      // Fallback: Use custom alert with sharing content
      return await this.shareViaCustomAlert(shareContent);
    } catch (error) {
      console.error('Error sharing post:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to share',
      };
    }
  }

  // Custom alert-based sharing fallback
  static async shareViaCustomAlert(shareContent: ShareOptions): Promise<ShareResult> {
    try {
      // Try Web Share API first (if available)
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: shareContent.title,
          text: shareContent.message,
          url: shareContent.url,
        });
        return { success: true, activityType: 'web-share' };
      }

      // Fallback: Show custom alert with shareable content
      const fullContent = `${shareContent.message}\n\nLink: ${shareContent.url}`;
      
      this.showAlert(
        'Share Project',
        fullContent,
        [
          { text: 'Done', style: 'default' }
        ],
        true // Make it copyable
      );
      
      return { success: true, activityType: 'custom-alert-share' };
    } catch (error) {
      console.error('Error with custom alert sharing:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sharing failed',
      };
    }
  }

  // Copy post link to clipboard with fallback
  static async copyPostLink(post: CraftPost): Promise<ShareResult> {
    await ensureModulesInitialized();
    
    try {
      const url = this.generatePostUrl(post.id);
      
      // Try native clipboard first
      if (Clipboard && Clipboard.setStringAsync) {
        try {
          await Clipboard.setStringAsync(url);
          return { success: true, activityType: 'native-clipboard' };
        } catch (error) {
          console.warn('Native clipboard failed, trying fallback:', error);
        }
      }

      // Fallback: Use web clipboard API
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(url);
          return { success: true, activityType: 'web-clipboard' };
        } catch (error) {
          console.warn('Web clipboard failed, using custom alert fallback:', error);
        }
      }

      // Final fallback: Show custom alert with copyable URL
      this.showAlert(
        'Copy Project Link',
        url,
        [{ text: 'Done', style: 'default' }],
        true // Make it copyable
      );
      
      return { success: true, activityType: 'custom-alert-copy' };
    } catch (error) {
      console.error('Error copying link:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to copy link',
      };
    }
  }

  // Share to specific social media platforms
  static async shareToSocialMedia(
    post: CraftPost, 
    platform: 'twitter' | 'facebook' | 'instagram' | 'whatsapp'
  ): Promise<ShareResult> {
    try {
      const shareContent = this.generatePostShareContent(post);
      let shareUrl = '';

      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareContent.message || '')}&url=${encodeURIComponent(shareContent.url || '')}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareContent.url || '')}`;
          break;
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodeURIComponent((shareContent.message || '') + ' ' + (shareContent.url || ''))}`;
          break;
        case 'instagram':
          // Instagram doesn't support direct URL sharing, so we'll use native sharing if available
          await ensureModulesInitialized();
          if (Sharing && Sharing.isAvailableAsync) {
            return await this.sharePost(post);
          } else {
            return await this.shareViaCustomAlert(shareContent);
          }
      }

      if (shareUrl) {
        const canOpen = await Linking.canOpenURL(shareUrl);
        if (canOpen) {
          await Linking.openURL(shareUrl);
          return { success: true, activityType: platform };
        } else {
          // If can't open URL, show fallback
          return await this.shareViaCustomAlert(shareContent);
        }
      }

      return {
        success: false,
        error: 'Platform not supported',
      };
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to share to ${platform}`,
      };
    }
  }

  // In-app sharing (share to user profile or collections)
  static async shareToProfile(post: CraftPost, userId: string): Promise<ShareResult> {
    try {
      // This would integrate with your user profile/collections system
      // For now, we'll simulate the functionality
      console.log(`Sharing post ${post.id} to user ${userId}'s profile`);
      
      // In a real implementation, this would:
      // 1. Add the post to user's shared collection
      // 2. Update user's profile with shared content
      // 3. Notify followers of the shared content
      
      return { success: true, activityType: 'profile-share' };
    } catch (error) {
      console.error('Error sharing to profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to share to profile',
      };
    }
  }

  // Helper function to format time spent
  private static formatTimeSpent(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  }

  // Track sharing analytics (for future implementation)
  static trackShareEvent(
    postId: string,
    platform: string,
    userId?: string
  ): void {
    // This would integrate with your analytics service
    console.log('📊 Share event tracked:', {
      postId,
      platform,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
} 