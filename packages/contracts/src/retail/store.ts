export interface StoreHours { day: string; open: string; close: string; }

export interface Store {
  id: string; name: string; address: string; city: string; state: string;
  zip: string; lat: number; lng: number; phone: string;
  hours: StoreHours[]; departments: string[]; services: string[];
  manager: string; employeeCount: number; annualRevenue: number;
  customerSatScore: number;
}
