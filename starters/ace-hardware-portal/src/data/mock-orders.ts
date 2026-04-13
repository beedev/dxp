export type OrderStatus = 'processing' | 'ready-for-pickup' | 'shipped' | 'delivered' | 'returned' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  deliveryMethod: 'pickup' | 'delivery';
  storeId?: string;
  trackingNumber?: string;
}

export const orders: Order[] = [
  // 3 processing
  {
    id: 'ORD-4825', date: '2026-04-09', status: 'processing',
    items: [
      { productId: 'T001', name: 'DeWalt 20V MAX Cordless Drill/Driver Kit', quantity: 1, price: 99.00 },
      { productId: 'T003', name: 'Stanley FatMax 25 ft Tape Measure', quantity: 2, price: 24.98 },
    ],
    subtotal: 148.96, tax: 11.17, total: 160.13,
    deliveryMethod: 'delivery',
  },
  {
    id: 'ORD-4823', date: '2026-04-08', status: 'processing',
    items: [
      { productId: 'P002', name: 'Benjamin Moore Regal Select Interior — White', quantity: 2, price: 62.99 },
      { productId: 'P003', name: 'KILZ Original Multi-Surface Primer', quantity: 1, price: 21.98 },
    ],
    subtotal: 147.96, tax: 11.10, total: 159.06,
    deliveryMethod: 'pickup', storeId: 'S001',
  },
  {
    id: 'ORD-4820', date: '2026-04-07', status: 'processing',
    items: [
      { productId: 'E003', name: 'Ring Video Doorbell 4', quantity: 1, price: 199.99 },
    ],
    subtotal: 199.99, tax: 15.00, total: 214.99,
    deliveryMethod: 'delivery',
  },

  // 2 ready-for-pickup
  {
    id: 'ORD-4812', date: '2026-04-07', status: 'ready-for-pickup',
    items: [
      { productId: 'T001', name: 'DeWalt 20V MAX Cordless Drill/Driver Kit', quantity: 1, price: 99.00 },
      { productId: 'T003', name: 'Stanley FatMax 25 ft Tape Measure', quantity: 1, price: 24.98 },
    ],
    subtotal: 123.98, tax: 9.30, total: 133.28,
    deliveryMethod: 'pickup', storeId: 'S001',
  },
  {
    id: 'ORD-4808', date: '2026-04-05', status: 'ready-for-pickup',
    items: [
      { productId: 'PL003', name: 'Moen Magnetix Showerhead', quantity: 1, price: 54.98 },
      { productId: 'PL004', name: 'SharkBite 1/2" Push-to-Connect Fitting Kit', quantity: 2, price: 13.99 },
    ],
    subtotal: 82.96, tax: 6.22, total: 89.18,
    deliveryMethod: 'pickup', storeId: 'S001',
  },

  // 3 shipped
  {
    id: 'ORD-4798', date: '2026-04-03', status: 'shipped',
    items: [
      { productId: 'P002', name: 'Benjamin Moore Regal Select Interior — White', quantity: 2, price: 62.99 },
      { productId: 'P003', name: 'KILZ Original Multi-Surface Primer', quantity: 1, price: 21.98 },
    ],
    subtotal: 147.96, tax: 11.10, total: 159.06,
    deliveryMethod: 'delivery', trackingNumber: '1Z999AA10123456784',
  },
  {
    id: 'ORD-4790', date: '2026-03-31', status: 'shipped',
    items: [
      { productId: 'O004', name: 'Weber Spirit II E-310 Gas Grill', quantity: 1, price: 449.00 },
    ],
    subtotal: 449.00, tax: 33.68, total: 482.68,
    deliveryMethod: 'delivery', trackingNumber: '1Z999AA10123456785',
  },
  {
    id: 'ORD-4785', date: '2026-03-28', status: 'shipped',
    items: [
      { productId: 'T002', name: 'Craftsman 170-Piece Mechanics Tool Set', quantity: 1, price: 149.00 },
      { productId: 'T008', name: 'Klein Tools 8" Long Nose Pliers', quantity: 1, price: 21.98 },
    ],
    subtotal: 170.98, tax: 12.82, total: 183.80,
    deliveryMethod: 'delivery', trackingNumber: '1Z999AA10123456786',
  },

  // 5 delivered
  {
    id: 'ORD-4770', date: '2026-03-22', status: 'delivered',
    items: [
      { productId: 'O001', name: 'Scotts Turf Builder Lawn Food, 15,000 sq ft', quantity: 1, price: 54.98 },
      { productId: 'O003', name: 'Fiskars Pro Lopper, 28 inch', quantity: 1, price: 27.98 },
    ],
    subtotal: 82.96, tax: 6.22, total: 89.18,
    deliveryMethod: 'pickup', storeId: 'S001',
  },
  {
    id: 'ORD-4755', date: '2026-03-18', status: 'delivered',
    items: [
      { productId: 'PL001', name: 'Moen Arbor One-Handle Kitchen Faucet', quantity: 1, price: 309.00 },
    ],
    subtotal: 309.00, tax: 23.18, total: 332.18,
    deliveryMethod: 'delivery',
  },
  {
    id: 'ORD-4740', date: '2026-03-12', status: 'delivered',
    items: [
      { productId: 'E001', name: 'Leviton Decora Smart Wi-Fi Switch', quantity: 3, price: 29.98 },
      { productId: 'E002', name: 'Lutron Caseta Dimmer Starter Kit', quantity: 1, price: 99.95 },
    ],
    subtotal: 189.89, tax: 14.24, total: 204.13,
    deliveryMethod: 'delivery',
  },
  {
    id: 'ORD-4728', date: '2026-03-05', status: 'delivered',
    items: [
      { productId: 'H001', name: 'Kwikset SmartKey Deadbolt — Satin Nickel', quantity: 2, price: 29.98 },
    ],
    subtotal: 59.96, tax: 4.50, total: 64.46,
    deliveryMethod: 'pickup', storeId: 'S001',
  },
  {
    id: 'ORD-4710', date: '2026-02-25', status: 'delivered',
    items: [
      { productId: 'P001', name: 'Rust-Oleum 2X Ultra Cover Gloss Black', quantity: 4, price: 5.98 },
      { productId: 'P005', name: 'Rust-Oleum Chalked Paint — Linen White', quantity: 1, price: 17.98 },
    ],
    subtotal: 41.90, tax: 3.14, total: 45.04,
    deliveryMethod: 'pickup', storeId: 'S001',
  },

  // 1 returned
  {
    id: 'ORD-4695', date: '2026-02-18', status: 'returned',
    items: [
      { productId: 'T004', name: 'DeWalt 7-1/4" Lightweight Circular Saw', quantity: 1, price: 109.00 },
    ],
    subtotal: 109.00, tax: 8.18, total: 117.18,
    deliveryMethod: 'delivery',
  },

  // 1 cancelled
  {
    id: 'ORD-4680', date: '2026-02-10', status: 'cancelled',
    items: [
      { productId: 'O004', name: 'Weber Spirit II E-310 Gas Grill', quantity: 1, price: 449.00 },
      { productId: 'O005', name: 'Kingsford Original Charcoal, 16 lb (2-pack)', quantity: 1, price: 19.98 },
    ],
    subtotal: 468.98, tax: 35.17, total: 504.15,
    deliveryMethod: 'delivery',
  },
];
