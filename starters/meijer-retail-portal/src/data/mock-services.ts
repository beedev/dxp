export type ServiceCategory = 'cutting' | 'mixing' | 'repair' | 'rental' | 'exchange' | 'installation';

export interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  price: number | null;
  priceLabel: string;
  duration: string;
  requiresAppointment: boolean;
}

export const services: ServiceOffering[] = [
  {
    id: 'SVC01',
    name: 'Key Cutting',
    description: 'Duplicate standard house, car (non-chip), and padlock keys while you wait. We carry a wide selection of decorative and specialty key blanks.',
    category: 'cutting',
    price: 2.99,
    priceLabel: '$2.99/key',
    duration: '5 min',
    requiresAppointment: false,
  },
  {
    id: 'SVC02',
    name: 'Paint Color Matching',
    description: 'Bring in any sample — a paint chip, fabric swatch, or even a photo — and our computerized spectrophotometer will match it to the nearest paint color in any brand we carry.',
    category: 'mixing',
    price: null,
    priceLabel: 'Free',
    duration: '15 min',
    requiresAppointment: false,
  },
  {
    id: 'SVC03',
    name: 'Paint Mixing',
    description: 'Custom paint tinting for any gallon or quart purchased in-store. Choose from thousands of colors across Benjamin Moore, Valspar, Clark+Kensington, and Rust-Oleum lines.',
    category: 'mixing',
    price: null,
    priceLabel: 'Free with purchase',
    duration: '10 min',
    requiresAppointment: false,
  },
  {
    id: 'SVC04',
    name: 'Screen Repair',
    description: 'Window and door screen re-screening service. We replace damaged mesh in your existing frame with fiberglass or aluminum screen material. Bring your frame in — we\'ll have it ready same day.',
    category: 'repair',
    price: 15,
    priceLabel: '$15-$25',
    duration: '30 min',
    requiresAppointment: false,
  },
  {
    id: 'SVC05',
    name: 'Pipe Threading',
    description: 'Custom pipe threading for black iron and galvanized steel pipe. We cut to length and thread both ends. Perfect for gas lines, plumbing, and industrial applications.',
    category: 'cutting',
    price: 3,
    priceLabel: '$3/cut',
    duration: '10 min',
    requiresAppointment: false,
  },
  {
    id: 'SVC06',
    name: 'Propane Tank Exchange',
    description: 'Swap your empty 20 lb propane tank for a full one. No waiting for refills. Tanks are pre-purged, filled, and safety-inspected. Available at the front of the store.',
    category: 'exchange',
    price: 21.99,
    priceLabel: '$21.99',
    duration: '5 min',
    requiresAppointment: false,
  },
  {
    id: 'SVC07',
    name: 'Tool Rental',
    description: 'Rent professional-grade tools by the day or week. Tile saws, pressure washers, carpet cleaners, floor sanders, trenchers, and more. Valid ID and credit card required.',
    category: 'rental',
    price: null,
    priceLabel: 'Varies by tool',
    duration: 'By day/week',
    requiresAppointment: false,
  },
  {
    id: 'SVC08',
    name: 'Small Engine Repair',
    description: 'Full-service repair for lawn mowers, snow blowers, chainsaws, leaf blowers, and other small engines. Tune-ups, carburetor rebuilds, blade sharpening, and winterization available.',
    category: 'repair',
    price: 50,
    priceLabel: '$50+',
    duration: '3-5 days',
    requiresAppointment: true,
  },
];
