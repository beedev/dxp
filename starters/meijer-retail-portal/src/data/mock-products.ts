/**
 * Meijer in-portal product catalog mocks.
 *
 * This is the *static* portal catalog page mock. The conv-assistant chat
 * uses the full 152-item Meijer catalog ingested into pgvector at
 * `apps/conversational-assistant/data/meijer_products.json`. The two
 * source-of-truths are intentionally separate so the portal can render
 * without hitting the BFF, while the chat hits the real catalog with
 * embeddings. Kept ~30 items here — enough to populate Catalog UI and
 * sample carts.
 */

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  /** Meijer department (free-form string — unlike ACE we don't constrain). */
  category: string;
  brand: string;
  price: number;
  msrp: number;
  imageUrl: string;
  specs: Record<string, string>;
  rating: number;
  reviewCount: number;
  inStoreOnly: boolean;
}

export const products: Product[] = [
  // === Produce ===
  { id: 'PRD-002', sku: 'PRD-002', barcode: '033383401522', name: 'Honeycrisp Apples, 3 lb Bag', description: 'Crisp, sweet-tart Honeycrisp apples. Excellent for snacking, lunch boxes, or baking.', category: 'produce', brand: 'Meijer', price: 5.99, msrp: 6.99, imageUrl: '/placeholder.png', specs: { 'Size': '3 lb', 'Variety': 'Honeycrisp' }, rating: 4.8, reviewCount: 1203, inStoreOnly: false },
  { id: 'PRD-003', sku: 'PRD-003', barcode: '033383700102', name: 'Strawberries, 1 lb', description: 'Sweet, juicy strawberries. Perfect for fruit platters, snacking, or desserts.', category: 'produce', brand: 'Driscoll\'s', price: 4.49, msrp: 5.49, imageUrl: '/placeholder.png', specs: { 'Size': '1 lb', 'Type': 'Fresh berries' }, rating: 4.6, reviewCount: 2341, inStoreOnly: false },
  { id: 'PRD-013', sku: 'PRD-013', barcode: '033383901421', name: 'Organic Baby Carrots, 1 lb', description: 'Sweet, crunchy organic baby carrots. Pre-washed, peeled, ready for lunch boxes or veggie trays.', category: 'produce', brand: 'True Goodness', price: 2.49, msrp: 2.79, imageUrl: '/placeholder.png', specs: { 'Size': '1 lb', 'Organic': 'Yes' }, rating: 4.7, reviewCount: 1124, inStoreOnly: false },

  // === Dairy ===
  { id: 'DRY-001', sku: 'DRY-001', barcode: '033383110011', name: 'Whole Milk, 1 gallon', description: 'Vitamin D whole milk. Family-size gallon.', category: 'dairy', brand: 'Meijer', price: 3.79, msrp: 4.29, imageUrl: '/placeholder.png', specs: { 'Size': '1 gal', 'Fat': 'Whole' }, rating: 4.7, reviewCount: 2143, inStoreOnly: false },
  { id: 'DRY-003', sku: 'DRY-003', barcode: '033383110133', name: 'Grade A Large Eggs, 12 ct', description: 'Grade A large eggs. Breakfast staple — scrambled, baked, or boiled.', category: 'dairy', brand: 'Meijer', price: 3.49, msrp: 3.99, imageUrl: '/placeholder.png', specs: { 'Count': '12', 'Size': 'Large' }, rating: 4.7, reviewCount: 3214, inStoreOnly: false },
  { id: 'DRY-005', sku: 'DRY-005', barcode: '034500001052', name: 'Salted Butter, 1 lb', description: 'Land O Lakes salted butter. Baking, spreading, holiday essential.', category: 'dairy', brand: 'Land O Lakes', price: 4.99, msrp: 5.49, imageUrl: '/placeholder.png', specs: { 'Size': '1 lb', 'Salted': 'Yes' }, rating: 4.8, reviewCount: 2456, inStoreOnly: false },
  { id: 'DRY-010', sku: 'DRY-010', barcode: '046100008012', name: 'String Cheese, 12 ct', description: 'Sargento Mozzarella string cheese. Lunch-box and after-school favorite.', category: 'dairy', brand: 'Sargento', price: 5.49, msrp: 5.99, imageUrl: '/placeholder.png', specs: { 'Count': '12', 'Type': 'Mozzarella' }, rating: 4.8, reviewCount: 1654, inStoreOnly: false },
  { id: 'DRY-014', sku: 'DRY-014', barcode: '818290010050', name: 'Chobani Greek Yogurt Vanilla, 32 oz', description: 'Chobani vanilla nonfat Greek yogurt. High-protein, family-size.', category: 'dairy', brand: 'Chobani', price: 5.99, msrp: 6.49, imageUrl: '/placeholder.png', specs: { 'Size': '32 oz', 'Protein': 'High' }, rating: 4.7, reviewCount: 1432, inStoreOnly: false },

  // === Meat & Seafood ===
  { id: 'MEAT-002', sku: 'MEAT-002', barcode: '033383500302', name: '80/20 Ground Beef Family Pack, 3 lb', description: 'Family-size 80% lean ground beef. Stock up for game day or weekly meals.', category: 'meat-seafood', brand: 'Meijer', price: 16.99, msrp: 18.99, imageUrl: '/placeholder.png', specs: { 'Size': '3 lb', 'Lean': '80/20' }, rating: 4.7, reviewCount: 1234, inStoreOnly: true },
  { id: 'MEAT-006', sku: 'MEAT-006', barcode: '027815010015', name: 'Beef Hot Dogs, 8 ct', description: 'Ball Park Classic Beef Franks. Cookout and tailgate essential.', category: 'meat-seafood', brand: 'Ball Park', price: 5.99, msrp: 6.49, imageUrl: '/placeholder.png', specs: { 'Count': '8', 'Type': 'Beef' }, rating: 4.7, reviewCount: 2143, inStoreOnly: false },
  { id: 'MEAT-007', sku: 'MEAT-007', barcode: '077782001005', name: 'Original Bratwurst, 5 ct', description: 'Johnsonville Original Bratwurst. Pork brats — grill or boil in beer.', category: 'meat-seafood', brand: 'Johnsonville', price: 6.49, msrp: 6.99, imageUrl: '/placeholder.png', specs: { 'Count': '5', 'Type': 'Pork brat' }, rating: 4.8, reviewCount: 1678, inStoreOnly: false },
  { id: 'MEAT-009', sku: 'MEAT-009', barcode: '022655080015', name: 'Frozen Whole Turkey, 14-16 lb', description: 'Butterball frozen whole turkey. Feeds 10-14. Holiday-ready.', category: 'meat-seafood', brand: 'Butterball', price: 24.99, msrp: 29.99, imageUrl: '/placeholder.png', specs: { 'Size': '14-16 lb', 'Type': 'Frozen whole' }, rating: 4.8, reviewCount: 2341, inStoreOnly: true },

  // === Deli & Bakery ===
  { id: 'BAKE-001', sku: 'BAKE-001', barcode: '033383610023', name: 'Hamburger Buns, 8 ct', description: 'Soft, fresh-baked hamburger buns from the Meijer Bakery. Cookout staple.', category: 'deli-bakery', brand: 'Meijer Bakery', price: 2.49, msrp: 2.99, imageUrl: '/placeholder.png', specs: { 'Count': '8' }, rating: 4.6, reviewCount: 743, inStoreOnly: false },
  { id: 'BAKE-005', sku: 'BAKE-005', barcode: '013764000050', name: 'Dave\'s Killer Bread 21 Whole Grains, 27 oz', description: 'Dave\'s Killer Bread 21 Whole Grains and Seeds. Hearty, organic, non-GMO.', category: 'deli-bakery', brand: 'Dave\'s Killer Bread', price: 5.99, msrp: 6.49, imageUrl: '/placeholder.png', specs: { 'Size': '27 oz', 'Organic': 'Yes' }, rating: 4.8, reviewCount: 2143, inStoreOnly: false },
  { id: 'BAKE-007', sku: 'BAKE-007', barcode: '033383620070', name: 'Birthday Cake, 1/4 Sheet Vanilla', description: '1/4 sheet vanilla cake with buttercream frosting. Serves 12-15. Made fresh in-store.', category: 'deli-bakery', brand: 'Meijer Bakery', price: 19.99, msrp: 24.99, imageUrl: '/placeholder.png', specs: { 'Size': '1/4 sheet', 'Flavor': 'Vanilla', 'Serves': '12-15' }, rating: 4.7, reviewCount: 542, inStoreOnly: true },
  { id: 'BAKE-009', sku: 'BAKE-009', barcode: '033383620087', name: 'Pumpkin Pie, 9 in', description: 'Meijer Bakery pumpkin pie. Made fresh in-store, holiday classic.', category: 'deli-bakery', brand: 'Meijer Bakery', price: 6.99, msrp: 7.99, imageUrl: '/placeholder.png', specs: { 'Size': '9 in', 'Type': 'Pumpkin' }, rating: 4.8, reviewCount: 743, inStoreOnly: true },

  // === Pantry ===
  { id: 'PAN-001', sku: 'PAN-001', barcode: '013000026017', name: 'Heinz Tomato Ketchup, 32 oz', description: 'The original — burgers, fries, hot dogs.', category: 'pantry', brand: 'Heinz', price: 4.49, msrp: 4.99, imageUrl: '/placeholder.png', specs: { 'Size': '32 oz' }, rating: 4.8, reviewCount: 3214, inStoreOnly: false },
  { id: 'PAN-009', sku: 'PAN-009', barcode: '076808009002', name: 'Barilla Spaghetti, 1 lb', description: 'Barilla Spaghetti pasta. Weeknight dinner staple.', category: 'pantry', brand: 'Barilla', price: 1.99, msrp: 2.49, imageUrl: '/placeholder.png', specs: { 'Size': '1 lb', 'Shape': 'Spaghetti' }, rating: 4.7, reviewCount: 2143, inStoreOnly: false },
  { id: 'PAN-015', sku: 'PAN-015', barcode: '043000201503', name: 'Stove Top Stuffing Mix Turkey, 6 oz', description: 'Holiday classic — ready in 5 minutes.', category: 'pantry', brand: 'Stove Top', price: 2.49, msrp: 2.99, imageUrl: '/placeholder.png', specs: { 'Size': '6 oz', 'Flavor': 'Turkey' }, rating: 4.7, reviewCount: 1542, inStoreOnly: false },
  { id: 'PAN-017', sku: 'PAN-017', barcode: '031200016010', name: 'Whole Berry Cranberry Sauce, 14 oz', description: 'Ocean Spray Whole Berry Cranberry Sauce. Holiday side.', category: 'pantry', brand: 'Ocean Spray', price: 1.99, msrp: 2.49, imageUrl: '/placeholder.png', specs: { 'Size': '14 oz', 'Type': 'Whole berry' }, rating: 4.7, reviewCount: 1234, inStoreOnly: false },
  { id: 'PAN-024', sku: 'PAN-024', barcode: '016000275928', name: 'Cheerios, 18 oz', description: 'General Mills Cheerios. Heart-healthy whole-grain oat cereal.', category: 'pantry', brand: 'General Mills', price: 4.99, msrp: 5.49, imageUrl: '/placeholder.png', specs: { 'Size': '18 oz' }, rating: 4.8, reviewCount: 2543, inStoreOnly: false },

  // === Frozen ===
  { id: 'FRZ-002', sku: 'FRZ-002', barcode: '071921020149', name: 'DiGiorno Rising Crust Pepperoni Pizza', description: 'Family-size frozen pizza with rising crust.', category: 'frozen', brand: 'DiGiorno', price: 7.99, msrp: 8.99, imageUrl: '/placeholder.png', specs: { 'Size': '27.5 oz', 'Topping': 'Pepperoni' }, rating: 4.7, reviewCount: 1876, inStoreOnly: false },
  { id: 'FRZ-005', sku: 'FRZ-005', barcode: '041548741482', name: 'Edy\'s Vanilla Ice Cream, 48 oz', description: 'Edy\'s Slow Churned Vanilla. Half the fat of regular vanilla, full flavor.', category: 'frozen', brand: 'Edy\'s', price: 4.99, msrp: 5.99, imageUrl: '/placeholder.png', specs: { 'Size': '48 oz', 'Flavor': 'Vanilla' }, rating: 4.7, reviewCount: 1654, inStoreOnly: false },

  // === Beverages ===
  { id: 'BEV-001', sku: 'BEV-001', barcode: '049000028386', name: 'Coca-Cola, 12-pack 12 oz Cans', description: 'Coca-Cola Classic. The original — 12-pack.', category: 'beverages', brand: 'Coca-Cola', price: 7.99, msrp: 8.99, imageUrl: '/placeholder.png', specs: { 'Count': '12', 'Size': '12 oz' }, rating: 4.8, reviewCount: 3214, inStoreOnly: false },
  { id: 'BEV-005', sku: 'BEV-005', barcode: '018200004025', name: 'Bud Light, 12-pack', description: 'Bud Light beer. 12-pack of 12 oz cans.', category: 'beverages', brand: 'Bud Light', price: 14.99, msrp: 15.99, imageUrl: '/placeholder.png', specs: { 'Count': '12', 'Size': '12 oz', 'Alcohol': '4.2%' }, rating: 4.6, reviewCount: 1432, inStoreOnly: true },
  { id: 'BEV-009', sku: 'BEV-009', barcode: '021200974502', name: 'Capri Sun Variety Pack, 30 ct', description: 'Capri Sun Variety Pack. Lunch-box classic.', category: 'beverages', brand: 'Capri Sun', price: 9.99, msrp: 10.99, imageUrl: '/placeholder.png', specs: { 'Count': '30' }, rating: 4.7, reviewCount: 2143, inStoreOnly: false },
  { id: 'BEV-010', sku: 'BEV-010', barcode: '657622602203', name: 'Honest Kids Berry Berry Good, 8 ct', description: 'Honest Kids Organic juice pouches. Lower-sugar kid drink.', category: 'beverages', brand: 'Honest Kids', price: 4.49, msrp: 4.99, imageUrl: '/placeholder.png', specs: { 'Count': '8', 'Organic': 'Yes' }, rating: 4.7, reviewCount: 743, inStoreOnly: false },

  // === Snacks ===
  { id: 'SNK-001', sku: 'SNK-001', barcode: '028400002201', name: 'Lay\'s Classic Potato Chips, Family Size', description: 'Lay\'s Classic Potato Chips, family size.', category: 'snacks', brand: 'Lay\'s', price: 4.99, msrp: 5.49, imageUrl: '/placeholder.png', specs: { 'Size': '13 oz' }, rating: 4.8, reviewCount: 3214, inStoreOnly: false },
  { id: 'SNK-002', sku: 'SNK-002', barcode: '028400060011', name: 'Doritos Nacho Cheese, Family Size', description: 'Doritos Nacho Cheese, family size. Game day staple.', category: 'snacks', brand: 'Doritos', price: 4.99, msrp: 5.49, imageUrl: '/placeholder.png', specs: { 'Size': '14.5 oz', 'Flavor': 'Nacho cheese' }, rating: 4.8, reviewCount: 2876, inStoreOnly: false },
  { id: 'SNK-006', sku: 'SNK-006', barcode: '014100085089', name: 'Goldfish Cheddar Crackers, 30 oz', description: 'Goldfish Cheddar — kid favorite, family-size carton.', category: 'snacks', brand: 'Pepperidge Farm', price: 8.49, msrp: 9.49, imageUrl: '/placeholder.png', specs: { 'Size': '30 oz', 'Flavor': 'Cheddar' }, rating: 4.8, reviewCount: 2543, inStoreOnly: false },
  { id: 'SNK-008', sku: 'SNK-008', barcode: '013562000753', name: 'Annie\'s Bunny Grahams Honey, 7.5 oz', description: 'Annie\'s Honey Bunny Grahams. Organic, kid-friendly.', category: 'snacks', brand: 'Annie\'s', price: 3.99, msrp: 4.49, imageUrl: '/placeholder.png', specs: { 'Size': '7.5 oz', 'Organic': 'Yes' }, rating: 4.8, reviewCount: 1234, inStoreOnly: false },
  { id: 'SNK-011', sku: 'SNK-011', barcode: '033383802001', name: 'True Goodness Organic Fruit Snacks, 10 ct', description: 'True Goodness Organic Mixed Berry Fruit Snacks. Made from real fruit juice.', category: 'snacks', brand: 'True Goodness', price: 3.99, msrp: 4.49, imageUrl: '/placeholder.png', specs: { 'Count': '10', 'Organic': 'Yes' }, rating: 4.7, reviewCount: 743, inStoreOnly: false },

  // === Party Supplies ===
  { id: 'PTY-004', sku: 'PTY-004', barcode: '041594002041', name: 'Solo Red Cups 18 oz, 50 ct', description: 'The classic American party cup.', category: 'party-supplies', brand: 'Solo', price: 7.99, msrp: 8.99, imageUrl: '/placeholder.png', specs: { 'Count': '50', 'Size': '18 oz' }, rating: 4.8, reviewCount: 1543, inStoreOnly: false },
  { id: 'PTY-007', sku: 'PTY-007', barcode: '033383900155', name: 'Latex Balloons Multi-Color, 50 ct', description: 'Latex balloons in mixed party colors. Helium-grade, 11 in.', category: 'party-supplies', brand: 'Meijer Party', price: 4.99, msrp: 5.49, imageUrl: '/placeholder.png', specs: { 'Count': '50', 'Size': '11 in' }, rating: 4.5, reviewCount: 423, inStoreOnly: false },

  // === Household ===
  { id: 'HSE-001', sku: 'HSE-001', barcode: '037000888031', name: 'Bounty Paper Towels, 8 mega rolls', description: 'Bounty Select-A-Size, 8 mega rolls = 22 regular.', category: 'household', brand: 'Bounty', price: 22.99, msrp: 25.99, imageUrl: '/placeholder.png', specs: { 'Count': '8', 'Type': 'Mega' }, rating: 4.8, reviewCount: 3214, inStoreOnly: false },
  { id: 'HSE-002', sku: 'HSE-002', barcode: '037000857013', name: 'Charmin Ultra Soft, 12 mega rolls', description: 'Charmin Ultra Soft Toilet Paper, 12 mega rolls.', category: 'household', brand: 'Charmin', price: 24.99, msrp: 28.99, imageUrl: '/placeholder.png', specs: { 'Count': '12', 'Type': 'Mega' }, rating: 4.8, reviewCount: 2876, inStoreOnly: false },

  // === Seasonal / General Merch ===
  { id: 'GMR-001', sku: 'GMR-001', barcode: '044600001029', name: 'Kingsford Charcoal Original, 16.6 lb', description: 'Kingsford Original Charcoal Briquets. Backyard BBQ classic.', category: 'seasonal-general', brand: 'Kingsford', price: 14.99, msrp: 17.99, imageUrl: '/placeholder.png', specs: { 'Size': '16.6 lb', 'Type': 'Original' }, rating: 4.8, reviewCount: 2143, inStoreOnly: true },
];
