import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PaymentsPort, PaymentIntent, CreatePaymentDto, Subscription } from '../ports/payments.port';

@Injectable()
export class StripeAdapter extends PaymentsPort {
  private readonly logger = new Logger(StripeAdapter.name);
  private readonly client: AxiosInstance;

  constructor(private config: ConfigService) {
    super();
    // Accept either STRIPE_SECRET_KEY (canonical) or the legacy STRIPE_API_KEY
    // we briefly used for the UCP-only adapter; consolidating onto one name.
    const key =
      this.config.get<string>('STRIPE_SECRET_KEY') ||
      this.config.get<string>('STRIPE_API_KEY') ||
      '';
    this.client = axios.create({
      baseURL: 'https://api.stripe.com/v1',
      auth: { username: key, password: '' },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  override getPublishableKey(): string | null {
    return this.config.get<string>('STRIPE_PUBLISHABLE_KEY') || null;
  }

  async createPayment(dto: CreatePaymentDto): Promise<PaymentIntent> {
    this.logger.log(`Stripe: creating payment $${dto.amount / 100}`);
    // automatic_payment_methods lets Stripe Elements show whichever method
    // the buyer prefers (card / Apple Pay / Link / etc.) without us picking.
    const params: Record<string, string> = {
      amount: String(dto.amount),
      currency: dto.currency || 'usd',
      'automatic_payment_methods[enabled]': 'true',
    };
    if (dto.description) params.description = dto.description;
    if (dto.customerId) params.customer = dto.customerId;
    if (dto.metadata) {
      for (const [k, v] of Object.entries(dto.metadata)) params[`metadata[${k}]`] = String(v);
    }
    const { data } = await this.client.post('/payment_intents', new URLSearchParams(params));
    return this.mapPayment(data);
  }

  async getPayment(id: string): Promise<PaymentIntent> {
    const { data } = await this.client.get(`/payment_intents/${id}`);
    return this.mapPayment(data);
  }

  async listPayments(customerId?: string): Promise<PaymentIntent[]> {
    const params = customerId ? `?customer=${customerId}&limit=20` : '?limit=20';
    const { data } = await this.client.get(`/payment_intents${params}`);
    return (data.data || []).map(this.mapPayment);
  }

  async refundPayment(id: string, amount?: number): Promise<PaymentIntent> {
    const params: Record<string, string> = { payment_intent: id };
    if (amount) params.amount = String(amount);
    await this.client.post('/refunds', new URLSearchParams(params));
    return this.getPayment(id);
  }

  async createSubscription(customerId: string, planId: string): Promise<Subscription> {
    const { data } = await this.client.post('/subscriptions', new URLSearchParams({ customer: customerId, 'items[0][price]': planId }));
    return { id: data.id, planId, status: data.status, currentPeriodEnd: new Date(data.current_period_end * 1000).toISOString(), amount: data.items?.data?.[0]?.price?.unit_amount || 0, currency: data.currency || 'usd' };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.client.delete(`/subscriptions/${subscriptionId}`);
  }

  async listSubscriptions(customerId: string): Promise<Subscription[]> {
    const { data } = await this.client.get(`/subscriptions?customer=${customerId}`);
    return (data.data || []).map((s: Record<string, unknown>) => ({ id: s.id, planId: '', status: s.status, currentPeriodEnd: new Date((s.current_period_end as number) * 1000).toISOString(), amount: 0, currency: s.currency }));
  }

  private mapPayment(p: Record<string, unknown>): PaymentIntent {
    return { id: String(p.id), amount: p.amount as number, currency: String(p.currency), status: this.mapStatus(String(p.status)), clientSecret: p.client_secret as string, createdAt: new Date((p.created as number) * 1000).toISOString() };
  }

  private mapStatus(s: string): PaymentIntent['status'] {
    const map: Record<string, PaymentIntent['status']> = { requires_payment_method: 'pending', requires_confirmation: 'pending', processing: 'processing', succeeded: 'succeeded', canceled: 'cancelled' };
    return map[s] || 'pending';
  }
}
