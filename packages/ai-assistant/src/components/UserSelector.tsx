import React from 'react';
import { Badge, Card, CardHeader, CardContent } from '@dxp/ui';
import { User as UserIcon, Bot } from 'lucide-react';
import type { DemoUser } from '../lib/agent-types';

interface UserSelectorProps {
  title: string;
  subtitle?: string;
  users: DemoUser[];
  onSelect: (userId: string) => void;
}

export function UserSelector({ title, subtitle, users, onSelect }: UserSelectorProps) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-[var(--dxp-radius)] bg-[var(--dxp-brand)] flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--dxp-text)]">{title}</h1>
            {subtitle && (
              <p className="text-sm text-[var(--dxp-text-secondary)]">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-bold text-[var(--dxp-text)]">Select a Demo User</h2>
          <p className="text-xs text-[var(--dxp-text-muted)] mt-1">
            Each user has different preferences, spend limits, and shopping history
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => onSelect(u.id)}
                className="text-left rounded-[var(--dxp-radius)] border-2 border-[var(--dxp-border)] hover:border-[var(--dxp-brand)] bg-[var(--dxp-surface)] p-4 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-[var(--dxp-brand-light)] flex items-center justify-center">
                    <UserIcon size={18} className="text-[var(--dxp-brand)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--dxp-text)]">{u.display_name}</p>
                    <p className="text-xs text-[var(--dxp-text-muted)]">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--dxp-border-light)]">
                  <span className="text-xs text-[var(--dxp-text-muted)]">Spend limit</span>
                  <Badge variant="brand">${u.spend_limit.toFixed(0)}</Badge>
                </div>
              </button>
            ))}
            {users.length === 0 && (
              <div className="col-span-3 text-center py-8 text-sm text-[var(--dxp-text-muted)]">
                Loading demo users...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
