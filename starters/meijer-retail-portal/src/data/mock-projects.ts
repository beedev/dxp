/**
 * Meijer Party Planner templates.
 *
 * Mirrors the 5 playbooks defined in the conv-assistant persona at
 * `apps/conversational-assistant/configs/meijer-retail.json` →
 * `project_playbooks`. Each template lists the same product
 * categories the chat assistant searches when asked to plan a party
 * or meal — so the in-portal Party Planner UI and the AI-driven
 * checkout produce equivalent shopping lists.
 */

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
    name: 'Kids Birthday Party (10 kids, healthy)',
    description: 'A balanced kids birthday party menu — fresh fruit, kid-friendly snacks, juice pouches, and a bakery cake. Allergy-conscious (nut-free) by default. Easily scalable from 8 to 15 kids.',
    difficulty: 'beginner',
    estimatedTime: '1-2 hours of prep',
    estimatedCost: 110,
    imageUrl: '/placeholder.png',
    steps: [
      'Confirm guest count and any allergies (nut, dairy, gluten) the day before',
      'Pre-cut watermelon and grapes into bite-size pieces; arrange a fruit platter',
      'Set out hummus + baby carrots and pretzel-cracker bowls',
      'Chill juice pouches and Honest Kids drinks',
      'Pick up the cake and balloon bouquet from the Meijer Bakery the morning of',
      'Set table: birthday-themed plates, cups, napkins; light candles for the cake reveal',
    ],
    materials: [
      { productId: 'PRD-003', name: 'Strawberries, 1 lb',                            quantity: 2, unitPrice:  4.49, category: 'produce' },
      { productId: 'PRD-004', name: 'Red Seedless Grapes, 2 lb',                     quantity: 1, unitPrice:  4.99, category: 'produce' },
      { productId: 'PRD-006', name: 'Watermelon Pre-Cut Chunks, 32 oz',              quantity: 1, unitPrice:  6.99, category: 'produce' },
      { productId: 'PRD-013', name: 'Organic Baby Carrots, 1 lb',                    quantity: 1, unitPrice:  2.49, category: 'produce' },
      { productId: 'SNK-008', name: 'Annie\'s Honey Bunny Grahams, 7.5 oz',         quantity: 2, unitPrice:  3.99, category: 'snacks' },
      { productId: 'SNK-011', name: 'True Goodness Organic Fruit Snacks, 10 ct',    quantity: 2, unitPrice:  3.99, category: 'snacks' },
      { productId: 'SNK-012', name: 'Pirate\'s Booty Aged White Cheddar, 6 oz',     quantity: 2, unitPrice:  4.49, category: 'snacks' },
      { productId: 'BEV-009', name: 'Capri Sun Variety Pack, 30 ct',                 quantity: 1, unitPrice:  9.99, category: 'beverages' },
      { productId: 'BEV-010', name: 'Honest Kids Berry Berry Good, 8 ct',            quantity: 2, unitPrice:  4.49, category: 'beverages' },
      { productId: 'BAKE-007', name: 'Birthday Cake, 1/4 Sheet Vanilla',             quantity: 1, unitPrice: 19.99, category: 'deli-bakery' },
      { productId: 'BAKE-011', name: 'Fresh Fruit Platter, Large',                   quantity: 1, unitPrice: 19.99, category: 'deli-bakery' },
      { productId: 'PTY-001', name: 'Birthday Themed Paper Plates, 24 ct',           quantity: 1, unitPrice:  4.99, category: 'party-supplies' },
      { productId: 'PTY-002', name: 'Birthday Themed Plastic Cups, 24 ct',           quantity: 1, unitPrice:  3.99, category: 'party-supplies' },
      { productId: 'PTY-003', name: 'Birthday Themed Napkins, 36 ct',                quantity: 1, unitPrice:  3.49, category: 'party-supplies' },
      { productId: 'PTY-007', name: 'Latex Balloons Multi-Color, 50 ct',             quantity: 1, unitPrice:  4.99, category: 'party-supplies' },
      { productId: 'PTY-008', name: 'Helium Balloon Bouquet, 12 ct',                 quantity: 1, unitPrice: 24.99, category: 'party-supplies' },
    ],
  },
  {
    id: 'PRJ002',
    name: 'Game-Day BBQ (10 adults)',
    description: 'A full football-watch-party menu for 10 adults. Burgers, brats, hot dogs, the chip-and-dip spread, beer, and a hard seltzer variety pack. Gas-grill or charcoal-grill ready.',
    difficulty: 'beginner',
    estimatedTime: '2-3 hours of prep + cooking',
    estimatedCost: 175,
    imageUrl: '/placeholder.png',
    steps: [
      'Check the propane tank or pick up charcoal + lighter fluid the day before',
      'Pull burger patties and brats from the cooler 30 min before grilling',
      'Slice tomatoes, onions, and lettuce; arrange a burger toppings tray',
      'Set out chip bowls, salsa, queso, and guacamole',
      'Chill beer and seltzer in a tub of ice',
      'Heat the grill, cook patties + brats, lay buns face-down for the last 30 seconds',
      'Plate up — remind the kickoff crowd where the trash bags and recycling are',
    ],
    materials: [
      { productId: 'MEAT-002', name: '80/20 Ground Beef Family Pack, 3 lb',          quantity: 1, unitPrice: 16.99, category: 'meat-seafood' },
      { productId: 'MEAT-006', name: 'Beef Hot Dogs, 8 ct',                          quantity: 1, unitPrice:  5.99, category: 'meat-seafood' },
      { productId: 'MEAT-007', name: 'Original Bratwurst, 5 ct',                     quantity: 2, unitPrice:  6.49, category: 'meat-seafood' },
      { productId: 'BAKE-001', name: 'Hamburger Buns, 8 ct',                         quantity: 2, unitPrice:  2.49, category: 'deli-bakery' },
      { productId: 'BAKE-002', name: 'Hot Dog Buns, 8 ct',                           quantity: 1, unitPrice:  2.49, category: 'deli-bakery' },
      { productId: 'DRY-009',  name: 'Singles American Cheese, 24 ct',               quantity: 1, unitPrice:  4.99, category: 'dairy' },
      { productId: 'PAN-001',  name: 'Heinz Tomato Ketchup, 32 oz',                  quantity: 1, unitPrice:  4.49, category: 'pantry' },
      { productId: 'PAN-002',  name: 'French\'s Yellow Mustard, 14 oz',             quantity: 1, unitPrice:  2.49, category: 'pantry' },
      { productId: 'PAN-004',  name: 'Vlasic Dill Pickle Spears, 24 oz',             quantity: 1, unitPrice:  3.99, category: 'pantry' },
      { productId: 'SNK-001',  name: 'Lay\'s Classic Chips, Family Size',           quantity: 2, unitPrice:  4.99, category: 'snacks' },
      { productId: 'SNK-002',  name: 'Doritos Nacho Cheese, Family Size',            quantity: 2, unitPrice:  4.99, category: 'snacks' },
      { productId: 'SNK-003',  name: 'Tostitos Scoops Tortilla Chips',               quantity: 1, unitPrice:  4.49, category: 'snacks' },
      { productId: 'PAN-006',  name: 'Pace Picante Salsa Medium, 24 oz',             quantity: 1, unitPrice:  4.49, category: 'pantry' },
      { productId: 'PAN-007',  name: 'Tostitos Salsa Con Queso, 15 oz',              quantity: 1, unitPrice:  4.99, category: 'pantry' },
      { productId: 'BEV-005',  name: 'Bud Light, 12-pack',                           quantity: 2, unitPrice: 14.99, category: 'beverages' },
      { productId: 'BEV-007',  name: 'White Claw Variety, 12-pack',                  quantity: 1, unitPrice: 19.99, category: 'beverages' },
      { productId: 'BEV-001',  name: 'Coca-Cola, 12-pack',                           quantity: 1, unitPrice:  7.99, category: 'beverages' },
      { productId: 'GMR-001',  name: 'Kingsford Charcoal, 16.6 lb',                  quantity: 1, unitPrice: 14.99, category: 'seasonal-general' },
      { productId: 'GMR-004',  name: 'Bag of Ice, 10 lb',                            quantity: 2, unitPrice:  2.99, category: 'seasonal-general' },
      { productId: 'PTY-005',  name: 'Hefty Heavy-Duty Paper Plates, 100 ct',        quantity: 1, unitPrice: 12.99, category: 'party-supplies' },
    ],
  },
  {
    id: 'PRJ003',
    name: 'Thanksgiving Dinner (8 guests)',
    description: 'A traditional Thanksgiving for 8 — turkey, stuffing, mashed potatoes, green-bean casserole, cranberry sauce, dinner rolls, and pumpkin pie. Mostly classic + one shortcut: bakery pie.',
    difficulty: 'intermediate',
    estimatedTime: '4-5 hours of cooking on the day',
    estimatedCost: 145,
    imageUrl: '/placeholder.png',
    steps: [
      'Order the turkey 3-5 days ahead so it has time to thaw in the fridge',
      'Day before: brine or season the turkey; prep the green-bean casserole base',
      'Morning of: roast turkey (15 min/lb at 325°F until 165°F internal)',
      'While turkey roasts: peel + boil potatoes, bake casserole, warm rolls',
      'Rest turkey 30 min before carving; finish gravy from pan drippings',
      'Plate sides, slice turkey, set out cranberry sauce and rolls',
      'Bring out the pumpkin pie + Cool Whip for dessert',
    ],
    materials: [
      { productId: 'MEAT-009', name: 'Butterball Frozen Whole Turkey, 14-16 lb',     quantity: 1, unitPrice: 24.99, category: 'meat-seafood' },
      { productId: 'PAN-015',  name: 'Stove Top Stuffing Mix Turkey, 6 oz',          quantity: 2, unitPrice:  2.49, category: 'pantry' },
      { productId: 'PRD-011',  name: 'Russet Potatoes, 5 lb',                        quantity: 1, unitPrice:  4.99, category: 'produce' },
      { productId: 'PRD-012',  name: 'Sweet Potatoes, 3 lb',                         quantity: 1, unitPrice:  3.99, category: 'produce' },
      { productId: 'PRD-016',  name: 'Fresh Sage, 0.5 oz',                           quantity: 1, unitPrice:  2.49, category: 'produce' },
      { productId: 'PRD-017',  name: 'Fresh Thyme, 0.5 oz',                          quantity: 1, unitPrice:  2.49, category: 'produce' },
      { productId: 'DRY-005',  name: 'Land O Lakes Salted Butter, 1 lb',             quantity: 1, unitPrice:  4.99, category: 'dairy' },
      { productId: 'DRY-006',  name: 'Heavy Whipping Cream, 1 pt',                   quantity: 1, unitPrice:  3.49, category: 'dairy' },
      { productId: 'DRY-001',  name: 'Whole Milk, 1 gallon',                         quantity: 1, unitPrice:  3.79, category: 'dairy' },
      { productId: 'PAN-019',  name: 'Cream of Mushroom Soup, 10.5 oz',              quantity: 2, unitPrice:  1.99, category: 'pantry' },
      { productId: 'FRZ-004',  name: 'Frozen Cut Green Beans, 1 lb',                 quantity: 2, unitPrice:  1.99, category: 'frozen' },
      { productId: 'PAN-020',  name: 'French\'s Crispy Fried Onions, 6 oz',         quantity: 1, unitPrice:  3.49, category: 'pantry' },
      { productId: 'PAN-017',  name: 'Whole Berry Cranberry Sauce, 14 oz',           quantity: 1, unitPrice:  1.99, category: 'pantry' },
      { productId: 'PAN-018',  name: 'Jellied Cranberry Sauce, 14 oz',               quantity: 1, unitPrice:  1.99, category: 'pantry' },
      { productId: 'BAKE-004', name: 'King\'s Hawaiian Sweet Rolls, 12 ct',         quantity: 2, unitPrice:  4.99, category: 'deli-bakery' },
      { productId: 'BAKE-009', name: 'Pumpkin Pie, 9 in (Meijer Bakery)',            quantity: 1, unitPrice:  6.99, category: 'deli-bakery' },
      { productId: 'FRZ-008',  name: 'Cool Whip Original, 8 oz',                     quantity: 1, unitPrice:  2.99, category: 'frozen' },
      { productId: 'BEV-014',  name: 'Martinelli\'s Sparkling Cider, 25.4 oz',      quantity: 2, unitPrice:  4.49, category: 'beverages' },
      { productId: 'PAN-026',  name: 'Bell\'s Poultry Seasoning, 0.7 oz',           quantity: 1, unitPrice:  4.99, category: 'pantry' },
      { productId: 'PAN-028',  name: 'Reynolds Disposable Roasting Pans, 3-pack',    quantity: 1, unitPrice:  4.99, category: 'pantry' },
    ],
  },
  {
    id: 'PRJ004',
    name: 'Weekly Groceries (Family of 4)',
    description: 'A typical week\'s worth of groceries for a family of four — fresh produce, proteins, dairy, breakfast, snacks, pantry staples, and household basics. Tuned for ~$150-200 per week.',
    difficulty: 'beginner',
    estimatedTime: '45 min in store + meal-plan time',
    estimatedCost: 175,
    imageUrl: '/placeholder.png',
    steps: [
      'Plan the week\'s 5 dinners + 2 leftover nights before shopping',
      'Inventory the pantry, fridge, and freezer; mark what\'s low',
      'Build the list by department, in the order you walk the store',
      'Shop perimeter (produce → dairy → meat → bakery) before the center aisles',
      'Stop in frozen last so cold items stay cold',
      'Use mPerks at checkout to apply coupons and digital savings',
    ],
    materials: [
      { productId: 'PRD-001', name: 'Bananas, 2 lb',                                 quantity: 1, unitPrice:  1.49, category: 'produce' },
      { productId: 'PRD-002', name: 'Honeycrisp Apples, 3 lb',                       quantity: 1, unitPrice:  5.99, category: 'produce' },
      { productId: 'PRD-007', name: 'Bagged Baby Spinach, 5 oz',                     quantity: 1, unitPrice:  2.99, category: 'produce' },
      { productId: 'PRD-014', name: 'Bell Peppers Multi-Color 3-pack',               quantity: 1, unitPrice:  4.99, category: 'produce' },
      { productId: 'PRD-015', name: 'Hass Avocados, 4-pack',                         quantity: 1, unitPrice:  4.99, category: 'produce' },
      { productId: 'DRY-001', name: 'Whole Milk, 1 gallon',                          quantity: 1, unitPrice:  3.79, category: 'dairy' },
      { productId: 'DRY-003', name: 'Grade A Large Eggs, 12 ct',                     quantity: 2, unitPrice:  3.49, category: 'dairy' },
      { productId: 'DRY-007', name: 'Sharp Cheddar Block, 8 oz',                     quantity: 1, unitPrice:  4.99, category: 'dairy' },
      { productId: 'DRY-014', name: 'Chobani Greek Yogurt Vanilla, 32 oz',           quantity: 1, unitPrice:  5.99, category: 'dairy' },
      { productId: 'MEAT-001', name: '80/20 Ground Beef, 1 lb',                      quantity: 2, unitPrice:  5.99, category: 'meat-seafood' },
      { productId: 'MEAT-004', name: 'Boneless Chicken Breasts, family pack',        quantity: 1, unitPrice: 11.99, category: 'meat-seafood' },
      { productId: 'BAKE-005', name: 'Dave\'s Killer Bread, 27 oz',                 quantity: 1, unitPrice:  5.99, category: 'deli-bakery' },
      { productId: 'PAN-009',  name: 'Barilla Spaghetti, 1 lb',                      quantity: 2, unitPrice:  1.99, category: 'pantry' },
      { productId: 'PAN-012',  name: 'Heinz Pasta Sauce, 24 oz',                     quantity: 2, unitPrice:  3.49, category: 'pantry' },
      { productId: 'PAN-024',  name: 'Cheerios, 18 oz',                              quantity: 1, unitPrice:  4.99, category: 'pantry' },
      { productId: 'FRZ-003',  name: 'Frozen Mixed Vegetables, 1 lb',                quantity: 2, unitPrice:  1.99, category: 'frozen' },
      { productId: 'FRZ-005',  name: 'Edy\'s Vanilla Ice Cream, 48 oz',             quantity: 1, unitPrice:  4.99, category: 'frozen' },
      { productId: 'HSE-001',  name: 'Bounty Paper Towels, 8 mega rolls',            quantity: 1, unitPrice: 22.99, category: 'household' },
      { productId: 'HSE-002',  name: 'Charmin Toilet Paper, 12 mega rolls',          quantity: 1, unitPrice: 24.99, category: 'household' },
    ],
  },
  {
    id: 'PRJ005',
    name: 'Back-to-School Lunches (5 days × 2 kids)',
    description: 'Five days of school lunches and snacks for two kids. Nut-free for school policies. Mix of fresh, packaged, and lunch-box-friendly items. Easy to pack the night before.',
    difficulty: 'beginner',
    estimatedTime: '20 min prep per evening',
    estimatedCost: 65,
    imageUrl: '/placeholder.png',
    steps: [
      'Pack lunches the night before — sandwich, snack, fruit, drink, treat',
      'Slice apples or grapes into snack containers; keep cheese sticks chilled',
      'Rotate sandwich fillings (turkey + cheese, then PB&J alternative if school allows)',
      'Always check the school\'s nut-policy ingredient lists',
      'Send a reusable water bottle alongside the juice/water box',
      'Friday treat: a Babybel or organic fruit snack as a reward',
    ],
    materials: [
      { productId: 'BAKE-006', name: 'Sara Lee 100% Whole Wheat Bread, 20 oz',       quantity: 1, unitPrice:  3.49, category: 'deli-bakery' },
      { productId: 'MEAT-012', name: 'Boar\'s Head Oven Gold Turkey, 1 lb (deli)',  quantity: 1, unitPrice: 11.99, category: 'deli-bakery' },
      { productId: 'DRY-009',  name: 'Singles American Cheese, 24 ct',               quantity: 1, unitPrice:  4.99, category: 'dairy' },
      { productId: 'DRY-010',  name: 'Sargento String Cheese, 12 ct',                quantity: 1, unitPrice:  5.49, category: 'dairy' },
      { productId: 'DRY-011',  name: 'Mini Babybel Cheese, 6 ct',                    quantity: 1, unitPrice:  4.99, category: 'dairy' },
      { productId: 'DRY-012',  name: 'Yoplait Go-Gurt Tubes, 16 ct',                 quantity: 1, unitPrice:  5.99, category: 'dairy' },
      { productId: 'PRD-002',  name: 'Honeycrisp Apples, 3 lb',                      quantity: 1, unitPrice:  5.99, category: 'produce' },
      { productId: 'PRD-005',  name: 'Cuties Mandarin Oranges, 3 lb',                quantity: 1, unitPrice:  5.99, category: 'produce' },
      { productId: 'SNK-014',  name: 'Mott\'s Applesauce No Sugar Added, 6 ct',     quantity: 1, unitPrice:  2.99, category: 'snacks' },
      { productId: 'SNK-006',  name: 'Goldfish Cheddar Crackers, 30 oz',             quantity: 1, unitPrice:  8.49, category: 'snacks' },
      { productId: 'SNK-009',  name: 'Nature Valley Granola Bars, 12 ct',            quantity: 1, unitPrice:  4.49, category: 'snacks' },
      { productId: 'SNK-010',  name: 'Nature\'s Bakery Fig Bars, 12 ct (nut-free)', quantity: 1, unitPrice:  6.99, category: 'snacks' },
      { productId: 'BEV-009',  name: 'Capri Sun Variety Pack, 30 ct',                quantity: 1, unitPrice:  9.99, category: 'beverages' },
      { productId: 'BEV-011',  name: 'Mott\'s Apple Juice Boxes, 8 ct',             quantity: 1, unitPrice:  3.49, category: 'beverages' },
    ],
  },
];
