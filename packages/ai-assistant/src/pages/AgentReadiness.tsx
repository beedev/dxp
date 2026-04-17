/**
 * Agent Readiness Monitor — manager-facing dashboard.
 *
 * Reads /api/readiness and displays the overall score + dimension breakdown,
 * plus specific issues and remediation recommendations. This is the HTC
 * "Agent Readiness Monitor" (Layer 3) — the metric clients ask for when
 * evaluating their data-foundation for AI agents.
 */

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Badge } from '@dxp/ui';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Gauge,
  Network,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';

interface ReadinessReport {
  overall: number;
  dimensions: {
    data_completeness: number;
    embedding_coverage: number;
    graph_connectivity: number;
    preference_data: number;
    data_freshness: number;
  };
  stats: {
    total_products: number;
    complete_products: number;
    embedded_products: number;
    total_users: number;
    users_with_preferences: number;
    product_nodes: number;
    total_edges: number;
    avg_edges_per_product: number;
  };
  issues: string[];
  recommendations: string[];
}

export function AgentReadiness() {
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('http://localhost:8002/api/readiness')
      .then((r) => r.json())
      .then(setReport)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const scoreColor = (n: number) =>
    n >= 90
      ? 'text-[var(--dxp-success)]'
      : n >= 70
      ? 'text-amber-500'
      : 'text-[var(--dxp-danger)]';

  const scoreBg = (n: number) =>
    n >= 90
      ? 'bg-[var(--dxp-success)]'
      : n >= 70
      ? 'bg-amber-500'
      : 'bg-[var(--dxp-danger)]';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-[var(--dxp-radius)] bg-[var(--dxp-brand)] flex items-center justify-center">
            <Gauge size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--dxp-text)]">
              Agent Readiness Monitor
            </h1>
            <p className="text-sm text-[var(--dxp-text-secondary)]">
              How agent-ready is your product catalog and customer data?
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)] px-3 py-2 text-sm text-[var(--dxp-text)] hover:bg-[var(--dxp-border-light)] disabled:opacity-50"
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {!report && !loading && (
        <p className="text-sm text-[var(--dxp-text-muted)]">
          No data available. Click Refresh.
        </p>
      )}

      {report && (
        <>
          {/* Overall score */}
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6 items-center">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider text-[var(--dxp-text-muted)] mb-1">
                    Overall Score
                  </p>
                  <p className={`text-6xl font-bold ${scoreColor(report.overall)}`}>
                    {report.overall.toFixed(0)}
                  </p>
                  <p className="text-sm text-[var(--dxp-text-muted)] mt-1">/ 100</p>
                  <div className="mt-3">
                    {report.overall >= 90 ? (
                      <Badge variant="success">Production-ready</Badge>
                    ) : report.overall >= 70 ? (
                      <Badge variant="warning">Needs improvement</Badge>
                    ) : (
                      <Badge variant="danger">Not ready</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <DimensionBar
                    label="Data completeness"
                    icon={<Database size={14} />}
                    value={report.dimensions.data_completeness}
                    colorClass={scoreBg(report.dimensions.data_completeness)}
                  />
                  <DimensionBar
                    label="Embedding coverage"
                    icon={<Sparkles size={14} />}
                    value={report.dimensions.embedding_coverage}
                    colorClass={scoreBg(report.dimensions.embedding_coverage)}
                  />
                  <DimensionBar
                    label="Graph connectivity"
                    icon={<Network size={14} />}
                    value={report.dimensions.graph_connectivity}
                    colorClass={scoreBg(report.dimensions.graph_connectivity)}
                  />
                  <DimensionBar
                    label="Preference data"
                    icon={<Activity size={14} />}
                    value={report.dimensions.preference_data}
                    colorClass={scoreBg(report.dimensions.preference_data)}
                  />
                  <DimensionBar
                    label="Data freshness"
                    icon={<RefreshCcw size={14} />}
                    value={report.dimensions.data_freshness}
                    colorClass={scoreBg(report.dimensions.data_freshness)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <h2 className="text-base font-bold text-[var(--dxp-text)]">Data Summary</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <Stat label="Products" value={report.stats.total_products} />
                <Stat
                  label="Complete"
                  value={`${report.stats.complete_products}/${report.stats.total_products}`}
                />
                <Stat
                  label="Embedded"
                  value={`${report.stats.embedded_products}/${report.stats.total_products}`}
                />
                <Stat label="Graph edges" value={report.stats.total_edges} />
                <Stat
                  label="Edges/product"
                  value={report.stats.avg_edges_per_product.toFixed(2)}
                />
                <Stat label="Users" value={report.stats.total_users} />
                <Stat
                  label="With prefs"
                  value={`${report.stats.users_with_preferences}/${report.stats.total_users}`}
                />
                <Stat label="Product nodes" value={report.stats.product_nodes} />
              </div>
            </CardContent>
          </Card>

          {/* Issues + recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500" />
                  <h2 className="text-base font-bold text-[var(--dxp-text)]">
                    Issues ({report.issues.length})
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                {report.issues.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-[var(--dxp-success)]">
                    <CheckCircle2 size={14} />
                    No issues detected
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {report.issues.map((issue, i) => (
                      <li key={i} className="flex gap-2 text-sm text-[var(--dxp-text)]">
                        <span className="text-amber-500 flex-shrink-0">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[var(--dxp-brand)]" />
                  <h2 className="text-base font-bold text-[var(--dxp-text)]">
                    Recommendations ({report.recommendations.length})
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                {report.recommendations.length === 0 ? (
                  <p className="text-sm text-[var(--dxp-text-muted)]">
                    All data quality checks pass — you're ready to scale.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-2 text-sm text-[var(--dxp-text)]">
                        <span className="text-[var(--dxp-brand)] flex-shrink-0">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function DimensionBar({
  label,
  icon,
  value,
  colorClass,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-36 flex-shrink-0 text-xs text-[var(--dxp-text-secondary)]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex-1 h-2 rounded-full bg-[var(--dxp-border-light)] overflow-hidden">
        <div
          className={`h-full transition-all ${colorClass}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-[var(--dxp-text)] w-10 text-right">
        {value.toFixed(0)}%
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--dxp-text-muted)]">
        {label}
      </p>
      <p className="text-lg font-bold text-[var(--dxp-text)] tabular-nums">{value}</p>
    </div>
  );
}
