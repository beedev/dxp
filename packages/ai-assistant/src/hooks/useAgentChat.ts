/**
 * useAgentChat — WebSocket hook for Agentic AI Assistant.
 *
 * Connects to the agentic backend via WebSocket for real-time chat streaming.
 * By default points at http://localhost:8002 (direct to FastAPI). Portals that
 * route through the DXP BFF can override by setting:
 *
 *   window.__DXP_AGENTIC_API_BASE__ = 'http://localhost:4201/api/v1/agentic';
 *
 * The WebSocket URL is derived automatically from API_BASE (http → ws).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AgentEntity,
  AgentProduct,
  AgentStep,
  AgentStepType,
  AgentUIConfig,
  CartItem,
  ChatMessage,
  DemoUser,
  EntityConfig,
  UploadRecord,
} from '../lib/agent-types';

// Re-export for callers that import from the hook (backwards-compat).
export type {
  AgentEntity,
  AgentProduct,
  AgentStep,
  AgentStepType,
  AgentUIConfig,
  CartItem,
  ChatMessage,
  ChatRole,
  DemoUser,
  EntityConfig,
  UploadRecord,
} from '../lib/agent-types';

const DEFAULT_API_BASE = 'http://localhost:8002';
const API_BASE = (typeof window !== 'undefined' && (window as any).__DXP_AGENTIC_API_BASE__) || DEFAULT_API_BASE;
const RECONNECT_BASE_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;

export interface UseAgentChatResult {
  connected: boolean;
  sessionId: string | null;
  users: DemoUser[];
  currentUser: DemoUser | null;
  messages: ChatMessage[];
  agentSteps: AgentStep[];
  products: AgentEntity[];
  cart: CartItem[];
  uploads: UploadRecord[];
  isThinking: boolean;
  uiConfig: AgentUIConfig | null;
  entityConfig: EntityConfig | null;
  selectUser: (userId: string) => Promise<void>;
  sendMessage: (content: string) => void;
  addProductToCart: (entity: AgentEntity) => void;
  uploadFile: (file: File) => Promise<UploadRecord | null>;
  removeUpload: (fileId: string) => Promise<void>;
  clearSession: () => void;
}

export function useAgentChat(): UseAgentChatResult {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingProductsRef = useRef<AgentEntity[] | null>(null);

  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [products, setProducts] = useState<AgentEntity[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [uiConfig, setUiConfig] = useState<AgentUIConfig | null>(null);
  const [entityConfig, setEntityConfig] = useState<EntityConfig | null>(null);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/agent-config`)
      .then((r) => r.ok ? r.json() : null)
      .then((cfg) => {
        if (!cfg) return;
        setUiConfig(cfg);
        if (cfg.entity_config) {
          setEntityConfig(cfg.entity_config);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/users`)
      .then((r) => r.json())
      .then(setUsers)
      .catch((err) => console.error('Failed to load users:', err));
  }, []);

  const selectUser = useCallback(async (userId: string) => {
    try {
      const loginRes = await fetch(`${API_BASE}/api/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!loginRes.ok) throw new Error('Login failed');
      const user: DemoUser = await loginRes.json();
      setCurrentUser(user);

      const sessionRes = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!sessionRes.ok) throw new Error('Session creation failed');
      const session = await sessionRes.json();
      setSessionId(session.id);

      setAgentSteps([]);
      setProducts([]);
      try {
        const histRes = await fetch(`${API_BASE}/api/sessions/${session.id}/agent-history`);
        if (histRes.ok) {
          const hist = await histRes.json();
          const restored = (hist.messages || []).map((m: any) => ({
            id: crypto.randomUUID(),
            role: m.role,
            content: m.content,
            timestamp: new Date().toISOString(),
          }));
          setMessages(restored);
        } else {
          setMessages([]);
        }
      } catch {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to select user:', err);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const connect = () => {
      const wsBase = API_BASE.replace(/^http/, 'ws');
      const ws = new WebSocket(`${wsBase}/ws/chat/${sessionId}`);

      ws.onopen = () => {
        setConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleMessage(payload);
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      ws.onclose = (event) => {
        setConnected(false);
        wsRef.current = null;
        if (!event.wasClean && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1;
          const delay = RECONNECT_BASE_MS * Math.pow(1.5, reconnectAttempts.current - 1);
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };

      wsRef.current = ws;
    };

    const handleMessage = (payload: Record<string, any>) => {
      const type = payload.type;

      switch (type) {
        case 'agent_step':
          setAgentSteps((prev) => [
            ...prev,
            {
              id: payload.id || crypto.randomUUID(),
              agent: payload.agent || 'system',
              step: (payload.step || 'thinking') as AgentStepType,
              tool: payload.tool,
              content: payload.content || '',
              duration_ms: payload.duration_ms,
              timestamp: new Date().toISOString(),
            },
          ]);
          if (payload.step !== 'error') {
            setIsThinking(true);
          }
          break;

        case 'products': {
          const incoming = (payload.products || []) as AgentEntity[];
          pendingProductsRef.current = incoming;
          setProducts(incoming);
          break;
        }

        case 'cart_updated':
          setCart(payload.cart || []);
          break;

        case 'assistant_message': {
          const attachedProducts = pendingProductsRef.current;
          pendingProductsRef.current = null;

          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: payload.content || '',
              timestamp: new Date().toISOString(),
              products: attachedProducts ?? undefined,
            },
          ]);
          setIsThinking(false);
          break;
        }

        default:
          break;
      }
    };

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [sessionId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !currentUser) {
        console.warn('Cannot send: WebSocket not connected');
        return;
      }
      pendingProductsRef.current = null;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsThinking(true);
      wsRef.current.send(
        JSON.stringify({
          type: 'user_message',
          content,
          user_id: currentUser.id,
        }),
      );
    },
    [currentUser],
  );

  const addProductToCart = useCallback(
    (entity: AgentEntity) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'add_to_cart_action',
            product_id: entity.id,
            quantity: 1,
          }),
        );
      }
      const subtitle = entity.data.brand ?? entity.data.asset_class ?? entity.entity_type;
      const price = entity.data.price;
      const priceStr = price != null ? ` ($${Number(price).toFixed(2)})` : '';
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Added **${entity.name}** by ${subtitle} to your cart${priceStr}. What else can I help you find?`,
          timestamp: new Date().toISOString(),
        },
      ]);
    },
    [],
  );

  const uploadFile = useCallback(
    async (file: File): Promise<UploadRecord | null> => {
      if (!sessionId) return null;
      try {
        const form = new FormData();
        form.append('session_id', sessionId);
        form.append('file', file);
        const res = await fetch(`${API_BASE}/api/uploads`, {
          method: 'POST',
          body: form,
        });
        if (!res.ok) {
          console.error('Upload failed:', await res.text());
          return null;
        }
        const record: UploadRecord = await res.json();
        setUploads((prev) => [...prev, record]);
        return record;
      } catch (err) {
        console.error('Upload error:', err);
        return null;
      }
    },
    [sessionId],
  );

  const removeUpload = useCallback(
    async (fileId: string) => {
      if (!sessionId) return;
      try {
        await fetch(
          `${API_BASE}/api/uploads/${fileId}?session_id=${encodeURIComponent(sessionId)}`,
          { method: 'DELETE' },
        );
      } catch {
        // continue regardless
      }
      setUploads((prev) => prev.filter((u) => u.id !== fileId));
    },
    [sessionId],
  );

  const clearSession = useCallback(() => {
    setMessages([]);
    setAgentSteps([]);
    setProducts([]);
    setUploads([]);
  }, []);

  return {
    connected,
    sessionId,
    users,
    currentUser,
    messages,
    agentSteps,
    products,
    cart,
    uploads,
    isThinking,
    uiConfig,
    entityConfig,
    selectUser,
    sendMessage,
    addProductToCart,
    uploadFile,
    removeUpload,
    clearSession,
  };
}
