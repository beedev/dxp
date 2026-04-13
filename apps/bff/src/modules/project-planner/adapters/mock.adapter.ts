import { Injectable, Logger } from '@nestjs/common';
import {
  ProjectPlannerPort,
  ProjectTemplate,
  MaterialItem,
  CostEstimate,
} from '../ports/project-planner.port';

const mockTemplates: ProjectTemplate[] = [
  {
    id: 'PRJ001',
    name: 'Build a Deck',
    description: 'Create a beautiful 12x16 ft outdoor deck.',
    difficulty: 'intermediate',
    estimatedTime: '2-3 days',
    estimatedCost: 1200,
    imageUrl: '/placeholder.png',
    steps: ['Check codes', 'Mark layout', 'Set footings', 'Install posts', 'Attach ledger', 'Frame joists', 'Lay decking', 'Install railing'],
    materials: [
      { productId: 'T001', name: 'DeWalt Drill', quantity: 1, unitPrice: 99.00, category: 'tools' },
    ],
  },
];

@Injectable()
export class MockProjectPlannerAdapter extends ProjectPlannerPort {
  private readonly logger = new Logger(MockProjectPlannerAdapter.name);

  async listTemplates(): Promise<ProjectTemplate[]> {
    return mockTemplates;
  }

  async getTemplate(id: string): Promise<ProjectTemplate> {
    const template = mockTemplates.find((t) => t.id === id);
    if (!template) throw new Error(`Template ${id} not found`);
    return template;
  }

  async getMaterialsList(id: string): Promise<MaterialItem[]> {
    const template = await this.getTemplate(id);
    return template.materials;
  }

  async estimateCost(id: string): Promise<CostEstimate> {
    const template = await this.getTemplate(id);
    const materials = template.materials.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0);
    return { materials, labor: 0, total: materials };
  }
}
