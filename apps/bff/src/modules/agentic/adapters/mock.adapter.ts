// Mock adapter — canned responses for offline/dev/demo without the backend.

import { Injectable } from '@nestjs/common';
import {
  AgentConfig,
  AgentUIConfig,
  AgenticPort,
  ReadinessReport,
} from '../ports/agentic.port';

@Injectable()
export class MockAgenticAdapter extends AgenticPort {
  async listConfigs(): Promise<AgentConfig[]> {
    return [
      {
        id: 'ace-hardware',
        name: 'Ace Hardware Shopping Assistant',
        domain: 'a retail hardware / DIY store',
      },
    ];
  }

  async getUIConfig(): Promise<AgentUIConfig> {
    return {
      title: 'AI Shopping Assistant (mock)',
      greeting: 'Backend not connected — this is the mock adapter.',
      suggestions: ['Connect the real backend', 'Check AGENTIC_ADAPTER env var'],
    };
  }

  async getReadiness(): Promise<ReadinessReport> {
    return {
      overall: 0,
      dimensions: {},
      stats: { note: 'mock adapter' },
      issues: ['Mock adapter active — connect LangGraph backend for real data'],
      recommendations: ['Set AGENTIC_ADAPTER=langgraph and AGENTIC_BACKEND_URL'],
    };
  }

  async getUserPreferences(_userId: string): Promise<Record<string, unknown>> {
    return { preferred_brands: [], styles: [], sizes: {}, exclusions: [] };
  }

  getChatWebSocketUrl(sessionId: string): string {
    return `ws://localhost:0/mock-${sessionId}`;
  }
}
