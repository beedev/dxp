export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
  clientSecret?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface CreatePaymentDto {
  amount: number;
  currency?: string;
  description?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  currentPeriodEnd: string;
  amount: number;
  currency: string;
}

export abstract class PaymentsPort {
  abstract createPayment(dto: CreatePaymentDto): Promise<PaymentIntent>;
  abstract getPayment(id: string): Promise<PaymentIntent>;
  abstract listPayments(customerId?: string): Promise<PaymentIntent[]>;
  abstract refundPayment(id: string, amount?: number): Promise<PaymentIntent>;
  abstract createSubscription(customerId: string, planId: string): Promise<Subscription>;
  abstract cancelSubscription(subscriptionId: string): Promise<void>;
  abstract listSubscriptions(customerId: string): Promise<Subscription[]>;
}
