import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import {
  CheckoutResult,
  CheckoutSession,
  CompleteSessionRequest,
  CreateSessionRequest,
  LineItem,
  UcpProfile,
  UCP_VERSION,
  UpdateSessionRequest,
} from '@dxp/contracts';
import { UcpCheckoutPort } from '../ports/ucp-checkout.port';
import { PaymentsPort } from '../../payments/ports/payments.port';

/**
 * Payment-processor-agnostic UCP checkout adapter.
 *
 * Delegates ALL payment-processor calls to the platform's `PaymentsPort` —
 * one adapter, every provider. Switching from Stripe → Razorpay (India) →
 * MercadoPago (LATAM) → Alipay (China) is a `PAYMENTS_PROVIDER` env change
 * with zero edits to the UCP layer.
 *
 * Session lifecycle (line items → buyer → fulfillment → complete) is held
 * locally; only the underlying PaymentIntent creation/lookup hits the
 * payment processor.
 */
@Injectable()
export class PaymentsBackedUcpCheckoutAdapter extends UcpCheckoutPort {
  private readonly logger = new Logger(PaymentsBackedUcpCheckoutAdapter.name);
  private readonly local = new Map<string, CheckoutSession>();
  private readonly paymentUrlTemplate: string | null;

  constructor(
    private readonly payments: PaymentsPort,
    config?: ConfigService,
  ) {
    super();
    // External agents (ChatGPT, MCP clients, email links) can't render Stripe
    // Elements — they need a URL to send the buyer to. UCP_PAYMENT_URL_TEMPLATE
    // is a string with `{session_id}` placeholder. When unset, we omit
    // payment_url and assume an embedded client will use client_secret.
    const template = config?.get<string>('UCP_PAYMENT_URL_TEMPLATE') ?? null;
    this.paymentUrlTemplate = template && template.includes('{session_id}') ? template : template;
    this.logger.log(
      `UCP adapter wired through PaymentsPort${this.paymentUrlTemplate ? ` · hosted pay URL: ${this.paymentUrlTemplate}` : ''}`,
    );
  }

  private renderPaymentUrl(sessionId: string): string | undefined {
    if (!this.paymentUrlTemplate) return undefined;
    return this.paymentUrlTemplate.replace(/\{session_id\}/g, encodeURIComponent(sessionId));
  }

  override getPublishableKey(): string | null {
    return this.payments.getPublishableKey();
  }

  private key(tenantId: string, id: string): string {
    return `${tenantId}:${id}`;
  }

  async getProfile(): Promise<UcpProfile> {
    const capabilities = [
      { name: 'dev.ucp.shopping.checkout', version: UCP_VERSION },
      { name: 'dev.ucp.shopping.fulfillment', version: UCP_VERSION },
    ];
    // Advertise hosted-payment capability when a URL template is configured.
    // External agents that can't render Stripe Elements look for this and
    // surface payment_url to the user.
    if (this.paymentUrlTemplate) {
      capabilities.push({ name: 'dev.ucp.shopping.hosted_payment', version: UCP_VERSION });
    }
    return {
      ucp: {
        version: UCP_VERSION,
        capabilities,
        services: {
          'dev.ucp.shopping': {
            version: UCP_VERSION,
            spec: 'https://ucp.dev/specification/overview',
            rest: {
              schema: 'https://ucp.dev/services/shopping/rest.openapi.json',
              endpoint: '/api/v1/ucp',
            },
            mcp: { endpoint: '/api/v1/ucp/mcp' },
          },
        },
      },
    };
  }

  async createSession(tenantId: string, req: CreateSessionRequest): Promise<CheckoutSession> {
    if (!req.line_items?.length) throw new BadRequestException('line_items required');

    const lineItems = req.line_items.map((li) => this.computeLineItemTotals(li));
    const totals = this.computeTotals(lineItems);
    const total = totals.find((t) => t.type === 'total')?.amount ?? 0;
    const currency = req.currency || 'USD';

    // Single delegated call — works against any PaymentsPort adapter.
    const intent = await this.payments.createPayment({
      amount: total,
      currency: currency.toLowerCase(),
      description: `UCP checkout (${lineItems.length} item${lineItems.length === 1 ? '' : 's'})`,
      metadata: { ucp_tenant: tenantId },
    });

    const now = new Date().toISOString();
    const session: CheckoutSession = {
      ucp: { version: UCP_VERSION, capabilities: [{ name: 'dev.ucp.shopping.checkout', version: UCP_VERSION }] },
      id: intent.id,
      status: 'open',
      currency,
      line_items: lineItems,
      buyer: req.buyer,
      totals,
      payment: {
        client_secret: intent.clientSecret,
        payment_intent_id: intent.id,
      },
      payment_url: this.renderPaymentUrl(intent.id),
      created_at: now,
      updated_at: now,
    };
    this.local.set(this.key(tenantId, session.id), session);
    this.logger.log(`createSession ${session.id} via PaymentsPort (${currency} ${total})`);
    return session;
  }

  async getSession(tenantId: string, id: string): Promise<CheckoutSession> {
    const s = this.local.get(this.key(tenantId, id));
    if (!s) throw new NotFoundException(`Session ${id} not found`);
    return s;
  }

  async updateSession(
    tenantId: string,
    id: string,
    req: UpdateSessionRequest,
  ): Promise<CheckoutSession> {
    const s = await this.getSession(tenantId, id);
    if (s.status !== 'open' && s.status !== 'ready_for_complete') {
      throw new BadRequestException(`Session ${id} is ${s.status}`);
    }
    if (req.line_items) {
      s.line_items = req.line_items.map((li) => this.computeLineItemTotals(li));
      s.totals = this.computeTotals(s.line_items);
    }
    if (req.buyer) s.buyer = req.buyer;
    if (req.fulfillment) s.fulfillment = req.fulfillment;
    if (s.buyer && s.fulfillment) s.status = 'ready_for_complete';
    s.updated_at = new Date().toISOString();
    this.local.set(this.key(tenantId, id), s);
    return s;
  }

  async completeSession(
    tenantId: string,
    id: string,
    req: CompleteSessionRequest,
  ): Promise<CheckoutResult> {
    const s = await this.getSession(tenantId, id);
    if (s.status === 'completed') throw new BadRequestException(`Session ${id} already completed`);
    if (!req.payment_data?.credential?.token) {
      throw new BadRequestException('payment_data.credential.token required');
    }

    const intentId = s.payment?.payment_intent_id ?? s.id;
    let intent;
    try {
      intent = await this.payments.getPayment(intentId);
    } catch (err) {
      throw new BadRequestException(`Could not retrieve PaymentIntent ${intentId}: ${(err as Error).message}`);
    }

    const ok = intent.status === 'succeeded' || intent.status === 'processing';
    if (!ok) {
      // Embedded card capture hasn't been confirmed yet (Elements still
      // pending or the customer never submitted). Surface that state to
      // the caller; UCP session stays open.
      return {
        status: 'declined',
        session: s,
        order_id: undefined,
        payment_id: intent.id,
        message: `PaymentIntent ${intent.status} — awaiting customer confirmation`,
      };
    }

    s.status = 'completed';
    s.payment = {
      ...s.payment,
      instruments: [
        {
          id: intent.id,
          handler_id: req.payment_data.handler_id,
          type: 'card',
          rich_text_description: `Payment ${intent.id}`,
        },
      ],
      selected_instrument_id: intent.id,
    };
    s.updated_at = new Date().toISOString();
    this.local.set(this.key(tenantId, id), s);

    const orderId = `ord_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    this.logger.log(`completeSession ${id} -> intent=${intent.id} status=${intent.status} order=${orderId}`);
    return {
      status: 'success',
      session: s,
      order_id: orderId,
      payment_id: intent.id,
      message: `Payment ${intent.status} via PaymentsPort`,
    };
  }

  async cancelSession(tenantId: string, id: string): Promise<CheckoutSession> {
    const s = await this.getSession(tenantId, id);
    if (s.status === 'completed') throw new BadRequestException(`Session ${id} already completed`);
    s.status = 'canceled';
    s.updated_at = new Date().toISOString();
    this.local.set(this.key(tenantId, id), s);
    return s;
  }

  private computeLineItemTotals(li: LineItem): LineItem {
    const subtotal = li.item.price * li.quantity;
    return { ...li, totals: [{ type: 'subtotal', amount: subtotal }, { type: 'total', amount: subtotal }] };
  }

  private computeTotals(items: LineItem[]) {
    const subtotal = items.reduce((s, li) => s + li.item.price * li.quantity, 0);
    const tax = Math.round(subtotal * 0.08);
    const total = subtotal + tax;
    return [
      { type: 'subtotal' as const, amount: subtotal },
      { type: 'tax' as const, amount: tax },
      { type: 'total' as const, amount: total },
    ];
  }
}
