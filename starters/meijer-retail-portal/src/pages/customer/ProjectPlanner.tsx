import React, { useState } from 'react';
import { Card, Badge, DataTable, ProgressTracker, Button } from '@dxp/ui';
import type { Column } from '@dxp/ui';
import { Hammer, Clock, DollarSign, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react';
import { projectTemplates } from '../../data/mock-projects';
import type { MaterialItem, ProjectTemplate } from '../../data/mock-projects';

const difficultyColor: Record<string, 'success' | 'warning' | 'danger'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
};

const materialColumns: Column<MaterialItem & { subtotal: number }>[] = [
  { key: 'name', header: 'Item', render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span> },
  { key: 'category', header: 'Category', render: (v: unknown) => <Badge variant="info">{v as string}</Badge> },
  { key: 'quantity', header: 'Qty' },
  { key: 'unitPrice', header: 'Unit Price', render: (v: unknown) => `$${(v as number).toFixed(2)}` },
  { key: 'subtotal', header: 'Subtotal', render: (v: unknown) => <span className="font-bold">${(v as number).toFixed(2)}</span> },
];

interface ProjectPlannerProps {
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
}

export function ProjectPlanner({ selectedProjectId, onSelectProject }: ProjectPlannerProps) {
  const [addedToCart, setAddedToCart] = useState<Set<string>>(new Set());
  const selectedProject = projectTemplates.find((p) => p.id === selectedProjectId) || null;

  const handleAddAllToCart = (project: ProjectTemplate) => {
    const newAdded = new Set(addedToCart);
    project.materials.forEach((m) => newAdded.add(`${project.id}-${m.productId}`));
    setAddedToCart(newAdded);
  };

  const handleAddItemToCart = (projectId: string, productId: string) => {
    setAddedToCart((prev) => new Set(prev).add(`${projectId}-${productId}`));
  };

  const materialsWithSubtotal = (project: ProjectTemplate) =>
    project.materials.map((m) => ({ ...m, subtotal: m.quantity * m.unitPrice }));

  const totalMaterialsCost = (project: ProjectTemplate) =>
    project.materials.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">DIY Project Ideas</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">
          Plan your next home improvement project. We have the tools, materials, and expertise to help.
        </p>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {projectTemplates.map((project) => (
          <Card
            key={project.id}
            className={`p-5 cursor-pointer transition-all hover:shadow-md ${
              selectedProjectId === project.id ? 'ring-2 ring-[var(--dxp-brand)] shadow-md' : ''
            }`}
            onClick={() => onSelectProject(selectedProjectId === project.id ? null : project.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-[var(--dxp-text)]">{project.name}</h3>
              <div className="flex items-center gap-1 text-[var(--dxp-text-muted)]">
                {selectedProjectId === project.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant={difficultyColor[project.difficulty]}>
                {project.difficulty.charAt(0).toUpperCase() + project.difficulty.slice(1)}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-[var(--dxp-text-muted)]">
                <Clock size={12} />
                <span>{project.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-[var(--dxp-text-muted)]">
                <DollarSign size={12} />
                <span>~${project.estimatedCost.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-sm text-[var(--dxp-text-secondary)] leading-relaxed line-clamp-2">
              {project.description}
            </p>

            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--dxp-text-muted)]">
              <Hammer size={12} />
              <span>{project.materials.length} materials &middot; {project.steps.length} steps</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Expanded Project Detail */}
      {selectedProject && (
        <div className="space-y-6">
          <div className="border-t-4 border-[var(--dxp-brand)] pt-6">
            <h2 className="text-2xl font-bold text-[var(--dxp-text)] mb-2">{selectedProject.name}</h2>
            <p className="text-sm text-[var(--dxp-text-secondary)] mb-4">{selectedProject.description}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <p className="text-xs font-semibold text-[var(--dxp-text-muted)] uppercase tracking-wide mb-1">Total Materials Cost</p>
              <p className="text-2xl font-bold text-[var(--dxp-text)]">${totalMaterialsCost(selectedProject).toFixed(2)}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs font-semibold text-[var(--dxp-text-muted)] uppercase tracking-wide mb-1">Estimated Time</p>
              <p className="text-2xl font-bold text-[var(--dxp-text)]">{selectedProject.estimatedTime}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs font-semibold text-[var(--dxp-text-muted)] uppercase tracking-wide mb-1">Difficulty</p>
              <p className="text-2xl font-bold text-[var(--dxp-text)]">
                <Badge variant={difficultyColor[selectedProject.difficulty]}>
                  {selectedProject.difficulty.charAt(0).toUpperCase() + selectedProject.difficulty.slice(1)}
                </Badge>
              </p>
            </Card>
          </div>

          {/* Steps */}
          <div>
            <h3 className="text-base font-bold text-[var(--dxp-text)] mb-3">Project Steps</h3>
            <ProgressTracker
              steps={selectedProject.steps.map((step, idx) => ({
                label: `Step ${idx + 1}`,
                description: step,
                status: 'pending' as const,
              }))}
            />
          </div>

          {/* Materials Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-[var(--dxp-text)]">Materials List</h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAddAllToCart(selectedProject)}
              >
                <ShoppingCart size={14} className="mr-1.5" />
                Add All to Cart
              </Button>
            </div>
            <DataTable
              columns={[
                ...materialColumns,
                {
                  key: 'productId' as keyof (MaterialItem & { subtotal: number }),
                  header: '',
                  render: (_v: unknown, row: MaterialItem & { subtotal: number }) => {
                    const cartKey = `${selectedProject.id}-${row.productId}`;
                    const isInCart = addedToCart.has(cartKey);
                    return (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddItemToCart(selectedProject.id, row.productId); }}
                        disabled={isInCart}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          isInCart
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : 'bg-[var(--dxp-brand)] text-white hover:opacity-90'
                        }`}
                      >
                        {isInCart ? 'Added' : 'Add to Cart'}
                      </button>
                    );
                  },
                },
              ]}
              data={materialsWithSubtotal(selectedProject)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
