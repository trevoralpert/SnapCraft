import { User, CraftSpecialization } from '../../shared/types';
import { OnboardingStep, OnboardingData, OnboardingProgress, OnboardingStepType } from '../../shared/types/onboarding';
import { AuthService } from '../firebase/auth';

export class OnboardingService {
  private static readonly TOTAL_STEPS = 5;
  
  private static readonly STEPS: { id: number; name: string; type: OnboardingStepType }[] = [
    { id: 0, name: 'Welcome to SnapCraft', type: 'welcome' },
    { id: 1, name: 'Choose Your Craft Specializations', type: 'craft-selection' },
    { id: 2, name: 'Camera Permissions & Tutorial', type: 'camera-permissions' },
    { id: 3, name: 'Tool Inventory Introduction', type: 'tool-introduction' },
    { id: 4, name: 'First Project Guidance', type: 'first-project-guidance' }
  ];

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
    data?: Partial<OnboardingData>
  ): Promise<void> {
    const currentOnboarding = user.onboarding || {
      completed: false,
      currentStep: 0,
      stepsCompleted: []
    };

    const step: OnboardingStep = {
      id: stepId,
      name: this.STEPS[stepId]?.name || `Step ${stepId}`,
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
    
    console.log(`✅ Onboarding step ${stepId} completed for user ${user.id}`);
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
    console.log(`⏭️ Onboarding skipped for user ${user.id}`);
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