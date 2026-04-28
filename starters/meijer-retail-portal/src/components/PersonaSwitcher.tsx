import React from 'react';
import { ShoppingCart, Store, Building2 } from 'lucide-react';

export type Persona = 'customer' | 'manager' | 'coop';

interface PersonaSwitcherProps {
  current: Persona;
  onChange: (persona: Persona) => void;
}

const personas: { key: Persona; label: string; icon: React.ReactNode }[] = [
  { key: 'customer', label: 'Customer', icon: <ShoppingCart size={14} /> },
  { key: 'manager', label: 'Manager', icon: <Store size={14} /> },
  { key: 'coop', label: 'Corporate', icon: <Building2 size={14} /> },
];

export function PersonaSwitcher({ current, onChange }: PersonaSwitcherProps) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-2">Portal View</p>
      <div className="flex flex-col gap-1">
        {personas.map((p) => (
          <button
            key={p.key}
            onClick={() => onChange(p.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors text-left ${
              current === p.key
                ? 'bg-[var(--dxp-brand)] text-white'
                : 'text-[var(--dxp-text-secondary)] hover:text-[var(--dxp-text)] hover:bg-[var(--dxp-border-light)]'
            }`}
          >
            {p.icon}
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
