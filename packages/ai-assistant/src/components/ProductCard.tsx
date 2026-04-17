import React, { useState } from 'react';
import { Badge, Button } from '@dxp/ui';
import { CheckCircle2, Plus } from 'lucide-react';
import type { AgentEntity, EntityCardLayout, EntityAction } from '../lib/agent-types';

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
  onAction?: (entity: AgentEntity) => void;
}

export function EntityCard({ entity, cardLayout, action, onAction }: EntityCardProps) {
  const [added, setAdded] = useState(false);
  const d = entity.data;

  const handleAction = () => {
    onAction?.(entity);
    setAdded(true);
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

interface EntityGridProps {
  entities: AgentEntity[];
  cardLayout?: EntityCardLayout;
  action?: EntityAction;
  onAction?: (entity: AgentEntity) => void;
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
