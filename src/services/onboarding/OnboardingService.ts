import { User, CraftSpecialization } from '../../shared/types';
import { OnboardingStep, OnboardingData, OnboardingProgress, OnboardingStepType } from '../../shared/types/onboarding';
import { AuthService } from '../firebase/auth';
import { OnboardingAnalytics } from '../analytics/OnboardingAnalytics';

export class OnboardingService {
  private static readonly TOTAL_STEPS = 5;
  private static stepStartTimes: Map<string, Date> = new Map();
  
  private static readonly STEPS: { id: number; name: string; type: OnboardingStepType }[] = [
    { id: 0, name: 'Welcome to SnapCraft', type: 'welcome' },
    { id: 1, name: 'Choose Your Craft Specializations', type: 'craft-selection' },
    { id: 2, name: 'Camera Permissions & Tutorial', type: 'camera-permissions' },
    { id: 3, name: 'Tool Inventory Introduction', type: 'tool-introduction' },
    { id: 4, name: 'First Project Guidance', type: 'first-project-guidance' }
  ];

  static async startOnboarding(userId: string): Promise<void> {
    // Initialize analytics session
    OnboardingAnalytics.initializeSession();
    
    // Track onboarding start
    await OnboardingAnalytics.trackEvent(userId, 'onboarding_started');
    
    console.log(`🚀 Onboarding started for user ${userId}`);
  }

  static async startStep(userId: string, stepId: number): Promise<void> {
    const stepInfo = this.getStepInfo(stepId);
    if (!stepInfo) return;

    // Track step start time
    const startTimeKey = `${userId}_${stepId}`;
    this.stepStartTimes.set(startTimeKey, new Date());

    // Track step view
    await OnboardingAnalytics.trackEvent(
      userId, 
      'step_viewed', 
      stepId, 
      stepInfo.name
    );

    console.log(`👀 User ${userId} started step ${stepId}: ${stepInfo.name}`);
  }

  static getProgress(user: User): OnboardingProgress {
    const onboarding = user.onboarding || {
      completed: false,
      currentStep: 0,
      stepsCompleted: []
    };

    return {
      currentStep: onboarding.currentStep || 0,
      totalSteps: this.TOTAL_STEPS,
      stepsCompleted: onboarding.stepsCompleted || [],
      data: {},
      canSkip: onboarding.currentStep !== undefined && onboarding.currentStep > 0
    };
  }

  static async completeStep(
    user: User, 
    stepId: number, 
    data?: Partial<OnboardingData>,
    skipped: boolean = false
  ): Promise<void> {
    const stepInfo = this.getStepInfo(stepId);
    if (!stepInfo) return;

    // Get step start time for duration calculation
    const startTimeKey = `${user.id}_${stepId}`;
    const startTime = this.stepStartTimes.get(startTimeKey) || new Date();

    const currentOnboarding = user.onboarding || {
      completed: false,
      currentStep: 0,
      stepsCompleted: []
    };

    const step: OnboardingStep = {
      id: stepId,
      name: stepInfo.name,
      completed: true,
      completedAt: new Date()
    };

    const updatedStepsCompleted = [
      ...currentOnboarding.stepsCompleted?.filter(s => s.id !== stepId) || [],
      step
    ];

    const nextStep = stepId + 1;
    const isCompleted = nextStep >= this.TOTAL_STEPS;

    const updatedOnboarding: any = {
      completed: isCompleted,
      currentStep: isCompleted ? this.TOTAL_STEPS : nextStep,
      stepsCompleted: updatedStepsCompleted
    };

    // Only add completedAt if onboarding is actually completed
    if (isCompleted) {
      updatedOnboarding.completedAt = new Date();
    }

    // Update user profile with onboarding progress
    const userUpdates: Partial<User> = {
      onboarding: updatedOnboarding
    };

    // Apply step-specific data updates
    if (data) {
      if (data.selectedCraftSpecializations) {
        userUpdates.craftSpecialization = data.selectedCraftSpecializations;
      }
    }

    await AuthService.updateUserData(user.id, userUpdates);

    // Track step completion with analytics
    await OnboardingAnalytics.trackStepCompletion(
      user.id,
      stepId,
      stepInfo.name,
      startTime,
      skipped
    );

    // Track onboarding completion
    if (isCompleted) {
      await OnboardingAnalytics.trackEvent(user.id, 'onboarding_completed');
    }

    // Clean up step start time
    this.stepStartTimes.delete(startTimeKey);
    
    console.log(`✅ Onboarding step ${stepId} ${skipped ? 'skipped' : 'completed'} for user ${user.id}`);
    if (isCompleted) {
      console.log(`🎉 Onboarding completed for user ${user.id}`);
    }
  }

  static async skipOnboarding(user: User): Promise<void> {
    const updatedOnboarding = {
      completed: true,
      completedAt: new Date(),
      currentStep: this.TOTAL_STEPS,
      stepsCompleted: this.STEPS.map(step => ({
        id: step.id,
        name: step.name,
        completed: true,
        completedAt: new Date()
      }))
    };

    await AuthService.updateUserData(user.id, { onboarding: updatedOnboarding });

    // Track onboarding abandonment/skip
    await OnboardingAnalytics.trackEvent(user.id, 'onboarding_abandoned');

    console.log(`⏭️ Onboarding skipped for user ${user.id}`);
  }

  static async trackError(userId: string, stepId: number, errorMessage: string): Promise<void> {
    const stepInfo = this.getStepInfo(stepId);
    if (!stepInfo) return;

    await OnboardingAnalytics.trackEvent(
      userId,
      'step_error',
      stepId,
      stepInfo.name,
      { errorMessage }
    );

    console.log(`❌ Onboarding error for user ${userId} at step ${stepId}: ${errorMessage}`);
  }

  static getStepInfo(stepId: number): { name: string; type: OnboardingStepType } | null {
    const step = this.STEPS.find(s => s.id === stepId);
    return step ? { name: step.name, type: step.type } : null;
  }

  static isOnboardingComplete(user: User): boolean {
    return user.onboarding?.completed === true;
  }

  static needsOnboarding(user: User): boolean {
    return !this.isOnboardingComplete(user);
  }
} 