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

// Most Meijer locations are open 24/7 today, but for demo legibility
// (and to mimic the pattern many neighborhood stores follow) we model
// extended-hours rather than around-the-clock here.
const defaultHours = [
  { day: 'Monday', open: '6:00 AM', close: '11:00 PM' },
  { day: 'Tuesday', open: '6:00 AM', close: '11:00 PM' },
  { day: 'Wednesday', open: '6:00 AM', close: '11:00 PM' },
  { day: 'Thursday', open: '6:00 AM', close: '11:00 PM' },
  { day: 'Friday', open: '6:00 AM', close: '11:00 PM' },
  { day: 'Saturday', open: '6:00 AM', close: '11:00 PM' },
  { day: 'Sunday', open: '6:00 AM', close: '11:00 PM' },
];

const meijerDepartments = [
  'Produce', 'Dairy', 'Meat & Seafood', 'Bakery', 'Deli',
  'Pantry', 'Frozen', 'Beverages', 'Snacks', 'Household',
  'Health & Beauty', 'Pharmacy', 'Apparel', 'Home', 'Garden',
];
const meijerServices = [
  'Pharmacy', 'Bakery Custom Cake Orders', 'Deli Party Trays',
  'Photo Center', 'Gas Station', 'mPerks Member Services',
  'Curbside Pickup', 'Meijer Mealtime Pickup',
];

export const stores: Store[] = [
  {
    id: 'S001', name: 'Meijer — Grand Rapids (Knapp\'s Corner)', address: '1997 East Beltline Ave NE', city: 'Grand Rapids', state: 'MI', zip: '49525',
    lat: 42.9989, lng: -85.5897, phone: '(616) 363-3300', hours: defaultHours,
    departments: meijerDepartments,
    services: [...meijerServices, 'Garden Center', 'Tire & Auto'],
    manager: 'Mike Sullivan', employeeCount: 312, annualRevenue: 92400000, customerSatScore: 91,
  },
  {
    id: 'S002', name: 'Meijer — Lansing (West Saginaw)', address: '6200 W Saginaw Hwy', city: 'Lansing', state: 'MI', zip: '48917',
    lat: 42.7325, lng: -84.6486, phone: '(517) 323-7900', hours: defaultHours,
    departments: meijerDepartments,
    services: meijerServices,
    manager: 'Sarah Chen', employeeCount: 245, annualRevenue: 78200000, customerSatScore: 89,
  },
  {
    id: 'S003', name: 'Meijer — Royal Oak', address: '5150 Coolidge Hwy', city: 'Royal Oak', state: 'MI', zip: '48073',
    lat: 42.5304, lng: -83.1448, phone: '(248) 280-7700', hours: defaultHours,
    departments: meijerDepartments,
    services: [...meijerServices, 'Garden Center'],
    manager: 'James Rodriguez', employeeCount: 268, annualRevenue: 84500000, customerSatScore: 92,
  },
  {
    id: 'S004', name: 'Meijer — Ann Arbor (Carpenter Rd)', address: '3145 Ann Arbor-Saline Rd', city: 'Ann Arbor', state: 'MI', zip: '48103',
    lat: 42.2278, lng: -83.7681, phone: '(734) 213-2700', hours: defaultHours,
    departments: meijerDepartments,
    services: meijerServices,
    manager: 'Emily Watson', employeeCount: 232, annualRevenue: 71800000, customerSatScore: 93,
  },
  {
    id: 'S005', name: 'Meijer — Indianapolis (Northeast)', address: '5349 E 82nd St', city: 'Indianapolis', state: 'IN', zip: '46250',
    lat: 39.9089, lng: -86.0703, phone: '(317) 845-9100', hours: defaultHours,
    departments: meijerDepartments,
    services: [...meijerServices, 'Garden Center', 'Tire & Auto'],
    manager: 'David Kim', employeeCount: 295, annualRevenue: 88900000, customerSatScore: 90,
  },
  {
    id: 'S006', name: 'Meijer — Northbrook (Chicago)', address: '2800 Patriot Blvd', city: 'Glenview', state: 'IL', zip: '60026',
    lat: 42.0865, lng: -87.8378, phone: '(847) 832-3300', hours: defaultHours,
    departments: meijerDepartments,
    services: meijerServices,
    manager: 'Lisa Patel', employeeCount: 278, annualRevenue: 86300000, customerSatScore: 88,
  },
  {
    id: 'S007', name: 'Meijer — Cincinnati (West Chester)', address: '7500 Tylersville Rd', city: 'West Chester', state: 'OH', zip: '45069',
    lat: 39.3506, lng: -84.4163, phone: '(513) 870-9000', hours: defaultHours,
    departments: meijerDepartments,
    services: [...meijerServices, 'Garden Center'],
    manager: 'Mark Johnson', employeeCount: 256, annualRevenue: 79400000, customerSatScore: 90,
  },
  {
    id: 'S008', name: 'Meijer — Louisville (Hurstbourne)', address: '4600 Shelbyville Rd', city: 'Louisville', state: 'KY', zip: '40207',
    lat: 38.2456, lng: -85.6300, phone: '(502) 894-7700', hours: defaultHours,
    departments: meijerDepartments,
    services: meijerServices,
    manager: 'Rachel Brooks', employeeCount: 241, annualRevenue: 74600000, customerSatScore: 91,
  },
];
