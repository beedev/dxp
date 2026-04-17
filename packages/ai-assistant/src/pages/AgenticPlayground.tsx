/**
 * Agentic Playground — combined demo page for stakeholders.
 *
 * Shows ALL agentic capabilities in a single view:
 * 1. Config Builder (generate + save configs)
 * 2. Live agent chat preview
 * 3. Readiness score
 * 4. Available configs list
 *
 * This is the "show the platform in 5 minutes" page.
 */

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Badge, Button, Tabs } from '@dxp/ui';
import { Bot, Gauge, Sparkles, Settings2, MessageSquare, List } from 'lucide-react';
import { AgenticAssistant } from '../components/AgenticAssistant';
import { AgentReadiness } from './AgentReadiness';
import { ConfigBuilder } from './ConfigBuilder';

const API_BASE = 'http://localhost:8002';

interface AgentConfigEntry {
  id: string;
  name: string;
  domain: string;
  domain_tags: string[];
}

export function AgenticPlayground() {
  const [activeTab, setActiveTab] = useState('chat');
  const [configs, setConfigs] = useState<AgentConfigEntry[]>([]);
  const [activeConfig, setActiveConfig] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/agent-configs`)
      .then((r) => r.json())
      .then((d) => setConfigs(d.configs || []))
      .catch(() => {});
    fetch(`${API_BASE}/api/agent-config`)
      .then((r) => r.json())
      .then(setActiveConfig)
      .catch(() => {});
  }, []);

  const tabs = [
    { id: 'chat', label: 'Live Chat', icon: <MessageSquare size={14} /> },
    { id: 'configs', label: 'Configs', icon: <List size={14} /> },
    { id: 'builder', label: 'Config Builder', icon: <Settings2 size={14} /> },
    { id: 'readiness', label: 'Readiness', icon: <Gauge size={14} /> },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-[var(--dxp-radius)] bg-[var(--dxp-brand)] flex items-center justify-center">
          <Bot size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--dxp-text)]">
            Agentic Commerce Playground
          </h1>
          <p className="text-sm text-[var(--dxp-text-secondary)]">
            DXP Framework — configurable AI conversation assistant for any portal
          </p>
          <div className="flex items-center gap-2 mt-2">
            {activeConfig && (
              <Badge variant="brand">{activeConfig.title || 'Loading...'}</Badge>
            )}
            <Badge variant="default">{configs.length} configs available</Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs.map((t) => ({
          key: t.id,
          label: t.label,
        }))}
        active={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />

      {/* Tab content */}
      {activeTab === 'chat' && (
        <div className="border border-[var(--dxp-border)] rounded-[var(--dxp-radius)] overflow-hidden" style={{ height: 'calc(100vh - 20rem)' }}>
          <AgenticAssistant />
        </div>
      )}

      {activeTab === 'configs' && (
        <ConfigList configs={configs} />
      )}

      {activeTab === 'builder' && (
        <ConfigBuilder />
      )}

      {activeTab === 'readiness' && (
        <AgentReadiness />
      )}
    </div>
  );
}

function ConfigList({ configs }: { configs: AgentConfigEntry[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-[var(--dxp-text)]">
        Available Agent Configurations
      </h2>
      <p className="text-sm text-[var(--dxp-text-muted)]">
        Each config defines a complete agent persona — voice, clarifiers, playbooks, and UI. Switch
        between them with a single environment variable.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {configs.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--dxp-text)]">{c.name}</h3>
                  <p className="text-xs text-[var(--dxp-text-secondary)] mt-0.5">{c.domain}</p>
                </div>
                <Bot size={20} className="text-[var(--dxp-brand)]" />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {c.domain_tags.map((tag) => (
                  <Badge key={tag} variant="default">{tag}</Badge>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--dxp-border-light)]">
                <p className="text-[10px] text-[var(--dxp-text-muted)] font-mono">
                  AGENTIC_CONFIG_ID={c.id}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {configs.length === 0 && (
        <p className="text-sm text-[var(--dxp-text-muted)] py-8 text-center">
          No configurations found. Use the Config Builder to create one.
        </p>
      )}
    </div>
  );
}
