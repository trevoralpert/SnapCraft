import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import app from '../firebase/config';
import EnvironmentService from '../../shared/services/EnvironmentService';

interface CraftEvent {
  craft_type?: string;
  difficulty?: string;
  time_spent?: number;
  user_skill_level?: string;
  tools_used?: string[];
}

interface UserEvent {
  user_id: string;
  user_skill_level?: string;
  craft_specializations?: string[];
}

interface ErrorEvent {
  error_type: string;
  error_message: string;
  error_stack?: string;
  user_id?: string;
  screen_name?: string;
}

class ProductionAnalytics {
  private analytics: Analytics | null = null;
  private performance: any = null; // FirebasePerformance type
  private environmentService = EnvironmentService.getInstance();
  private isEnabled = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const envInfo = this.environmentService.getEnvironmentInfo();
      
      // Only enable analytics in production and staging
      if (envInfo.environment === 'production' || envInfo.environment === 'staging') {
        if (app) {
          this.analytics = getAnalytics(app);
          this.performance = getPerformance(app);
          this.isEnabled = true;
          
          console.log('📊 Production Analytics initialized for:', envInfo.environment);
          
          // Log initialization
          this.logEvent('analytics_initialized', {
            environment: envInfo.environment,
            timestamp: Date.now()
          });
        } else {
          console.log('📊 Analytics disabled - Firebase app not initialized');
        }
      } else {
        console.log('📊 Analytics disabled in development environment');
      }
    } catch (error) {
      console.error('❌ Failed to initialize analytics:', error);
    }
  }

  // Core event logging
  logEvent(eventName: string, parameters?: Record<string, any>) {
    if (!this.isEnabled || !this.analytics) {
      console.log('📊 [DEV] Analytics event:', eventName, parameters);
      return;
    }

    try {
      logEvent(this.analytics, eventName, {
        ...parameters,
        timestamp: Date.now(),
        app_version: '1.0.0', // TODO: Get from app.json
      });
    } catch (error) {
      console.error('❌ Failed to log analytics event:', error);
    }
  }

  // Craft-specific events
  logCraftPostCreated(craftData: CraftEvent & { post_id: string }) {
    this.logEvent('craft_post_created', {
      ...craftData,
      event_category: 'craft_creation',
    });
  }

  logStoryShared(storyData: CraftEvent & { story_id: string; duration: number }) {
    this.logEvent('story_shared', {
      ...storyData,
      event_category: 'story_creation',
    });
  }

  logCraftViewed(craftData: { post_id: string; craft_type: string; view_duration?: number }) {
    this.logEvent('craft_viewed', {
      ...craftData,
      event_category: 'content_engagement',
    });
  }

  logTechniqueSearched(searchData: { query: string; craft_type?: string; results_count: number }) {
    this.logEvent('technique_searched', {
      ...searchData,
      event_category: 'knowledge_discovery',
    });
  }

  logToolAdded(toolData: { tool_name: string; tool_category: string; craft_type: string }) {
    this.logEvent('tool_added', {
      ...toolData,
      event_category: 'inventory_management',
    });
  }

  // User behavior events
  logUserSignUp(userData: UserEvent) {
    this.logEvent('sign_up', {
      ...userData,
      event_category: 'user_lifecycle',
      method: 'email',
    });
  }

  logUserLogin(userData: UserEvent) {
    this.logEvent('login', {
      ...userData,
      event_category: 'user_lifecycle',
      method: 'email',
    });
  }

  logSkillLevelUp(skillData: { 
    user_id: string; 
    craft_type: string; 
    old_level: string; 
    new_level: string 
  }) {
    this.logEvent('skill_level_up', {
      ...skillData,
      event_category: 'skill_progression',
    });
  }

  logFeatureUsed(featureData: { 
    feature_name: string; 
    screen_name: string; 
    user_id?: string 
  }) {
    this.logEvent('feature_used', {
      ...featureData,
      event_category: 'feature_engagement',
    });
  }

  // Performance events
  logPerformanceMetric(metricData: {
    metric_name: string;
    value: number;
    unit: string;
    screen_name?: string;
  }) {
    this.logEvent('performance_metric', {
      ...metricData,
      event_category: 'performance',
    });
  }

  logLoadTime(loadData: {
    screen_name: string;
    load_time_ms: number;
    user_id?: string;
  }) {
    this.logEvent('screen_load_time', {
      ...loadData,
      event_category: 'performance',
    });
  }

  // Error tracking
  logError(errorData: ErrorEvent) {
    this.logEvent('app_error', {
      ...errorData,
      event_category: 'error_tracking',
    });

    // Also log to console for development
    console.error('📊 Analytics Error:', errorData);
  }

  logCrash(crashData: {
    crash_type: string;
    crash_message: string;
    user_id?: string;
    screen_name?: string;
  }) {
    this.logEvent('app_crash', {
      ...crashData,
      event_category: 'error_tracking',
    });
  }

  // Business metrics
  logContentCreation(contentData: {
    content_type: 'post' | 'story' | 'comment';
    craft_type: string;
    user_skill_level: string;
    creation_time_ms?: number;
  }) {
    this.logEvent('content_created', {
      ...contentData,
      event_category: 'content_metrics',
    });
  }

  logEngagement(engagementData: {
    action: 'like' | 'comment' | 'share' | 'save';
    content_type: 'post' | 'story';
    content_id: string;
    user_id: string;
  }) {
    this.logEvent('content_engagement', {
      ...engagementData,
      event_category: 'engagement_metrics',
    });
  }

  logRetention(retentionData: {
    user_id: string;
    days_since_signup: number;
    session_count: number;
    last_active_days_ago: number;
  }) {
    this.logEvent('user_retention', {
      ...retentionData,
      event_category: 'retention_metrics',
    });
  }

  // Conversion events
  logOnboardingCompleted(onboardingData: {
    user_id: string;
    completion_time_ms: number;
    steps_completed: number;
    total_steps: number;
  }) {
    this.logEvent('onboarding_completed', {
      ...onboardingData,
      event_category: 'conversion',
    });
  }

  logFirstPost(firstPostData: {
    user_id: string;
    days_since_signup: number;
    craft_type: string;
    post_type: 'image' | 'video' | 'text';
  }) {
    this.logEvent('first_post_created', {
      ...firstPostData,
      event_category: 'conversion',
    });
  }

  // Search and discovery
  logSearch(searchData: {
    query: string;
    search_type: 'craft' | 'user' | 'technique' | 'tool';
    results_count: number;
    user_id?: string;
  }) {
    this.logEvent('search_performed', {
      ...searchData,
      event_category: 'discovery',
    });
  }

  logDiscovery(discoveryData: {
    discovery_method: 'feed' | 'search' | 'recommendation' | 'trending';
    content_type: 'post' | 'user' | 'technique';
    content_id: string;
    user_id?: string;
  }) {
    this.logEvent('content_discovered', {
      ...discoveryData,
      event_category: 'discovery',
    });
  }

  // Custom dimensions and user properties
  setUserProperties(properties: {
    skill_level?: string;
    primary_craft?: string;
    crafts_count?: number;
    posts_count?: number;
    followers_count?: number;
  }) {
    if (!this.isEnabled || !this.analytics) return;

    try {
      // Set user properties for segmentation
      Object.entries(properties).forEach(([key, value]) => {
        if (value !== undefined) {
          // Note: setUserProperties is not available in v9, use custom events instead
          this.logEvent('user_property_update', {
            property_name: key,
            property_value: value,
            event_category: 'user_properties',
          });
        }
      });
    } catch (error) {
      console.error('❌ Failed to set user properties:', error);
    }
  }

  // Debug and testing
  getAnalyticsStatus() {
    return {
      enabled: this.isEnabled,
      analytics: !!this.analytics,
      performance: !!this.performance,
      environment: this.environmentService.getEnvironmentInfo().environment,
    };
  }
}

// Export singleton instance
export const productionAnalytics = new ProductionAnalytics();
export default productionAnalytics; 