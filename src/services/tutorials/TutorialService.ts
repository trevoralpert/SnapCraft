import { Tutorial, TutorialStep, TutorialProgress, User } from '../../shared/types';
import { AuthService } from '../firebase/auth';

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
        throw new Error(`Tutorial ${tutorialId} not started`);
      }

      const tutorial = this.TUTORIALS.find(t => t.id === tutorialId);
      if (!tutorial) {
        throw new Error(`Tutorial ${tutorialId} not found`);
      }

      const stepIndex = tutorial.steps.findIndex(s => s.id === stepId);
      if (stepIndex === -1) {
        throw new Error(`Step ${stepId} not found in tutorial ${tutorialId}`);
      }

      // Update progress
      const updatedProgress: any = {
        ...currentProgress,
        completedSteps: [...currentProgress.completedSteps.filter(s => s !== stepId), stepId]
      };

      // Only set currentStepId if there's a next step
      const nextStep = tutorial.steps[stepIndex + 1];
      if (nextStep) {
        updatedProgress.currentStepId = nextStep.id;
      }

      // Check if tutorial is completed
      if (updatedProgress.completedSteps.length === tutorial.steps.length) {
        updatedProgress.completedAt = new Date();
        // Remove currentStepId when tutorial is completed
        delete updatedProgress.currentStepId;
        console.log(`🎉 Tutorial ${tutorialId} completed for user ${userId}`);
      }

      await this.saveTutorialProgress(userId, updatedProgress);
      console.log(`✅ Tutorial step ${stepId} completed for user ${userId}`);
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

      const updatedProgress: TutorialProgress = {
        ...currentProgress,
        tutorialId,
        userId,
        startedAt: currentProgress?.startedAt || new Date(),
        completedAt: new Date(),
        completedSteps: [],
        timeSpent: currentProgress?.timeSpent || 0,
        skipped: true
      };

      await this.saveTutorialProgress(userId, updatedProgress);
      console.log(`⏭️ Tutorial ${tutorialId} skipped for user ${userId}`);
    } catch (error) {
      console.error('Error skipping tutorial:', error);
      throw error;
    }
  }

  // Save tutorial progress to Firebase
  private static async saveTutorialProgress(userId: string, progress: TutorialProgress): Promise<void> {
    try {
      const userData = await AuthService.getUserData(userId);
      const currentTutorialProgress = userData?.tutorialProgress || {};

      const updatedTutorialProgress = {
        ...currentTutorialProgress,
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

  // Get recommended tutorials based on user's craft specialization
  static getRecommendedTutorials(user: User): Tutorial[] {
    const completed = Object.keys(user.tutorialProgress || {})
      .filter(tutorialId => {
        const progress = user.tutorialProgress?.[tutorialId];
        return progress?.completedAt;
      });

    return this.TUTORIALS.filter(tutorial => {
      // Skip already completed tutorials
      if (completed.includes(tutorial.id)) return false;

      // Check prerequisites
      if (tutorial.prerequisites) {
        const hasPrerequisites = tutorial.prerequisites.every(prereq => 
          completed.includes(prereq)
        );
        if (!hasPrerequisites) return false;
      }

      return true;
    });
  }

  // Check if user has completed all required tutorials
  static hasCompletedRequiredTutorials(user: User): boolean {
    const requiredTutorials = this.getRequiredTutorials();
    const tutorialProgress = user.tutorialProgress || {};
    const completedTutorials = Object.keys(tutorialProgress)
      .filter(tutorialId => tutorialProgress[tutorialId].completedAt);

    return requiredTutorials.every(tutorial => 
      completedTutorials.includes(tutorial.id)
    );
  }
} 