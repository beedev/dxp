import React, { useEffect, useState } from 'react';
import { Card, CardHeader, Badge } from '@dxp/ui';
import { Sparkles } from 'lucide-react';

interface BrandPref {
  name: string;
  category?: string | null;
  confidence: number;
}
interface StylePref {
  name: string;
  confidence: number;
}

interface Preferences {
  preferred_brands?: BrandPref[];
  styles?: StylePref[];
  sizes?: Record<string, any>;
  budget_ranges?: Record<string, any>;
  exclusions?: string[];
}

interface PreferencesPanelProps {
  userId: string | null;
  /** Bump this to force a refresh after the agent may have updated prefs */
  refreshKey?: number;
}

export function PreferencesPanel({ userId, refreshKey = 0 }: PreferencesPanelProps) {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setPrefs(null);
      return;
    }
    setLoading(true);
    fetch(`http://localhost:8002/api/users/${userId}/preferences`)
      .then((r) => r.ok ? r.json() : null)
      .then((p) => setPrefs(p))
      .catch(() => setPrefs(null))
      .finally(() => setLoading(false));
  }, [userId, refreshKey]);

  const hasAny =
    prefs &&
    ((prefs.preferred_brands?.length ?? 0) > 0 ||
      (prefs.styles?.length ?? 0) > 0 ||
      (prefs.exclusions?.length ?? 0) > 0 ||
      Object.keys(prefs.sizes ?? {}).length > 0 ||
      Object.keys(prefs.budget_ranges ?? {}).length > 0);

  return (
    <Card className="flex flex-col min-h-0">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[var(--dxp-brand)]" />
          <h3 className="text-sm font-bold text-[var(--dxp-text)]">Your Preferences</h3>
        </div>
      </CardHeader>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading && (
          <p className="text-xs text-[var(--dxp-text-muted)]">Loading...</p>
        )}
        {!loading && !hasAny && (
          <p className="text-xs text-[var(--dxp-text-muted)] leading-relaxed">
            No preferences learned yet. As you shop and make choices, the agent will
            learn your preferred brands, styles, and sizes.
          </p>
        )}

        {prefs?.preferred_brands && prefs.preferred_brands.length > 0 && (
          <Section label="Preferred brands">
            {prefs.preferred_brands.map((b, i) => (
              <PrefItem key={i} label={b.name} sublabel={b.category ?? undefined} confidence={b.confidence} />
            ))}
          </Section>
        )}

        {prefs?.styles && prefs.styles.length > 0 && (
          <Section label="Styles">
            {prefs.styles.map((s, i) => (
              <PrefItem key={i} label={s.name} confidence={s.confidence} />
            ))}
          </Section>
        )}

        {prefs?.sizes && Object.keys(prefs.sizes).length > 0 && (
          <Section label="Sizes">
            {Object.entries(prefs.sizes).map(([k, v]) => (
              <PrefItem
                key={k}
                label={`${k}: ${formatValue(v)}`}
              />
            ))}
          </Section>
        )}

        {prefs?.budget_ranges && Object.keys(prefs.budget_ranges).length > 0 && (
          <Section label="Budget">
            {Object.entries(prefs.budget_ranges).map(([k, v]: [string, any]) => (
              <PrefItem
                key={k}
                label={`${k}: $${v.min ?? '?'} - $${v.max ?? '?'}`}
              />
            ))}
          </Section>
        )}

        {prefs?.exclusions && prefs.exclusions.length > 0 && (
          <Section label="Avoid">
            {prefs.exclusions.map((e, i) => (
              <div key={i}>
                <Badge variant="danger">{e}</Badge>
              </div>
            ))}
          </Section>
        )}
      </div>
    </Card>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dxp-text-muted)]">
        {label}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function PrefItem({
  label,
  sublabel,
  confidence,
}: {
  label: string;
  sublabel?: string;
  confidence?: number;
}) {
  const pct = confidence != null ? Math.round(confidence * 100) : null;
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[var(--dxp-text)] truncate">{label}</p>
        {sublabel && (
          <p className="text-[10px] text-[var(--dxp-text-muted)]">{sublabel}</p>
        )}
      </div>
      {pct != null && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-12 h-1.5 bg-[var(--dxp-border-light)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--dxp-brand)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-[var(--dxp-text-muted)] w-7 text-right">
            {pct}%
          </span>
        </div>
      )}
    </div>
  );
}

function formatValue(v: any): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    if (v.size && v.width) return `${v.size} (${v.width})`;
    return JSON.stringify(v);
  }
  return String(v);
}
