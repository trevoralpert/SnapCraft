import OpenAIService, { CraftContext, RAGResponse } from './openai';
import PineconeService, { SearchQuery, SearchResult, CraftKnowledge } from './pinecone';
import { useAuthStore } from '../../stores/authStore';
// Vision mode types - for future integration
import { VisionMode, VisionModeConfig } from '../../shared/types/vision';
import { getAvailableVisionModes } from '../../shared/constants/visionModes';

export interface RAGQuery {
  query: string;
  context?: {
    craftTypes?: string[];
    difficulty?: string[];
    includeUserProfile?: boolean;
    includeRecentActivity?: boolean;
  };
  options?: {
    maxKnowledgeResults?: number;
    confidenceThreshold?: number;
    includeFollowUp?: boolean;
  };
}

export interface EnhancedRAGResponse extends RAGResponse {
  knowledgeBase: SearchResult[];
  processingTime: number;
  queryId: string;
}

export class RAGService {
  private static instance: RAGService;
  private openaiService: OpenAIService;
  private pineconeService: PineconeService;
  
  private constructor() {
    this.openaiService = OpenAIService.getInstance();
    this.pineconeService = PineconeService.getInstance();
  }
  
  public static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  /**
   * Main RAG query processing - combines knowledge retrieval with AI generation
   */
  async processQuery(ragQuery: RAGQuery): Promise<EnhancedRAGResponse> {
    const startTime = Date.now();
    const queryId = `rag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log('🧠 Processing RAG query:', { queryId, query: ragQuery.query });
      
      // Step 1: Build user context
      const context = await this.buildUserContext(ragQuery.context);
      
      // Step 2: Search knowledge base for relevant information
      const knowledgeResults = await this.searchRelevantKnowledge(ragQuery);
      
      // Step 3: Extract knowledge content for AI context
      const knowledgeContext = knowledgeResults.map(result => 
        `${result.knowledge.title}: ${result.knowledge.content}`
      );
      
      console.log(`📚 Retrieved ${knowledgeResults.length} knowledge articles:`, 
        knowledgeResults.map(r => `"${r.knowledge.title}" (${r.relevance} relevance, score: ${r.score.toFixed(2)})`));
      
      // Step 4: Generate AI response with knowledge context
      const aiResponse = await this.openaiService.generateCraftContent(
        ragQuery.query,
        context,
        knowledgeContext
      );
      
      // Step 5: Enhance response with knowledge base results
      const processingTime = Date.now() - startTime;
      
      const enhancedResponse: EnhancedRAGResponse = {
        ...aiResponse,
        knowledgeBase: knowledgeResults,
        processingTime,
        queryId,
        // Add knowledge-based suggestions
        suggestions: [
          ...aiResponse.suggestions,
          ...this.generateKnowledgeSuggestions(knowledgeResults)
        ]
      };
      
      console.log(`✅ RAG query processed in ${processingTime}ms:`, queryId);
      return enhancedResponse;
      
    } catch (error) {
      console.error('❌ RAG query processing failed:', error);
      throw new Error(`Failed to process RAG query: ${error}`);
    }
  }

  /**
   * Get intelligent project suggestions based on user profile
   */
  async getProjectSuggestions(): Promise<EnhancedRAGResponse> {
    const context = await this.buildUserContext({ includeUserProfile: true });
    
    const ragQuery: RAGQuery = {
      query: 'Suggest craft projects suitable for my skill level and interests',
      context: {
        includeUserProfile: true,
        craftTypes: context.userProfile?.craftSpecialization
      },
      options: {
        maxKnowledgeResults: 5,
        includeFollowUp: true
      }
    };
    
    return this.processQuery(ragQuery);
  }

  /**
   * Get technique guidance with knowledge base support
   */
  async getTechniqueGuidance(
    technique: string, 
    craftType: string
  ): Promise<EnhancedRAGResponse> {
    const ragQuery: RAGQuery = {
      query: `How do I perform ${technique} in ${craftType}?`,
      context: {
        craftTypes: [craftType],
        includeUserProfile: true
      },
      options: {
        maxKnowledgeResults: 3,
        includeFollowUp: true
      }
    };
    
    return this.processQuery(ragQuery);
  }

  /**
   * Analyze a craft post and provide intelligent feedback
   */
  async analyzeCraftPost(
    postDescription: string,
    craftType: string,
    images?: string[]
  ): Promise<EnhancedRAGResponse> {
    const ragQuery: RAGQuery = {
      query: `Analyze this ${craftType} project and provide feedback: ${postDescription}`,
      context: {
        craftTypes: [craftType],
        includeUserProfile: true
      },
      options: {
        maxKnowledgeResults: 4,
        includeFollowUp: true
      }
    };
    
    return this.processQuery(ragQuery);
  }

  /**
   * Get tool recommendations for a specific project
   */
  async getToolRecommendations(
    projectDescription: string,
    craftType: string
  ): Promise<EnhancedRAGResponse> {
    const ragQuery: RAGQuery = {
      query: `What tools do I need for this ${craftType} project: ${projectDescription}`,
      context: {
        craftTypes: [craftType],
        includeUserProfile: true
      },
      options: {
        maxKnowledgeResults: 3,
        includeFollowUp: false
      }
    };
    
    return this.processQuery(ragQuery);
  }

  /**
   * Troubleshoot craft problems with AI assistance
   */
  async troubleshootProblem(
    problem: string,
    craftType: string
  ): Promise<EnhancedRAGResponse> {
    const ragQuery: RAGQuery = {
      query: `I'm having this problem with ${craftType}: ${problem}. How can I fix it?`,
      context: {
        craftTypes: [craftType],
        includeUserProfile: true
      },
      options: {
        maxKnowledgeResults: 3,
        includeFollowUp: true
      }
    };
    
    return this.processQuery(ragQuery);
  }

  /**
   * Search knowledge base directly
   */
  async searchKnowledge(
    query: string,
    filters?: {
      craftTypes?: string[];
      categories?: string[];
      difficulty?: string[];
    }
  ): Promise<SearchResult[]> {
    const searchQuery: SearchQuery = {
      query,
      craftTypes: filters?.craftTypes,
      categories: filters?.categories,
      difficulty: filters?.difficulty,
      limit: 10,
      threshold: 0.2
    };
    
    return this.pineconeService.searchKnowledge(searchQuery);
  }

  /**
   * Get similar knowledge articles
   */
  async getSimilarKnowledge(knowledgeId: string): Promise<SearchResult[]> {
    return this.pineconeService.getSimilarKnowledge(knowledgeId, 5);
  }

  /**
   * Build user context from current state
   */
  private async buildUserContext(contextOptions?: RAGQuery['context']): Promise<CraftContext> {
    const { user } = useAuthStore.getState();
    
    const context: CraftContext = {};
    
    if (contextOptions?.includeUserProfile && user) {
      context.userProfile = {
        craftSpecialization: user.craftSpecialization || [],
        skillLevel: user.skillLevel || 'beginner',
        bio: user.bio
      };
    }
    
    // TODO: Add recent activity tracking
    if (contextOptions?.includeRecentActivity) {
      context.recentActivity = {
        likedPosts: [], // Would come from user activity store
        savedPosts: [], // Would come from user activity store
        viewedArticles: [] // Would come from user activity store
      };
    }
    
    return context;
  }

  /**
   * Search for relevant knowledge based on query
   */
  private async searchRelevantKnowledge(ragQuery: RAGQuery): Promise<SearchResult[]> {
    const searchQuery: SearchQuery = {
      query: ragQuery.query,
      craftTypes: ragQuery.context?.craftTypes,
      difficulty: ragQuery.context?.difficulty,
      limit: ragQuery.options?.maxKnowledgeResults || 5,
      threshold: ragQuery.options?.confidenceThreshold || 0.3
    };
    
    return this.pineconeService.searchKnowledge(searchQuery);
  }

  /**
   * Generate additional suggestions based on knowledge results
   */
  private generateKnowledgeSuggestions(knowledgeResults: SearchResult[]): string[] {
    const suggestions: string[] = [];
    
    // Add suggestions based on related knowledge
    const relatedTopics = new Set<string>();
    knowledgeResults.forEach(result => {
      result.knowledge.tags.forEach(tag => relatedTopics.add(tag));
    });
    
    Array.from(relatedTopics).slice(0, 3).forEach(topic => {
      suggestions.push(`Learn more about ${topic}`);
    });
    
    // Add difficulty progression suggestions
    const difficulties = [...new Set(knowledgeResults.map(r => r.knowledge.difficulty))];
    if (difficulties.includes('beginner')) {
      suggestions.push('Start with beginner-friendly techniques');
    }
    if (difficulties.includes('advanced')) {
      suggestions.push('Challenge yourself with advanced methods');
    }
    
    return suggestions;
  }

  /**
   * Test RAG system connectivity
   */
  async testSystem(): Promise<{
    openai: boolean;
    pinecone: boolean;
    overall: boolean;
  }> {
    try {
      console.log('🧪 Testing RAG system connectivity...');
      
      const [openaiTest, pineconeTest] = await Promise.all([
        this.openaiService.testConnection(),
        this.pineconeService.testConnection()
      ]);
      
      const overall = openaiTest && pineconeTest;
      
      console.log('🧪 RAG system test results:', {
        openai: openaiTest,
        pinecone: pineconeTest,
        overall
      });
      
      return { openai: openaiTest, pinecone: pineconeTest, overall };
    } catch (error) {
      console.error('❌ RAG system test failed:', error);
      return { openai: false, pinecone: false, overall: false };
    }
  }

  /**
   * Get system statistics
   */
  getSystemStats() {
    return {
      knowledgeBase: this.pineconeService.getKnowledgeStats(),
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const ragService = RAGService.getInstance();

// Export types for external use
export type {
  CraftContext,
  RAGResponse,
  SearchResult,
  CraftKnowledge
};

export default RAGService; 