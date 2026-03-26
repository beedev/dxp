export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  attachments?: { name: string; url: string }[];
}

export interface Conversation {
  id: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  assignee?: string;
  createdAt: string;
  lastMessageAt: string;
  messages?: ChatMessage[];
}

export interface CreateConversationDto {
  subject: string;
  message: string;
  category?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export abstract class ChatPort {
  abstract createConversation(userId: string, dto: CreateConversationDto): Promise<Conversation>;
  abstract getConversation(conversationId: string): Promise<Conversation>;
  abstract listConversations(userId: string, status?: string): Promise<Conversation[]>;
  abstract sendMessage(conversationId: string, content: string, sender: 'user' | 'agent'): Promise<ChatMessage>;
  abstract closeConversation(conversationId: string): Promise<void>;
}
