import { AuthService } from '../firebase/auth';
import { User, OnboardingStep, TutorialProgress, FirstProjectGuidance } from '../../shared/types';

export interface OnboardingEvent {
  id: string;
  userId: string;
  eventType: OnboardingEventType;
  stepId?: number;
  stepName?: string;
  timestamp: Date;
  sessionId: string;
  metadata?: {
    duration?: number; // seconds spent on step
    skipped?: boolean;
    errorMessage?: string;
    userAgent?: string;
    platform?: 'ios' | 'android' | 'web';
    appVersion?: string;
  };
}

export type OnboardingEventType = 
  | 'onboarding_started'
  | 'step_viewed'
  | 'step_completed'
  | 'step_skipped'
  | 'step_error'
  | 'onboarding_completed'
  | 'onboarding_abandoned'
  | 'tutorial_started'
  | 'tutorial_completed'
  | 'first_project_started'
  | 'first_project_completed';

export interface OnboardingAnalyticsData {
  totalUsers: number;
  completionStats: {
    started: number;
    completed: number;
    completionRate: number;
    averageCompletionTime: number; // in minutes
    medianCompletionTime: number;
  };
  stepAnalytics: {
    stepId: number;
    stepName: string;
    viewCount: number;
    completionCount: number;
    skipCount: number;
    dropOffRate: number;
    averageTimeSpent: number; // seconds
    commonErrors: string[];
  }[];
  funnelAnalysis: {
    step: string;
    entered: number;
    completed: number;
    conversionRate: number;
    dropOffCount: number;
  }[];
  timeToFirstProject: {
    average: number; // hours
    median: number;
    percentiles: {
      p25: number;
      p75: number;
      p90: number;
    };
  };
  cohortAnalysis: {
    period: string; // 'week' | 'month'
    cohorts: {
      startDate: string;
      userCount: number;
      completionRate: number;
      averageTime: number;
    }[];
  };
}

export interface UserJourneyMetrics {
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  totalDuration?: number; // minutes
  stepsCompleted: number;
  stepsSkipped: number;
  tutorialsCompleted: number;
  firstProjectStarted: boolean;
  firstProjectCompleted: boolean;
  dropOffPoint?: string;
  platform: string;
  appVersion: string;
}

export class OnboardingAnalytics {
  private static sessionId: string = '';

  // Initialize analytics session
  static initializeSession(): string {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return this.sessionId;
  }

  // Track onboarding events
  static async trackEvent(
    userId: string,
    eventType: OnboardingEventType,
    stepId?: number,
    stepName?: string,
    metadata?: OnboardingEvent['metadata']
  ): Promise<void> {
    try {
      const event: OnboardingEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        eventType,
        stepId,
        stepName,
        timestamp: new Date(),
        sessionId: this.sessionId || this.initializeSession(),
        metadata: {
          platform: 'ios', // Could be detected dynamically
          appVersion: '1.0.0', // Could be from app config
          ...metadata,
        },
      };

      // Save to Firebase (in a real app, this would go to an analytics collection)
      await this.saveAnalyticsEvent(event);
      
      console.log(`📊 Onboarding Analytics: ${eventType}`, {
        userId,
        stepId,
        stepName,
        metadata,
      });
    } catch (error) {
      console.error('Error tracking onboarding event:', error);
    }
  }

  // Track step completion with timing
  static async trackStepCompletion(
    userId: string,
    stepId: number,
    stepName: string,
    startTime: Date,
    skipped: boolean = false
  ): Promise<void> {
    const duration = Math.round((Date.now() - startTime.getTime()) / 1000);
    
    await this.trackEvent(
      userId,
      skipped ? 'step_skipped' : 'step_completed',
      stepId,
      stepName,
      { duration, skipped }
    );
  }

  // Track tutorial progress
  static async trackTutorialProgress(
    userId: string,
    tutorialId: string,
    eventType: 'tutorial_started' | 'tutorial_completed',
    progress?: TutorialProgress
  ): Promise<void> {
    await this.trackEvent(
      userId,
      eventType,
      undefined,
      tutorialId,
      {
        duration: progress?.timeSpent,
        skipped: progress?.skipped,
      }
    );
  }

  // Track first project milestones
  static async trackFirstProjectMilestone(
    userId: string,
    eventType: 'first_project_started' | 'first_project_completed',
    projectTemplate?: string,
    guidance?: FirstProjectGuidance
  ): Promise<void> {
    const duration = guidance?.completedAt && guidance?.startedAt
      ? Math.round((guidance.completedAt.getTime() - guidance.startedAt.getTime()) / (1000 * 60))
      : undefined;

    await this.trackEvent(
      userId,
      eventType,
      undefined,
      projectTemplate,
      { duration }
    );
  }

  // Get comprehensive analytics data
  static async getOnboardingAnalytics(): Promise<OnboardingAnalyticsData> {
    try {
      // In a real implementation, this would query the analytics database
      // For now, we'll calculate from user data
      const analyticsData = await this.calculateAnalyticsFromUserData();
      
      console.log('📊 Generated onboarding analytics:', analyticsData);
      return analyticsData;
    } catch (error) {
      console.error('Error getting onboarding analytics:', error);
      return this.getDefaultAnalyticsData();
    }
  }

  // Calculate analytics from existing user data
  private static async calculateAnalyticsFromUserData(): Promise<OnboardingAnalyticsData> {
    // This is a simplified version - in production, you'd query all users
    const mockData: OnboardingAnalyticsData = {
      totalUsers: 150,
      completionStats: {
        started: 150,
        completed: 127,
        completionRate: 84.7,
        averageCompletionTime: 12.5,
        medianCompletionTime: 10.2,
      },
      stepAnalytics: [
        {
          stepId: 0,
          stepName: 'Welcome',
          viewCount: 150,
          completionCount: 148,
          skipCount: 2,
          dropOffRate: 1.3,
          averageTimeSpent: 45,
          commonErrors: [],
        },
        {
          stepId: 1,
          stepName: 'Craft Selection',
          viewCount: 148,
          completionCount: 142,
          skipCount: 3,
          dropOffRate: 4.1,
          averageTimeSpent: 120,
          commonErrors: ['No specialization selected'],
        },
        {
          stepId: 2,
          stepName: 'Camera Permissions',
          viewCount: 142,
          completionCount: 135,
          skipCount: 5,
          dropOffRate: 9.2,
          averageTimeSpent: 90,
          commonErrors: ['Permission denied', 'Camera not available'],
        },
        {
          stepId: 3,
          stepName: 'Tool Introduction',
          viewCount: 135,
          completionCount: 132,
          skipCount: 2,
          dropOffRate: 2.2,
          averageTimeSpent: 75,
          commonErrors: [],
        },
        {
          stepId: 4,
          stepName: 'First Project',
          viewCount: 132,
          completionCount: 127,
          skipCount: 4,
          dropOffRate: 3.8,
          averageTimeSpent: 180,
          commonErrors: ['No projects available'],
        },
      ],
      funnelAnalysis: [
        { step: 'Started Onboarding', entered: 150, completed: 150, conversionRate: 100, dropOffCount: 0 },
        { step: 'Welcome', entered: 150, completed: 148, conversionRate: 98.7, dropOffCount: 2 },
        { step: 'Craft Selection', entered: 148, completed: 142, conversionRate: 95.9, dropOffCount: 6 },
        { step: 'Camera Permissions', entered: 142, completed: 135, conversionRate: 95.1, dropOffCount: 7 },
        { step: 'Tool Introduction', entered: 135, completed: 132, conversionRate: 97.8, dropOffCount: 3 },
        { step: 'First Project', entered: 132, completed: 127, conversionRate: 96.2, dropOffCount: 5 },
      ],
      timeToFirstProject: {
        average: 2.8,
        median: 2.1,
        percentiles: {
          p25: 1.5,
          p75: 3.2,
          p90: 5.1,
        },
      },
      cohortAnalysis: {
        period: 'week',
        cohorts: [
          { startDate: '2025-06-23', userCount: 45, completionRate: 86.7, averageTime: 11.2 },
          { startDate: '2025-06-16', userCount: 52, completionRate: 84.6, averageTime: 12.8 },
          { startDate: '2025-06-09', userCount: 38, completionRate: 81.6, averageTime: 13.5 },
          { startDate: '2025-06-02', userCount: 15, completionRate: 80.0, averageTime: 14.2 },
        ],
      },
    };

    return mockData;
  }

  // Get user journey metrics for a specific user
  static async getUserJourneyMetrics(userId: string): Promise<UserJourneyMetrics | null> {
    try {
      const userData = await AuthService.getUserData(userId);
      if (!userData) return null;

      const onboarding = userData.onboarding;
      const tutorialProgress = userData.tutorialProgress || {};
      const firstProjectGuidance = userData.firstProjectGuidance;

      // Helper function to safely convert Firebase Timestamp to Date
      const toDate = (timestamp: any): Date => {
        if (!timestamp) return new Date();
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }
        if (timestamp.seconds) {
          return new Date(timestamp.seconds * 1000);
        }
        if (timestamp instanceof Date) {
          return timestamp;
        }
        return new Date(timestamp);
      };

      const startedAt = onboarding?.stepsCompleted?.[0]?.completedAt 
        ? toDate(onboarding.stepsCompleted[0].completedAt) 
        : new Date();
      
      const completedAt = onboarding?.completedAt 
        ? toDate(onboarding.completedAt) 
        : undefined;

      const metrics: UserJourneyMetrics = {
        userId,
        startedAt,
        completedAt,
        totalDuration: completedAt && startedAt
          ? Math.round((completedAt.getTime() - startedAt.getTime()) / (1000 * 60))
          : undefined,
        stepsCompleted: onboarding?.stepsCompleted?.filter(s => s.completed).length || 0,
        stepsSkipped: 0, // Would need to track this in onboarding data
        tutorialsCompleted: Object.values(tutorialProgress).filter(t => t.completedAt).length,
        firstProjectStarted: !!firstProjectGuidance?.startedAt,
        firstProjectCompleted: !!firstProjectGuidance?.completedAt,
        dropOffPoint: !onboarding?.completed ? `Step ${onboarding?.currentStep || 0}` : undefined,
        platform: 'ios',
        appVersion: '1.0.0',
      };

      return metrics;
    } catch (error) {
      console.error('Error getting user journey metrics:', error);
      return null;
    }
  }

  // Identify users at risk of dropping off
  static async getAtRiskUsers(): Promise<{ userId: string; riskScore: number; reason: string }[]> {
    // This would analyze user behavior patterns to identify drop-off risk
    // For now, return mock data
    return [
      { userId: 'user1', riskScore: 0.85, reason: 'Stuck on camera permissions for 2 days' },
      { userId: 'user2', riskScore: 0.72, reason: 'Started onboarding but no activity for 24h' },
      { userId: 'user3', riskScore: 0.68, reason: 'Completed onboarding but no first project started' },
    ];
  }

  // A/B Testing Support
  static async getABTestVariant(userId: string, testName: string): Promise<string> {
    // Simple hash-based A/B testing
    const hash = this.hashUserId(userId + testName);
    const variant = hash % 2 === 0 ? 'A' : 'B';
    
    // Track the assignment
    await this.trackEvent(userId, 'step_viewed', undefined, `ab_test_${testName}_${variant}`);
    
    return variant;
  }

  // Utility method to generate analytics insights
  static async generateInsights(): Promise<string[]> {
    const analytics = await this.getOnboardingAnalytics();
    const insights: string[] = [];

    // Completion rate insights
    if (analytics.completionStats.completionRate > 85) {
      insights.push('🎉 Excellent onboarding completion rate! Users are finding the flow intuitive.');
    } else if (analytics.completionStats.completionRate < 70) {
      insights.push('⚠️ Onboarding completion rate needs improvement. Consider simplifying the flow.');
    }

    // Drop-off analysis
    const highestDropOff = analytics.stepAnalytics.reduce((max, step) => 
      step.dropOffRate > max.dropOffRate ? step : max
    );
    if (highestDropOff.dropOffRate > 10) {
      insights.push(`🚨 High drop-off at "${highestDropOff.stepName}" (${highestDropOff.dropOffRate}%). This step needs attention.`);
    }

    // Time to first project
    if (analytics.timeToFirstProject.average > 4) {
      insights.push('⏰ Users take too long to start their first project. Consider adding more guidance.');
    }

    return insights;
  }

  // Private helper methods
  private static async saveAnalyticsEvent(event: OnboardingEvent): Promise<void> {
    // In a real app, save to Firebase Analytics collection
    // For now, just log it
    console.log('💾 Saving analytics event:', event);
  }

  private static hashUserId(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private static getDefaultAnalyticsData(): OnboardingAnalyticsData {
    return {
      totalUsers: 0,
      completionStats: {
        started: 0,
        completed: 0,
        completionRate: 0,
        averageCompletionTime: 0,
        medianCompletionTime: 0,
      },
      stepAnalytics: [],
      funnelAnalysis: [],
      timeToFirstProject: {
        average: 0,
        median: 0,
        percentiles: { p25: 0, p75: 0, p90: 0 },
      },
      cohortAnalysis: {
        period: 'week',
        cohorts: [],
      },
    };
  }
} 