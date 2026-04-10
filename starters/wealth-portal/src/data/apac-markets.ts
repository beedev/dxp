export interface ApacIndex {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  flag: string;
  tz: string;
  open: string;
  close: string;
  value: number;
  change: number;
  changePercent: number;
}

export const APAC_INDICES: ApacIndex[] = [
  { symbol: '^HSI', name: 'Hang Seng Index', exchange: 'HKEX', country: 'Hong Kong', flag: '🇭🇰', tz: 'Asia/Hong_Kong', open: '01:30', close: '08:00', value: 19842.23, change: -67.45, changePercent: -0.34 },
  { symbol: '^N225', name: 'Nikkei 225', exchange: 'TSE', country: 'Japan', flag: '🇯🇵', tz: 'Asia/Tokyo', open: '00:00', close: '06:00', value: 35210.45, change: 304.56, changePercent: 0.87 },
  { symbol: '^AXJO', name: 'ASX 200', exchange: 'ASX', country: 'Australia', flag: '🇦🇺', tz: 'Australia/Sydney', open: '23:00', close: '05:00', value: 7834.56, change: 18.23, changePercent: 0.23 },
  { symbol: '^STI', name: 'Straits Times Index', exchange: 'SGX', country: 'Singapore', flag: '🇸🇬', tz: 'Asia/Singapore', open: '01:00', close: '09:00', value: 3421.78, change: -4.12, changePercent: -0.12 },
  { symbol: '^KS11', name: 'KOSPI', exchange: 'KRX', country: 'South Korea', flag: '🇰🇷', tz: 'Asia/Seoul', open: '00:00', close: '06:30', value: 2678.34, change: 29.87, changePercent: 1.12 },
  { symbol: '^BSESN', name: 'BSE Sensex', exchange: 'BSE', country: 'India', flag: '🇮🇳', tz: 'Asia/Kolkata', open: '03:45', close: '10:00', value: 72453.22, change: -327.45, changePercent: -0.45 },
  { symbol: '^NSEI', name: 'Nifty 50', exchange: 'NSE', country: 'India', flag: '🇮🇳', tz: 'Asia/Kolkata', open: '03:45', close: '10:00', value: 21934.56, change: -83.45, changePercent: -0.38 },
  { symbol: '^NSEBANK', name: 'Nifty Bank', exchange: 'NSE', country: 'India', flag: '🇮🇳', tz: 'Asia/Kolkata', open: '03:45', close: '10:00', value: 46821.40, change: 156.75, changePercent: 0.34 },
  { symbol: '^CNXMIDCAP', name: 'Nifty Midcap 100', exchange: 'NSE', country: 'India', flag: '🇮🇳', tz: 'Asia/Kolkata', open: '03:45', close: '10:00', value: 48127.85, change: -123.90, changePercent: -0.26 },
  { symbol: '^KLSE', name: 'FTSE Bursa KLCI', exchange: 'Bursa', country: 'Malaysia', flag: '🇲🇾', tz: 'Asia/Kuala_Lumpur', open: '01:00', close: '09:00', value: 1567.89, change: 5.34, changePercent: 0.34 },
  { symbol: '^SET.BK', name: 'SET Index', exchange: 'SET', country: 'Thailand', flag: '🇹🇭', tz: 'Asia/Bangkok', open: '02:30', close: '09:30', value: 1389.23, change: -9.32, changePercent: -0.67 },
  { symbol: '^JKSE', name: 'Jakarta Composite', exchange: 'IDX', country: 'Indonesia', flag: '🇮🇩', tz: 'Asia/Jakarta', open: '01:30', close: '09:00', value: 7234.56, change: 64.12, changePercent: 0.89 },
  { symbol: '^TWII', name: 'Taiwan Weighted', exchange: 'TWSE', country: 'Taiwan', flag: '🇹🇼', tz: 'Asia/Taipei', open: '01:00', close: '05:30', value: 19876.34, change: 287.45, changePercent: 1.45 },
  { symbol: '000001.SS', name: 'Shanghai Composite', exchange: 'SSE', country: 'China', flag: '🇨🇳', tz: 'Asia/Shanghai', open: '01:30', close: '07:00', value: 3178.45, change: -7.34, changePercent: -0.23 },
];

export function isMarketOpen(openUTC: string, closeUTC: string): boolean {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMin = now.getUTCMinutes();
  const nowMins = utcHour * 60 + utcMin;
  const [oh, om] = openUTC.split(':').map(Number);
  const [ch, cm] = closeUTC.split(':').map(Number);
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;
  if (openMins < closeMins) return nowMins >= openMins && nowMins < closeMins;
  return nowMins >= openMins || nowMins < closeMins; // crosses midnight
}
