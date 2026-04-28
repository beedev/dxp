/**
 * Universal Commerce Protocol (UCP) — typed contracts.
 *
 * Mirrors the shopping-checkout shapes from https://ucp.dev/specification/checkout-rest
 * Spec version tag: 2026-01-11.
 *
 * Kept intentionally minimal — only the fields our adapters use today. Extend
 * as we onboard real backends (Shopify, Stripe Checkout, custom order systems).
 */

export const UCP_VERSION = '2026-01-11' as const;

/**
 * UCP service / capability names. Per-spec these are reverse-DNS-ish strings.
 */
export interface UcpCapability {
  name: string;
  version: string;
  config?: Record<string, unknown>;
}

/**
 * Returned at /.well-known/ucp. Advertises supported transports and services.
 */
export interface UcpProfile {
  ucp: {
    version: typeof UCP_VERSION;
    capabilities: UcpCapability[];
    services: {
      [serviceName: string]: {
        version: string;
        spec: string;
        rest?: { schema: string; endpoint: string };
        // mcp/a2a transports — not implemented in MVP, declared as optional
        mcp?: { endpoint: string };
        a2a?: { endpoint: string };
      };
    };
  };
}

export type CheckoutSessionStatus =
  | 'open'
  | 'ready_for_complete'
  | 'completed'
  | 'canceled';

export interface MoneyAmount {
  /** Smallest currency unit (e.g. cents for USD). */
  value: number;
  currency: string;
}

export interface LineItemRef {
  id: string;
  title: string;
  /** Smallest currency unit. */
  price: number;
}

export interface LineItem {
  id: string;
  item: LineItemRef;
  quantity: number;
  totals?: { type: string; amount: number }[];
}

export interface Buyer {
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface FulfillmentDestination {
  id: string;
  street_address: string;
  address_locality: string;
  address_region: string;
  postal_code: string;
  address_country: string;
}

export interface FulfillmentMethod {
  id: string;
  type: 'shipping' | 'pickup' | 'digital';
  line_item_ids: string[];
  selected_destination_id?: string;
  destinations?: FulfillmentDestination[];
}

export interface PaymentInstrument {
  id: string;
  handler_id: string;
  type: string;
  brand?: string;
  last_digits?: string;
  rich_text_description?: string;
}

export interface PaymentData {
  id: string;
  handler_id: string;
  type: string;
  credential: { type: string; token: string };
}

export interface CheckoutTotals {
  type: 'subtotal' | 'tax' | 'shipping' | 'discount' | 'total';
  amount: number;
}

export interface CheckoutSession {
  ucp: { version: string; capabilities: UcpCapability[] };
  id: string;
  status: CheckoutSessionStatus;
  currency: string;
  line_items: LineItem[];
  buyer?: Buyer;
  fulfillment?: { methods: FulfillmentMethod[] };
  payment?: {
    instruments?: PaymentInstrument[];
    selected_instrument_id?: string;
    /**
     * For embedded card-capture flows (e.g. Stripe Elements). Front-ends pass
     * this to Stripe.js's confirmPayment() — never to the BFF.
     */
    client_secret?: string;
    payment_intent_id?: string;
  };
  totals: CheckoutTotals[];
  /**
   * Hosted-checkout URL when the adapter supports redirect-style capture
   * (e.g. Stripe Checkout hosted page). Front-ends redirect the customer
   * here to capture card details on the payment provider's domain.
   */
  payment_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UcpPublicConfig {
  ucp_version: string;
  stripe_publishable_key?: string;
}

export interface CheckoutResult {
  status: 'success' | 'declined' | 'failed';
  session: CheckoutSession;
  order_id?: string;
  payment_id?: string;
  message?: string;
}

// ---------------------------------------------------------------------------
// Request shapes used by the BFF controller (subset of the full UCP spec).
// ---------------------------------------------------------------------------

export interface CreateSessionRequest {
  line_items: LineItem[];
  currency: string;
  buyer?: Buyer;
}

export interface UpdateSessionRequest {
  line_items?: LineItem[];
  buyer?: Buyer;
  fulfillment?: { methods: FulfillmentMethod[] };
}

export interface CompleteSessionRequest {
  payment_data: PaymentData;
  risk_signals?: Record<string, unknown>;
}
