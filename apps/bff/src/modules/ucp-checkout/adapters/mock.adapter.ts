import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
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

/**
 * In-memory UCP checkout adapter — keys sessions by tenantId:sessionId.
 * Suitable for demos and the conv-assistant smoke flow. Swap via UCP_ADAPTER
 * env to a persistent backend (Stripe Checkout, Shopify, custom) without
 * changing the controller or any caller.
 */
@Injectable()
export class MockUcpCheckoutAdapter extends UcpCheckoutPort {
  private readonly logger = new Logger(MockUcpCheckoutAdapter.name);
  private readonly sessions = new Map<string, CheckoutSession>();

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
              // The path mirrors the Nest controller's mount point.
              endpoint: '/api/v1/ucp',
            },
            mcp: {
              endpoint: '/api/v1/ucp/mcp',
            },
          },
        },
      },
    };
  }

  async createSession(
    tenantId: string,
    req: CreateSessionRequest,
  ): Promise<CheckoutSession> {
    if (!req.line_items?.length) {
      throw new BadRequestException('line_items required');
    }
    const id = `chk_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();
    const lineItems = req.line_items.map((li) => this.computeLineItemTotals(li));
    const session: CheckoutSession = {
      ucp: {
        version: UCP_VERSION,
        capabilities: [{ name: 'dev.ucp.shopping.checkout', version: UCP_VERSION }],
      },
      id,
      status: 'open',
      currency: req.currency || 'USD',
      line_items: lineItems,
      buyer: req.buyer,
      totals: this.computeTotals(lineItems),
      created_at: now,
      updated_at: now,
    };
    this.sessions.set(this.key(tenantId, id), session);
    this.logger.log(`createSession ${id} (${lineItems.length} items)`);
    return session;
  }

  async getSession(tenantId: string, id: string): Promise<CheckoutSession> {
    const s = this.sessions.get(this.key(tenantId, id));
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
    // Mark ready_for_complete when buyer + fulfillment present.
    if (s.buyer && s.fulfillment) s.status = 'ready_for_complete';
    s.updated_at = new Date().toISOString();
    this.sessions.set(this.key(tenantId, id), s);
    return s;
  }

  async completeSession(
    tenantId: string,
    id: string,
    req: CompleteSessionRequest,
  ): Promise<CheckoutResult> {
    const s = await this.getSession(tenantId, id);
    if (s.status === 'completed') {
      throw new BadRequestException(`Session ${id} already completed`);
    }
    if (!req.payment_data?.credential?.token) {
      throw new BadRequestException('payment_data.credential.token required');
    }
    s.status = 'completed';
    s.payment = {
      instruments: [
        {
          id: req.payment_data.id,
          handler_id: req.payment_data.handler_id,
          type: req.payment_data.type,
          rich_text_description: `${req.payment_data.handler_id} (mock)`,
        },
      ],
      selected_instrument_id: req.payment_data.id,
    };
    s.updated_at = new Date().toISOString();
    this.sessions.set(this.key(tenantId, id), s);
    const orderId = `ord_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    this.logger.log(`completeSession ${id} -> order ${orderId}`);
    return {
      status: 'success',
      session: s,
      order_id: orderId,
      payment_id: `pay_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
    };
  }

  async cancelSession(tenantId: string, id: string): Promise<CheckoutSession> {
    const s = await this.getSession(tenantId, id);
    if (s.status === 'completed') {
      throw new BadRequestException(`Session ${id} already completed`);
    }
    s.status = 'canceled';
    s.updated_at = new Date().toISOString();
    this.sessions.set(this.key(tenantId, id), s);
    return s;
  }

  private computeLineItemTotals(li: LineItem): LineItem {
    const subtotal = li.item.price * li.quantity;
    return { ...li, totals: [{ type: 'subtotal', amount: subtotal }, { type: 'total', amount: subtotal }] };
  }

  private computeTotals(items: LineItem[]) {
    const subtotal = items.reduce((s, li) => s + li.item.price * li.quantity, 0);
    // Mock tax 8%, free shipping; round to integer minor units.
    const tax = Math.round(subtotal * 0.08);
    const total = subtotal + tax;
    return [
      { type: 'subtotal' as const, amount: subtotal },
      { type: 'tax' as const, amount: tax },
      { type: 'total' as const, amount: total },
    ];
  }
}
