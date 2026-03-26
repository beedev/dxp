import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ChatPort, Conversation, ChatMessage, CreateConversationDto } from '../ports/chat.port';

@Injectable()
export class IntercomAdapter extends ChatPort {
  private readonly logger = new Logger(IntercomAdapter.name);
  private readonly client: AxiosInstance;

  constructor(private config: ConfigService) {
    super();
    this.client = axios.create({
      baseURL: 'https://api.intercom.io',
      headers: { Authorization: `Bearer ${this.config.get<string>('INTERCOM_ACCESS_TOKEN', '')}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    });
  }

  async createConversation(userId: string, dto: CreateConversationDto): Promise<Conversation> {
    this.logger.log(`Intercom: create conversation for ${userId}`);
    const { data } = await this.client.post('/conversations', { from: { type: 'user', id: userId }, body: dto.message });
    return { id: data.id, subject: dto.subject, status: 'open', createdAt: new Date().toISOString(), lastMessageAt: new Date().toISOString() };
  }

  async getConversation(id: string): Promise<Conversation> {
    const { data } = await this.client.get(`/conversations/${id}`);
    return { id: data.id, subject: data.title || '', status: data.state === 'closed' ? 'closed' : 'open', createdAt: new Date(data.created_at * 1000).toISOString(), lastMessageAt: new Date(data.updated_at * 1000).toISOString() };
  }

  async listConversations(userId: string): Promise<Conversation[]> {
    const { data } = await this.client.get(`/conversations?type=user&id=${userId}`);
    return (data.conversations || []).map((c: Record<string, unknown>) => ({ id: c.id, subject: '', status: c.state === 'closed' ? 'closed' : 'open', createdAt: '', lastMessageAt: '' }));
  }

  async sendMessage(conversationId: string, content: string, sender: 'user' | 'agent'): Promise<ChatMessage> {
    const { data } = await this.client.post(`/conversations/${conversationId}/reply`, { body: content, message_type: 'comment', type: sender === 'agent' ? 'admin' : 'user' });
    return { id: String(Date.now()), conversationId, sender, content, timestamp: new Date().toISOString() };
  }

  async closeConversation(conversationId: string): Promise<void> {
    await this.client.post(`/conversations/${conversationId}/close`);
  }
}
