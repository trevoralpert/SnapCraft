/**
 * Test script for ProjectScoringService
 * Run this to verify the AI scoring system integration
 */

import { ProjectScoringService } from './ProjectScoringService';
import { ProjectScoringRequest } from '../../shared/types';

/**
 * Test the project scoring service with a sample woodworking project
 */
export async function testProjectScoring(): Promise<void> {
  console.log('🧪 Testing ProjectScoringService...');

  const scoringService = ProjectScoringService.getInstance();

  // Test connectivity first
  const isConnected = await scoringService.testConnection();
  console.log(`🔗 Service connectivity: ${isConnected ? '✅ Connected' : '❌ Disconnected'}`);

  if (!isConnected) {
    console.log('⚠️ Skipping scoring test due to connectivity issues');
    return;
  }

  // Sample project for testing
  const testRequest: ProjectScoringRequest = {
    projectId: 'test-project-001',
    userId: 'test-user-001',
    craftType: 'woodworking',
    description: `Built a simple pine bookshelf using traditional joinery techniques. 
                  Started with rough lumber, milled to size, cut dados for shelves, 
                  and assembled with wood glue and clamps. Applied three coats of 
                  polyurethane finish. Took about 8 hours over two weekends.
                  
                  Challenges included getting the dados perfectly square and 
                  preventing tear-out on the cross-grain cuts. Used a sharp chisel 
                  to clean up the joints. Overall happy with the result - it's 
                  sturdy and functional.`,
    imageUrls: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
    materials: ['Pine lumber', 'Wood glue', 'Polyurethane finish', 'Sandpaper'],
    toolsUsed: ['Table saw', 'Router', 'Chisels', 'Clamps', 'Random orbital sander'],
    timeSpent: 480, // 8 hours
    userSkillLevel: 'apprentice',
    userProfile: {
      bio: 'Weekend woodworker learning traditional techniques',
      craftSpecialization: ['woodworking']
    }
  };

  try {
    console.log('🎯 Starting project scoring...');
    const startTime = Date.now();
    
    const result = await scoringService.scoreProject(testRequest);
    
    const endTime = Date.now();
    console.log(`⏱️ Scoring completed in ${endTime - startTime}ms`);

    // Display results
    console.log('\n📊 SCORING RESULTS:');
    console.log(`Overall Score: ${result.individualSkillScore}/100`);
    console.log(`Skill Level: ${result.skillLevelCategory}`);
    console.log(`Confidence: ${result.aiScoringMetadata.confidence}%`);
    console.log(`Needs Review: ${result.aiScoringMetadata.needsHumanReview ? 'Yes' : 'No'}`);

    console.log('\n📋 CRITERIA BREAKDOWN:');
    Object.entries(result.scoringCriteria).forEach(([criterion, data]) => {
      console.log(`${criterion}: ${data.score}/100 (${Math.round(data.weight * 100)}% weight, ${data.confidence}% confidence)`);
    });

    console.log('\n💪 STRENGTHS:');
    result.strengths.forEach((strength, index) => {
      console.log(`${index + 1}. ${strength}`);
    });

    console.log('\n🎯 IMPROVEMENT AREAS:');
    result.improvementAreas.forEach((area, index) => {
      console.log(`${index + 1}. ${area}`);
    });

    console.log('\n🚀 NEXT STEPS:');
    result.nextStepSuggestions.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`);
    });

    console.log('\n✅ ProjectScoringService test completed successfully!');

  } catch (error) {
    console.error('❌ Scoring test failed:', error);
    throw error;
  }
}

/**
 * Test multiple craft types
 */
export async function testMultipleCraftTypes(): Promise<void> {
  console.log('🧪 Testing multiple craft types...');

  const scoringService = ProjectScoringService.getInstance();
  
  const craftTests: Array<{
    craftType: any;
    description: string;
  }> = [
    {
      craftType: 'metalworking',
      description: 'Welded a simple steel garden gate using MIG welding. Ground all welds smooth and applied primer and paint.'
    },
    {
      craftType: 'pottery',
      description: 'Threw a ceramic bowl on the wheel, trimmed when leather hard, bisque fired, glazed with celadon, and glaze fired to cone 10.'
    },
    {
      craftType: 'leathercraft',
      description: 'Hand-stitched a leather wallet using vegetable-tanned leather. Used saddle stitching and edge finishing techniques.'
    }
  ];

  for (const test of craftTests) {
    try {
      console.log(`\n🎯 Testing ${test.craftType}...`);
      
      const request: ProjectScoringRequest = {
        projectId: `test-${test.craftType}-001`,
        userId: 'test-user-001',
        craftType: test.craftType,
        description: test.description,
        userSkillLevel: 'apprentice'
      };

      const result = await scoringService.scoreProject(request);
      console.log(`${test.craftType}: ${result.individualSkillScore}/100 (${result.skillLevelCategory})`);
      
    } catch (error) {
      console.error(`❌ ${test.craftType} test failed:`, error);
    }
  }

  console.log('\n✅ Multi-craft testing completed!');
}

// Export test functions for use in development
export default {
  testProjectScoring,
  testMultipleCraftTypes
};