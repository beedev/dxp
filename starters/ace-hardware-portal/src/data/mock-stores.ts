export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  phone: string;
  hours: { day: string; open: string; close: string }[];
  departments: string[];
  services: string[];
  manager: string;
  employeeCount: number;
  annualRevenue: number;
  customerSatScore: number;
}

const defaultHours = [
  { day: 'Monday', open: '7:00 AM', close: '9:00 PM' },
  { day: 'Tuesday', open: '7:00 AM', close: '9:00 PM' },
  { day: 'Wednesday', open: '7:00 AM', close: '9:00 PM' },
  { day: 'Thursday', open: '7:00 AM', close: '9:00 PM' },
  { day: 'Friday', open: '7:00 AM', close: '9:00 PM' },
  { day: 'Saturday', open: '7:00 AM', close: '8:00 PM' },
  { day: 'Sunday', open: '8:00 AM', close: '6:00 PM' },
];

export const stores: Store[] = [
  {
    id: 'S001', name: 'ACE Hardware — Naperville', address: '123 Main St', city: 'Naperville', state: 'IL', zip: '60540',
    lat: 41.7508, lng: -88.1535, phone: '(630) 555-0101', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware', 'Seasonal'],
    services: ['Key Cutting', 'Paint Mixing', 'Screen Repair', 'Pipe Threading', 'Tool Rental', 'Propane Exchange'],
    manager: 'Mike Sullivan', employeeCount: 24, annualRevenue: 3420000, customerSatScore: 92,
  },
  {
    id: 'S002', name: 'ACE Hardware — Austin Downtown', address: '456 Congress Ave', city: 'Austin', state: 'TX', zip: '78701',
    lat: 30.2672, lng: -97.7431, phone: '(512) 555-0202', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware'],
    services: ['Key Cutting', 'Paint Mixing', 'Propane Exchange', 'Blade Sharpening'],
    manager: 'Sarah Chen', employeeCount: 18, annualRevenue: 2890000, customerSatScore: 89,
  },
  {
    id: 'S003', name: 'ACE Hardware — Cherry Creek', address: '789 Cherry Creek Dr', city: 'Denver', state: 'CO', zip: '80206',
    lat: 39.7171, lng: -104.9530, phone: '(303) 555-0303', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware', 'Seasonal'],
    services: ['Key Cutting', 'Paint Mixing', 'Screen Repair', 'Tool Rental', 'Propane Exchange', 'Small Engine Repair'],
    manager: 'James Rodriguez', employeeCount: 22, annualRevenue: 3180000, customerSatScore: 94,
  },
  {
    id: 'S004', name: 'ACE Hardware — Hawthorne', address: '321 Hawthorne Blvd', city: 'Portland', state: 'OR', zip: '97214',
    lat: 45.5122, lng: -122.6587, phone: '(503) 555-0404', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware'],
    services: ['Key Cutting', 'Paint Mixing', 'Pipe Threading', 'Blade Sharpening'],
    manager: 'Emily Watson', employeeCount: 16, annualRevenue: 2450000, customerSatScore: 91,
  },
  {
    id: 'S005', name: 'ACE Hardware — Buckhead', address: '555 Peachtree Rd NE', city: 'Atlanta', state: 'GA', zip: '30305',
    lat: 33.8381, lng: -84.3804, phone: '(404) 555-0505', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware', 'Seasonal'],
    services: ['Key Cutting', 'Paint Mixing', 'Screen Repair', 'Propane Exchange', 'Tool Rental'],
    manager: 'David Thompson', employeeCount: 20, annualRevenue: 3050000, customerSatScore: 88,
  },
  {
    id: 'S006', name: 'ACE Hardware — Scottsdale', address: '890 Scottsdale Rd', city: 'Scottsdale', state: 'AZ', zip: '85251',
    lat: 33.4942, lng: -111.9261, phone: '(480) 555-0606', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware'],
    services: ['Key Cutting', 'Paint Mixing', 'Propane Exchange', 'Screen Repair'],
    manager: 'Lisa Martinez', employeeCount: 17, annualRevenue: 2780000, customerSatScore: 90,
  },
  {
    id: 'S007', name: 'ACE Hardware — Brookline', address: '147 Harvard St', city: 'Brookline', state: 'MA', zip: '02446',
    lat: 42.3426, lng: -71.1212, phone: '(617) 555-0707', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Hardware', 'Seasonal'],
    services: ['Key Cutting', 'Paint Mixing', 'Pipe Threading', 'Glass Cutting'],
    manager: 'Tom O\'Brien', employeeCount: 14, annualRevenue: 2320000, customerSatScore: 93,
  },
  {
    id: 'S008', name: 'ACE Hardware — La Jolla', address: '263 Prospect St', city: 'La Jolla', state: 'CA', zip: '92037',
    lat: 32.8473, lng: -117.2742, phone: '(858) 555-0808', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware'],
    services: ['Key Cutting', 'Paint Mixing', 'Screen Repair', 'Blade Sharpening', 'Propane Exchange'],
    manager: 'Rachel Kim', employeeCount: 19, annualRevenue: 2960000, customerSatScore: 91,
  },
  {
    id: 'S009', name: 'ACE Hardware — Bellevue', address: '410 Bellevue Way NE', city: 'Bellevue', state: 'WA', zip: '98004',
    lat: 47.6101, lng: -122.2015, phone: '(425) 555-0909', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware', 'Seasonal'],
    services: ['Key Cutting', 'Paint Mixing', 'Tool Rental', 'Propane Exchange', 'Small Engine Repair'],
    manager: 'Chris Nguyen', employeeCount: 21, annualRevenue: 3350000, customerSatScore: 95,
  },
  {
    id: 'S010', name: 'ACE Hardware — Boise', address: '580 Main St', city: 'Boise', state: 'ID', zip: '83702',
    lat: 43.6150, lng: -116.2023, phone: '(208) 555-1010', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware'],
    services: ['Key Cutting', 'Paint Mixing', 'Pipe Threading', 'Propane Exchange'],
    manager: 'Steve Harris', employeeCount: 15, annualRevenue: 2210000, customerSatScore: 87,
  },
  {
    id: 'S011', name: 'ACE Hardware — Raleigh', address: '220 Fayetteville St', city: 'Raleigh', state: 'NC', zip: '27601',
    lat: 35.7796, lng: -78.6382, phone: '(919) 555-1111', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware', 'Seasonal'],
    services: ['Key Cutting', 'Paint Mixing', 'Screen Repair', 'Tool Rental'],
    manager: 'Karen Davis', employeeCount: 19, annualRevenue: 2870000, customerSatScore: 89,
  },
  {
    id: 'S012', name: 'ACE Hardware — Omaha', address: '310 Dodge St', city: 'Omaha', state: 'NE', zip: '68102',
    lat: 41.2565, lng: -95.9345, phone: '(402) 555-1212', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware'],
    services: ['Key Cutting', 'Paint Mixing', 'Propane Exchange', 'Blade Sharpening'],
    manager: 'Bill Peterson', employeeCount: 16, annualRevenue: 2540000, customerSatScore: 86,
  },
  {
    id: 'S013', name: 'ACE Hardware — Salt Lake City', address: '175 S State St', city: 'Salt Lake City', state: 'UT', zip: '84111',
    lat: 40.7608, lng: -111.8910, phone: '(801) 555-1313', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware'],
    services: ['Key Cutting', 'Paint Mixing', 'Pipe Threading', 'Propane Exchange', 'Tool Rental'],
    manager: 'Amy Clark', employeeCount: 18, annualRevenue: 2690000, customerSatScore: 90,
  },
  {
    id: 'S014', name: 'ACE Hardware — Nashville', address: '420 Broadway', city: 'Nashville', state: 'TN', zip: '37203',
    lat: 36.1627, lng: -86.7816, phone: '(615) 555-1414', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware', 'Seasonal'],
    services: ['Key Cutting', 'Paint Mixing', 'Screen Repair', 'Propane Exchange'],
    manager: 'Robert Johnson', employeeCount: 20, annualRevenue: 3100000, customerSatScore: 88,
  },
  {
    id: 'S015', name: 'ACE Hardware — Minneapolis', address: '600 Hennepin Ave', city: 'Minneapolis', state: 'MN', zip: '55403',
    lat: 44.9778, lng: -93.2650, phone: '(612) 555-1515', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware', 'Seasonal'],
    services: ['Key Cutting', 'Paint Mixing', 'Pipe Threading', 'Tool Rental', 'Small Engine Repair'],
    manager: 'Linda Olson', employeeCount: 23, annualRevenue: 3280000, customerSatScore: 93,
  },
  {
    id: 'S016', name: 'ACE Hardware — Charleston', address: '290 King St', city: 'Charleston', state: 'SC', zip: '29401',
    lat: 32.7765, lng: -79.9311, phone: '(843) 555-1616', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware'],
    services: ['Key Cutting', 'Paint Mixing', 'Screen Repair', 'Propane Exchange'],
    manager: 'Nancy Cooper', employeeCount: 15, annualRevenue: 2380000, customerSatScore: 92,
  },
  {
    id: 'S017', name: 'ACE Hardware — Albuquerque', address: '110 Central Ave NW', city: 'Albuquerque', state: 'NM', zip: '87102',
    lat: 35.0844, lng: -106.6504, phone: '(505) 555-1717', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware'],
    services: ['Key Cutting', 'Paint Mixing', 'Propane Exchange', 'Blade Sharpening'],
    manager: 'Carlos Montoya', employeeCount: 14, annualRevenue: 2150000, customerSatScore: 85,
  },
  {
    id: 'S018', name: 'ACE Hardware — Madison', address: '345 State St', city: 'Madison', state: 'WI', zip: '53703',
    lat: 43.0731, lng: -89.4012, phone: '(608) 555-1818', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware', 'Seasonal'],
    services: ['Key Cutting', 'Paint Mixing', 'Pipe Threading', 'Tool Rental', 'Propane Exchange'],
    manager: 'Jennifer Lewis', employeeCount: 17, annualRevenue: 2610000, customerSatScore: 91,
  },
  {
    id: 'S019', name: 'ACE Hardware — Savannah', address: '215 Bull St', city: 'Savannah', state: 'GA', zip: '31401',
    lat: 32.0809, lng: -81.0912, phone: '(912) 555-1919', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware'],
    services: ['Key Cutting', 'Paint Mixing', 'Screen Repair', 'Propane Exchange'],
    manager: 'Patricia Williams', employeeCount: 13, annualRevenue: 1980000, customerSatScore: 90,
  },
  {
    id: 'S020', name: 'ACE Hardware — Boulder', address: '580 Pearl St', city: 'Boulder', state: 'CO', zip: '80302',
    lat: 40.0150, lng: -105.2705, phone: '(303) 555-2020', hours: defaultHours,
    departments: ['Paint', 'Tools', 'Plumbing', 'Electrical', 'Outdoor', 'Hardware', 'Seasonal'],
    services: ['Key Cutting', 'Paint Mixing', 'Tool Rental', 'Small Engine Repair', 'Propane Exchange'],
    manager: 'Daniel Wright', employeeCount: 19, annualRevenue: 2840000, customerSatScore: 94,
  },
];
