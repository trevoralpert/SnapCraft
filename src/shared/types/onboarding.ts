// Phase 5: Onboarding System Types
import { CraftSpecialization } from './index';

export interface OnboardingStep {
  id: number;
  name: string;
  completed: boolean;
  completedAt?: Date;
}

export interface OnboardingData {
  selectedCraftSpecializations?: CraftSpecialization[];
  cameraPermissionGranted?: boolean;
  hasSeenToolIntro?: boolean;
  hasSeenFirstProjectTip?: boolean;
}

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  stepsCompleted: OnboardingStep[];
  data: OnboardingData;
  canSkip: boolean;
}

export type OnboardingStepType = 
  | 'welcome'
  | 'craft-selection'
  | 'camera-permissions'
  | 'tool-introduction'
  | 'first-project-guidance';

export interface OnboardingScreenProps {
  onNext: (data?: Partial<OnboardingData>) => void;
  onSkip?: () => void;
  onBack?: () => void;
  progress: OnboardingProgress;
} 