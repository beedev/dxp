/**
 * AgenticAssistant — the reusable agent chat component.
 *
 * Works for any DXP portal deployment. Domain specifics (title, suggestions,
 * persona) come from the backend's `/api/agent-config` endpoint, which reads
 * the deployment's persona JSON config. No hardcoded domain in this component.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, CardHeader, Input } from '@dxp/ui';
import {
  Activity,
  Bot,
  Brain,
  ChevronDown,
  RotateCcw,
  Send,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import type { CartItem } from '../lib/agent-types';
import { useAgentChat } from '../hooks/useAgentChat';
import { MessageBubble } from './MessageBubble';
import { EntityGrid } from './ProductCard';
import { AgentStepCard } from './AgentStepCard';
import { UserSelector } from './UserSelector';
import { PreferencesPanel } from './PreferencesPanel';
import { UploadButton, UploadChips } from './UploadButton';
import { MicButton } from './MicButton';
import { InlinePaymentCard } from './InlinePaymentCard';

// Domain-neutral fallbacks — only render when /api/agent-config is unreachable.
// Real per-vertical suggestions come from the persona config.
const DEFAULT_SUGGESTIONS = [
  'How can I help?',
  'Ask me a question',
];

export function AgenticAssistant() {
  const chat = useAgentChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activityEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  useEffect(() => {
    activityEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.agentSteps]);

  const handleSend = () => {
    if (!input.trim() || !chat.connected) return;
    chat.sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (s: string) => {
    // Mirror handleSend: skip when not connected so the message isn't dropped
    // before the WebSocket and user session are ready. sendMessage's retry
    // loop also covers slow connects, but this avoids firing into a closed
    // socket on rapid clicks right after page load.
    if (!chat.connected) return;
    chat.sendMessage(s);
  };

  const ui = chat.uiConfig;
  const ec = chat.entityConfig;
  const title = ui?.title ?? 'AI Assistant';
  const subtitle = ui?.subtitle ?? 'Autonomous AI agents at your service';
  const greeting = ui?.greeting ?? 'How can I help you today?';
  const greetingSubtitle = ui?.greeting_subtitle ?? '';
  const suggestions = ui?.suggestions?.length ? ui.suggestions : DEFAULT_SUGGESTIONS;

  const priceField = ec?.card_layout?.primary_metric?.field;
  const showCart = !ec?.action?.type || ec.action.type === 'add_to_cart';
  const cartTotal = chat.cart.reduce((s, c) => {
    const unitPrice = c.data?.[priceField ?? ''] ?? c.price ?? 0;
    return s + Number(unitPrice) * c.quantity;
  }, 0);
  const cartLabel = ec?.action?.label ?? 'Add to Cart';
  const cartNoun = cartLabel.replace(/^Add to\s*/i, '').toLowerCase() || 'cart';

  if (!chat.currentUser) {
    return (
      <UserSelector
        title={title}
        subtitle={subtitle}
        users={chat.users}
        onSelect={chat.selectUser}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] p-4 gap-4">
      <Header
        title={title}
        currentUserName={chat.currentUser.display_name}
        showCart={showCart}
        cart={chat.cart}
        cartCount={chat.cart.reduce((s, c) => s + c.quantity, 0)}
        cartTotal={cartTotal}
        cartNoun={cartNoun}
        priceField={priceField}
        connected={chat.connected}
        onNewChat={() => {
          chat.clearSession();
          chat.selectUser(chat.currentUser!.id);
        }}
      />

      <div className="grid grid-cols-[1fr_300px] gap-4 flex-1 min-h-0">
        <Card className="flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {chat.messages.length === 0 && (
              <EmptyState
                greeting={greeting}
                greetingSubtitle={greetingSubtitle}
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
              />
            )}

            {chat.messages.map((m) => (
              <div key={m.id} className="space-y-3">
                <MessageBubble role={m.role} content={m.content} />
                {m.products && m.products.length > 0 && (
                  <EntityGrid
                    entities={m.products}
                    cardLayout={ec?.card_layout}
                    action={ec?.action}
                    configs={chat.entityConfigs ?? undefined}
                    onAction={(entity, formValues) => {
                      // Pick the action specific to this entity's type — falls
                      // back to the persona-level action when no per-type config.
                      const perType = chat.entityConfigs?.[entity.entity_type];
                      const effectiveAction = perType?.action ?? ec?.action;
                      const actionType = effectiveAction?.type;
                      if (actionType === 'add_to_cart') {
                        // Retail: add to cart with optional quantity from form
                        chat.addProductToCart(entity, formValues?.quantity);
                        return;
                      }
                      if (!actionType) return;
                      // Domain action: send a deterministic instruction so the LLM
                      // calls the domain_action tool with action_type + the entity's
                      // primary key + any form values. The backend's domain_action
                      // tool description lists available actions and their payload
                      // fields, so the LLM can map our entity_id → the right path
                      // param (e.g., claim_id for /claims/{claim_id}).
                      const formParts = formValues
                        ? Object.entries(formValues)
                            .filter(([, v]) => v !== '' && v !== undefined && v !== null)
                            .map(([k, v]) => `${k}=${v}`)
                        : [];
                      const idArg = entity.external_id ? `entity_id=${entity.external_id}` : '';
                      const args = [idArg, ...formParts].filter(Boolean);
                      const argList = args.length ? ` with ${args.join(', ')}` : '';
                      chat.sendMessage(
                        `Use the domain_action tool with action_type "${actionType}" for "${entity.name}"${argList}.`,
                      );
                    }}
                  />
                )}
              </div>
            ))}

            {chat.isThinking && <ThinkingIndicator />}

            {chat.pendingPayment && chat.checkoutConfig?.enabled && (
              <InlinePaymentCard
                pending={chat.pendingPayment}
                card={chat.checkoutConfig.inline_card}
                onSuccess={chat.confirmPayment}
                onCancel={chat.cancelPayment}
              />
            )}

            <div ref={messagesEndRef} />
          </div>

          <UploadChips uploads={chat.uploads} onRemove={chat.removeUpload} />

          <div className="border-t border-[var(--dxp-border-light)] px-5 py-3 flex gap-2 items-center">
            <UploadButton disabled={!chat.connected} onUpload={chat.uploadFile} />
            <MicButton
              disabled={!chat.connected}
              onTranscribed={(text) => {
                if (text) {
                  chat.sendMessage(text);
                }
              }}
            />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={chat.connected ? 'Ask me anything...' : 'Connecting...'}
              disabled={!chat.connected}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || !chat.connected}
              size="md"
            >
              <Send size={16} />
            </Button>
          </div>
        </Card>

        <div className="flex flex-col gap-4 min-h-0">
          <div className="max-h-[40%] min-h-[180px]">
            <PreferencesPanel
              userId={chat.currentUser?.id ?? null}
              refreshKey={chat.messages.length}
            />
          </div>

          <Card className="flex flex-col min-h-0 flex-1">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-[var(--dxp-brand)]" />
                  <h3 className="text-sm font-bold text-[var(--dxp-text)]">Agent Activity</h3>
                </div>
                {chat.agentSteps.length > 0 && (
                  <span className="text-[10px] text-[var(--dxp-text-muted)] tabular-nums">
                    {chat.agentSteps.length} steps
                  </span>
                )}
              </div>
            </CardHeader>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {chat.agentSteps.length === 0 ? (
                <ActivityEmptyState />
              ) : (
                <>
                  {chat.agentSteps.map((step, i) => (
                    <AgentStepCard
                      key={step.id}
                      step={step}
                      isLatest={i === chat.agentSteps.length - 1}
                    />
                  ))}
                  <div ref={activityEndRef} />
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// -- Sub-components (file-private) --

interface HeaderProps {
  title: string;
  currentUserName: string;
  showCart: boolean;
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  cartNoun: string;
  /** Persona's primary_metric.field, used to read per-item price from `data`. */
  priceField?: string;
  connected: boolean;
  onNewChat?: () => void;
}

function Header({ title, currentUserName, showCart, cart, cartCount, cartTotal, cartNoun, priceField, connected, onNewChat }: HeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-[var(--dxp-radius)] bg-[var(--dxp-brand)] flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--dxp-text)]">{title}</h1>
          <p className="text-xs text-[var(--dxp-text-muted)]">
            Chatting as {currentUserName}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {showCart && (
          <CartButton
            cart={cart}
            cartCount={cartCount}
            cartTotal={cartTotal}
            cartNoun={cartNoun}
            priceField={priceField}
          />
        )}
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-[var(--dxp-radius)] bg-[var(--dxp-border-light)] text-[var(--dxp-text-secondary)] hover:bg-[var(--dxp-border)] hover:text-[var(--dxp-text)] transition-colors"
          >
            <RotateCcw size={12} />
            New Chat
          </button>
        )}
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              connected ? 'bg-[var(--dxp-success)]' : 'bg-[var(--dxp-danger)]'
            }`}
          />
          <span className="text-xs text-[var(--dxp-text-muted)]">
            {connected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Cart popover ─────────────────────────────────────────────────────────────

interface CartButtonProps {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  cartNoun: string;
  /** Persona's primary_metric.field — read unit price from CartItem.data when present. */
  priceField?: string;
}

function CartButton({ cart, cartCount, cartTotal, cartNoun, priceField }: CartButtonProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape so keyboard users can dismiss without
  // hunting for the toggle.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isEmpty = cartCount === 0;
  const unitPrice = (item: CartItem): number => {
    const fromData = priceField ? Number(item.data?.[priceField]) : NaN;
    if (Number.isFinite(fromData)) return fromData;
    return Number(item.price ?? 0);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--dxp-radius)] transition-colors cursor-pointer ${
          !isEmpty
            ? 'bg-[var(--dxp-brand-light)] text-[var(--dxp-brand)] hover:bg-[var(--dxp-border-light)]'
            : 'bg-[var(--dxp-border-light)] text-[var(--dxp-text-muted)] hover:bg-[var(--dxp-border)]'
        }`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <ShoppingCart size={14} />
        <span className="text-xs font-semibold">{cartCount} in {cartNoun}</span>
        {!isEmpty && (
          <>
            <span className="text-xs">·</span>
            <span className="text-xs font-semibold">${cartTotal.toFixed(2)}</span>
          </>
        )}
        <ChevronDown
          size={12}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`${cartNoun} contents`}
          className="absolute right-0 top-full mt-2 w-80 rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)] shadow-lg z-50"
        >
          <div className="px-4 py-3 border-b border-[var(--dxp-border-light)]">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--dxp-text-muted)]">
              Your {cartNoun}
            </p>
          </div>

          {isEmpty ? (
            <div className="px-4 py-6 text-center text-sm text-[var(--dxp-text-muted)]">
              Nothing in your {cartNoun} yet. Ask the assistant to find something.
            </div>
          ) : (
            <>
              <ul className="max-h-72 overflow-y-auto divide-y divide-[var(--dxp-border-light)]">
                {cart.map((item) => {
                  const u = unitPrice(item);
                  return (
                    <li key={item.product_id} className="px-4 py-3 flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--dxp-text)] truncate" title={item.name}>
                          {item.name}
                        </p>
                        {item.brand && (
                          <p className="text-xs text-[var(--dxp-text-muted)] truncate">{item.brand}</p>
                        )}
                        <p className="text-xs text-[var(--dxp-text-muted)] mt-0.5">
                          ${u.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[var(--dxp-text)] flex-shrink-0">
                        ${(u * item.quantity).toFixed(2)}
                      </p>
                    </li>
                  );
                })}
              </ul>
              <div className="px-4 py-3 border-t border-[var(--dxp-border-light)] flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--dxp-text)]">Subtotal</span>
                <span className="text-sm font-bold text-[var(--dxp-text)]">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface EmptyStateProps {
  greeting: string;
  greetingSubtitle: string;
  suggestions: string[];
  onSuggestionClick: (s: string) => void;
}

function EmptyState({
  greeting,
  greetingSubtitle,
  suggestions,
  onSuggestionClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="h-14 w-14 rounded-full bg-[var(--dxp-brand-light)] flex items-center justify-center mb-4">
        <Sparkles size={22} className="text-[var(--dxp-brand)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--dxp-text)] mb-1">{greeting}</h3>
      {greetingSubtitle && (
        <p className="text-sm text-[var(--dxp-text-muted)] mb-6 max-w-md">
          {greetingSubtitle}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestionClick(s)}
            className="text-left text-xs text-[var(--dxp-text-secondary)] bg-[var(--dxp-border-light)] hover:bg-[var(--dxp-brand-light)] hover:text-[var(--dxp-brand)] rounded-[var(--dxp-radius)] px-3 py-2.5 transition-colors border border-[var(--dxp-border)]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--dxp-text-muted)] px-2">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--dxp-brand)] animate-pulse" />
      <span
        className="h-1.5 w-1.5 rounded-full bg-[var(--dxp-brand)] animate-pulse"
        style={{ animationDelay: '0.15s' }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-[var(--dxp-brand)] animate-pulse"
        style={{ animationDelay: '0.3s' }}
      />
      <span className="ml-1">Agent is working...</span>
    </div>
  );
}

function ActivityEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-8">
      <Brain size={24} className="text-[var(--dxp-text-muted)] opacity-40 mb-3" />
      <p className="text-xs text-[var(--dxp-text-muted)] leading-relaxed px-4">
        Agent steps will appear here as the AI works on your request
      </p>
    </div>
  );
}
