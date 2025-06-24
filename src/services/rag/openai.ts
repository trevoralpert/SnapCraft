import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // For development - move to backend in production
});

export interface CraftContext {
  userProfile?: {
    craftSpecialization: string[];
    skillLevel: string;
    bio?: string;
  };
  currentProject?: {
    description: string;
    craftType: string;
    difficulty: string;
    materials: string[];
    techniques: string[];
  };
  recentActivity?: {
    likedPosts: string[];
    savedPosts: string[];
    viewedArticles: string[];
  };
}

export interface RAGResponse {
  content: string;
  confidence: number;
  sources: string[];
  suggestions: string[];
  followUpQuestions: string[];
}

export class OpenAIService {
  private static instance: OpenAIService;
  
  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Generate craft-specific content based on user query and context
   */
  async generateCraftContent(
    query: string,
    context: CraftContext,
    knowledgeBase?: string[]
  ): Promise<RAGResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(query, knowledgeBase);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      return this.parseRAGResponse(response);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate craft content');
    }
  }

  /**
   * Generate project suggestions based on user's craft specialization and skill level
   */
  async generateProjectSuggestions(context: CraftContext): Promise<RAGResponse> {
    const specializations = context.userProfile?.craftSpecialization?.join(', ') || 'general crafts';
    const skillLevel = context.userProfile?.skillLevel || 'beginner';
    
    const query = `Suggest ${skillLevel} level craft projects for someone interested in ${specializations}. 
                  Include materials needed, estimated time, and difficulty considerations.`;
    
    return this.generateCraftContent(query, context);
  }

  /**
   * Provide technique guidance for specific craft processes
   */
  async provideTechniqueGuidance(
    technique: string,
    craftType: string,
    context: CraftContext
  ): Promise<RAGResponse> {
    const query = `Explain the ${technique} technique in ${craftType}. 
                  Include step-by-step instructions, common mistakes to avoid, 
                  required tools, and safety considerations.`;
    
    return this.generateCraftContent(query, context);
  }

  /**
   * Analyze craft posts and provide intelligent feedback
   */
  async analyzeCraftPost(
    postDescription: string,
    images: string[],
    context: CraftContext
  ): Promise<RAGResponse> {
    const query = `Analyze this craft project: "${postDescription}". 
                  Provide constructive feedback, identify techniques used, 
                  suggest improvements, and recommend related projects.`;
    
    return this.generateCraftContent(query, context);
  }

  /**
   * Generate tool recommendations based on user's projects and skill level
   */
  async recommendTools(
    projectDescription: string,
    context: CraftContext
  ): Promise<RAGResponse> {
    const query = `What tools would be needed for this project: "${projectDescription}"? 
                  Consider the user's skill level and provide both essential and optional tools.`;
    
    return this.generateCraftContent(query, context);
  }

  /**
   * Troubleshoot craft problems with AI assistance
   */
  async troubleshootProblem(
    problem: string,
    craftType: string,
    context: CraftContext
  ): Promise<RAGResponse> {
    const query = `Help troubleshoot this ${craftType} problem: "${problem}". 
                  Provide possible causes, solutions, and prevention tips.`;
    
    return this.generateCraftContent(query, context);
  }

  /**
   * Build system prompt based on user context
   */
  private buildSystemPrompt(context: CraftContext): string {
    const specializations = context.userProfile?.craftSpecialization?.join(', ') || 'general crafts';
    const skillLevel = context.userProfile?.skillLevel || 'beginner';
    
    return `You are an expert craftsman AI assistant specializing in traditional and modern crafts. 
            Your expertise spans woodworking, metalworking, blacksmithing, pottery, leathercraft, 
            weaving, bushcraft, stonemasonry, glassblowing, jewelry making, and general crafts.

            Current user context:
            - Craft specializations: ${specializations}
            - Skill level: ${skillLevel}
            - Bio: ${context.userProfile?.bio || 'Not provided'}

            Guidelines:
            1. Provide practical, actionable advice suitable for the user's skill level
            2. Emphasize safety considerations and proper technique
            3. Reference traditional methods while acknowledging modern innovations
            4. Include material specifications, tool requirements, and time estimates
            5. Suggest progressive skill-building approaches
            6. Respect cultural and historical significance of traditional crafts
            7. Encourage sustainable and environmentally conscious practices

            Response format:
            - Main content: Detailed, practical advice
            - Confidence: Rate your confidence (0-100)
            - Sources: Mention relevant traditional techniques or modern innovations
            - Suggestions: Related projects or techniques to explore
            - Follow-up questions: Questions to help the user dive deeper

            Always maintain an encouraging, educational tone that respects both tradition and innovation.`;
  }

  /**
   * Build user prompt with knowledge base context
   */
  private buildUserPrompt(query: string, knowledgeBase?: string[]): string {
    let prompt = query;
    
    if (knowledgeBase && knowledgeBase.length > 0) {
      prompt += '\n\nRelevant knowledge base context:\n';
      knowledgeBase.forEach((knowledge, index) => {
        prompt += `${index + 1}. ${knowledge}\n`;
      });
    }
    
    return prompt;
  }

  /**
   * Parse the RAG response into structured format
   */
  private parseRAGResponse(response: string): RAGResponse {
    // For now, return a structured response
    // In production, you might want to use a more sophisticated parsing approach
    return {
      content: response,
      confidence: 85, // Default confidence
      sources: ['Traditional craft knowledge', 'Modern techniques'],
      suggestions: [
        'Explore related techniques',
        'Practice with simpler projects first',
        'Join a local craft community'
      ],
      followUpQuestions: [
        'What tools do you currently have available?',
        'What\'s your experience level with this technique?',
        'Are you working on this as part of a larger project?'
      ]
    };
  }

  /**
   * Generate embeddings for text (for Pinecone integration)
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      
      return response.data[0]?.embedding || [];
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  /**
   * Test the OpenAI connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello, test message.' }],
        max_tokens: 10,
      });
      
      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}

export default OpenAIService; 