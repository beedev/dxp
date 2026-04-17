// Agentic Port — the contract that all agentic-backend adapters must implement.
//
// An "agentic backend" is any service that runs an LLM-based assistant with
// tool orchestration (LangGraph, Vertex AI Agents, Bedrock, etc.). The port
// abstracts the backend so portals route through a consistent API.

export interface AgentConfig {
  id: string;
  name: string;
  domain: string;
}

export interface AgentUIConfig {
  title: string;
  subtitle?: string;
  greeting: string;
  greeting_subtitle?: string;
  suggestions: string[];
}

export interface ReadinessReport {
  overall: number;
  dimensions: Record<string, number>;
  stats: Record<string, unknown>;
  issues: string[];
  recommendations: string[];
}

export abstract class AgenticPort {
  /** List all available deployment configurations. */
  abstract listConfigs(): Promise<AgentConfig[]>;

  /** Get UI config (title, suggestions, greeting) for the active deployment. */
  abstract getUIConfig(): Promise<AgentUIConfig>;

  /** Return the agent-readiness score for the active deployment. */
  abstract getReadiness(): Promise<ReadinessReport>;

  /** Return a user's current preferences. */
  abstract getUserPreferences(userId: string): Promise<Record<string, unknown>>;

  /**
   * WebSocket URL for the portal to connect to for real-time chat.
   * Proxying WebSockets through NestJS is non-trivial; for this POC the
   * adapter just returns a URL and the portal connects directly.
   */
  abstract getChatWebSocketUrl(sessionId: string): string;
}
