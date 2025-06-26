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
    id: 'wood_002',
    title: 'Beginner Woodworking Projects: Simple Cutting Board',
    content: `A cutting board is an excellent first project for beginning woodworkers. It teaches fundamental skills while creating something useful.
              
              Materials: Hardwood like maple, cherry, or walnut. Avoid softwoods for cutting boards.
              Dimensions: Start with 12" x 8" x 1" thick for a basic board.
              
              Tools needed: Hand saw or circular saw, block plane, sandpaper (120, 220, 320 grit), clamps
              Optional tools: Router for rounded edges, random orbital sander
              
              Steps: 1) Cut wood to size 2) Glue boards edge-to-edge if needed 3) Plane smooth 4) Sand progressively 5) Apply food-safe finish
              
              Finishing: Use mineral oil or specialized cutting board oil. Avoid regular wood stains or polyurethane.
              Maintenance: Oil monthly, sand lightly if knife marks become deep.`,
    category: 'projects', 
    craftType: ['woodworking'],
    difficulty: 'beginner',
    tags: ['cutting-board', 'beginner', 'kitchen', 'food-safe', 'glue-up'],
    metadata: {
      author: 'Workshop Teacher',
      dateCreated: new Date('2024-03-01'),
      lastUpdated: new Date('2024-06-15'),
      views: 2341,
      rating: 4.9,
      source: 'Beginner Woodworking Guide'
    }
  },
  {
    id: 'wood_003',
    title: 'Wood Splitting and Grain Direction',
    content: `Understanding wood grain is crucial for preventing splits and achieving strong joints. Wood is much stronger along the grain than across it.
              
              Grain types: End grain (strongest), edge grain (medium), face grain (weakest in tension)
              
              Preventing splits:
              - Pre-drill holes near board ends
              - Use sharp tools to avoid tear-out
              - Support wood properly when cutting
              - Understand seasonal wood movement
              
              Troubleshooting splits:
              - Small splits: Fill with wood glue and clamp
              - Large splits: Cut out damaged section and patch
              - Prevention: Seal end grain immediately after cutting
              
              Tools for grain work: Sharp chisels, block plane, card scraper for smooth finishes
              Wood selection: Choose boards with straight, consistent grain for structural projects.`,
    category: 'troubleshooting',
    craftType: ['woodworking'],
    difficulty: 'intermediate',
    tags: ['grain', 'splitting', 'wood-movement', 'repair', 'prevention'],
    metadata: {
      author: 'Wood Science Expert',
      dateCreated: new Date('2024-02-15'),
      lastUpdated: new Date('2024-05-20'),
      views: 1456,
      rating: 4.7,
      source: 'Wood Technology Institute'
    }
  },
  {
    id: 'wood_004',
    title: 'Essential Tools for Furniture Making',
    content: `Furniture making requires a combination of measuring, cutting, shaping, and assembly tools. Build your toolkit gradually based on projects.
              
              Measuring tools: Combination square, marking gauge, rulers, calipers
              Cutting tools: Hand saws (crosscut, rip, dovetail), chisels (1/4", 1/2", 3/4", 1")
              Shaping tools: Block plane, smoothing plane, router (optional), sandpaper
              Assembly tools: Clamps (bar, pipe, spring), screwdrivers, drill
              
              Power tool alternatives:
              - Circular saw can replace table saw for many cuts
              - Router can create decorative edges and joinery
              - Random orbital sander speeds finishing
              
              Tool maintenance: Keep cutting tools sharp, store in dry conditions, oil metal parts
              Budget approach: Buy quality used tools, learn to restore vintage tools
              
              Advanced additions: Mortising machine, domino joiner, thickness planer as skills develop.`,
    category: 'tools',
    craftType: ['woodworking'],
    difficulty: 'intermediate',
    tags: ['furniture', 'tool-selection', 'power-tools', 'hand-tools', 'maintenance'],
    metadata: {
      author: 'Furniture Maker',
      dateCreated: new Date('2024-01-20'),
      lastUpdated: new Date('2024-06-05'),
      views: 1876,
      rating: 4.8,
      source: 'Fine Woodworking Magazine'
    }
  },
  {
    id: 'wood_005',
    title: 'Outdoor Wood Finishes: Protection and Durability',
    content: `Outdoor wood projects require finishes that protect against UV rays, moisture, and temperature changes. Choose finishes based on wood type and exposure.
              
              Finish types:
              - Penetrating oil stains: Soak into wood, need regular reapplication
              - Film-forming finishes: Create protective layer, can peel over time
              - Natural finishes: Tung oil, linseed oil for minimal protection
              
              Best outdoor finishes:
              - Marine varnish: Maximum protection, requires maintenance
              - Deck stains: Easy application, moderate protection
              - Penetrating sealers: Natural look, frequent reapplication
              
              Application tips:
              - Sand to 220 grit before finishing
              - Apply in shade, avoid direct sunlight
              - Multiple thin coats better than one thick coat
              - Allow proper drying time between coats
              
              Maintenance schedule: Inspect annually, reapply every 2-3 years depending on exposure.`,
    category: 'finishing',
    craftType: ['woodworking'],
    difficulty: 'intermediate',
    tags: ['outdoor', 'finishing', 'weather-protection', 'maintenance', 'durability'],
    metadata: {
      author: 'Deck Builder',
      dateCreated: new Date('2024-04-10'),
      lastUpdated: new Date('2024-06-20'),
      views: 1123,
      rating: 4.6,
      source: 'Outdoor Woodworking Specialists'
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
  // METALWORKING ARTICLES
  {
    id: 'metal_002',
    title: 'Basic Welding Techniques: MIG, TIG, and Stick',
    content: `Understanding different welding processes helps choose the right technique for your metalworking project.
              
              MIG Welding (GMAW): Best for beginners, uses wire feed, good for thin materials
              - Pros: Easy to learn, fast, good penetration
              - Cons: Requires shielding gas, not great for outdoor use
              - Best for: Auto body work, general fabrication
              
              TIG Welding (GTAW): Precise control, high quality welds
              - Pros: Clean welds, works on all metals, precise control
              - Cons: Slower, requires more skill, expensive
              - Best for: Stainless steel, aluminum, critical joints
              
              Stick Welding (SMAW): Most versatile, works outdoors
              - Pros: Works in wind, portable, inexpensive
              - Cons: More spatter, harder to learn
              - Best for: Structural work, repairs, thick materials
              
              Safety: Always wear welding helmet, proper ventilation, fire-resistant clothing.`,
    category: 'techniques',
    craftType: ['metalworking', 'welding'],
    difficulty: 'intermediate',
    tags: ['welding', 'MIG', 'TIG', 'stick', 'fabrication'],
    metadata: {
      author: 'Professional Welder',
      dateCreated: new Date('2024-03-15'),
      lastUpdated: new Date('2024-06-10'),
      views: 1654,
      rating: 4.7,
      source: 'Welding Institute'
    }
  },
  {
    id: 'metal_003',
    title: 'Metalworking Tools: Essential Equipment for Beginners',
    content: `Starting metalworking requires specific tools different from woodworking. Build your shop gradually.
              
              Cutting tools: Hacksaw, angle grinder, plasma cutter (advanced), metal cutting bandsaw
              Measuring: Steel rulers, calipers, squares, center punch, scribe
              Shaping: Hammers (ball peen, cross peen), anvil, vise, files, sandpaper
              Joining: Welding equipment, torch, flux, filler metals, clamps
              
              Essential first purchases:
              1. Good vise (4" minimum jaw width)
              2. Angle grinder with cutting and grinding discs
              3. Set of files (flat, round, half-round)
              4. Ball peen hammer set
              5. Steel ruler and square
              
              Safety equipment: Safety glasses, hearing protection, welding helmet, leather gloves
              Workshop setup: Good ventilation, fire extinguisher, steel workbench.`,
    category: 'tools',
    craftType: ['metalworking'],
    difficulty: 'beginner',
    tags: ['tools', 'equipment', 'setup', 'beginner', 'safety'],
    metadata: {
      author: 'Metal Shop Instructor',
      dateCreated: new Date('2024-02-20'),
      lastUpdated: new Date('2024-06-05'),
      views: 1432,
      rating: 4.6,
      source: 'Metalworking Today'
    }
  },

  // POTTERY & CERAMICS ARTICLES
  {
    id: 'pottery_002',
    title: 'Pottery Wheel Basics: Centering and Pulling',
    content: `Wheel throwing is fundamental to pottery. Master centering before attempting to pull walls.
              
              Centering technique:
              1. Secure clay firmly on wheel head
              2. Start wheel at medium speed
              3. Brace arms against body for stability
              4. Apply steady, even pressure from outside
              5. Use water sparingly - too much weakens clay
              
              Pulling walls:
              1. Open the centered clay with thumbs
              2. Leave 1/4" bottom thickness
              3. Support inside with one hand, outside with other
              4. Pull slowly and steadily upward
              5. Keep walls even thickness
              
              Common mistakes: Too much water, uneven pressure, rushing the process
              Practice: Start with 1-2 pounds of clay, focus on centering first.`,
    category: 'techniques',
    craftType: ['pottery', 'ceramics'],
    difficulty: 'intermediate',
    tags: ['wheel-throwing', 'centering', 'pottery', 'technique'],
    metadata: {
      author: 'Master Potter',
      dateCreated: new Date('2024-04-01'),
      lastUpdated: new Date('2024-06-12'),
      views: 1876,
      rating: 4.8,
      source: 'Pottery Guild'
    }
  },
  {
    id: 'pottery_003',
    title: 'Glazing Techniques and Firing Temperatures',
    content: `Glazing transforms raw pottery into functional, beautiful pieces. Understanding glaze chemistry prevents failures.
              
              Glaze types:
              - Earthenware glazes: Fire at cone 04-06 (1830-1886°F)
              - Stoneware glazes: Fire at cone 6-10 (2232-2345°F)
              - Porcelain glazes: Fire at cone 8-12 (2280-2420°F)
              
              Application methods:
              - Dipping: Even coverage, good for interiors
              - Brushing: Artistic control, multiple coats needed
              - Spraying: Smooth finish, requires ventilation
              - Pouring: Good for large pieces
              
              Common problems:
              - Crawling: Clean bisque thoroughly before glazing
              - Pinholing: Fire slowly, proper glaze thickness
              - Crazing: Glaze expansion mismatch with clay body
              
              Safety: Always wear dust mask, ventilate kiln area, test fire samples.`,
    category: 'techniques',
    craftType: ['pottery', 'ceramics'],
    difficulty: 'advanced',
    tags: ['glazing', 'firing', 'kiln', 'temperature', 'chemistry'],
    metadata: {
      author: 'Ceramic Chemist',
      dateCreated: new Date('2024-03-20'),
      lastUpdated: new Date('2024-06-18'),
      views: 1234,
      rating: 4.9,
      source: 'Ceramics Monthly'
    }
  },

  // LEATHERCRAFT ARTICLES
  {
    id: 'leather_001',
    title: 'Leatherworking Basics: Tools and First Projects',
    content: `Leathercraft combines traditional techniques with modern tools. Start with simple projects to build skills.
              
              Essential tools:
              - Cutting: Rotary cutter, craft knife, leather shears
              - Punching: Hole punch set, awl, pricking irons
              - Stitching: Needles, thread, stitching pony
              - Finishing: Edge beveler, burnisher, dyes and finishes
              
              Leather types:
              - Vegetable tanned: Toolable, natural, ages well
              - Chrome tanned: Soft, flexible, good for garments
              - Oil tanned: Water resistant, durable
              
              First projects:
              1. Simple bookmark or keychain
              2. Card holder or simple wallet
              3. Belt (great for learning edge finishing)
              4. Small bag or pouch
              
              Techniques: Always cut with sharp tools, wet leather slightly for tooling, practice stitching on scraps.`,
    category: 'projects',
    craftType: ['leathercraft'],
    difficulty: 'beginner',
    tags: ['leather', 'tools', 'beginner', 'projects', 'stitching'],
    metadata: {
      author: 'Leather Artisan',
      dateCreated: new Date('2024-01-25'),
      lastUpdated: new Date('2024-06-08'),
      views: 1567,
      rating: 4.7,
      source: 'Leather Crafters Guild'
    }
  },
  {
    id: 'leather_002',
    title: 'Advanced Leather Tooling and Carving',
    content: `Leather tooling creates beautiful decorative patterns. Master basic techniques before attempting complex designs.
              
              Preparation:
              1. Case leather properly - damp but not wet
              2. Transfer pattern using tracing film
              3. Use swivel knife to cut main lines
              4. Bevel around cut lines with beveler
              
              Essential tools:
              - Swivel knife: For cutting design lines
              - Bevelers: Create depth and dimension
              - Backgrounders: Texture background areas
              - Pear shader: Smooth curved areas
              - Seeder: Add texture details
              
              Techniques:
              - Keep tools sharp and clean
              - Work systematically from center outward
              - Maintain consistent moisture level
              - Practice on scraps before final piece
              
              Finishing: Dye carefully, apply resist to tooled areas, finish with appropriate topcoat.`,
    category: 'techniques',
    craftType: ['leathercraft'],
    difficulty: 'advanced',
    tags: ['tooling', 'carving', 'patterns', 'decoration', 'finishing'],
    metadata: {
      author: 'Master Leather Carver',
      dateCreated: new Date('2024-04-15'),
      lastUpdated: new Date('2024-06-20'),
      views: 987,
      rating: 4.8,
      source: 'Traditional Leather Arts'
    }
  },

  // JEWELRY MAKING ARTICLES
  {
    id: 'jewelry_001',
    title: 'Jewelry Making Fundamentals: Wire and Basic Techniques',
    content: `Jewelry making combines artistry with precision metalwork. Start with wire techniques before advancing to casting.
              
              Wire types and gauges:
              - 20-22 gauge: General construction, jump rings
              - 18-20 gauge: Ear wires, clasps, heavier elements
              - 24-26 gauge: Wrapping, delicate work, binding
              - Materials: Silver, gold-filled, copper, brass for practice
              
              Basic techniques:
              1. Wire cutting: Use flush cutters for clean ends
              2. Jump rings: Consistent opening/closing prevents work hardening
              3. Wire wrapping: Secure stones, create decorative elements
              4. Loops: Round nose pliers for consistent curves
              
              Essential tools:
              - Pliers: Round nose, flat nose, chain nose, bent nose
              - Cutters: Flush cutters, heavy duty cutters
              - Files: Needle files for smoothing ends
              - Mandrels: Ring mandrel, bracelet mandrel
              
              Safety: Eye protection, proper ventilation, secure work surface.`,
    category: 'techniques',
    craftType: ['jewelry'],
    difficulty: 'beginner',
    tags: ['wire', 'pliers', 'basic-techniques', 'tools', 'safety'],
    metadata: {
      author: 'Jewelry Instructor',
      dateCreated: new Date('2024-02-28'),
      lastUpdated: new Date('2024-06-14'),
      views: 1789,
      rating: 4.6,
      source: 'Jewelry Arts Institute'
    }
  },

  // TEXTILE & FIBER ARTS
  {
    id: 'textile_001',
    title: 'Hand Weaving: Setting Up Your First Loom',
    content: `Hand weaving connects us to ancient traditions. Proper loom setup ensures successful projects.
              
              Loom types:
              - Frame loom: Simple, portable, good for beginners
              - Table loom: More shafts, portable, no foot treadles
              - Floor loom: Fastest weaving, hands-free operation
              
              Warping process:
              1. Calculate warp length: finished length + loom waste + take-up + shrinkage
              2. Wind warp on warping board or reel
              3. Transfer to loom maintaining cross
              4. Thread heddles and reed
              5. Tie onto front apron rod
              
              First project suggestions:
              - Plain weave dishcloths
              - Simple striped scarves
              - Placemats with color variations
              
              Common mistakes: Uneven tension, skipped threads in threading, beating too hard
              Troubleshooting: Keep threading charts, check cross frequently, maintain even rhythm.`,
    category: 'techniques',
    craftType: ['weaving', 'textiles'],
    difficulty: 'intermediate',
    tags: ['loom', 'warping', 'setup', 'weaving', 'beginner'],
    metadata: {
      author: 'Master Weaver',
      dateCreated: new Date('2024-03-10'),
      lastUpdated: new Date('2024-06-16'),
      views: 1345,
      rating: 4.7,
      source: 'Handwoven Magazine'
    }
  },

  // GENERAL CRAFT ARTICLES
  {
    id: 'general_001',
    title: 'Workshop Organization: Maximizing Small Spaces',
    content: `Efficient workshop organization multiplies your productivity. Smart storage solutions work in any size space.
              
              Vertical storage solutions:
              - Wall-mounted tool boards with outlined tools
              - Magnetic strips for metal tools
              - Pegboard with custom hangers
              - Ceiling-mounted lumber racks
              
              Mobile storage:
              - Rolling tool carts for frequently used items
              - Stackable bins on wheels
              - Fold-down work surfaces
              - Tool cabinets on casters
              
              Small space strategies:
              - Multi-purpose tools reduce space needs
              - Fold-away workbenches
              - Under-stair storage utilization
              - Shared community workshop space
              
              Organization principles:
              - Most used tools at eye level
              - Group related tools together
              - Label everything clearly
              - Regular decluttering sessions
              
              Safety: Clear pathways, proper lighting, easy access to safety equipment.`,
    category: 'workshop',
    craftType: ['general'],
    difficulty: 'beginner',
    tags: ['organization', 'storage', 'small-space', 'efficiency', 'workshop'],
    metadata: {
      author: 'Workshop Designer',
      dateCreated: new Date('2024-01-10'),
      lastUpdated: new Date('2024-06-22'),
      views: 2456,
      rating: 4.8,
      source: 'Workshop Solutions'
    }
  },
  {
    id: 'general_002',
    title: 'Project Planning: From Idea to Completion',
    content: `Successful craft projects require planning. Systematic approach prevents costly mistakes and frustration.
              
              Planning phases:
              1. Concept development: Sketch ideas, research techniques
              2. Material selection: Quality vs. budget, availability
              3. Tool assessment: What you have vs. what you need
              4. Timeline creation: Realistic scheduling with buffer time
              5. Cost estimation: Materials, tools, time investment
              
              Documentation:
              - Keep project notebooks with sketches
              - Photo document process steps
              - Note material sources and costs
              - Record technique modifications
              - Track time spent on different phases
              
              Risk management:
              - Order extra materials for mistakes
              - Practice new techniques on scraps
              - Have backup plans for critical steps
              - Budget for unexpected tool needs
              
              Success factors: Start with clear goals, break complex projects into phases, celebrate milestones.`,
    category: 'planning',
    craftType: ['general'],
    difficulty: 'beginner',
    tags: ['planning', 'project-management', 'documentation', 'organization'],
    metadata: {
      author: 'Craft Project Manager',
      dateCreated: new Date('2024-05-01'),
      lastUpdated: new Date('2024-06-25'),
      views: 1678,
      rating: 4.5,
      source: 'Craft Planning Institute'
    }
  },

  // SAFETY ARTICLES
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
  },

  // ADVANCED WOODWORKING ARTICLES
  {
    id: 'wood_006',
    title: 'Advanced Joinery: Dovetails and Japanese Techniques',
    content: `Advanced joinery techniques create strong, beautiful connections that showcase craftsmanship.
              
              Dovetail joints:
              - Through dovetails: Strongest, most visible, classic furniture joint
              - Half-blind dovetails: Hidden from front, used in drawer construction
              - Sliding dovetails: Connects panels at right angles, very strong
              
              Cutting technique:
              1. Mark tails first, cut with dovetail saw
              2. Use tails to mark pins precisely
              3. Cut pins slightly oversized, pare to fit
              4. Test fit frequently, adjust carefully
              
              Japanese joinery principles:
              - No nails or screws, only wood connections
              - Precise hand tool work, sharp chisels essential
              - Understanding wood movement and grain direction
              - Patience and practice for perfect fits
              
              Tools: Dovetail saw, sharp chisels, marking gauge, Japanese pull saw
              Practice: Start with softwood, progress to hardwood, make test joints.`,
    category: 'techniques',
    craftType: ['woodworking'],
    difficulty: 'expert',
    tags: ['joinery', 'dovetails', 'japanese', 'advanced', 'hand-tools'],
    metadata: {
      author: 'Japanese Woodworking Master',
      dateCreated: new Date('2024-05-15'),
      lastUpdated: new Date('2024-06-28'),
      views: 743,
      rating: 4.9,
      source: 'Traditional Joinery Institute'
    }
  },

  // STONE CARVING ARTICLES
  {
    id: 'stone_001',
    title: 'Stone Carving Basics: Tools and Techniques',
    content: `Stone carving is one of humanity's oldest art forms. Start with soft stones and basic techniques.
              
              Stone types for beginners:
              - Soapstone: Very soft, easy to carve, good for learning
              - Alabaster: Slightly harder, beautiful when polished
              - Limestone: Traditional carving stone, moderate hardness
              - Avoid: Marble and granite until experienced
              
              Essential tools:
              - Chisels: Point chisel, flat chisel, toothed chisel
              - Hammers: Weighted for control, various sizes
              - Rasps and rifflers: For shaping and smoothing
              - Safety: Dust mask, eye protection, hearing protection
              
              Basic techniques:
              1. Roughing out: Remove large amounts of material
              2. Shaping: Define major forms and planes
              3. Detailing: Add fine features and textures
              4. Finishing: Sanding and polishing
              
              Safety critical: Always wear protection, work in ventilated area, wet cutting reduces dust.`,
    category: 'techniques',
    craftType: ['stone-carving', 'sculpture'],
    difficulty: 'intermediate',
    tags: ['stone', 'carving', 'sculpture', 'tools', 'safety'],
    metadata: {
      author: 'Stone Carving Guild',
      dateCreated: new Date('2024-04-20'),
      lastUpdated: new Date('2024-06-30'),
      views: 1123,
      rating: 4.6,
      source: 'Stone Carvers Association'
    }
  },

  // GLASSWORKING ARTICLES
  {
    id: 'glass_001',
    title: 'Stained Glass Basics: Lead Came and Copper Foil Methods',
    content: `Stained glass combines artistry with technical skill. Two main construction methods serve different purposes.
              
              Lead came method:
              - Traditional technique for large windows
              - H-shaped lead strips hold glass pieces
              - Strong, weather-resistant, authentic look
              - Tools: Lead knife, lathekin, soldering iron, cement
              
              Copper foil method (Tiffany):
              - Better for small, intricate pieces
              - Copper tape around glass edges, then soldered
              - Allows for more detailed work
              - Tools: Foil dispenser, burnisher, soldering iron, flux
              
              Glass cutting basics:
              1. Score glass with sharp cutter in one smooth motion
              2. Break along score line immediately
              3. Use running pliers for long straight cuts
              4. Grozing pliers for removing small pieces
              
              Safety: Safety glasses, cut-resistant gloves, proper ventilation for soldering, first aid kit.`,
    category: 'techniques',
    craftType: ['glasswork', 'stained-glass'],
    difficulty: 'intermediate',
    tags: ['glass', 'stained-glass', 'lead-came', 'copper-foil', 'cutting'],
    metadata: {
      author: 'Stained Glass Artist',
      dateCreated: new Date('2024-03-25'),
      lastUpdated: new Date('2024-06-17'),
      views: 1456,
      rating: 4.7,
      source: 'Glass Arts Society'
    }
  },

  // BOOKBINDING ARTICLES
  {
    id: 'book_001',
    title: 'Traditional Bookbinding: Pamphlet Stitch and Case Binding',
    content: `Bookbinding preserves knowledge and creates beautiful objects. Start with simple pamphlet binding.
              
              Pamphlet stitch (single signature):
              1. Fold paper sheets to create signature
              2. Mark sewing stations on fold
              3. Punch holes at marked points
              4. Sew from inside to outside, back to inside
              5. Tie off thread securely inside
              
              Case binding (hardcover):
              - Multiple signatures sewn together
              - Sewn book block attached to hard covers
              - More complex but creates durable books
              
              Essential tools:
              - Bone folder: For sharp, clean folds
              - Awl: For punching accurate holes
              - Bookbinding needle: Blunt tip prevents tearing
              - PVA glue: Flexible, archival adhesive
              - Book press: For flat, even pressure
              
              Paper considerations: Grain direction affects how book opens, choose appropriate weight.`,
    category: 'techniques',
    craftType: ['bookbinding', 'paper-arts'],
    difficulty: 'intermediate',
    tags: ['bookbinding', 'sewing', 'paper', 'traditional', 'binding'],
    metadata: {
      author: 'Master Bookbinder',
      dateCreated: new Date('2024-02-05'),
      lastUpdated: new Date('2024-06-11'),
      views: 987,
      rating: 4.8,
      source: 'Guild of Book Workers'
    }
  },

  // WOODTURNING ARTICLES
  {
    id: 'wood_007',
    title: 'Woodturning Basics: Bowls and Spindle Work',
    content: `Woodturning transforms blocks of wood into beautiful functional objects. Safety and proper technique are essential.
              
              Types of turning:
              - Spindle turning: Wood grain runs parallel to lathe axis (table legs, tool handles)
              - Faceplate turning: Wood grain runs perpendicular to axis (bowls, plates)
              
              Essential tools:
              - Roughing gouge: Initial shaping of spindles
              - Spindle gouge: Detail work on spindles
              - Bowl gouge: Hollowing bowls and vessels
              - Parting tool: Cutting grooves and separating pieces
              - Skew chisel: Smooth finishing cuts
              
              Safety priorities:
              - Always wear face shield and dust mask
              - Check wood for cracks, knots, metal
              - Secure workpiece properly
              - Keep tools sharp for better control
              - Never leave lathe running unattended
              
              First projects: Start with simple spindles like pens or tool handles before attempting bowls.`,
    category: 'techniques',
    craftType: ['woodworking', 'turning'],
    difficulty: 'intermediate',
    tags: ['turning', 'lathe', 'bowls', 'spindle', 'safety'],
    metadata: {
      author: 'Woodturning Guild',
      dateCreated: new Date('2024-04-05'),
      lastUpdated: new Date('2024-06-19'),
      views: 1567,
      rating: 4.7,
      source: 'American Woodturner'
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