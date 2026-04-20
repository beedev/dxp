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
  Send,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import { useAgentChat } from '../hooks/useAgentChat';
import { MessageBubble } from './MessageBubble';
import { EntityGrid } from './ProductCard';
import { AgentStepCard } from './AgentStepCard';
import { UserSelector } from './UserSelector';
import { PreferencesPanel } from './PreferencesPanel';
import { UploadButton, UploadChips } from './UploadButton';
import { MicButton } from './MicButton';

const DEFAULT_SUGGESTIONS = [
  'Find me a cordless drill under $200',
  'Help me plan a project',
  'What deals are available?',
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
        cartCount={chat.cart.reduce((s, c) => s + c.quantity, 0)}
        cartTotal={cartTotal}
        cartNoun={cartNoun}
        connected={chat.connected}
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
                    onAction={chat.addProductToCart}
                  />
                )}
              </div>
            ))}

            {chat.isThinking && <ThinkingIndicator />}

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
  cartCount: number;
  cartTotal: number;
  cartNoun: string;
  connected: boolean;
}

function Header({ title, currentUserName, showCart, cartCount, cartTotal, cartNoun, connected }: HeaderProps) {
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
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--dxp-radius)] ${
              cartCount > 0
                ? 'bg-[var(--dxp-brand-light)] text-[var(--dxp-brand)]'
                : 'bg-[var(--dxp-border-light)] text-[var(--dxp-text-muted)]'
            }`}
          >
            <ShoppingCart size={14} />
            <span className="text-xs font-semibold">{cartCount} in {cartNoun}</span>
            {cartCount > 0 && (
              <>
                <span className="text-xs">·</span>
                <span className="text-xs font-semibold">${cartTotal.toFixed(2)}</span>
              </>
            )}
          </div>
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
