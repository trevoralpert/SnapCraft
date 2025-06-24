// Pinecone Vector Database Service for Craft Knowledge
// Note: This is a mock implementation for development
// In production, you would use the actual Pinecone SDK

export interface CraftKnowledge {
  id: string;
  title: string;
  content: string;
  category: string;
  craftType: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tags: string[];
  embedding?: number[];
  metadata: {
    author: string;
    dateCreated: Date;
    lastUpdated: Date;
    views: number;
    rating: number;
    source: string;
  };
}

export interface SearchResult {
  knowledge: CraftKnowledge;
  score: number;
  relevance: 'high' | 'medium' | 'low';
}

export interface SearchQuery {
  query: string;
  craftTypes?: string[];
  difficulty?: string[];
  categories?: string[];
  limit?: number;
  threshold?: number;
}

// Mock craft knowledge database
const MOCK_CRAFT_KNOWLEDGE: CraftKnowledge[] = [
  {
    id: 'wood_001',
    title: 'Mortise and Tenon Joinery Basics',
    content: `Mortise and tenon joints are fundamental in woodworking, creating strong, lasting connections between pieces. 
              The mortise is a hole cut into one piece of wood, while the tenon is a projection on another piece that fits into the mortise.
              
              Tools needed: Chisel set, marking gauge, drill, square, saw
              Steps: 1) Mark the joint locations 2) Cut the tenon first 3) Use tenon to mark mortise 4) Drill and chisel mortise 5) Test fit and adjust
              
              Common mistakes: Rushing the marking process, cutting mortise too loose, not keeping tools sharp.
              Safety: Always clamp work securely, cut away from your body, keep tools sharp for better control.`,
    category: 'techniques',
    craftType: ['woodworking'],
    difficulty: 'intermediate',
    tags: ['joinery', 'furniture', 'traditional', 'hand-tools'],
    metadata: {
      author: 'Master Carpenter',
      dateCreated: new Date('2024-01-15'),
      lastUpdated: new Date('2024-06-01'),
      views: 1247,
      rating: 4.8,
      source: 'Traditional Woodworking Guild'
    }
  },
  {
    id: 'metal_001',
    title: 'Blacksmithing: Heat Treatment of Steel',
    content: `Heat treatment is crucial for achieving the right balance of hardness and toughness in steel tools and weapons.
              The process involves heating, quenching, and tempering to achieve desired properties.
              
              Critical temperatures: Normalize at 1600°F, harden at 1475°F, temper between 350-500°F depending on application.
              Quenching media: Water for high carbon steel, oil for alloy steels, air for some tool steels.
              
              Signs of proper heat: Color changes from red to orange to yellow to white heat.
              Testing: File test for hardness, bend test for toughness.
              
              Safety: Proper ventilation, safety glasses, heat-resistant gloves, fire extinguisher nearby.`,
    category: 'techniques',
    craftType: ['blacksmithing', 'metalworking'],
    difficulty: 'advanced',
    tags: ['heat-treatment', 'steel', 'hardening', 'tempering', 'safety'],
    metadata: {
      author: 'Iron Master Smith',
      dateCreated: new Date('2024-02-10'),
      lastUpdated: new Date('2024-05-20'),
      views: 892,
      rating: 4.9,
      source: 'Blacksmith Association'
    }
  },
  {
    id: 'pottery_001',
    title: 'Clay Preparation and Wedging Techniques',
    content: `Proper clay preparation is essential for successful pottery. Wedging removes air bubbles and creates uniform consistency.
              
              Types of clay: Earthenware (low fire), Stoneware (mid-high fire), Porcelain (high fire)
              Wedging methods: Spiral wedging, ram's head wedging, wire wedging for recycled clay
              
              Steps: 1) Check clay moisture 2) Cut clay to remove air pockets 3) Wedge using consistent pressure 4) Test for readiness
              Proper wedging creates a smooth, uniform texture without air bubbles.
              
              Storage: Keep clay covered and moist, age clay for better plasticity.
              Tools: Wire clay cutter, wedging board, spray bottle for moisture.`,
    category: 'materials',
    craftType: ['pottery'],
    difficulty: 'beginner',
    tags: ['clay', 'preparation', 'wedging', 'ceramics', 'basics'],
    metadata: {
      author: 'Ceramic Artist',
      dateCreated: new Date('2024-03-05'),
      lastUpdated: new Date('2024-06-10'),
      views: 1534,
      rating: 4.7,
      source: 'Pottery Guild'
    }
  },
  {
    id: 'safety_001',
    title: 'Workshop Safety: Essential Guidelines for All Crafts',
    content: `Safety should be the top priority in any craft workshop. Proper preparation and awareness prevent accidents.
              
              Personal Protective Equipment (PPE): Safety glasses, hearing protection, dust masks, appropriate clothing
              Workshop setup: Good lighting, proper ventilation, clear pathways, first aid kit accessible
              
              Tool safety: Keep tools sharp and clean, proper storage, regular maintenance
              Fire safety: Know location of extinguishers, proper disposal of oily rags, electrical safety
              
              Emergency procedures: Know how to shut off power, gas, water. Have emergency contacts posted.
              Training: Never use tools you're not trained on, ask for help when unsure.
              
              Remember: No project is worth an injury. Take breaks when tired or frustrated.`,
    category: 'safety',
    craftType: ['general', 'woodworking', 'metalworking', 'pottery'],
    difficulty: 'beginner',
    tags: ['safety', 'PPE', 'workshop', 'emergency', 'prevention'],
    metadata: {
      author: 'Safety Coordinator',
      dateCreated: new Date('2024-01-01'),
      lastUpdated: new Date('2024-06-15'),
      views: 2103,
      rating: 5.0,
      source: 'Craft Safety Institute'
    }
  },
  {
    id: 'tools_001',
    title: 'Essential Hand Tools for Beginning Woodworkers',
    content: `Starting woodworking doesn't require expensive machinery. Quality hand tools can accomplish most basic projects.
              
              Essential tools: 
              - Measuring: Ruler, square, marking gauge
              - Cutting: Hand saw (crosscut and rip), coping saw, chisels (1/4", 1/2", 3/4", 1")
              - Shaping: Block plane, smoothing plane, rasp, sandpaper
              - Assembly: Hammer, screwdrivers, clamps
              
              Tool care: Keep tools clean and sharp, proper storage prevents rust, oil moving parts regularly
              Buying advice: Buy quality tools gradually, learn to sharpen and maintain tools
              
              Budget approach: Start with basic set, add specialized tools as projects require them.
              Used tools: Often better quality than new budget tools, learn to restore vintage tools.`,
    category: 'tools',
    craftType: ['woodworking'],
    difficulty: 'beginner',
    tags: ['hand-tools', 'beginner', 'essential', 'maintenance', 'budget'],
    metadata: {
      author: 'Tool Specialist',
      dateCreated: new Date('2024-02-20'),
      lastUpdated: new Date('2024-05-30'),
      views: 1876,
      rating: 4.6,
      source: 'Woodworking Magazine'
    }
  }
];

export class PineconeService {
  private static instance: PineconeService;
  private knowledgeBase: CraftKnowledge[] = MOCK_CRAFT_KNOWLEDGE;
  
  public static getInstance(): PineconeService {
    if (!PineconeService.instance) {
      PineconeService.instance = new PineconeService();
    }
    return PineconeService.instance;
  }

  /**
   * Search for relevant craft knowledge using semantic similarity
   * Note: This is a mock implementation using keyword matching
   * In production, this would use actual vector similarity search
   */
  async searchKnowledge(searchQuery: SearchQuery): Promise<SearchResult[]> {
    try {
      console.log('🔍 Searching knowledge base:', searchQuery);
      
      let results = this.knowledgeBase.filter(knowledge => {
        // Filter by craft types
        if (searchQuery.craftTypes && searchQuery.craftTypes.length > 0) {
          const hasMatchingCraft = knowledge.craftType.some(craft => 
            searchQuery.craftTypes!.includes(craft)
          );
          if (!hasMatchingCraft) return false;
        }
        
        // Filter by difficulty
        if (searchQuery.difficulty && searchQuery.difficulty.length > 0) {
          if (!searchQuery.difficulty.includes(knowledge.difficulty)) return false;
        }
        
        // Filter by categories
        if (searchQuery.categories && searchQuery.categories.length > 0) {
          if (!searchQuery.categories.includes(knowledge.category)) return false;
        }
        
        return true;
      });
      
      // Mock semantic search using keyword matching
      const searchResults: SearchResult[] = results.map(knowledge => {
        const score = this.calculateRelevanceScore(searchQuery.query, knowledge);
        const relevance = score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';
        
        return {
          knowledge,
          score,
          relevance
        };
      });
      
      // Sort by relevance score and apply limit
      const sortedResults = searchResults
        .filter(result => result.score >= (searchQuery.threshold || 0.2))
        .sort((a, b) => b.score - a.score)
        .slice(0, searchQuery.limit || 10);
      
      console.log(`📚 Found ${sortedResults.length} relevant knowledge articles`);
      return sortedResults;
      
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      throw new Error('Failed to search knowledge base');
    }
  }
  
  /**
   * Get knowledge by ID
   */
  async getKnowledgeById(id: string): Promise<CraftKnowledge | null> {
    const knowledge = this.knowledgeBase.find(k => k.id === id);
    return knowledge || null;
  }
  
  /**
   * Get knowledge by category
   */
  async getKnowledgeByCategory(category: string): Promise<CraftKnowledge[]> {
    return this.knowledgeBase.filter(k => k.category === category);
  }
  
  /**
   * Get knowledge by craft type
   */
  async getKnowledgeByCraftType(craftType: string): Promise<CraftKnowledge[]> {
    return this.knowledgeBase.filter(k => k.craftType.includes(craftType));
  }
  
  /**
   * Add new knowledge to the database
   * In production, this would create embeddings and store in Pinecone
   */
  async addKnowledge(knowledge: Omit<CraftKnowledge, 'id'>): Promise<string> {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newKnowledge: CraftKnowledge = {
      ...knowledge,
      id,
    };
    
    this.knowledgeBase.push(newKnowledge);
    console.log('📝 Added new knowledge:', id);
    return id;
  }
  
  /**
   * Get similar knowledge based on content
   */
  async getSimilarKnowledge(
    knowledgeId: string, 
    limit: number = 5
  ): Promise<SearchResult[]> {
    const targetKnowledge = await this.getKnowledgeById(knowledgeId);
    if (!targetKnowledge) return [];
    
    const searchQuery: SearchQuery = {
      query: targetKnowledge.title + ' ' + targetKnowledge.tags.join(' '),
      craftTypes: targetKnowledge.craftType,
      limit: limit + 1 // +1 to exclude the original
    };
    
    const results = await this.searchKnowledge(searchQuery);
    return results.filter(result => result.knowledge.id !== knowledgeId);
  }
  
  /**
   * Calculate relevance score using keyword matching
   * In production, this would use actual vector similarity
   */
  private calculateRelevanceScore(query: string, knowledge: CraftKnowledge): number {
    const queryLower = query.toLowerCase();
    const searchableText = (
      knowledge.title + ' ' + 
      knowledge.content + ' ' + 
      knowledge.tags.join(' ') + ' ' +
      knowledge.craftType.join(' ')
    ).toLowerCase();
    
    // Simple keyword matching score
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    let matchCount = 0;
    let totalWords = queryWords.length;
    
    queryWords.forEach(word => {
      if (searchableText.includes(word)) {
        matchCount++;
      }
    });
    
    // Boost score for title matches
    const titleScore = knowledge.title.toLowerCase().includes(queryLower) ? 0.3 : 0;
    
    // Boost score for exact tag matches
    const tagScore = knowledge.tags.some(tag => 
      queryLower.includes(tag.toLowerCase())
    ) ? 0.2 : 0;
    
    const baseScore = totalWords > 0 ? matchCount / totalWords : 0;
    return Math.min(baseScore + titleScore + tagScore, 1.0);
  }
  
  /**
   * Get knowledge statistics
   */
  getKnowledgeStats() {
    const stats = {
      totalArticles: this.knowledgeBase.length,
      categories: [...new Set(this.knowledgeBase.map(k => k.category))],
      craftTypes: [...new Set(this.knowledgeBase.flatMap(k => k.craftType))],
      difficulties: [...new Set(this.knowledgeBase.map(k => k.difficulty))],
      averageRating: this.knowledgeBase.reduce((sum, k) => sum + k.metadata.rating, 0) / this.knowledgeBase.length,
      totalViews: this.knowledgeBase.reduce((sum, k) => sum + k.metadata.views, 0)
    };
    
    return stats;
  }
  
  /**
   * Test the Pinecone connection (mock)
   */
  async testConnection(): Promise<boolean> {
    try {
      // Mock connection test
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('✅ Pinecone connection test successful (mock)');
      return true;
    } catch (error) {
      console.error('❌ Pinecone connection test failed:', error);
      return false;
    }
  }
}

export default PineconeService; 