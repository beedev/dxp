// LangGraph adapter — proxies REST calls to our FastAPI + LangGraph backend.

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AgentConfig,
  AgentUIConfig,
  AgenticPort,
  ReadinessReport,
} from '../ports/agentic.port';

@Injectable()
export class LangGraphAdapter extends AgenticPort {
  constructor(private readonly config: ConfigService) {
    super();
  }

  private get baseUrl(): string {
    return this.config.get<string>('AGENTIC_BACKEND_URL') ?? 'http://localhost:8002';
  }

  private get wsUrl(): string {
    return (
      this.config.get<string>('AGENTIC_BACKEND_WS_URL') ??
      this.baseUrl.replace(/^http/, 'ws')
    );
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) {
      throw new Error(`Agentic backend ${path} failed: ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  private async postJson<T>(path: string, body: any): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Agentic backend POST ${path} failed: ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  async listConfigs(): Promise<AgentConfig[]> {
    const data = await this.fetchJson<{ configs: AgentConfig[] }>('/api/agent-configs');
    return data.configs ?? [];
  }

  async getUIConfig(): Promise<AgentUIConfig> {
    return this.fetchJson<AgentUIConfig>('/api/agent-config');
  }

  async getReadiness(): Promise<ReadinessReport> {
    return this.fetchJson<ReadinessReport>('/api/readiness');
  }

  async getUserPreferences(userId: string): Promise<Record<string, unknown>> {
    return this.fetchJson(`/api/users/${userId}/preferences`);
  }

  getChatWebSocketUrl(sessionId: string): string {
    return `${this.wsUrl}/ws/chat/${sessionId}`;
  }

  async listUsers(): Promise<any[]> {
    return this.fetchJson<any[]>('/api/users');
  }

  async demoLogin(userId: string): Promise<any> {
    return this.postJson('/api/auth/demo-login', { user_id: userId });
  }

  async createSession(userId: string): Promise<any> {
    return this.postJson('/api/sessions', { user_id: userId });
  }

  async getSessionHistory(sessionId: string): Promise<any> {
    return this.fetchJson(`/api/sessions/${sessionId}/agent-history`);
  }
}
