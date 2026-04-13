export type ProductCategory = 'paint' | 'tools' | 'plumbing' | 'electrical' | 'outdoor' | 'hardware' | 'seasonal';

export interface Product {
  id: string; sku: string; barcode: string; name: string; description: string;
  category: ProductCategory; brand: string; price: number; msrp: number;
  imageUrl: string; specs: Record<string, string>; rating: number;
  reviewCount: number; inStoreOnly: boolean;
}

export interface ProductReview {
  id: string; productId: string; author: string; rating: number;
  title: string; body: string; date: string; helpful: number;
}
