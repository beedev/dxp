export type RetailServiceCategory = 'cutting' | 'mixing' | 'repair' | 'rental' | 'exchange' | 'installation';

export interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  category: RetailServiceCategory;
  price: number | null;
  duration: string;
  requiresAppointment: boolean;
}
