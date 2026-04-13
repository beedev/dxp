// Project Planner Port — the contract that all project planner adapters must implement.

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

export interface CostEstimate {
  materials: number;
  labor: number;
  total: number;
}

export abstract class ProjectPlannerPort {
  abstract listTemplates(): Promise<ProjectTemplate[]>;
  abstract getTemplate(id: string): Promise<ProjectTemplate>;
  abstract getMaterialsList(id: string): Promise<MaterialItem[]>;
  abstract estimateCost(id: string): Promise<CostEstimate>;
}
