// Generate 30 days of daily sales data
function generateDailySales() {
  const data: { date: string; storeId: string; revenue: number; transactions: number; avgTicket: number }[] = [];
  const today = new Date();

  for (let d = 29; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const iso = date.toISOString().split('T')[0];
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    // Generate for store S001 (Naperville) as the "current" store
    const baseRevenue = isWeekend ? 16000 : 12000;
    const variance = (Math.random() - 0.5) * 4000;
    const revenue = Math.round(baseRevenue + variance);
    const avgTicket = Math.round(140 + (Math.random() - 0.5) * 50);
    const transactions = Math.round(revenue / avgTicket);

    data.push({ date: iso, storeId: 'S001', revenue, transactions, avgTicket });
  }
  return data;
}

// Hourly sales for today (8am to 8pm realistic curve)
function generateHourlySales() {
  // Realistic hourly pattern: morning ramp, lunch peak, afternoon dip, after-work peak, evening decline
  const hourlyPattern: Record<number, number> = {
    7: 320, 8: 680, 9: 1120, 10: 1450, 11: 1680,
    12: 1890, 13: 1620, 14: 1380, 15: 1290, 16: 1540,
    17: 1870, 18: 1420, 19: 890, 20: 420,
  };

  return Object.entries(hourlyPattern).map(([hour, revenue]) => {
    const variance = (Math.random() - 0.5) * 200;
    const rev = Math.round(revenue + variance);
    const avgTicket = Math.round(140 + (Math.random() - 0.5) * 40);
    return {
      hour: parseInt(hour),
      hourLabel: `${parseInt(hour) > 12 ? parseInt(hour) - 12 : parseInt(hour)}${parseInt(hour) >= 12 ? 'pm' : 'am'}`,
      revenue: rev,
      transactions: Math.round(rev / avgTicket),
    };
  });
}

export const dailySales = generateDailySales();
export const hourlySales = generateHourlySales();

export const categoryBreakdown = [
  { category: 'Paint & Stains', revenue: 3280, units: 42, pctOfTotal: 22.9 },
  { category: 'Power Tools', revenue: 2890, units: 18, pctOfTotal: 20.2 },
  { category: 'Plumbing', revenue: 1940, units: 35, pctOfTotal: 13.5 },
  { category: 'Electrical', revenue: 1670, units: 48, pctOfTotal: 11.7 },
  { category: 'Outdoor & Garden', revenue: 1850, units: 24, pctOfTotal: 12.9 },
  { category: 'Hardware & Fasteners', revenue: 1120, units: 67, pctOfTotal: 7.8 },
  { category: 'Seasonal', revenue: 890, units: 31, pctOfTotal: 6.2 },
  { category: 'Other', revenue: 688, units: 22, pctOfTotal: 4.8 },
];

export const topSellers = [
  { productId: 'T001', name: 'DeWalt 20V MAX Drill/Driver Kit', category: 'Tools', unitsSold: 8, revenue: 792 },
  { productId: 'P002', name: 'Benjamin Moore Regal Select', category: 'Paint', unitsSold: 6, revenue: 378 },
  { productId: 'E003', name: 'Philips LED 60W 4-Pack', category: 'Electrical', unitsSold: 14, revenue: 112 },
  { productId: 'PL001', name: 'Moen Arbor Pull-Down Faucet', category: 'Plumbing', unitsSold: 2, revenue: 618 },
  { productId: 'O003', name: 'Flexzilla 100ft Garden Hose', category: 'Outdoor', unitsSold: 5, revenue: 300 },
  { productId: 'T002', name: 'Craftsman 170-Piece Tool Set', category: 'Tools', unitsSold: 3, revenue: 447 },
  { productId: 'P003', name: 'KILZ Original Primer', category: 'Paint', unitsSold: 7, revenue: 154 },
  { productId: 'H001', name: 'Kwikset SmartKey Deadbolt', category: 'Hardware', unitsSold: 6, revenue: 180 },
];

// Monthly revenue trend for 12 months
export const monthlyRevenue = [
  { month: 'May', revenue: 268000 },
  { month: 'Jun', revenue: 312000 },
  { month: 'Jul', revenue: 335000 },
  { month: 'Aug', revenue: 321000 },
  { month: 'Sep', revenue: 289000 },
  { month: 'Oct', revenue: 298000 },
  { month: 'Nov', revenue: 276000 },
  { month: 'Dec', revenue: 310000 },
  { month: 'Jan', revenue: 245000 },
  { month: 'Feb', revenue: 258000 },
  { month: 'Mar', revenue: 302000 },
  { month: 'Apr', revenue: 328000 },
];
