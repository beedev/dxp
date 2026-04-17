/**
 * Config Builder — LLM-powered agent configuration generator.
 *
 * Manager describes a new agent persona in plain English → LLM generates
 * the full config → preview → save → new agent is live. Domain-scoped:
 * can only generate configs relevant to this portal's domain.
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter, Button, Input, Badge } from '@dxp/ui';
import { Bot, Loader2, Save, Sparkles, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';

const API_BASE = 'http://localhost:8002';
const PORTAL_DOMAIN = 'retail'; // This portal's domain scope

export function ConfigBuilder() {
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedConfig, setGeneratedConfig] = useState<Record<string, any> | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setGenerating(true);
    setError(null);
    setSaved(false);
    setGeneratedConfig(null);
    try {
      const res = await fetch(`${API_BASE}/api/agent-configs/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          portal_domain: PORTAL_DOMAIN,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setGeneratedConfig(data.config);
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedConfig) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/agent-configs/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: generatedConfig,
          portal_domain: PORTAL_DOMAIN,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Save failed' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-[var(--dxp-radius)] bg-[var(--dxp-brand)] flex items-center justify-center">
          <Sparkles size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--dxp-text)]">
            Agent Config Builder
          </h1>
          <p className="text-sm text-[var(--dxp-text-secondary)]">
            Describe your agent in plain English — the LLM generates the full configuration
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="brand">Domain: {PORTAL_DOMAIN}</Badge>
            <span className="text-xs text-[var(--dxp-text-muted)]">
              Configs will be scoped to this portal's domain
            </span>
          </div>
        </div>
      </div>

      {/* Input card */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-bold text-[var(--dxp-text)]">
            Describe Your Agent
          </h2>
          <p className="text-xs text-[var(--dxp-text-muted)] mt-1">
            What kind of assistant do you need? What products/services? What should the
            personality be? What are common customer scenarios?
          </p>
        </CardHeader>
        <CardContent>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`Example: "I need an assistant for a garden center that helps customers choose plants based on their garden conditions (sun, shade, soil type), recommends fertilizers and tools, and can plan a seasonal planting schedule. Should be warm and encouraging, especially for beginner gardeners."`}
            rows={5}
            className="w-full rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)] px-3 py-2 text-sm text-[var(--dxp-text)] placeholder:text-[var(--dxp-text-muted)] focus:ring-2 focus:ring-[var(--dxp-brand)] focus:border-[var(--dxp-brand)] outline-none resize-y"
          />
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleGenerate}
            disabled={!description.trim() || generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating config...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Agent Config
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-[var(--dxp-radius)] bg-red-50 border border-red-200">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Generated config preview */}
      {generatedConfig && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[var(--dxp-text)]">
                  Generated: {generatedConfig.name || 'Untitled'}
                </h2>
                <div className="flex gap-1.5 mt-1">
                  {(generatedConfig.domain_tags || []).map((tag: string) => (
                    <Badge key={tag} variant="default">{tag}</Badge>
                  ))}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setGeneratedConfig(null); setSaved(false); }}>
                <RefreshCcw size={14} />
                Regenerate
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Persona summary */}
            <Section title="Persona">
              <Detail label="Domain" value={generatedConfig.persona?.domain_summary} />
              <Detail label="Voice" value={generatedConfig.persona?.voice} />
              {generatedConfig.persona?.tone_rules?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[var(--dxp-text-muted)] mb-1">Tone rules</p>
                  <ul className="space-y-0.5">
                    {generatedConfig.persona.tone_rules.map((r: string, i: number) => (
                      <li key={i} className="text-xs text-[var(--dxp-text)]">• {r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>

            {/* UI config */}
            <Section title="UI">
              <Detail label="Title" value={generatedConfig.ui?.title} />
              <Detail label="Greeting" value={generatedConfig.ui?.greeting} />
              {generatedConfig.ui?.suggestions?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[var(--dxp-text-muted)] mb-1">Suggestion chips</p>
                  <div className="flex flex-wrap gap-1.5">
                    {generatedConfig.ui.suggestions.map((s: string, i: number) => (
                      <Badge key={i} variant="brand">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* Clarifiers */}
            {generatedConfig.clarifying_question_examples && (
              <Section title="Clarifying Questions">
                {Object.entries(generatedConfig.clarifying_question_examples).map(([key, val]: [string, any]) => (
                  <div key={key} className="mb-2">
                    <p className="text-xs font-semibold text-[var(--dxp-text)]">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </p>
                    <ul className="mt-0.5 space-y-0.5">
                      {(val.questions || []).map((q: string, i: number) => (
                        <li key={i} className="text-xs text-[var(--dxp-text-secondary)]">→ {q}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </Section>
            )}

            {/* Playbooks */}
            {generatedConfig.project_playbooks && (
              <Section title="Project Playbooks">
                {Object.entries(generatedConfig.project_playbooks)
                  .filter(([k, v]) => typeof v === 'object' && (v as any)?.categories_to_search)
                  .map(([key, val]: [string, any]) => (
                    <div key={key} className="mb-2">
                      <p className="text-xs font-semibold text-[var(--dxp-text)]">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </p>
                      <ul className="mt-0.5 space-y-0.5">
                        {(val.categories_to_search || []).map((c: string, i: number) => (
                          <li key={i} className="text-xs text-[var(--dxp-text-secondary)]">☐ {c}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </Section>
            )}

            {/* Raw JSON (collapsible) */}
            <details className="border border-[var(--dxp-border-light)] rounded-[var(--dxp-radius)]">
              <summary className="px-3 py-2 text-xs font-medium text-[var(--dxp-text-muted)] cursor-pointer">
                View raw JSON
              </summary>
              <pre className="px-3 py-2 text-[10px] leading-relaxed text-[var(--dxp-text-secondary)] overflow-x-auto bg-[var(--dxp-border-light)] rounded-b-[var(--dxp-radius)]">
                {JSON.stringify(generatedConfig, null, 2)}
              </pre>
            </details>
          </CardContent>
          <CardFooter>
            {saved ? (
              <div className="flex items-center gap-2 text-sm text-[var(--dxp-success)] w-full justify-center py-2">
                <CheckCircle2 size={16} />
                Config saved! ID: {generatedConfig.id}
              </div>
            ) : (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save & Activate
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[var(--dxp-border-light)] pt-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--dxp-text-muted)] mb-2">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium text-[var(--dxp-text-muted)]">{label}</p>
      <p className="text-sm text-[var(--dxp-text)]">{value}</p>
    </div>
  );
}
