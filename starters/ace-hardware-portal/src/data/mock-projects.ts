export interface MaterialItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  category: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  estimatedCost: number;
  imageUrl: string;
  steps: string[];
  materials: MaterialItem[];
}

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'PRJ001',
    name: 'Build a Deck',
    description: 'Create a beautiful 12x16 ft outdoor deck perfect for entertaining. This intermediate project uses pressure-treated lumber and composite decking for durability and low maintenance.',
    difficulty: 'intermediate',
    estimatedTime: '2-3 days',
    estimatedCost: 1200,
    imageUrl: '/placeholder.png',
    steps: [
      'Check local building codes and obtain necessary permits',
      'Mark the deck layout with stakes and string lines, ensuring square corners',
      'Dig post holes to required depth (typically 42" below grade) and set concrete footings',
      'Install 6x6 support posts and cut to level height',
      'Attach ledger board to house framing with lag bolts and flashing',
      'Install beam and joist framing with proper spacing (16" on center)',
      'Lay composite decking boards with recommended gap spacing',
      'Build and install railing system with balusters per code requirements',
    ],
    materials: [
      { productId: 'H003', name: 'Grip-Rite 16d Common Nails — 5 lb', quantity: 3, unitPrice: 8.48, category: 'hardware' },
      { productId: 'T001', name: 'DeWalt 20V MAX Drill/Driver Kit', quantity: 1, unitPrice: 99.00, category: 'tools' },
      { productId: 'T003', name: 'Stanley FatMax 25 ft Tape Measure', quantity: 1, unitPrice: 24.98, category: 'tools' },
      { productId: 'T005', name: 'Stanley FatMax 48" Box Beam Level', quantity: 1, unitPrice: 39.98, category: 'tools' },
      { productId: 'T004', name: 'DeWalt 7-1/4" Circular Saw', quantity: 1, unitPrice: 109.00, category: 'tools' },
      { productId: 'P004', name: 'Valspar Semi-Transparent Deck Stain', quantity: 3, unitPrice: 34.98, category: 'paint' },
      { productId: 'P009', name: 'Minwax Helmsman Spar Urethane', quantity: 2, unitPrice: 24.98, category: 'paint' },
      { productId: 'H002', name: 'Stanley 3.5" Door Hinge 3-Pack', quantity: 2, unitPrice: 9.98, category: 'hardware' },
      { productId: 'T008', name: 'Klein Tools 8" Long Nose Pliers', quantity: 1, unitPrice: 21.98, category: 'tools' },
      { productId: 'H006', name: 'Yard Master 10x12 ft Blue Poly Tarp', quantity: 2, unitPrice: 14.98, category: 'seasonal' },
      { productId: 'T010', name: 'DeWalt 20V Random Orbit Sander', quantity: 1, unitPrice: 69.00, category: 'tools' },
      { productId: 'T006', name: 'Craftsman V20 Impact Driver Kit', quantity: 1, unitPrice: 79.00, category: 'tools' },
    ],
  },
  {
    id: 'PRJ002',
    name: 'Bathroom Vanity Upgrade',
    description: 'Replace your old bathroom vanity with a modern upgrade. A beginner-friendly project that transforms the look of your bathroom in just a few hours.',
    difficulty: 'beginner',
    estimatedTime: '4-6 hours',
    estimatedCost: 350,
    imageUrl: '/placeholder.png',
    steps: [
      'Turn off water supply valves and disconnect supply lines',
      'Disconnect drain trap and remove existing vanity',
      'Patch and repair any wall damage behind old vanity',
      'Position new vanity and mark wall stud locations',
      'Secure vanity to wall studs with screws',
      'Install new faucet and reconnect supply lines and drain',
    ],
    materials: [
      { productId: 'PL002', name: 'SharkBite Push-to-Connect Fitting Kit', quantity: 1, unitPrice: 32.98, category: 'plumbing' },
      { productId: 'PL003', name: 'Fluidmaster 400A Fill Valve', quantity: 1, unitPrice: 8.98, category: 'plumbing' },
      { productId: 'PL004', name: 'Watts 1/2" Ball Valve', quantity: 2, unitPrice: 12.48, category: 'plumbing' },
      { productId: 'T001', name: 'DeWalt 20V MAX Drill/Driver Kit', quantity: 1, unitPrice: 99.00, category: 'tools' },
      { productId: 'T003', name: 'Stanley FatMax 25 ft Tape Measure', quantity: 1, unitPrice: 24.98, category: 'tools' },
      { productId: 'T005', name: 'Stanley FatMax 48" Box Beam Level', quantity: 1, unitPrice: 39.98, category: 'tools' },
      { productId: 'P003', name: 'KILZ Original Multi-Surface Primer', quantity: 1, unitPrice: 21.98, category: 'paint' },
      { productId: 'H002', name: 'Stanley 3.5" Door Hinge 3-Pack', quantity: 1, unitPrice: 9.98, category: 'hardware' },
    ],
  },
  {
    id: 'PRJ003',
    name: 'Kitchen Backsplash',
    description: 'Add a stunning tile backsplash to your kitchen. Subway tile is timeless and this intermediate project delivers a professional look without the professional price tag.',
    difficulty: 'intermediate',
    estimatedTime: '1 day',
    estimatedCost: 250,
    imageUrl: '/placeholder.png',
    steps: [
      'Measure backsplash area and calculate tile quantity (add 10% for cuts and waste)',
      'Clean and prep the wall surface — remove outlet covers and apply painter\'s tape',
      'Mix thin-set mortar to peanut butter consistency',
      'Apply thin-set with notched trowel and set tiles starting from center bottom',
      'Use tile spacers for consistent grout lines (1/16" to 1/8")',
      'Let thin-set cure for 24 hours, then mix and apply grout with rubber float',
      'Wipe excess grout with damp sponge and seal grout lines after 48 hours',
    ],
    materials: [
      { productId: 'T003', name: 'Stanley FatMax 25 ft Tape Measure', quantity: 1, unitPrice: 24.98, category: 'tools' },
      { productId: 'T005', name: 'Stanley FatMax 48" Box Beam Level', quantity: 1, unitPrice: 39.98, category: 'tools' },
      { productId: 'T008', name: 'Klein Tools 8" Long Nose Pliers', quantity: 1, unitPrice: 21.98, category: 'tools' },
      { productId: 'P010', name: 'Rust-Oleum Painter\'s Touch 2X', quantity: 1, unitPrice: 5.98, category: 'paint' },
      { productId: 'H003', name: 'Grip-Rite 16d Common Nails — 5 lb', quantity: 1, unitPrice: 8.48, category: 'hardware' },
      { productId: 'H006', name: 'Yard Master 10x12 ft Blue Poly Tarp', quantity: 1, unitPrice: 14.98, category: 'seasonal' },
      { productId: 'E001', name: 'Leviton 15A GFCI Outlet', quantity: 1, unitPrice: 16.98, category: 'electrical' },
    ],
  },
  {
    id: 'PRJ004',
    name: 'Privacy Fence',
    description: 'Build a 6-foot privacy fence to define your property line and create a secluded backyard retreat. This advanced project requires precise measurements and post setting.',
    difficulty: 'advanced',
    estimatedTime: '2-3 days',
    estimatedCost: 1800,
    imageUrl: '/placeholder.png',
    steps: [
      'Contact utility locator service (811) to mark underground lines',
      'Survey property lines and mark fence post locations (6-8 ft spacing)',
      'Dig post holes 10" diameter x 36" deep with post hole digger',
      'Set 4x4 posts in concrete, plumb each post with level, and brace',
      'Allow concrete to cure for 24-48 hours before attaching rails',
      'Install 2x4 horizontal rails between posts (top, middle, bottom)',
      'Attach 1x6 fence pickets with uniform spacing using pneumatic nailer',
      'Install post caps and apply stain or sealant for weather protection',
      'Install gate hardware and ensure proper swing clearance',
    ],
    materials: [
      { productId: 'T001', name: 'DeWalt 20V MAX Drill/Driver Kit', quantity: 1, unitPrice: 99.00, category: 'tools' },
      { productId: 'T004', name: 'DeWalt 7-1/4" Circular Saw', quantity: 1, unitPrice: 109.00, category: 'tools' },
      { productId: 'T003', name: 'Stanley FatMax 25 ft Tape Measure', quantity: 1, unitPrice: 24.98, category: 'tools' },
      { productId: 'T005', name: 'Stanley FatMax 48" Box Beam Level', quantity: 1, unitPrice: 39.98, category: 'tools' },
      { productId: 'T006', name: 'Craftsman V20 Impact Driver Kit', quantity: 1, unitPrice: 79.00, category: 'tools' },
      { productId: 'P004', name: 'Valspar Semi-Transparent Deck Stain', quantity: 4, unitPrice: 34.98, category: 'paint' },
      { productId: 'H003', name: 'Grip-Rite 16d Common Nails — 5 lb', quantity: 5, unitPrice: 8.48, category: 'hardware' },
      { productId: 'H001', name: 'Kwikset SmartKey Deadbolt (gate lock)', quantity: 1, unitPrice: 29.98, category: 'hardware' },
      { productId: 'H002', name: 'Stanley 3.5" Door Hinge 3-Pack (gate)', quantity: 2, unitPrice: 9.98, category: 'hardware' },
      { productId: 'H006', name: 'Yard Master 10x12 ft Blue Poly Tarp', quantity: 2, unitPrice: 14.98, category: 'seasonal' },
    ],
  },
  {
    id: 'PRJ005',
    name: 'Garage Organization',
    description: 'Transform your cluttered garage into an organized workspace. This beginner project uses wall-mounted storage, shelving, and a fresh coat of floor coating for a clean, functional space.',
    difficulty: 'beginner',
    estimatedTime: '1 day',
    estimatedCost: 200,
    imageUrl: '/placeholder.png',
    steps: [
      'Clear everything out of the garage and sort into keep, donate, and discard piles',
      'Clean the garage floor thoroughly — sweep, degrease, and let dry',
      'Install wall-mounted pegboard panels on studs for tool organization',
      'Mount heavy-duty shelf brackets and shelving for storage bins',
      'Apply epoxy floor coating for a clean, durable finish',
    ],
    materials: [
      { productId: 'T001', name: 'DeWalt 20V MAX Drill/Driver Kit', quantity: 1, unitPrice: 99.00, category: 'tools' },
      { productId: 'T003', name: 'Stanley FatMax 25 ft Tape Measure', quantity: 1, unitPrice: 24.98, category: 'tools' },
      { productId: 'T005', name: 'Stanley FatMax 48" Box Beam Level', quantity: 1, unitPrice: 39.98, category: 'tools' },
      { productId: 'P007', name: 'Rust-Oleum EpoxyShield Garage Floor Coating', quantity: 1, unitPrice: 84.98, category: 'paint' },
      { productId: 'P001', name: 'Rust-Oleum 2X Ultra Cover Gloss Black', quantity: 2, unitPrice: 5.98, category: 'paint' },
      { productId: 'H003', name: 'Grip-Rite 16d Common Nails — 5 lb', quantity: 1, unitPrice: 8.48, category: 'hardware' },
      { productId: 'H002', name: 'Stanley 3.5" Door Hinge 3-Pack', quantity: 1, unitPrice: 9.98, category: 'hardware' },
      { productId: 'E007', name: 'Halo 6" LED Recessed Retrofit Downlight', quantity: 4, unitPrice: 12.98, category: 'electrical' },
      { productId: 'T008', name: 'Klein Tools 8" Long Nose Pliers', quantity: 1, unitPrice: 21.98, category: 'tools' },
    ],
  },
];
