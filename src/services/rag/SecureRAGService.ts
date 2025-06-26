import EnvironmentService from '../../shared/services/EnvironmentService';
import { CraftContext, RAGResponse } from './openai';

interface RAGQuery {
  query: string;
  context?: CraftContext;
  options?: {
    maxResults?: number;
    includeFollowUp?: boolean;
  };
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * Secure RAG Service that communicates with backend API proxy
 * instead of exposing API keys on the client
 */
class SecureRAGService {
  private static instance: SecureRAGService;
  private environmentService: EnvironmentService;
  private baseURL: string;

  private constructor() {
    this.environmentService = EnvironmentService.getInstance();
    this.baseURL = this.environmentService.getAPIConfig().baseUrl;
  }

  public static getInstance(): SecureRAGService {
    if (!SecureRAGService.instance) {
      SecureRAGService.instance = new SecureRAGService();
    }
    return SecureRAGService.instance;
  }

  /**
   * Generate craft content using secure backend proxy
   */
  async generateCraftContent(ragQuery: RAGQuery): Promise<RAGResponse> {
    try {
      // Check if RAG features are enabled
      if (!this.environmentService.isFeatureEnabled('enableRAGFeatures')) {
        return this.getMockResponse(ragQuery.query);
      }

      const response = await this.makeSecureAPICall<RAGResponse>('/api/rag/generate', {
        method: 'POST',
        body: JSON.stringify(ragQuery),
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('SecureRAGService: Error generating content:', error);
      
      // Fallback to mock response if backend is unavailable
      if (this.environmentService.isFeatureEnabled('enableDemoMode')) {
        return this.getMockResponse(ragQuery.query);
      }
      
      throw error;
    }
  }

  /**
   * Search craft knowledge using secure backend
   */
  async searchKnowledge(query: string, filters?: {
    craftTypes?: string[];
    difficulty?: string[];
    categories?: string[];
  }): Promise<any[]> {
    try {
      const response = await this.makeSecureAPICall<any[]>('/api/knowledge/search', {
        method: 'POST',
        body: JSON.stringify({ query, filters }),
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to search knowledge');
      }
    } catch (error) {
      console.error('SecureRAGService: Error searching knowledge:', error);
      
      // Fallback to mock results
      if (this.environmentService.isFeatureEnabled('enableDemoMode')) {
        return this.getMockSearchResults(query);
      }
      
      throw error;
    }
  }

  /**
   * Test RAG system connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeSecureAPICall<{ status: string }>('/api/rag/health', {
        method: 'GET',
      });

      return response.success && response.data?.status === 'healthy';
    } catch (error) {
      console.error('SecureRAGService: Health check failed:', error);
      return false;
    }
  }

  /**
   * Make secure API call with authentication and error handling
   */
  private async makeSecureAPICall<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<APIResponse<T>> {
    const config = this.environmentService.getAPIConfig();
    const url = `${this.baseURL}${endpoint}`;

    // Add authentication headers (user token from auth store)
    const headers = {
      'Content-Type': 'application/json',
      'X-App-Version': '1.0.0',
      'X-Environment': this.environmentService.getEnvironment(),
      ...options.headers,
    };

    // Add user authentication if available
    // Note: In a real implementation, you'd get this from your auth store
    // const authToken = await getAuthToken();
    // if (authToken) {
    //   headers['Authorization'] = `Bearer ${authToken}`;
    // }

    const requestOptions: RequestInit = {
      ...options,
      headers,
      // Note: timeout is handled by AbortController in production
    };

    // Retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          success: true,
          data,
          timestamp: Date.now(),
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`API call attempt ${attempt + 1} failed:`, error);
        
        // Wait before retry (exponential backoff)
        if (attempt < config.retryAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      timestamp: Date.now(),
    };
  }

  /**
   * Get mock response for demo mode
   */
  private getMockResponse(query: string): RAGResponse {
    const mockResponses = {
      'woodworking': {
        content: "For woodworking projects, start with proper wood selection. Choose hardwoods like oak or maple for furniture, softwoods like pine for practice projects. Always work with the grain and use sharp tools for clean cuts.",
        confidence: 85,
        sources: ['Woodworking Fundamentals', 'Grain Direction Guide'],
        suggestions: [
          'What are the best joints for furniture making?',
          'How to choose the right wood finish?',
          'Essential woodworking safety tips'
        ],
        followUpQuestions: [
          'What type of project are you planning?',
          'What tools do you currently have?'
        ]
      },
      'metalworking': {
        content: "Metalworking requires understanding material properties. Start with mild steel for practice - it's forgiving and easy to work. Always wear proper safety equipment and ensure good ventilation when welding or grinding.",
        confidence: 82,
        sources: ['Metalworking Safety Manual', 'Steel Properties Guide'],
        suggestions: [
          'Basic welding techniques for beginners',
          'How to choose the right metal for your project',
          'Essential metalworking tools'
        ],
        followUpQuestions: [
          'Are you interested in welding or cold forming?',
          'What safety equipment do you have?'
        ]
      },
      'default': {
        content: `Great question about "${query}"! In traditional craftsmanship, this topic involves understanding both the materials and techniques involved. The key is to start with the fundamentals and build your skills gradually.`,
        confidence: 75,
        sources: ['Traditional Crafts Encyclopedia', 'Artisan Techniques Guide'],
        suggestions: [
          'What specific aspect interests you most?',
          'Do you have experience with similar techniques?',
          'What tools do you currently have available?'
        ],
        followUpQuestions: [
          'What is your current skill level?',
          'Are you working on a specific project?'
        ]
      }
    };

    // Simple keyword matching for demo
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('wood')) return mockResponses.woodworking;
    if (lowerQuery.includes('metal')) return mockResponses.metalworking;
    
    return mockResponses.default;
  }

  /**
   * Get mock search results for demo mode
   */
  private getMockSearchResults(query: string): any[] {
    return [
      {
        id: 'mock_1',
        title: `Advanced ${query} Techniques`,
        content: `Comprehensive guide to ${query} with step-by-step instructions...`,
        category: 'techniques',
        difficulty: 'intermediate',
        rating: 4.5,
        views: 1250,
      },
      {
        id: 'mock_2',
        title: `${query} Safety Guidelines`,
        content: `Essential safety practices when working with ${query}...`,
        category: 'safety',
        difficulty: 'beginner',
        rating: 4.8,
        views: 890,
      },
      {
        id: 'mock_3',
        title: `Tools for ${query}`,
        content: `Complete guide to selecting and maintaining tools for ${query}...`,
        category: 'tools',
        difficulty: 'beginner',
        rating: 4.3,
        views: 567,
      },
    ];
  }

  /**
   * Get service status and configuration info
   */
  getServiceInfo() {
    const env = this.environmentService.getEnvironmentInfo();
    
    return {
      environment: env.environment,
      ragEnabled: env.features.enableRAGFeatures,
      demoMode: env.features.enableDemoMode,
      apiUrl: this.baseURL,
      securityEnabled: env.security.enableEncryption,
      isValid: env.isValid,
    };
  }
}

export default SecureRAGService; 