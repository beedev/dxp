export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  category: 'paint' | 'tools' | 'plumbing' | 'electrical' | 'outdoor' | 'hardware' | 'seasonal';
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
  // === PAINT (10) ===
  {
    id: 'P001', sku: 'RO-2X-GLO', barcode: '020066187279', name: 'Rust-Oleum 2X Ultra Cover Gloss Black',
    description: '12 oz spray paint with double cover technology. Indoor/outdoor use on wood, metal, plastic, and more.',
    category: 'paint', brand: 'Rust-Oleum', price: 5.98, msrp: 7.49, imageUrl: '/placeholder.png',
    specs: { 'Size': '12 oz', 'Finish': 'Gloss', 'Color': 'Black', 'Coverage': '12 sq ft', 'Dry Time': '20 min' },
    rating: 4.6, reviewCount: 2341, inStoreOnly: false,
  },
  {
    id: 'P002', sku: 'BM-REGAL-WH', barcode: '023906735012', name: 'Benjamin Moore Regal Select Interior — White',
    description: 'Premium interior paint with exceptional hide and coverage. Mildew-resistant finish.',
    category: 'paint', brand: 'Benjamin Moore', price: 62.99, msrp: 69.99, imageUrl: '/placeholder.png',
    specs: { 'Size': '1 Gallon', 'Finish': 'Eggshell', 'Color': 'Simply White OC-117', 'Coverage': '400 sq ft/gal', 'VOC': 'Low' },
    rating: 4.8, reviewCount: 876, inStoreOnly: false,
  },
  {
    id: 'P003', sku: 'KL-EXT-GRY', barcode: '080047102003', name: 'KILZ Original Multi-Surface Primer',
    description: 'Interior oil-based primer, sealer, and stain blocker. Blocks most stains including water, smoke, tannin.',
    category: 'paint', brand: 'KILZ', price: 21.98, msrp: 24.99, imageUrl: '/placeholder.png',
    specs: { 'Size': '1 Gallon', 'Type': 'Oil-Based Primer', 'Coverage': '300-400 sq ft/gal', 'Dry Time': '30 min' },
    rating: 4.5, reviewCount: 3102, inStoreOnly: false,
  },
  {
    id: 'P004', sku: 'VL-DECK-CDR', barcode: '080047221003', name: 'Valspar Semi-Transparent Deck Stain — Cedar',
    description: 'Weather-resistant deck stain that enhances natural wood grain. UV protection formula.',
    category: 'paint', brand: 'Valspar', price: 34.98, msrp: 39.99, imageUrl: '/placeholder.png',
    specs: { 'Size': '1 Gallon', 'Type': 'Semi-Transparent Stain', 'Color': 'Cedar Naturaltone', 'Coverage': '200-400 sq ft/gal' },
    rating: 4.3, reviewCount: 567, inStoreOnly: false,
  },
  {
    id: 'P005', sku: 'RO-CHALK-LIN', barcode: '020066285289', name: 'Rust-Oleum Chalked Paint — Linen White',
    description: 'Ultra matte chalked paint for furniture refinishing. No sanding or priming needed.',
    category: 'paint', brand: 'Rust-Oleum', price: 17.98, msrp: 19.99, imageUrl: '/placeholder.png',
    specs: { 'Size': '30 oz', 'Finish': 'Ultra Matte', 'Color': 'Linen White', 'Coverage': '150 sq ft' },
    rating: 4.4, reviewCount: 1203, inStoreOnly: false,
  },
  {
    id: 'P006', sku: 'BM-ADV-SATIN', barcode: '023906710019', name: 'Benjamin Moore Advance Interior Paint — Satin',
    description: 'Waterborne alkyd paint ideal for trim, doors, and cabinets. Levels to a smooth, furniture-like finish.',
    category: 'paint', brand: 'Benjamin Moore', price: 72.99, msrp: 79.99, imageUrl: '/placeholder.png',
    specs: { 'Size': '1 Gallon', 'Finish': 'Satin', 'Type': 'Waterborne Alkyd', 'Dry Time': '16 hours recoat' },
    rating: 4.7, reviewCount: 445, inStoreOnly: false,
  },
  {
    id: 'P007', sku: 'RO-EPOXY-GR', barcode: '020066238001', name: 'Rust-Oleum EpoxyShield Garage Floor Coating',
    description: 'Professional-strength epoxy floor coating kit. Covers 250 sq ft. Includes decorative chips.',
    category: 'paint', brand: 'Rust-Oleum', price: 84.98, msrp: 99.99, imageUrl: '/placeholder.png',
    specs: { 'Coverage': '250 sq ft', 'Type': 'Epoxy', 'Dry Time': '24 hours', 'Includes': 'Anti-skid chips' },
    rating: 4.2, reviewCount: 1876, inStoreOnly: true,
  },
  {
    id: 'P008', sku: 'MWX-EXT-FLAT', barcode: '023906760014', name: 'Clark+Kensington Exterior Flat Paint',
    description: 'Paint + primer in one. Advanced acrylic latex formula with excellent adhesion.',
    category: 'paint', brand: 'Clark+Kensington', price: 41.99, msrp: 49.99, imageUrl: '/placeholder.png',
    specs: { 'Size': '1 Gallon', 'Finish': 'Flat', 'Type': 'Paint + Primer', 'Coverage': '350-400 sq ft/gal' },
    rating: 4.5, reviewCount: 328, inStoreOnly: false,
  },
  {
    id: 'P009', sku: 'MNW-HELM-SAT', barcode: '027426651005', name: 'Minwax Helmsman Spar Urethane — Satin',
    description: 'Crystal clear urethane finish for interior/exterior wood. UV absorbers reduce fading.',
    category: 'paint', brand: 'Minwax', price: 24.98, msrp: 29.99, imageUrl: '/placeholder.png',
    specs: { 'Size': '1 Quart', 'Finish': 'Satin', 'Type': 'Spar Urethane', 'Use': 'Interior/Exterior' },
    rating: 4.6, reviewCount: 712, inStoreOnly: false,
  },
  {
    id: 'P010', sku: 'RO-SPRAY-RED', barcode: '020066249854', name: 'Rust-Oleum Painter\'s Touch 2X — Colonial Red',
    description: 'Double cover spray paint. Covers up to 12 sq ft. Ideal for craft and DIY projects.',
    category: 'paint', brand: 'Rust-Oleum', price: 5.98, msrp: 7.49, imageUrl: '/placeholder.png',
    specs: { 'Size': '12 oz', 'Finish': 'Satin', 'Color': 'Colonial Red', 'Coverage': '12 sq ft' },
    rating: 4.5, reviewCount: 1650, inStoreOnly: false,
  },

  // === TOOLS (10) ===
  {
    id: 'T001', sku: 'DW-DRL-20V', barcode: '885911478700', name: 'DeWalt 20V MAX Cordless Drill/Driver Kit',
    description: 'Compact, lightweight design fits into tight areas. 300 unit watts out of max power. Includes 2 batteries.',
    category: 'tools', brand: 'DeWalt', price: 99.00, msrp: 129.00, imageUrl: '/placeholder.png',
    specs: { 'Voltage': '20V', 'Speed': '0-1500 RPM', 'Chuck': '1/2 inch', 'Weight': '3.6 lbs', 'Batteries': '2x 1.3Ah' },
    rating: 4.8, reviewCount: 5623, inStoreOnly: false,
  },
  {
    id: 'T002', sku: 'CM-WR-170', barcode: '076174094312', name: 'Craftsman 170-Piece Mechanics Tool Set',
    description: 'Comprehensive tool set with 72-tooth ratchets, 6-point sockets, combination wrenches, and more.',
    category: 'tools', brand: 'Craftsman', price: 149.00, msrp: 199.99, imageUrl: '/placeholder.png',
    specs: { 'Pieces': '170', 'Drive Sizes': '1/4", 3/8", 1/2"', 'Socket Type': '6-Point', 'Case': 'Blow-molded' },
    rating: 4.7, reviewCount: 3421, inStoreOnly: false,
  },
  {
    id: 'T003', sku: 'SN-TPM-25', barcode: '076174100259', name: 'Stanley FatMax 25 ft Tape Measure',
    description: '25 ft blade with 11 ft standout. BladeArmor coating on first 6 inches. Belt clip included.',
    category: 'tools', brand: 'Stanley', price: 24.98, msrp: 29.99, imageUrl: '/placeholder.png',
    specs: { 'Length': '25 ft', 'Standout': '11 ft', 'Width': '1-1/4 inch', 'Coating': 'BladeArmor' },
    rating: 4.7, reviewCount: 4012, inStoreOnly: false,
  },
  {
    id: 'T004', sku: 'DW-SAW-CIR', barcode: '885911460501', name: 'DeWalt 7-1/4" Lightweight Circular Saw',
    description: '15 Amp motor delivers 5,200 RPM for aggressive cutting. Electric brake stops blade after trigger release.',
    category: 'tools', brand: 'DeWalt', price: 109.00, msrp: 139.00, imageUrl: '/placeholder.png',
    specs: { 'Amps': '15', 'Speed': '5,200 RPM', 'Blade': '7-1/4 inch', 'Bevel': '57 degrees', 'Weight': '8.8 lbs' },
    rating: 4.6, reviewCount: 1893, inStoreOnly: false,
  },
  {
    id: 'T005', sku: 'SN-LVL-48', barcode: '076174430486', name: 'Stanley FatMax 48" Box Beam Level',
    description: 'High-contrast center vial for easy reading. Shock-absorbing end caps. Non-marring surface.',
    category: 'tools', brand: 'Stanley', price: 39.98, msrp: 49.99, imageUrl: '/placeholder.png',
    specs: { 'Length': '48 inch', 'Vials': '3 (plumb, level, 45°)', 'Accuracy': '0.0005"/inch', 'Material': 'Aluminum' },
    rating: 4.5, reviewCount: 876, inStoreOnly: false,
  },
  {
    id: 'T006', sku: 'CM-DRL-V20', barcode: '076174096326', name: 'Craftsman V20 Impact Driver Kit',
    description: 'Compact impact driver with 1,460 in-lbs of torque. Variable speed trigger. LED work light.',
    category: 'tools', brand: 'Craftsman', price: 79.00, msrp: 99.00, imageUrl: '/placeholder.png',
    specs: { 'Voltage': '20V', 'Torque': '1,460 in-lbs', 'Speed': '0-2,800 RPM', 'Impact Rate': '0-3,200 BPM' },
    rating: 4.6, reviewCount: 2103, inStoreOnly: false,
  },
  {
    id: 'T007', sku: 'DW-OSC-20V', barcode: '885911549301', name: 'DeWalt 20V MAX XR Oscillating Multi-Tool',
    description: 'Brushless motor for long runtime. Quick-Change accessory system. 3-speed selector.',
    category: 'tools', brand: 'DeWalt', price: 159.00, msrp: 189.00, imageUrl: '/placeholder.png',
    specs: { 'Voltage': '20V', 'Oscillation': '0-20,000 OPM', 'System': 'Quick-Change', 'Motor': 'Brushless' },
    rating: 4.7, reviewCount: 987, inStoreOnly: false,
  },
  {
    id: 'T008', sku: 'KL-PLRS-8', barcode: '037103208088', name: 'Klein Tools 8" Long Nose Pliers',
    description: 'Induction-hardened cutting knives. Cross-hatched jaws for superior gripping. Heavy-duty.',
    category: 'tools', brand: 'Klein Tools', price: 21.98, msrp: 27.99, imageUrl: '/placeholder.png',
    specs: { 'Length': '8 inch', 'Jaw Type': 'Long Nose', 'Material': 'Steel', 'Handle': 'Journeyman' },
    rating: 4.8, reviewCount: 3210, inStoreOnly: false,
  },
  {
    id: 'T009', sku: 'MK-LAS-GRN', barcode: '038484200102', name: 'Milwaukee Green Cross Line Laser Level',
    description: 'Green beam laser 4x more visible than red. Self-leveling within 4 degrees. Indoor/outdoor use.',
    category: 'tools', brand: 'Milwaukee', price: 199.00, msrp: 249.00, imageUrl: '/placeholder.png',
    specs: { 'Beam': 'Green', 'Range': '100 ft', 'Accuracy': '3/16" at 33 ft', 'Self-Leveling': '4 degrees' },
    rating: 4.5, reviewCount: 654, inStoreOnly: false,
  },
  {
    id: 'T010', sku: 'DW-SNDRS-20', barcode: '885911593206', name: 'DeWalt 20V Random Orbit Sander',
    description: '5-inch random orbit sander with dust-sealed switch. 12,000 OPM. Hook and loop pad.',
    category: 'tools', brand: 'DeWalt', price: 69.00, msrp: 89.00, imageUrl: '/placeholder.png',
    specs: { 'Voltage': '20V', 'Orbits': '12,000 OPM', 'Pad Size': '5 inch', 'Dust Collection': 'Bag included' },
    rating: 4.4, reviewCount: 1243, inStoreOnly: false,
  },

  // === PLUMBING (8) ===
  {
    id: 'PL001', sku: 'MN-FAU-ARC', barcode: '026508206515', name: 'Moen Arbor Pull-Down Kitchen Faucet',
    description: 'MotionSense wave technology for hands-free activation. Power Boost for faster cleaning.',
    category: 'plumbing', brand: 'Moen', price: 309.00, msrp: 369.00, imageUrl: '/placeholder.png',
    specs: { 'Finish': 'Spot Resist Stainless', 'Spray Modes': '2', 'Technology': 'MotionSense', 'Hose Length': '68 inch' },
    rating: 4.6, reviewCount: 2156, inStoreOnly: false,
  },
  {
    id: 'PL002', sku: 'SK-CPVC-KT', barcode: '039923293107', name: 'SharkBite Push-to-Connect Fitting Kit (6pc)',
    description: 'No soldering, clamps, or glue needed. Push-fit connection on copper, CPVC, and PEX.',
    category: 'plumbing', brand: 'SharkBite', price: 32.98, msrp: 39.99, imageUrl: '/placeholder.png',
    specs: { 'Pieces': '6', 'Size': '1/2 inch', 'Compatible': 'Copper, CPVC, PEX', 'Pressure': '200 PSI' },
    rating: 4.7, reviewCount: 1876, inStoreOnly: false,
  },
  {
    id: 'PL003', sku: 'FL-TOIL-REP', barcode: '039961021038', name: 'Fluidmaster 400A Universal Fill Valve',
    description: 'Fits most toilets. Anti-siphon design meets plumbing codes. Easy height adjustment 9-14 inches.',
    category: 'plumbing', brand: 'Fluidmaster', price: 8.98, msrp: 11.99, imageUrl: '/placeholder.png',
    specs: { 'Fits': 'Most toilets', 'Height': '9-14 inch adjustable', 'Design': 'Anti-siphon', 'Flow Rate': '2.4 GPM' },
    rating: 4.5, reviewCount: 4523, inStoreOnly: false,
  },
  {
    id: 'PL004', sku: 'DT-BALL-1/2', barcode: '038753399102', name: 'Watts 1/2" Ball Valve — Lead Free',
    description: 'Full port brass ball valve. Lead-free compliant for potable water. Quarter-turn operation.',
    category: 'plumbing', brand: 'Watts', price: 12.48, msrp: 15.99, imageUrl: '/placeholder.png',
    specs: { 'Size': '1/2 inch', 'Material': 'Lead-Free Brass', 'Operation': 'Quarter-Turn', 'Pressure': '600 WOG' },
    rating: 4.6, reviewCount: 987, inStoreOnly: false,
  },
  {
    id: 'PL005', sku: 'MN-SHW-MAG', barcode: '026508237243', name: 'Moen Magnetix Handheld Showerhead',
    description: 'Magnetic docking system snaps showerhead precisely into place. 6 spray settings.',
    category: 'plumbing', brand: 'Moen', price: 49.98, msrp: 59.99, imageUrl: '/placeholder.png',
    specs: { 'Spray Settings': '6', 'Hose Length': '60 inch', 'Flow Rate': '1.75 GPM', 'Dock': 'Magnetix' },
    rating: 4.7, reviewCount: 3421, inStoreOnly: false,
  },
  {
    id: 'PL006', sku: 'CH-PEX-100', barcode: '052334102001', name: 'SharkBite 1/2" PEX Pipe — 100 ft Coil',
    description: 'Flexible PEX pipe for hot and cold water supply. No torch or soldering needed.',
    category: 'plumbing', brand: 'SharkBite', price: 42.98, msrp: 54.99, imageUrl: '/placeholder.png',
    specs: { 'Size': '1/2 inch', 'Length': '100 ft', 'Material': 'PEX-B', 'Rating': '160 PSI at 73°F' },
    rating: 4.5, reviewCount: 2103, inStoreOnly: false,
  },
  {
    id: 'PL007', sku: 'AO-WTR-50G', barcode: '091193048503', name: 'A.O. Smith 50-Gallon Electric Water Heater',
    description: '50-gallon electric water heater with self-cleaning dip tube. 6-year limited warranty.',
    category: 'plumbing', brand: 'A.O. Smith', price: 549.00, msrp: 649.00, imageUrl: '/placeholder.png',
    specs: { 'Capacity': '50 Gallon', 'Type': 'Electric', 'Recovery': '21 GPH', 'Warranty': '6 Year' },
    rating: 4.3, reviewCount: 876, inStoreOnly: true,
  },
  {
    id: 'PL008', sku: 'RD-DISP-1/2', barcode: '021015031008', name: 'InSinkErator Badger 5 Garbage Disposal',
    description: '1/2 HP continuous feed disposal. Galvanized steel grind components. Quick Lock mounting.',
    category: 'plumbing', brand: 'InSinkErator', price: 99.98, msrp: 119.00, imageUrl: '/placeholder.png',
    specs: { 'HP': '1/2', 'Feed': 'Continuous', 'Mount': 'Quick Lock', 'Grind': 'Galvanized Steel' },
    rating: 4.4, reviewCount: 2987, inStoreOnly: false,
  },

  // === ELECTRICAL (8) ===
  {
    id: 'E001', sku: 'LV-GFCI-15', barcode: '078477311424', name: 'Leviton 15A GFCI Outlet — White',
    description: 'SmartlockPro self-test GFCI. Slim design. Status indicator light. Feed-through wiring.',
    category: 'electrical', brand: 'Leviton', price: 16.98, msrp: 21.99, imageUrl: '/placeholder.png',
    specs: { 'Amps': '15A', 'Voltage': '125V', 'Type': 'GFCI', 'Color': 'White', 'UL Listed': 'Yes' },
    rating: 4.7, reviewCount: 3456, inStoreOnly: false,
  },
  {
    id: 'E002', sku: 'LT-DIM-LED', barcode: '019813108018', name: 'Lutron Caseta Wireless Smart Dimmer',
    description: 'Works with Alexa, Google, and HomeKit. Fades lights to off for a premium feel. Pico remote included.',
    category: 'electrical', brand: 'Lutron', price: 64.95, msrp: 79.95, imageUrl: '/placeholder.png',
    specs: { 'Type': 'Smart Dimmer', 'Protocol': 'Clear Connect RF', 'Compatible': 'LED/CFL/Incandescent', 'Includes': 'Pico Remote' },
    rating: 4.8, reviewCount: 5621, inStoreOnly: false,
  },
  {
    id: 'E003', sku: 'PH-LED-4PK', barcode: '046677461003', name: 'Philips LED 60W Equivalent Soft White (4-pack)',
    description: '8.5W LED replaces 60W incandescent. 800 lumens. 10,000 hour rated life.',
    category: 'electrical', brand: 'Philips', price: 7.98, msrp: 9.99, imageUrl: '/placeholder.png',
    specs: { 'Watts': '8.5W (60W equiv)', 'Lumens': '800', 'Color Temp': '2700K Soft White', 'Life': '10,000 hours', 'Quantity': '4' },
    rating: 4.6, reviewCount: 8943, inStoreOnly: false,
  },
  {
    id: 'E004', sku: 'SQ-12-2-NM', barcode: '029892261208', name: 'Southwire 12/2 NM-B Romex — 250 ft',
    description: '12-gauge, 2-conductor with ground. Non-metallic sheathed cable for residential wiring.',
    category: 'electrical', brand: 'Southwire', price: 94.98, msrp: 109.00, imageUrl: '/placeholder.png',
    specs: { 'Gauge': '12 AWG', 'Conductors': '2 + Ground', 'Length': '250 ft', 'Type': 'NM-B Romex' },
    rating: 4.5, reviewCount: 1234, inStoreOnly: true,
  },
  {
    id: 'E005', sku: 'LV-USB-OUTL', barcode: '078477332450', name: 'Leviton USB-C/A Outlet — 15A White',
    description: 'Tamper-resistant outlet with USB Type-C and Type-A ports. 30W total USB power.',
    category: 'electrical', brand: 'Leviton', price: 29.98, msrp: 34.99, imageUrl: '/placeholder.png',
    specs: { 'Amps': '15A', 'USB Power': '30W Total', 'USB Ports': 'Type-C + Type-A', 'Color': 'White' },
    rating: 4.6, reviewCount: 2109, inStoreOnly: false,
  },
  {
    id: 'E006', sku: 'SQ-14-3-NM', barcode: '029892143084', name: 'Southwire 14/3 NM-B Romex — 100 ft',
    description: '14-gauge, 3-conductor with ground. For switch loops and 3-way switch circuits.',
    category: 'electrical', brand: 'Southwire', price: 48.98, msrp: 59.00, imageUrl: '/placeholder.png',
    specs: { 'Gauge': '14 AWG', 'Conductors': '3 + Ground', 'Length': '100 ft', 'Type': 'NM-B Romex' },
    rating: 4.4, reviewCount: 567, inStoreOnly: true,
  },
  {
    id: 'E007', sku: 'RG-LED-REC', barcode: '080083563042', name: 'Halo 6" LED Recessed Retrofit Downlight',
    description: '65W equivalent LED retrofit. 700 lumens. Fits 6-inch recessed cans. IC and non-IC rated.',
    category: 'electrical', brand: 'Halo', price: 12.98, msrp: 16.99, imageUrl: '/placeholder.png',
    specs: { 'Size': '6 inch', 'Lumens': '700', 'Watts': '9.6W (65W equiv)', 'Color Temp': '3000K Warm White' },
    rating: 4.5, reviewCount: 3876, inStoreOnly: false,
  },
  {
    id: 'E008', sku: 'SQ-BRKR-20', barcode: '078477111222', name: 'Square D 20A Single-Pole Circuit Breaker',
    description: 'QO series plug-on breaker. Thermal-magnetic trip. For Square D QO load centers.',
    category: 'electrical', brand: 'Square D', price: 7.48, msrp: 9.99, imageUrl: '/placeholder.png',
    specs: { 'Amps': '20A', 'Poles': 'Single', 'Type': 'QO Plug-On', 'Interrupt Rating': '10 kA' },
    rating: 4.7, reviewCount: 2340, inStoreOnly: false,
  },

  // === OUTDOOR (8) ===
  {
    id: 'O001', sku: 'WB-SPRT-310', barcode: '077924032905', name: 'Weber Spirit II E-310 Gas Grill',
    description: '3 burner gas grill with 529 sq in total cooking area. GS4 grilling system. iGrill 3 compatible.',
    category: 'outdoor', brand: 'Weber', price: 519.00, msrp: 599.00, imageUrl: '/placeholder.png',
    specs: { 'Burners': '3', 'BTU': '30,000', 'Cooking Area': '529 sq in', 'Fuel': 'Propane', 'Ignition': 'Infinity' },
    rating: 4.7, reviewCount: 3215, inStoreOnly: true,
  },
  {
    id: 'O002', sku: 'TR-RCY-22', barcode: '021038008226', name: 'Toro Recycler 22" Self-Propelled Mower',
    description: 'Personal Pace self-propel system automatically adjusts to your walking speed. SmartStow for easy storage.',
    category: 'outdoor', brand: 'Toro', price: 399.00, msrp: 449.00, imageUrl: '/placeholder.png',
    specs: { 'Deck': '22 inch', 'Engine': '163cc Briggs & Stratton', 'Drive': 'Self-Propelled', 'Feature': 'SmartStow' },
    rating: 4.5, reviewCount: 2876, inStoreOnly: true,
  },
  {
    id: 'O003', sku: 'FM-HSE-100', barcode: '034411000076', name: 'Flexzilla 5/8" x 100 ft Garden Hose',
    description: 'Flexible all-weather garden hose. Kink resistant. Lead-free. Lightweight.',
    category: 'outdoor', brand: 'Flexzilla', price: 59.98, msrp: 69.99, imageUrl: '/placeholder.png',
    specs: { 'Diameter': '5/8 inch', 'Length': '100 ft', 'Max PSI': '150', 'Material': 'Hybrid Polymer' },
    rating: 4.7, reviewCount: 5430, inStoreOnly: false,
  },
  {
    id: 'O004', sku: 'SC-TURF-15K', barcode: '032247502818', name: 'Scotts Turf Builder Lawn Food — 15,000 sq ft',
    description: 'Feeds and strengthens your lawn. Builds strong, deep roots. Apply any time during growing season.',
    category: 'outdoor', brand: 'Scotts', price: 54.98, msrp: 64.99, imageUrl: '/placeholder.png',
    specs: { 'Coverage': '15,000 sq ft', 'NPK': '32-0-4', 'Application': 'Broadcast Spreader', 'Season': 'Any' },
    rating: 4.4, reviewCount: 6721, inStoreOnly: false,
  },
  {
    id: 'O005', sku: 'BO-HED-TRM', barcode: '047323000126', name: 'BLACK+DECKER 20V Hedge Trimmer',
    description: '22-inch dual-action blade for reduced vibration. Pre-hardened steel blades.',
    category: 'outdoor', brand: 'BLACK+DECKER', price: 79.00, msrp: 99.00, imageUrl: '/placeholder.png',
    specs: { 'Blade': '22 inch', 'Voltage': '20V', 'Cut Capacity': '3/4 inch', 'Action': 'Dual' },
    rating: 4.3, reviewCount: 1543, inStoreOnly: false,
  },
  {
    id: 'O006', sku: 'RB-PLNTR-14', barcode: '043532120143', name: 'Bloem Ariana 14" Self-Watering Planter',
    description: 'Built-in self-watering disk provides consistent moisture. UV-protected resin.',
    category: 'outdoor', brand: 'Bloem', price: 12.98, msrp: 16.99, imageUrl: '/placeholder.png',
    specs: { 'Diameter': '14 inch', 'Material': 'Resin', 'Feature': 'Self-Watering', 'Color': 'Charcoal' },
    rating: 4.4, reviewCount: 2109, inStoreOnly: false,
  },
  {
    id: 'O007', sku: 'EG-ELEC-BLW', barcode: '045923020015', name: 'EGO POWER+ 56V Blower — 615 CFM',
    description: 'Turbine fan engineering delivers up to 615 CFM. Variable speed. Weather-resistant construction.',
    category: 'outdoor', brand: 'EGO', price: 199.00, msrp: 229.00, imageUrl: '/placeholder.png',
    specs: { 'Voltage': '56V', 'CFM': '615', 'MPH': '170', 'Run Time': 'Up to 75 min' },
    rating: 4.6, reviewCount: 3987, inStoreOnly: false,
  },
  {
    id: 'O008', sku: 'SC-WEED-5K', barcode: '032247503012', name: 'Scotts Weed & Feed — 5,000 sq ft',
    description: 'Kills existing weeds and feeds your lawn. Apply when weeds are actively growing.',
    category: 'outdoor', brand: 'Scotts', price: 24.98, msrp: 29.99, imageUrl: '/placeholder.png',
    specs: { 'Coverage': '5,000 sq ft', 'Active': '2,4-D + Mecoprop', 'Application': 'Broadcast Spreader' },
    rating: 4.2, reviewCount: 4321, inStoreOnly: false,
  },

  // === HARDWARE & SEASONAL (6) ===
  {
    id: 'H001', sku: 'KW-DBLK-SN', barcode: '042049551013', name: 'Kwikset SmartKey Deadbolt — Satin Nickel',
    description: 'SmartKey re-key technology lets you re-key the lock in seconds. ANSI/BHMA Grade 2 security.',
    category: 'hardware', brand: 'Kwikset', price: 29.98, msrp: 39.99, imageUrl: '/placeholder.png',
    specs: { 'Type': 'Deadbolt', 'Finish': 'Satin Nickel', 'Grade': 'ANSI Grade 2', 'Feature': 'SmartKey Re-Key' },
    rating: 4.5, reviewCount: 3210, inStoreOnly: false,
  },
  {
    id: 'H002', sku: 'SN-HNG-3PK', barcode: '076174008125', name: 'Stanley 3.5" Door Hinge 3-Pack — Satin Nickel',
    description: 'Residential door hinge with removable pin. 5/8" radius corners. Includes screws.',
    category: 'hardware', brand: 'Stanley', price: 9.98, msrp: 12.99, imageUrl: '/placeholder.png',
    specs: { 'Size': '3.5 inch', 'Finish': 'Satin Nickel', 'Corners': '5/8" Radius', 'Pack': '3' },
    rating: 4.6, reviewCount: 1876, inStoreOnly: false,
  },
  {
    id: 'H003', sku: 'GW-NAIL-5LB', barcode: '044315085050', name: 'Grip-Rite 16d 3-1/2" Bright Common Nails — 5 lb',
    description: 'Bright steel common nails for general construction. Full round head. Diamond point.',
    category: 'hardware', brand: 'Grip-Rite', price: 8.48, msrp: 10.99, imageUrl: '/placeholder.png',
    specs: { 'Size': '16d (3-1/2")', 'Finish': 'Bright', 'Weight': '5 lb', 'Approx Count': '200' },
    rating: 4.3, reviewCount: 654, inStoreOnly: false,
  },
  {
    id: 'H004', sku: 'WN-INSUL-R19', barcode: '032076011904', name: 'Owens Corning R-19 Kraft Faced Insulation',
    description: '6-1/4" thick fiberglass batt insulation for floors and walls. Kraft paper vapor retarder.',
    category: 'hardware', brand: 'Owens Corning', price: 47.98, msrp: 55.00, imageUrl: '/placeholder.png',
    specs: { 'R-Value': 'R-19', 'Thickness': '6-1/4"', 'Width': '15"', 'Coverage': '48.96 sq ft', 'Faced': 'Kraft' },
    rating: 4.4, reviewCount: 987, inStoreOnly: true,
  },
  {
    id: 'H005', sku: 'HO-XMAS-300', barcode: '079736200300', name: 'Holiday Living 300ct LED Mini Lights — Warm White',
    description: '300 count LED mini string lights. 8 function controller. Indoor/outdoor use. 74.5 ft total length.',
    category: 'seasonal', brand: 'Holiday Living', price: 12.98, msrp: 16.99, imageUrl: '/placeholder.png',
    specs: { 'Count': '300', 'Type': 'LED Mini', 'Color': 'Warm White', 'Length': '74.5 ft', 'Use': 'Indoor/Outdoor' },
    rating: 4.3, reviewCount: 2345, inStoreOnly: false,
  },
  {
    id: 'H006', sku: 'YR-TARP-10', barcode: '086786100008', name: 'Yard Master 10x12 ft Blue Poly Tarp',
    description: 'Waterproof polyethylene tarp with rust-resistant grommets. UV treated for extended outdoor use.',
    category: 'seasonal', brand: 'Yard Master', price: 14.98, msrp: 19.99, imageUrl: '/placeholder.png',
    specs: { 'Size': '10 x 12 ft', 'Material': 'Polyethylene', 'Mil': '5', 'Grommets': 'Every 3 ft' },
    rating: 4.1, reviewCount: 1432, inStoreOnly: false,
  },
];
