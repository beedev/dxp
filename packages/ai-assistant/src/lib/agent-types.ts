/**
 * Shared types for the agentic assistant frontend.
 *
 * These mirror the WebSocket message contract. Keep in sync with the
 * backend's `chat.py` event protocol.
 */

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  /** Entities returned by the agent as part of this specific turn. */
  products?: AgentEntity[];
}

export type AgentStepType =
  | 'thinking'
  | 'tool_call'
  | 'tool_result'
  | 'decision'
  | 'error';

export interface AgentStep {
  id: string;
  agent: string;
  step: AgentStepType;
  tool?: string;
  content: string;
  duration_ms?: number;
  timestamp: string;
}

export interface AgentEntity {
  id: string;
  entity_type: string;
  external_id: string;
  name: string;
  description: string;
  data: Record<string, any>;
  image_url?: string;
}

/** @deprecated Use AgentEntity instead. Kept for backward compatibility. */
export type AgentProduct = AgentEntity;

export interface EntityCardLayout {
  headline: string;
  subtitle: string;
  primary_metric: { field: string; format: 'currency' | 'percent' | 'rating' | 'number'; label?: string };
  secondary_metrics: Array<{ field: string; format?: string; label?: string }>;
  badge: string;
}

export interface ActionFormField {
  field: string;
  type: 'number' | 'select' | 'toggle' | 'text';
  label?: string;
  options?: string[];
  default?: any;
  show_when?: string;  // e.g., "type != market"
}

/**
 * Icon name accepted by EntityAction.icon. Maps to a lucide-react icon in the
 * card renderer. Add new mappings in ProductCard.tsx::ActionIcon.
 */
export type EntityActionIcon =
  | 'plus'
  | 'arrow-right'
  | 'external-link'
  | 'eye'
  | 'check'
  | 'send';

export interface EntityAction {
  label: string;
  type: string;
  /**
   * Optional icon override. If omitted, the renderer picks a default by type
   * (`add_to_cart` → plus, anything else → arrow-right). Persona configs can
   * set this explicitly to use a domain-appropriate affordance.
   */
  icon?: EntityActionIcon;
  form?: ActionFormField[];
}

export interface EntityConfig {
  card_layout: EntityCardLayout;
  action: EntityAction;
}

export interface CartItem {
  product_id: string;
  name: string;
  brand?: string;
  price?: number;
  quantity: number;
  data?: Record<string, any>;
}

export interface DemoUser {
  id: string;
  email: string;
  display_name: string;
  spend_limit: number;
}

/**
 * Persona-driven inline checkout card (rendered when the backend emits
 * `payment_required`). Absence = no inline checkout for this tenant.
 */
export interface CheckoutCardConfig {
  title?: string;
  subtitle?: string;
  submit_label?: string;
  test_card_hint?: string;
  success_message?: string;
  cancel_label?: string;
}

export interface CheckoutConfig {
  enabled: boolean;
  provider?: string;
  trigger?: { tool?: string; on_status?: string };
  inline_card?: CheckoutCardConfig;
  /** Template for the message sent to the LLM after Stripe confirms.
   * `{payment_intent_id}` is substituted. */
  post_success_user_message?: string;
}

/** A pending Stripe Elements card capture surfaced inline in the chat. */
export interface PendingPayment {
  client_secret: string;
  payment_intent_id?: string;
  amount?: number;
  currency?: string;
}

/**
 * UI config from the deployment's persona JSON (loaded from backend).
 */
export interface AgentUIConfig {
  title: string;
  subtitle?: string;
  greeting: string;
  greeting_subtitle?: string;
  suggestions: string[];
  checkout?: CheckoutConfig;
}

export interface UploadRecord {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  analyzed?: boolean;
}
