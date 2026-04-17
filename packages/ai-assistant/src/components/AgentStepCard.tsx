import React from 'react';
import { Badge } from '@dxp/ui';
import { Brain, Wrench, CheckCircle2, Lightbulb, AlertCircle } from 'lucide-react';
import type { AgentStep } from '../lib/agent-types';

const STEP_ICONS: Record<string, React.ReactNode> = {
  thinking: <Brain size={12} className="text-purple-500" />,
  tool_call: <Wrench size={12} className="text-amber-600" />,
  tool_result: <CheckCircle2 size={12} className="text-[var(--dxp-success)]" />,
  decision: <Lightbulb size={12} className="text-blue-500" />,
  error: <AlertCircle size={12} className="text-[var(--dxp-danger)]" />,
};

interface AgentStepCardProps {
  step: AgentStep;
  isLatest: boolean;
}

export function AgentStepCard({ step, isLatest }: AgentStepCardProps) {
  const icon = STEP_ICONS[step.step] ?? STEP_ICONS.thinking;

  return (
    <div
      className={`rounded-[var(--dxp-radius)] border p-2.5 transition-colors ${
        isLatest
          ? 'border-[var(--dxp-brand)] bg-[var(--dxp-brand-light)]'
          : 'border-[var(--dxp-border)] bg-[var(--dxp-surface)]'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="flex items-center gap-1">{icon}</div>
        <Badge variant="brand">{step.agent}</Badge>
        {step.tool && (
          <span className="text-[10px] text-[var(--dxp-text-muted)] font-mono bg-[var(--dxp-border-light)] rounded px-1.5 py-0.5">
            {step.tool}
          </span>
        )}
        {step.duration_ms != null && (
          <span className="text-[10px] text-[var(--dxp-text-muted)] ml-auto tabular-nums">
            {step.duration_ms}ms
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--dxp-text-secondary)] leading-relaxed line-clamp-3">
        {step.content}
      </p>
    </div>
  );
}
