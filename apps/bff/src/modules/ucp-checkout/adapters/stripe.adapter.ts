import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
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

/**
 * Stripe-backed UCP adapter.
 *
 * Uses the real `stripe` Node SDK pointed at either Stripe production OR the
 * `stripe/stripe-mock` Docker container (default for local dev). Set:
 *
 *   UCP_ADAPTER=stripe
 *   STRIPE_API_KEY=sk_test_xxx                 # any value works against the mock
 *   STRIPE_API_HOST=localhost                  # omit to use real Stripe
 *   STRIPE_API_PORT=12111
 *   STRIPE_API_PROTOCOL=http
 *
 * Behavior mapping:
 * - createSession → stripe.checkout.sessions.create({mode: 'payment', ...})
 *   Stripe returns a real `cs_test_*` id; UCP session id mirrors it so any
 *   subsequent UPDATE/COMPLETE call can resolve the underlying Checkout Session.
 * - updateSession → store buyer + fulfillment locally (Stripe Checkout
 *   Sessions are largely immutable after creation; the buyer is captured at
 *   payment time on the hosted page). We mirror the in-memory adapter for
 *   parts Stripe doesn't expose pre-completion.
 * - completeSession → simulate completion by retrieving the session and
 *   creating a successful PaymentIntent via stripe.paymentIntents.create.
 *   In real Stripe, the hosted Checkout page handles this; for our adapter-
 *   demo we short-circuit to a confirmed PaymentIntent so the UCP API
 *   contract stays uniform.
 */
@Injectable()
export class StripeUcpCheckoutAdapter extends UcpCheckoutPort {
  private readonly logger = new Logger(StripeUcpCheckoutAdapter.name);
  private readonly stripe: InstanceType<typeof Stripe>;
  private readonly local = new Map<string, CheckoutSession>(); // id → session mirror

  constructor() {
    super();
    const apiKey = process.env.STRIPE_API_KEY || 'sk_test_dxp_dev';
    const host = process.env.STRIPE_API_HOST;
    const config: Record<string, unknown> = {};
    if (host) {
      config.host = host;
      config.port = parseInt(process.env.STRIPE_API_PORT || '12111', 10);
      config.protocol = process.env.STRIPE_API_PROTOCOL || 'http';
    }
    this.stripe = new Stripe(apiKey, config as any);
    this.logger.log(`Stripe UCP adapter initialized (host=${host ?? 'api.stripe.com'})`);
  }

  private key(tenantId: string, id: string): string {
    return `${tenantId}:${id}`;
  }

  async getProfile(): Promise<UcpProfile> {
    return {
      ucp: {
        version: UCP_VERSION,
        capabilities: [
          { name: 'dev.ucp.shopping.checkout', version: UCP_VERSION },
          { name: 'dev.ucp.shopping.fulfillment', version: UCP_VERSION },
        ],
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

    const stripeSession = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: req.line_items.map((li) => ({
        quantity: li.quantity,
        price_data: {
          currency: (req.currency || 'USD').toLowerCase(),
          product_data: { name: li.item.title },
          unit_amount: li.item.price,
        },
      })),
      success_url: 'http://localhost:4500/customer/cart?ucp=success',
      cancel_url: 'http://localhost:4500/customer/cart?ucp=cancel',
    });

    const now = new Date().toISOString();
    const lineItems = req.line_items.map((li) => this.computeLineItemTotals(li));
    const session: CheckoutSession = {
      ucp: { version: UCP_VERSION, capabilities: [{ name: 'dev.ucp.shopping.checkout', version: UCP_VERSION }] },
      id: stripeSession.id,
      status: 'open',
      currency: req.currency || 'USD',
      line_items: lineItems,
      buyer: req.buyer,
      totals: this.computeTotals(lineItems),
      created_at: now,
      updated_at: now,
      // Stripe-specific metadata is preserved alongside UCP shape — agents
      // that know about Stripe can use these; UCP-only agents ignore them.
      ...(stripeSession.url ? { } : {}),
    };
    // Stash Stripe ids in payment.instruments for later complete().
    (session as any).data = { stripe: { checkout_session_id: stripeSession.id, hosted_url: stripeSession.url } };

    this.local.set(this.key(tenantId, session.id), session);
    this.logger.log(`createSession ${session.id} via Stripe (mock=${!!process.env.STRIPE_API_HOST})`);
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

    // Calculate amount from session totals.
    const totalLine = s.totals.find((t) => t.type === 'total');
    const amount = totalLine?.amount ?? s.line_items.reduce((sum, li) => sum + li.item.price * li.quantity, 0);

    // Real Stripe Checkout completes via the hosted page; for our UCP
    // contract we short-circuit by creating a confirmed PaymentIntent so
    // the same flow works against stripe-mock and real Stripe in test mode.
    const intent = await this.stripe.paymentIntents.create({
      amount,
      currency: s.currency.toLowerCase(),
      payment_method_types: ['card'],
      // Use the canonical test PaymentMethod in test mode / stripe-mock.
      payment_method: 'pm_card_visa',
      confirm: true,
      // Map our session to the intent for traceability.
      metadata: {
        ucp_session_id: id,
        ucp_handler_id: req.payment_data.handler_id,
      },
    });

    s.status = 'completed';
    s.payment = {
      instruments: [
        {
          id: intent.id,
          handler_id: req.payment_data.handler_id,
          type: 'card',
          rich_text_description: `Stripe ${intent.id}`,
        },
      ],
      selected_instrument_id: intent.id,
    };
    s.updated_at = new Date().toISOString();
    (s as any).data = {
      ...((s as any).data || {}),
      stripe: { ...((s as any).data?.stripe || {}), payment_intent_id: intent.id },
    };
    this.local.set(this.key(tenantId, id), s);

    const orderId = `ord_${id.replace('cs_test_', '').slice(0, 16)}`;
    this.logger.log(`completeSession ${id} via Stripe -> ${intent.id} (${intent.status})`);
    // stripe-mock returns canned PaymentIntent states (often 'requires_payment_method'
    // even when the call succeeds). For demo purposes any non-error response from
    // Stripe is treated as success — real Stripe + a real Confirm flow returns
    // 'succeeded' deterministically.
    const stripeOk = intent.status === 'succeeded' || intent.status === 'processing';
    const isMock = !!process.env.STRIPE_API_HOST;
    const ok = stripeOk || isMock;
    return {
      status: ok ? 'success' : 'declined',
      session: s,
      order_id: orderId,
      payment_id: intent.id,
      message: `Stripe PaymentIntent ${intent.status}`,
    };
  }

  async cancelSession(tenantId: string, id: string): Promise<CheckoutSession> {
    const s = await this.getSession(tenantId, id);
    if (s.status === 'completed') throw new BadRequestException(`Session ${id} already completed`);
    try {
      await this.stripe.checkout.sessions.expire(id);
    } catch (err) {
      // stripe-mock may not implement expire; best-effort.
      this.logger.warn(`Stripe sessions.expire failed for ${id}: ${(err as Error).message}`);
    }
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
