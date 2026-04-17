/**
 * Data Pipeline Manager — upload data, trigger ingestion + enrichment, monitor status.
 */

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter, Button, Badge, Input } from '@dxp/ui';
import {
  Database, Upload, Play, RefreshCcw, CheckCircle2, Loader2, AlertCircle,
  FileJson, Network, Sparkles, Plus,
} from 'lucide-react';

const API_BASE = 'http://localhost:8002';

interface DataConfig {
  id: string;
  description: string;
  source_type: string;
  source_path: string;
  entity_name: string;
  field_map: Record<string, string>;
  required_fields: string[];
  embedding_model: string;
  graph_enabled: boolean;
}

interface PipelineRun {
  run_id: string;
  config_id?: string;
  stage: string;
  status: string;
  products?: number;
  error?: string;
  elapsed_seconds?: number;
}

export function DataPipeline() {
  const [configs, setConfigs] = useState<DataConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [ingesting, setIngesting] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [runStatus, setRunStatus] = useState<PipelineRun | null>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadConfigs = () => {
    fetch(`${API_BASE}/api/data-pipeline/configs`)
      .then((r) => r.json())
      .then((d) => {
        setConfigs(d.configs || []);
        if (!selectedConfig && d.configs?.length) setSelectedConfig(d.configs[0].id);
      })
      .catch(() => {});
  };

  const loadReadiness = () => {
    fetch(`${API_BASE}/api/readiness`)
      .then((r) => r.json())
      .then(setReadiness)
      .catch(() => {});
  };

  useEffect(() => { loadConfigs(); loadReadiness(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !selectedConfig) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('config_id', selectedConfig);
      form.append('file', files[0]);
      const res = await fetch(`${API_BASE}/api/data-pipeline/upload-source`, {
        method: 'POST', body: form,
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Upload failed');
      setUploadResult(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const pollStatus = (runId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/data-pipeline/status?run_id=${runId}`);
        const s = await res.json();
        setRunStatus(s);
        if (s.status === 'completed' || s.status === 'failed') {
          clearInterval(interval);
          setIngesting(false);
          setEnriching(false);
          loadReadiness();
        }
      } catch { clearInterval(interval); }
    }, 2000);
  };

  const handleIngest = async () => {
    if (!selectedConfig) return;
    setIngesting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('config_id', selectedConfig);
      const res = await fetch(`${API_BASE}/api/data-pipeline/ingest`, {
        method: 'POST', body: form,
      });
      const data = await res.json();
      setRunStatus({ run_id: data.run_id, stage: 'ingest', status: 'running', config_id: selectedConfig });
      pollStatus(data.run_id);
    } catch (err: any) {
      setError(err.message);
      setIngesting(false);
    }
  };

  const handleEnrich = async () => {
    setEnriching(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/data-pipeline/enrich`, { method: 'POST' });
      const data = await res.json();
      setRunStatus({ run_id: data.run_id, stage: 'enrich', status: 'running' });
      pollStatus(data.run_id);
    } catch (err: any) {
      setError(err.message);
      setEnriching(false);
    }
  };

  const activeConfig = configs.find((c) => c.id === selectedConfig);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-[var(--dxp-radius)] bg-[var(--dxp-brand)] flex items-center justify-center">
          <Database size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--dxp-text)]">Data Pipeline Manager</h1>
          <p className="text-sm text-[var(--dxp-text-secondary)]">
            Upload source data, trigger ingestion into vector DB + knowledge graph
          </p>
        </div>
      </div>

      {/* Readiness score (compact) */}
      {readiness && (
        <Card>
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Sparkles size={16} className="text-[var(--dxp-brand)]" />
              <span className="text-sm font-medium text-[var(--dxp-text)]">Agent Readiness</span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-2xl font-bold ${readiness.overall >= 90 ? 'text-[var(--dxp-success)]' : readiness.overall >= 70 ? 'text-amber-500' : 'text-[var(--dxp-danger)]'}`}>
                {readiness.overall.toFixed(0)}%
              </span>
              <div className="flex gap-3 text-xs text-[var(--dxp-text-muted)]">
                <span>{activeConfig?.entity_name ? activeConfig.entity_name.charAt(0).toUpperCase() + activeConfig.entity_name.slice(1) + 's' : 'Records'}: {readiness.stats?.total_products || 0}</span>
                <span>Embedded: {readiness.stats?.embedded_products || 0}</span>
                <span>Graph edges: {readiness.stats?.total_edges || 0}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={loadReadiness}>
                <RefreshCcw size={12} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Config selector + upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileJson size={14} className="text-[var(--dxp-brand)]" />
              <h2 className="text-base font-bold text-[var(--dxp-text)]">Data Config</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={selectedConfig}
              onChange={(e) => setSelectedConfig(e.target.value)}
              className="w-full rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)] px-3 py-2 text-sm text-[var(--dxp-text)]"
            >
              {configs.map((c) => (
                <option key={c.id} value={c.id}>{c.id} — {c.description}</option>
              ))}
            </select>
            {activeConfig && (
              <div className="text-xs text-[var(--dxp-text-muted)] space-y-1">
                <p>Source: <code>{activeConfig.source_type}</code> → <code>{activeConfig.source_path || '(no file yet)'}</code></p>
                <p>Entity: <code>{activeConfig.entity_name}</code></p>
                <p>Embeddings: <code>{activeConfig.embedding_model}</code></p>
                <p>Graph: {activeConfig.graph_enabled ? <Badge variant="success">enabled</Badge> : <Badge variant="default">disabled</Badge>}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload size={14} className="text-[var(--dxp-brand)]" />
              <h2 className="text-base font-bold text-[var(--dxp-text)]">Upload Source Data</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[var(--dxp-text-muted)]">
              Upload a JSON array of your {activeConfig?.entity_name || 'data'} items. Each item should have at minimum:{' '}
              {activeConfig?.required_fields?.join(', ') || 'name, description, category'}.
            </p>
            <label className="flex items-center justify-center gap-2 rounded-[var(--dxp-radius)] border-2 border-dashed border-[var(--dxp-border)] p-6 cursor-pointer hover:border-[var(--dxp-brand)] transition-colors">
              {uploading ? (
                <Loader2 size={16} className="animate-spin text-[var(--dxp-brand)]" />
              ) : (
                <Upload size={16} className="text-[var(--dxp-text-muted)]" />
              )}
              <span className="text-sm text-[var(--dxp-text-secondary)]">
                {uploading ? 'Uploading...' : 'Click to upload JSON or CSV'}
              </span>
              <input type="file" accept=".json,.csv" onChange={handleUpload} className="hidden" />
            </label>
            {uploadResult && (
              <div className="flex items-center gap-2 text-xs text-[var(--dxp-success)]">
                <CheckCircle2 size={14} />
                Uploaded {uploadResult.filename} ({uploadResult.records} records, {uploadResult.size_kb}KB)
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-[var(--dxp-radius)] bg-red-50 border border-red-200">
          <AlertCircle size={16} className="text-red-500 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Pipeline actions */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-bold text-[var(--dxp-text)]">Pipeline Actions</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ingest */}
            <div className="rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-[var(--dxp-brand)]" />
                <h3 className="text-sm font-bold text-[var(--dxp-text)]">Step 1: Ingest</h3>
              </div>
              <p className="text-xs text-[var(--dxp-text-muted)]">
                Reads source data → generates embeddings → writes to pgvector + builds base graph nodes/edges
              </p>
              <Button onClick={handleIngest} disabled={ingesting || !selectedConfig} className="w-full">
                {ingesting ? (
                  <><Loader2 size={14} className="animate-spin" /> Ingesting...</>
                ) : (
                  <><Play size={14} /> Run Ingestion</>
                )}
              </Button>
            </div>

            {/* Enrich */}
            <div className="rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Network size={16} className="text-[var(--dxp-brand)]" />
                <h3 className="text-sm font-bold text-[var(--dxp-text)]">Step 2: Enrich Graph</h3>
              </div>
              <p className="text-xs text-[var(--dxp-text-muted)]">
                LLM-infers HAS_FEATURE edges from descriptions + computes FREQUENTLY_BOUGHT_WITH cross-category links
              </p>
              <Button onClick={handleEnrich} disabled={enriching} variant="secondary" className="w-full">
                {enriching ? (
                  <><Loader2 size={14} className="animate-spin" /> Enriching...</>
                ) : (
                  <><Network size={14} /> Enrich Graph</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>

        {/* Status */}
        {runStatus && (
          <CardFooter>
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                {runStatus.status === 'running' && <Loader2 size={14} className="animate-spin text-[var(--dxp-brand)]" />}
                {runStatus.status === 'completed' && <CheckCircle2 size={14} className="text-[var(--dxp-success)]" />}
                {runStatus.status === 'failed' && <AlertCircle size={14} className="text-[var(--dxp-danger)]" />}
                <span className="text-sm text-[var(--dxp-text)]">
                  {runStatus.stage}: {runStatus.status}
                  {runStatus.elapsed_seconds != null && ` (${runStatus.elapsed_seconds}s)`}
                </span>
              </div>
              {runStatus.products != null && runStatus.products > 0 && (
                <Badge variant="success">{runStatus.products} products</Badge>
              )}
              {runStatus.error && (
                <span className="text-xs text-[var(--dxp-danger)] max-w-[300px] truncate">{runStatus.error}</span>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
