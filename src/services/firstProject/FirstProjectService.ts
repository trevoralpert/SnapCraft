import { ProjectTemplate, ProjectStep, FirstProjectGuidance, User, CraftSpecialization, SkillLevel } from '../../shared/types';
import { AuthService } from '../firebase/auth';

export class FirstProjectService {
  // Pre-defined project templates for different crafts and skill levels
  private static readonly PROJECT_TEMPLATES: ProjectTemplate[] = [
    // Woodworking Templates
    {
      id: 'simple-cutting-board',
      name: 'Simple Cutting Board',
      description: 'Create your first wooden cutting board using basic woodworking techniques',
      craftType: 'woodworking',
      skillLevel: 'novice',
      estimatedTime: 120, // 2 hours
      difficulty: 'beginner',
      materials: ['Pine or hardwood board (12" x 8" x 1")', 'Wood finish or food-safe oil', 'Sandpaper (120, 220 grit)'],
      tools: ['Hand saw or circular saw', 'Sander or sanding block', 'Measuring tape', 'Pencil'],
      isPopular: true,
      completionRate: 85,
      tips: [
        'Start with softer woods like pine for easier cutting',
        'Always sand with the grain, not against it',
        'Apply thin coats of finish for best results'
      ],
      steps: [
        {
          id: 'measure-cut',
          title: 'Measure and Cut',
          description: 'Mark and cut your board to size',
          instructions: [
            'Measure and mark your desired dimensions',
            'Use a straight edge to ensure clean lines',
            'Cut slowly and steadily with your saw'
          ],
          tips: ['Measure twice, cut once!', 'Support the wood properly while cutting'],
          estimatedTime: 30,
          photoRequired: true,
          safetyNotes: ['Wear safety glasses', 'Keep fingers away from blade'],
          successCriteria: ['Board is cut to correct dimensions', 'Edges are reasonably straight']
        },
        {
          id: 'sand-smooth',
          title: 'Sand Smooth',
          description: 'Sand the board to a smooth finish',
          instructions: [
            'Start with 120 grit sandpaper',
            'Sand all surfaces evenly',
            'Progress to 220 grit for final smoothing'
          ],
          tips: ['Sand with the grain direction', 'Check for smoothness by touch'],
          estimatedTime: 45,
          photoRequired: true,
          commonMistakes: ['Sanding against the grain', 'Skipping grits'],
          successCriteria: ['Surface feels smooth to touch', 'No visible scratches remain']
        },
        {
          id: 'apply-finish',
          title: 'Apply Finish',
          description: 'Protect your cutting board with food-safe finish',
          instructions: [
            'Clean off all sanding dust',
            'Apply thin, even coats of finish',
            'Allow proper drying time between coats'
          ],
          tips: ['Use food-safe finishes only', 'Apply in well-ventilated area'],
          estimatedTime: 45,
          photoRequired: true,
          successCriteria: ['Even finish coverage', 'No drips or bubbles', 'Smooth final surface']
        }
      ]
    },
    // Leathercraft Template
    {
      id: 'leather-keychain',
      name: 'Leather Keychain',
      description: 'Craft a simple leather keychain to learn basic leatherworking skills',
      craftType: 'leathercraft',
      skillLevel: 'novice',
      estimatedTime: 90,
      difficulty: 'beginner',
      materials: ['Vegetable-tanned leather (3-4 oz)', 'Leather dye or stain', 'Keyring hardware', 'Leather conditioner'],
      tools: ['Craft knife', 'Cutting mat', 'Leather punch', 'Edge beveler', 'Burnishing tool'],
      isPopular: true,
      completionRate: 78,
      tips: [
        'Use vegetable-tanned leather for best results',
        'Sharp tools make cleaner cuts',
        'Take your time with edge finishing'
      ],
      steps: [
        {
          id: 'cut-shape',
          title: 'Cut Leather Shape',
          description: 'Cut your keychain to the desired shape',
          instructions: [
            'Draw your design on paper first',
            'Transfer pattern to leather',
            'Cut carefully with sharp craft knife'
          ],
          tips: ['Keep knife perpendicular to leather', 'Make multiple light passes'],
          estimatedTime: 20,
          photoRequired: true,
          safetyNotes: ['Always cut away from your body', 'Use sharp blades only'],
          successCriteria: ['Clean, straight cuts', 'Shape matches your design']
        },
        {
          id: 'punch-hole',
          title: 'Punch Keyring Hole',
          description: 'Create a clean hole for the keyring',
          instructions: [
            'Mark hole location carefully',
            'Use appropriate size punch',
            'Punch from grain side through'
          ],
          tips: ['Punch over cutting mat', 'Ensure hole is properly centered'],
          estimatedTime: 10,
          photoRequired: true,
          successCriteria: ['Round, clean hole', 'No torn edges', 'Proper size for keyring']
        },
        {
          id: 'finish-edges',
          title: 'Finish Edges',
          description: 'Bevel and burnish edges for professional look',
          instructions: [
            'Bevel all edges with edge beveler',
            'Sand edges lightly if needed',
            'Burnish with burnishing tool'
          ],
          tips: ['Work slowly for even bevels', 'Burnish until edges shine'],
          estimatedTime: 30,
          photoRequired: true,
          successCriteria: ['Smooth, rounded edges', 'No rough spots', 'Professional appearance']
        },
        {
          id: 'dye-condition',
          title: 'Dye and Condition',
          description: 'Add color and protect the leather',
          instructions: [
            'Apply dye evenly with cloth',
            'Allow to dry completely',
            'Apply leather conditioner'
          ],
          tips: ['Test dye on scrap first', 'Apply thin, even coats'],
          estimatedTime: 30,
          photoRequired: true,
          successCriteria: ['Even color coverage', 'No streaks or blotches', 'Leather feels supple']
        }
      ]
    },
    // Metalworking Template
    {
      id: 'simple-bottle-opener',
      name: 'Simple Bottle Opener',
      description: 'Create a functional bottle opener using basic metalworking techniques',
      craftType: 'metalworking',
      skillLevel: 'novice',
      estimatedTime: 150,
      difficulty: 'beginner',
      materials: ['Steel bar (1/4" x 1" x 6")', 'Metal polish', 'Clear coat (optional)'],
      tools: ['Hacksaw', 'Files', 'Drill with bits', 'Sandpaper', 'Safety equipment'],
      isPopular: false,
      completionRate: 65,
      tips: [
        'Take your time with filing - it\'s therapeutic',
        'Deburr all edges for safety',
        'Practice on scrap metal first'
      ],
      steps: [
        {
          id: 'cut-shape',
          title: 'Cut Basic Shape',
          description: 'Cut the steel bar to create the opener shape',
          instructions: [
            'Mark your cutting lines',
            'Secure work in vise',
            'Cut slowly with hacksaw'
          ],
          tips: ['Let the saw do the work', 'Support the cutoff piece'],
          estimatedTime: 30,
          photoRequired: true,
          safetyNotes: ['Wear safety glasses', 'Secure workpiece properly'],
          successCriteria: ['Clean cuts', 'Proper dimensions', 'No cracks or damage']
        },
        {
          id: 'file-shape',
          title: 'File to Shape',
          description: 'Use files to create the opener profile',
          instructions: [
            'Secure work in vise',
            'File the opener notch',
            'Shape the handle end'
          ],
          tips: ['File on the push stroke only', 'Keep files clean'],
          estimatedTime: 60,
          photoRequired: true,
          successCriteria: ['Functional opener notch', 'Smooth handle', 'Good proportions']
        },
        {
          id: 'drill-handle',
          title: 'Drill Handle Hole',
          description: 'Add a hole for hanging or attachment',
          instructions: [
            'Mark hole location',
            'Start with center punch',
            'Drill slowly with cutting oil'
          ],
          tips: ['Use cutting oil for smooth drilling', 'Deburr hole when finished'],
          estimatedTime: 15,
          photoRequired: true,
          safetyNotes: ['Secure work firmly', 'Use proper drill speed'],
          successCriteria: ['Clean, round hole', 'No burrs', 'Proper location']
        },
        {
          id: 'finish-polish',
          title: 'Finish and Polish',
          description: 'Create a smooth, polished finish',
          instructions: [
            'Sand all surfaces progressively',
            'Remove all scratches',
            'Polish to desired finish'
          ],
          tips: ['Work through grits systematically', 'Clean between grits'],
          estimatedTime: 45,
          photoRequired: true,
          successCriteria: ['Smooth, polished surface', 'No visible scratches', 'Professional appearance']
        }
      ]
    }
  ];

  // Get all available project templates
  static getProjectTemplates(): ProjectTemplate[] {
    return this.PROJECT_TEMPLATES;
  }

  // Get templates filtered by craft type
  static getTemplatesByCraft(craftType: CraftSpecialization): ProjectTemplate[] {
    return this.PROJECT_TEMPLATES.filter(template => template.craftType === craftType);
  }

  // Get templates filtered by skill level
  static getTemplatesBySkillLevel(skillLevel: SkillLevel): ProjectTemplate[] {
    return this.PROJECT_TEMPLATES.filter(template => template.skillLevel === skillLevel);
  }

  // Get recommended templates for a user based on their profile
  static getRecommendedTemplates(user: User): ProjectTemplate[] {
    const userCrafts = user.craftSpecialization;
    const userSkillLevel = user.skillLevel;

    return this.PROJECT_TEMPLATES.filter(template => {
      // Match user's craft specializations
      const matchesCraft = userCrafts.includes(template.craftType) || userCrafts.includes('general');
      
      // Match or slightly challenge user's skill level
      const matchesSkill = template.skillLevel === userSkillLevel || 
                          (userSkillLevel === 'novice' && template.skillLevel === 'apprentice');

      return matchesCraft && matchesSkill;
    }).sort((a, b) => {
      // Sort by popularity and completion rate
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return b.completionRate - a.completionRate;
    });
  }

  // Start first project guidance for a user
  static async startFirstProjectGuidance(userId: string, templateId: string): Promise<void> {
    try {
      const template = this.PROJECT_TEMPLATES.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      const guidance: FirstProjectGuidance = {
        userId,
        selectedTemplate: template,
        currentStep: 0,
        completedSteps: [],
        startedAt: new Date(),
        guidanceNotes: [
          `Welcome to your first ${template.craftType} project!`,
          `This project should take about ${Math.round(template.estimatedTime / 60)} hours to complete.`,
          `Don't worry if it takes longer - learning takes time!`
        ]
      };

      await this.saveGuidanceProgress(userId, guidance);
      console.log(`✅ First project guidance started for user ${userId} with template ${templateId}`);
    } catch (error) {
      console.error('Error starting first project guidance:', error);
      throw error;
    }
  }

  // Complete a project step
  static async completeStep(userId: string, stepId: string): Promise<void> {
    try {
      const guidance = await this.getGuidanceProgress(userId);
      if (!guidance || !guidance.selectedTemplate) {
        throw new Error('No active guidance found');
      }

      const template = guidance.selectedTemplate;
      const stepIndex = template.steps.findIndex(s => s.id === stepId);
      
      if (stepIndex === -1) {
        throw new Error(`Step ${stepId} not found`);
      }

      const updatedGuidance: FirstProjectGuidance = {
        ...guidance,
        completedSteps: [...guidance.completedSteps.filter(s => s !== stepId), stepId],
        currentStep: Math.min(stepIndex + 1, template.steps.length - 1)
      };

      // Check if project is completed
      if (updatedGuidance.completedSteps.length === template.steps.length) {
        updatedGuidance.completedAt = new Date();
        updatedGuidance.guidanceNotes.push(
          '🎉 Congratulations! You\'ve completed your first project!',
          'Take a moment to admire your work and share it with the community.',
          'Ready for your next challenge?'
        );
        console.log(`🎉 First project completed for user ${userId}`);
      }

      await this.saveGuidanceProgress(userId, updatedGuidance);
      console.log(`✅ Step ${stepId} completed for user ${userId}`);
    } catch (error) {
      console.error('Error completing step:', error);
      throw error;
    }
  }

  // Get user's guidance progress
  static async getGuidanceProgress(userId: string): Promise<FirstProjectGuidance | null> {
    try {
      const userData = await AuthService.getUserData(userId);
      return userData?.firstProjectGuidance || null;
    } catch (error) {
      console.error('Error getting guidance progress:', error);
      return null;
    }
  }

  // Save guidance progress to Firebase
  private static async saveGuidanceProgress(userId: string, guidance: FirstProjectGuidance): Promise<void> {
    try {
      await AuthService.updateUserData(userId, { 
        firstProjectGuidance: guidance 
      });
    } catch (error) {
      console.error('Error saving guidance progress:', error);
      throw error;
    }
  }

  // Submit feedback for completed project
  static async submitFeedback(
    userId: string, 
    difficulty: 'too-easy' | 'just-right' | 'too-hard',
    helpfulness: number,
    suggestions?: string
  ): Promise<void> {
    try {
      const guidance = await this.getGuidanceProgress(userId);
      if (!guidance) {
        throw new Error('No guidance found to provide feedback for');
      }

      const updatedGuidance: FirstProjectGuidance = {
        ...guidance,
        userFeedback: {
          difficulty,
          helpfulness,
          suggestions
        }
      };

      await this.saveGuidanceProgress(userId, updatedGuidance);
      console.log(`✅ Feedback submitted for user ${userId}`);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  // Check if user has completed their first project
  static async hasCompletedFirstProject(userId: string): Promise<boolean> {
    try {
      const guidance = await this.getGuidanceProgress(userId);
      return guidance?.completedAt !== undefined;
    } catch (error) {
      console.error('Error checking first project completion:', error);
      return false;
    }
  }

  // Get project completion statistics
  static getCompletionStats(): { averageTime: number; popularTemplates: string[] } {
    // This would typically come from analytics data
    // For now, return mock data based on template completion rates
    const popularTemplates = this.PROJECT_TEMPLATES
      .filter(t => t.isPopular)
      .sort((a, b) => b.completionRate - a.completionRate)
      .map(t => t.name);

    return {
      averageTime: 2.5, // hours
      popularTemplates
    };
  }
} 