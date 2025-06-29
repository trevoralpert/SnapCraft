import { Tutorial, TutorialStep, TutorialProgress, User } from '../../shared/types';
import { AuthService } from '../firebase/auth';
import { OnboardingAnalytics } from '../analytics/OnboardingAnalytics';

export class TutorialService {
  // Define available tutorials
  private static readonly TUTORIALS: Tutorial[] = [
    {
      id: 'camera-basics',
      name: 'Camera & Vision Modes',
      description: 'Learn to use SnapCraft\'s intelligent camera system for project documentation',
      category: 'camera',
      estimatedDuration: 3,
      difficulty: 'beginner',
      isRequired: true,
      steps: [
        {
          id: 'camera-intro',
          title: 'Welcome to SnapCraft Camera',
          description: 'Discover how our AI-powered camera helps document your craft projects',
          type: 'camera',
          completed: false,
          interactionRequired: false
        },
        {
          id: 'vision-modes-overview',
          title: 'Vision Modes Explained',
          description: 'Learn about different vision modes: General, Tool ID, Process, and Quality Check',
          type: 'vision-mode',
          completed: false,
          interactionRequired: false
        },
        {
          id: 'take-first-photo',
          title: 'Take Your First Photo',
          description: 'Practice taking a photo in General mode',
          type: 'camera',
          completed: false,
          interactionRequired: true,
          highlightElement: 'camera-capture-button'
        },
        {
          id: 'switch-vision-modes',
          title: 'Try Different Vision Modes',
          description: 'Switch between vision modes and see how AI analysis changes',
          type: 'vision-mode',
          completed: false,
          interactionRequired: true,
          highlightElement: 'vision-mode-selector'
        }
      ]
    },
    {
      id: 'tool-identification',
      name: 'Smart Tool Recognition',
      description: 'Master the tool identification system to build your digital inventory',
      category: 'tools',
      estimatedDuration: 4,
      difficulty: 'beginner',
      isRequired: true,
      steps: [
        {
          id: 'tool-id-intro',
          title: 'AI Tool Recognition',
          description: 'Learn how SnapCraft automatically identifies tools in your photos',
          type: 'tool-identification',
          completed: false,
          interactionRequired: false
        },
        {
          id: 'tool-photo-tips',
          title: 'Best Practices for Tool Photos',
          description: 'Tips for taking clear photos that help AI identify tools accurately',
          type: 'tool-identification',
          completed: false,
          interactionRequired: false
        },
        {
          id: 'identify-first-tool',
          title: 'Identify Your First Tool',
          description: 'Take a photo of a tool and watch the AI identify it',
          type: 'tool-identification',
          completed: false,
          interactionRequired: true,
          highlightElement: 'tool-id-camera'
        },
        {
          id: 'manage-tool-inventory',
          title: 'Managing Your Tool Inventory',
          description: 'Learn to edit, organize, and track your identified tools',
          type: 'tool-identification',
          completed: false,
          interactionRequired: true,
          highlightElement: 'tool-inventory-screen'
        }
      ]
    },
    {
      id: 'project-documentation',
      name: 'Project Documentation Best Practices',
      description: 'Learn to document your craft projects effectively for skill assessment',
      category: 'documentation',
      estimatedDuration: 5,
      difficulty: 'intermediate',
      isRequired: true,
      prerequisites: ['camera-basics'],
      steps: [
        {
          id: 'documentation-intro',
          title: 'Why Document Your Projects?',
          description: 'Understand how good documentation helps track your craft journey',
          type: 'documentation',
          completed: false,
          interactionRequired: false
        },
        {
          id: 'project-phases',
          title: 'Documenting Project Phases',
          description: 'Learn to capture before, during, and after shots effectively',
          type: 'documentation',
          completed: false,
          interactionRequired: false
        },
        {
          id: 'quality-indicators',
          title: 'What Makes Quality Documentation',
          description: 'Key elements that help AI assess your skill level accurately',
          type: 'documentation',
          completed: false,
          interactionRequired: false
        },
        {
          id: 'create-sample-project',
          title: 'Document a Sample Project',
          description: 'Practice documenting a simple craft project step-by-step',
          type: 'documentation',
          completed: false,
          interactionRequired: true,
          highlightElement: 'project-creation-flow'
        }
      ]
    }
  ];

  // Get all available tutorials
  static getAvailableTutorials(): Tutorial[] {
    return this.TUTORIALS;
  }

  // Get tutorials for a specific category
  static getTutorialsByCategory(category: Tutorial['category']): Tutorial[] {
    return this.TUTORIALS.filter(tutorial => tutorial.category === category);
  }

  // Get required tutorials for onboarding
  static getRequiredTutorials(): Tutorial[] {
    return this.TUTORIALS.filter(tutorial => tutorial.isRequired);
  }

  // Get user's tutorial progress
  static async getTutorialProgress(userId: string): Promise<{ [tutorialId: string]: TutorialProgress }> {
    try {
      const userData = await AuthService.getUserData(userId);
      return userData?.tutorialProgress || {};
    } catch (error) {
      console.error('Error getting tutorial progress:', error);
      return {};
    }
  }

  // Start a tutorial
  static async startTutorial(userId: string, tutorialId: string): Promise<void> {
    try {
      const tutorial = this.TUTORIALS.find(t => t.id === tutorialId);
      if (!tutorial) {
        throw new Error(`Tutorial ${tutorialId} not found`);
      }

      const progress: TutorialProgress = {
        tutorialId,
        userId,
        startedAt: new Date(),
        currentStepId: tutorial.steps[0]?.id,
        completedSteps: [],
        timeSpent: 0,
        skipped: false
      };

      await this.saveTutorialProgress(userId, progress);

      // Track tutorial start with analytics
      await OnboardingAnalytics.trackTutorialProgress(
        userId,
        tutorialId,
        'tutorial_started',
        progress
      );

      console.log(`✅ Tutorial ${tutorialId} started for user ${userId}`);
    } catch (error) {
      console.error('Error starting tutorial:', error);
      throw error;
    }
  }

  // Complete a tutorial step
  static async completeStep(userId: string, tutorialId: string, stepId: string): Promise<void> {
    try {
      const userProgress = await this.getTutorialProgress(userId);
      const currentProgress = userProgress[tutorialId];

      if (!currentProgress) {
        throw new Error(`No progress found for tutorial ${tutorialId}`);
      }

      const tutorial = this.TUTORIALS.find(t => t.id === tutorialId);
      if (!tutorial) {
        throw new Error(`Tutorial ${tutorialId} not found`);
      }

      const currentStepIndex = tutorial.steps.findIndex(s => s.id === stepId);
      const nextStep = tutorial.steps[currentStepIndex + 1];
      const isCompleted = !nextStep;

      const updatedProgress: TutorialProgress = {
        ...currentProgress,
        completedSteps: [...currentProgress.completedSteps, stepId],
        timeSpent: currentProgress.timeSpent + 30, // Estimate 30 seconds per step
      };

      // Set currentStepId only if there's a next step, otherwise remove it
      if (nextStep) {
        updatedProgress.currentStepId = nextStep.id;
      } else {
        // Tutorial completed - remove currentStepId and set completion date
        delete updatedProgress.currentStepId;
        updatedProgress.completedAt = new Date();
      }

      await this.saveTutorialProgress(userId, updatedProgress);

      // Track tutorial completion with analytics
      if (isCompleted) {
        await OnboardingAnalytics.trackTutorialProgress(
          userId,
          tutorialId,
          'tutorial_completed',
          updatedProgress
        );
      }

      console.log(`✅ Tutorial step ${stepId} completed for user ${userId} in tutorial ${tutorialId}`);
      if (isCompleted) {
        console.log(`🎉 Tutorial ${tutorialId} completed for user ${userId}`);
      }
    } catch (error) {
      console.error('Error completing tutorial step:', error);
      throw error;
    }
  }

  // Skip a tutorial
  static async skipTutorial(userId: string, tutorialId: string): Promise<void> {
    try {
      const userProgress = await this.getTutorialProgress(userId);
      const currentProgress = userProgress[tutorialId];

      if (!currentProgress) {
        // If tutorial wasn't started, start it first
        await this.startTutorial(userId, tutorialId);
      }

      const skippedProgress: TutorialProgress = {
        ...currentProgress,
        skipped: true,
        completedAt: new Date(),
        timeSpent: currentProgress?.timeSpent || 0
      };

      // Remove currentStepId when skipped
      delete skippedProgress.currentStepId;

      await this.saveTutorialProgress(userId, skippedProgress);

      // Track tutorial skip with analytics
      await OnboardingAnalytics.trackTutorialProgress(
        userId,
        tutorialId,
        'tutorial_completed', // Treat skip as completion for analytics
        skippedProgress
      );

      console.log(`⏭️ Tutorial ${tutorialId} skipped for user ${userId}`);
    } catch (error) {
      console.error('Error skipping tutorial:', error);
      throw error;
    }
  }

  // Save tutorial progress to user profile
  private static async saveTutorialProgress(userId: string, progress: TutorialProgress): Promise<void> {
    try {
      const userData = await AuthService.getUserData(userId);
      if (!userData) {
        throw new Error('User not found');
      }

      const updatedTutorialProgress = {
        ...userData.tutorialProgress,
        [progress.tutorialId]: progress
      };

      await AuthService.updateUserData(userId, {
        tutorialProgress: updatedTutorialProgress
      });
    } catch (error) {
      console.error('Error saving tutorial progress:', error);
      throw error;
    }
  }

  // Get recommended tutorials for a user based on their progress and specialization
  static getRecommendedTutorials(user: User): Tutorial[] {
    const userProgress = user.tutorialProgress || {};
    const completedTutorials = Object.keys(userProgress).filter(
      tutorialId => userProgress[tutorialId].completedAt || userProgress[tutorialId].skipped
    );

    return this.TUTORIALS.filter(tutorial => {
      // Skip if already completed
      if (completedTutorials.includes(tutorial.id)) {
        return false;
      }

      // Check prerequisites
      if (tutorial.prerequisites) {
        const hasPrerequisites = tutorial.prerequisites.every(prereq => 
          completedTutorials.includes(prereq)
        );
        if (!hasPrerequisites) {
          return false;
        }
      }

      return true;
    });
  }

  // Check if user has completed all required tutorials
  static hasCompletedRequiredTutorials(user: User): boolean {
    const requiredTutorials = this.getRequiredTutorials();
    const userProgress = user.tutorialProgress || {};

    return requiredTutorials.every(tutorial => {
      const progress = userProgress[tutorial.id];
      return progress && (progress.completedAt || progress.skipped);
    });
  }
} 