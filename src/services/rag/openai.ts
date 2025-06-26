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

export interface PhotoAnalysisResponse {
  analysis: string;
  confidence: number;
  detectedCraft: string[];
  identifiedTechniques: string[];
  suggestedImprovements: string[];
  toolRecommendations: string[];
  followUpQuestions: string[];
  safetyConsiderations: string[];
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
    
    return `You are an expert multi-craft AI assistant with deep knowledge across all traditional and modern crafts. 
            Your expertise spans woodworking, metalworking, blacksmithing, pottery, ceramics, leathercraft, 
            weaving, textiles, stone carving, glasswork, jewelry making, bookbinding, and general workshop practices.

            Current user context:
            - Craft specializations: ${specializations}
            - Skill level: ${skillLevel}
            - Bio: ${context.userProfile?.bio || 'Not provided'}

            Guidelines:
            1. Identify the craft type from the user's question and provide relevant advice
            2. If the question doesn't match the user's specializations, still provide helpful guidance
            3. Consider the user's available tools when making recommendations
            4. Emphasize safety considerations specific to each craft type
            5. Reference traditional methods while acknowledging modern innovations
            6. Include material specifications, tool requirements, and time estimates
            7. Suggest progressive skill-building approaches appropriate to the craft
            8. Respect cultural and historical significance of traditional crafts
            9. Encourage sustainable and environmentally conscious practices
            10. If tools don't match the craft type, explain alternatives or suggest appropriate tools

            Response format:
            - Main content: Detailed, practical advice specific to the craft type
            - Confidence: Rate your confidence (0-100) based on how well the retrieved articles match the question
            - Sources: Mention specific retrieved articles or traditional techniques
            - Suggestions: Related projects or techniques to explore
            - Follow-up questions: Questions to help the user dive deeper

            Always maintain an encouraging, educational tone that respects both tradition and innovation across all craft types.`;
  }

  /**
   * Build user prompt with knowledge base context
   */
  private buildUserPrompt(query: string, knowledgeBase?: string[]): string {
    let prompt = query;
    
    if (knowledgeBase && knowledgeBase.length > 0) {
      prompt += '\n\n=== RETRIEVED KNOWLEDGE BASE ARTICLES ===\n';
      prompt += 'Please base your response primarily on the following retrieved articles from our craft knowledge database:\n\n';
      knowledgeBase.forEach((knowledge, index) => {
        prompt += `ARTICLE ${index + 1}:\n${knowledge}\n\n`;
      });
      prompt += '=== END KNOWLEDGE BASE ARTICLES ===\n\n';
      prompt += 'IMPORTANT: Please base your response primarily on the above retrieved articles. ';
      prompt += 'If the articles don\'t contain enough information, you may supplement with general knowledge, ';
      prompt += 'but clearly indicate what comes from the retrieved articles vs. general knowledge.\n';
      prompt += 'Also provide a confidence percentage (0-100) based on how well the retrieved articles answer the question.';
    }
    
    return prompt;
  }

  /**
   * Parse the RAG response into structured format
   */
  private parseRAGResponse(response: string): RAGResponse {
    // Extract confidence from GPT's response
    let confidence = 85; // Default confidence
    const confidenceMatch = response.match(/confidence[:\s]*(\d+)%/i);
    if (confidenceMatch && confidenceMatch[1]) {
      confidence = parseInt(confidenceMatch[1], 10);
    }
    
    // Clean the response content by removing confidence statements to avoid duplication
    let cleanContent = response;
    cleanContent = cleanContent.replace(/confidence[:\s]*\d+%/gi, '');
    cleanContent = cleanContent.replace(/\n\s*\n/g, '\n\n'); // Clean up extra newlines
    cleanContent = cleanContent.trim();
    
    return {
      content: cleanContent,
      confidence: confidence,
      sources: ['Retrieved from craft knowledge database', 'Traditional techniques'],
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

  /**
   * Analyze craft project photos using GPT-4 Vision
   */
  async analyzeCraftPhoto(
    imageUri: string,
    userQuery: string,
    context: CraftContext,
    knowledgeBase?: string[]
  ): Promise<PhotoAnalysisResponse> {
    try {
      const systemPrompt = this.buildPhotoAnalysisSystemPrompt(context);
      const userPrompt = this.buildPhotoAnalysisUserPrompt(userQuery, knowledgeBase);

      // Convert image to base64 for API
      const base64Image = await this.convertImageToBase64(imageUri);

      // Debug logging (can be removed in production)
      console.log('🔍 Vision API Debug Info:');
      console.log('- Image processed, Base64 length:', base64Image.length);
      console.log('- User query:', userQuery);
      console.log('- Knowledge base articles:', knowledgeBase?.length || 0);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      // Debug the raw response (can be removed in production)
      console.log('🤖 GPT-4o Analysis Complete');
      
      return this.parsePhotoAnalysisResponse(response);
    } catch (error) {
      console.error('OpenAI Vision API Error:', error);
      throw new Error('Failed to analyze craft photo');
    }
  }

  /**
   * Convert image URI to base64 string
   */
  private async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
             return new Promise((resolve, reject) => {
         const reader = new FileReader();
         reader.onloadend = () => {
           const result = reader.result;
           if (typeof result === 'string') {
             // Remove the data URL prefix to get just the base64 string
                           const base64Data = result.split(',')[1];
              if (base64Data) {
                resolve(base64Data);
              } else {
                reject(new Error('Invalid base64 data format'));
              }
           } else {
             reject(new Error('Failed to read image as base64 string'));
           }
         };
         reader.onerror = reject;
         reader.readAsDataURL(blob);
       });
    } catch (error) {
      console.error('Image conversion error:', error);
      throw new Error('Failed to convert image to base64');
    }
  }

  /**
   * Build system prompt for photo analysis
   */
  private buildPhotoAnalysisSystemPrompt(context: CraftContext): string {
    const specializations = context.userProfile?.craftSpecialization?.join(', ') || 'general crafts';
    const skillLevel = context.userProfile?.skillLevel || 'beginner';
    
    return `You are an expert tool and craft analysis AI with advanced computer vision capabilities. 
            You excel at identifying tools, materials, techniques, and craft projects from photos.
            
            Your primary job is to:
            1. CLEARLY IDENTIFY what you see in the image (tools, materials, projects, etc.)
            2. Name specific tools and their common uses
            3. Identify craft types and techniques being shown
            4. Provide helpful analysis and recommendations

            Current user context:
            - Craft specializations: ${specializations}
            - Skill level: ${skillLevel}

            IMPORTANT: Always start your response by clearly stating what you can see in the image. 
            If you see a tool, name it specifically (e.g., "I can see a socket wrench" or "This appears to be a chisel").
            If you cannot identify something, explain what you do see and why identification is difficult.

            Provide your analysis in this structure:
            - Analysis: What you observe in the image
            - Confidence: Your confidence level (0-100%)
            - Detected Craft: Relevant craft types
            - Identified Techniques: Techniques shown or implied
            - Tool Recommendations: Suggested tools or improvements
            - Follow-up Questions: Questions to help the user learn more
            - Safety Considerations: Any safety notes

            Be direct, helpful, and specific in your identifications.`;
  }

  /**
   * Build user prompt for photo analysis with knowledge base context
   */
  private buildPhotoAnalysisUserPrompt(query: string, knowledgeBase?: string[]): string {
    let prompt = `Look at this image and answer: "${query}"

First, tell me exactly what you can see in the image. Be specific about any tools, objects, or materials visible.`;
    
    if (knowledgeBase && knowledgeBase.length > 0) {
      prompt += '\n\n=== RELEVANT CRAFT KNOWLEDGE ===\n';
      prompt += 'Use the following knowledge base articles to inform your analysis:\n\n';
      knowledgeBase.forEach((knowledge, index) => {
        prompt += `REFERENCE ${index + 1}:\n${knowledge}\n\n`;
      });
      prompt += '=== END CRAFT KNOWLEDGE ===\n\n';
    }

    prompt += `\nProvide a clear, helpful response that directly addresses the user's question.`;
    
    return prompt;
  }

  /**
   * Parse photo analysis response from GPT-4 Vision
   */
  private parsePhotoAnalysisResponse(response: string): PhotoAnalysisResponse {
    // Extract confidence rating - handle markdown formatting
    const confidenceMatch = response.match(/\*?\*?confidence\*?\*?[:\s]*(\d+)%?/i);
    const confidence = confidenceMatch && confidenceMatch[1] ? parseInt(confidenceMatch[1], 10) : 75;

    // Debug confidence parsing (can be removed in production)
    console.log('🔍 Confidence extracted:', confidence + '%');

    // Clean response content - handle markdown formatting
    const cleanedResponse = response
      .replace(/\*?\*?confidence\*?\*?[:\s]*\d+%?/gi, '')
      .trim();

    // Extract structured information (basic parsing - could be enhanced)
    const detectedCraft = this.extractListFromResponse(response, ['craft', 'type', 'discipline']);
    const identifiedTechniques = this.extractListFromResponse(response, ['technique', 'method', 'process']);
    const suggestedImprovements = this.extractListFromResponse(response, ['improvement', 'suggestion', 'enhance']);
    const toolRecommendations = this.extractListFromResponse(response, ['tool', 'equipment', 'recommend']);
    const followUpQuestions = this.extractListFromResponse(response, ['question', 'ask', 'explore']);
    const safetyConsiderations = this.extractListFromResponse(response, ['safety', 'caution', 'warning']);

    return {
      analysis: cleanedResponse,
      confidence,
      detectedCraft,
      identifiedTechniques,
      suggestedImprovements,
      toolRecommendations,
      followUpQuestions,
      safetyConsiderations,
    };
  }

  /**
   * Extract lists from response text based on keywords
   */
  private extractListFromResponse(response: string, keywords: string[]): string[] {
    const items: string[] = [];
    const lines = response.split('\n');
    
    lines.forEach(line => {
      // Look for bullet points or numbered lists
      if (line.match(/^[\s]*[-•*]\s/) || line.match(/^[\s]*\d+\.\s/)) {
        const cleanLine = line.replace(/^[\s]*[-•*\d.]\s*/, '').trim();
        if (cleanLine.length > 0 && keywords.some(keyword => 
          line.toLowerCase().includes(keyword.toLowerCase())
        )) {
          items.push(cleanLine);
        }
      }
    });
    
    return items.slice(0, 5); // Limit to 5 items per category
  }
}

export default OpenAIService; 