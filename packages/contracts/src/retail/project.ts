export interface MaterialItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  category: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  estimatedCost: number;
  imageUrl: string;
  steps: string[];
  materials: MaterialItem[];
}
