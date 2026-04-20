import React, { useState } from 'react';
import { Badge, Button } from '@dxp/ui';
import { CheckCircle2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import type { AgentEntity, EntityCardLayout, EntityAction, ActionFormField } from '../lib/agent-types';

function formatValue(value: any, format?: string): string {
  if (value == null) return '';
  switch (format) {
    case 'currency':
      return `$${Number(value).toFixed(2)}`;
    case 'percent':
      return `${Number(value).toFixed(1)}%`;
    case 'rating':
      return `\u2605 ${Number(value).toFixed(1)}`;
    case 'number':
      return String(Number(value));
    default:
      return String(value);
  }
}

interface EntityCardProps {
  entity: AgentEntity;
  cardLayout?: EntityCardLayout;
  action?: EntityAction;
  onAction?: (entity: AgentEntity, formValues?: Record<string, any>) => void;
}

function shouldShowField(field: ActionFormField, values: Record<string, any>): boolean {
  if (!field.show_when) return true;
  const match = field.show_when.match(/^(\w+)\s*(!=|==)\s*(.+)$/);
  if (!match) return true;
  const [, key, op, expected] = match;
  const actual = String(values[key] ?? '');
  return op === '!=' ? actual !== expected : actual === expected;
}

export function EntityCard({ entity, cardLayout, action, onAction }: EntityCardProps) {
  const [added, setAdded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const hasForm = action?.form && action.form.length > 0;
  const d = entity.data;

  // Form state — initialize from defaults
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = {};
    action?.form?.forEach((f) => {
      if (f.default !== undefined) defaults[f.field] = f.default;
    });
    return defaults;
  });

  const updateField = (field: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleAction = () => {
    if (hasForm && !showForm) {
      setShowForm(true);
      return;
    }
    onAction?.(entity, hasForm ? { ...formValues, symbol: d.symbol || entity.external_id } : undefined);
    setAdded(true);
    setShowForm(false);
    setTimeout(() => setAdded(false), 2000);
  };

  const actionLabel = action?.label ?? 'Add to Cart';
  const addedLabel = actionLabel.replace(/^Add/, 'Added');

  if (!cardLayout) {
    const hasDiscount =
      d.original_price != null && d.original_price > d.price;
    const discountPct = hasDiscount
      ? Math.round((1 - d.price / d.original_price) * 100)
      : 0;

    return (
      <div className="rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)] p-3 hover:border-[var(--dxp-brand)] transition-colors flex flex-col">
        <div className="flex items-start gap-3 flex-1">
          <div className="h-16 w-16 flex-shrink-0 rounded-[var(--dxp-radius)] bg-[var(--dxp-border-light)] flex items-center justify-center text-xs text-[var(--dxp-text-muted)] font-semibold">
            {(d.brand ?? entity.name)?.slice(0, 3).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[var(--dxp-brand)] font-semibold uppercase tracking-wider">
              {d.brand}
            </p>
            <h4 className="text-sm font-semibold text-[var(--dxp-text)] line-clamp-2">
              {entity.name}
            </h4>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-[var(--dxp-text)]">
                ${Number(d.price).toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xs text-[var(--dxp-text-muted)] line-through">
                    ${Number(d.original_price).toFixed(2)}
                  </span>
                  <Badge variant="success">-{discountPct}%</Badge>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--dxp-text-muted)]">
              {d.rating != null && <span>{'\u2605'} {Number(d.rating).toFixed(1)}</span>}
              {d.review_count != null && (
                <>
                  <span>·</span>
                  <span>{d.review_count} reviews</span>
                </>
              )}
            </div>
          </div>
        </div>
        <Button
          onClick={handleAction}
          variant={added ? 'secondary' : 'primary'}
          size="sm"
          className="mt-3 w-full"
        >
          {added ? (
            <>
              <CheckCircle2 size={14} />
              {addedLabel}
            </>
          ) : (
            <>
              <Plus size={14} />
              {actionLabel}
            </>
          )}
        </Button>
      </div>
    );
  }

  const subtitleValue = d[cardLayout.subtitle] ?? '';
  const primaryValue = d[cardLayout.primary_metric.field];
  const badgeValue = d[cardLayout.badge];
  const thumbnailText = (subtitleValue || entity.name).slice(0, 3).toUpperCase();

  return (
    <div className="rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)] p-3 hover:border-[var(--dxp-brand)] transition-colors flex flex-col">
      <div className="flex items-start gap-3 flex-1">
        <div className="h-16 w-16 flex-shrink-0 rounded-[var(--dxp-radius)] bg-[var(--dxp-border-light)] flex items-center justify-center text-xs text-[var(--dxp-text-muted)] font-semibold">
          {thumbnailText}
        </div>
        <div className="flex-1 min-w-0">
          {subtitleValue && (
            <p className="text-[10px] text-[var(--dxp-brand)] font-semibold uppercase tracking-wider">
              {subtitleValue}
            </p>
          )}
          <h4 className="text-sm font-semibold text-[var(--dxp-text)] line-clamp-2">
            {d[cardLayout.headline] ?? entity.name}
          </h4>
          {primaryValue != null && (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-[var(--dxp-text)]">
                {formatValue(primaryValue, cardLayout.primary_metric.format)}
              </span>
              {cardLayout.primary_metric.label && (
                <span className="text-xs text-[var(--dxp-text-muted)]">
                  {cardLayout.primary_metric.label}
                </span>
              )}
            </div>
          )}
          {cardLayout.secondary_metrics.length > 0 && (
            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--dxp-text-muted)]">
              {cardLayout.secondary_metrics.map((m, i) => (
                <React.Fragment key={m.field}>
                  {i > 0 && <span>·</span>}
                  <span>
                    {m.label ? `${m.label}: ` : ''}
                    {formatValue(d[m.field], m.format)}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}
          {badgeValue && (
            <div className="mt-1">
              <Badge variant="info">{badgeValue}</Badge>
            </div>
          )}
        </div>
      </div>
      {/* Action form — renders when user clicks the action button */}
      {showForm && hasForm && (
        <div className="mt-3 space-y-2 border-t border-[var(--dxp-border-light)] pt-3">
          {action!.form!.filter((f) => shouldShowField(f, formValues)).map((f) => (
            <div key={f.field}>
              {f.type === 'toggle' && f.options ? (
                <div className="flex rounded-md overflow-hidden border border-[var(--dxp-border)]">
                  {f.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => updateField(f.field, opt)}
                      className={`flex-1 py-1.5 text-xs font-bold transition-colors ${
                        formValues[f.field] === opt
                          ? opt === 'buy' ? 'bg-emerald-600 text-white' : opt === 'sell' ? 'bg-rose-600 text-white' : 'bg-[var(--dxp-brand)] text-white'
                          : 'bg-[var(--dxp-surface)] text-[var(--dxp-text-secondary)]'
                      }`}
                    >
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              ) : f.type === 'select' && f.options ? (
                <div className="flex gap-1">
                  {f.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => updateField(f.field, opt)}
                      className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${
                        formValues[f.field] === opt
                          ? 'bg-[var(--dxp-brand)] text-white'
                          : 'bg-[var(--dxp-border-light)] text-[var(--dxp-text-muted)]'
                      }`}
                    >
                      {opt.toUpperCase()}
                    </button>
                  ))}
                </div>
              ) : f.type === 'number' ? (
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-[var(--dxp-text-muted)] w-16 shrink-0">{f.label || f.field}</label>
                  <input
                    type="number"
                    value={formValues[f.field] ?? f.default ?? ''}
                    onChange={(e) => updateField(f.field, e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 px-2 py-1 text-xs rounded border border-[var(--dxp-border)] bg-[var(--dxp-surface)] text-[var(--dxp-text)]"
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        {showForm && (
          <Button onClick={() => setShowForm(false)} variant="ghost" size="sm" className="px-2">
            <ChevronUp size={14} />
          </Button>
        )}
        <Button
          onClick={handleAction}
          variant={added ? 'secondary' : 'primary'}
          size="sm"
          className="flex-1"
        >
          {added ? (
            <>
              <CheckCircle2 size={14} />
              {addedLabel}
            </>
          ) : showForm ? (
            <>
              <CheckCircle2 size={14} />
              Confirm {actionLabel}
            </>
          ) : hasForm ? (
            <>
              <ChevronDown size={14} />
              {actionLabel}
            </>
          ) : (
            <>
              <Plus size={14} />
              {actionLabel}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface EntityGridProps {
  entities: AgentEntity[];
  cardLayout?: EntityCardLayout;
  action?: EntityAction;
  onAction?: (entity: AgentEntity, formValues?: Record<string, any>) => void;
}

export function EntityGrid({ entities, cardLayout, action, onAction }: EntityGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
      {entities.map((e) => (
        <EntityCard key={e.id} entity={e} cardLayout={cardLayout} action={action} onAction={onAction} />
      ))}
    </div>
  );
}

/** @deprecated Use EntityCard instead. Kept for backward compatibility. */
export const ProductCard = EntityCard;

/** @deprecated Use EntityGrid instead. Kept for backward compatibility. */
export function ProductGrid({
  products,
  onAddToCart,
}: {
  products: AgentEntity[];
  onAddToCart: (entity: AgentEntity) => void;
}) {
  return <EntityGrid entities={products} onAction={onAddToCart} />;
}
