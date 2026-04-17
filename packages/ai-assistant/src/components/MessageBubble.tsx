import React from 'react';
import { Bot, User as UserIcon, AlertCircle } from 'lucide-react';
import type { ChatRole } from '../lib/agent-types';
import { SpeakButton } from './SpeakButton';

interface MessageBubbleProps {
  role: ChatRole;
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';
  const isSystem = role === 'system';
  const isAssistant = role === 'assistant';

  if (isSystem) {
    return (
      <div className="flex items-start gap-2 px-2 py-1.5">
        <AlertCircle size={14} className="text-[var(--dxp-danger)] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[var(--dxp-danger)]">{content}</p>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`h-7 w-7 flex-shrink-0 rounded-full flex items-center justify-center ${
          isUser ? 'bg-[var(--dxp-brand)]' : 'bg-[var(--dxp-border-light)]'
        }`}
      >
        {isUser ? (
          <UserIcon size={14} className="text-white" />
        ) : (
          <Bot size={14} className="text-[var(--dxp-brand)]" />
        )}
      </div>
      <div className={`max-w-[80%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-[var(--dxp-radius)] px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-[var(--dxp-brand)] text-white'
              : 'bg-[var(--dxp-border-light)] text-[var(--dxp-text)]'
          }`}
        >
          {renderMarkdown(content)}
        </div>
        {isAssistant && content.trim().length > 0 && (
          <SpeakButton text={content} />
        )}
      </div>
    </div>
  );
}

function renderMarkdown(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <p key={i} className="flex gap-2 py-0.5">
          <span className="opacity-60">•</span>
          <span>{inlineFormat(line.slice(2))}</span>
        </p>
      );
    }
    if (line.match(/^\d+\.\s/)) {
      return <p key={i} className="py-0.5">{inlineFormat(line)}</p>;
    }
    if (!line.trim()) return <br key={i} />;
    return <p key={i} className="py-0.5">{inlineFormat(line)}</p>;
  });
}

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
