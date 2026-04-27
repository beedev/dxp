// UCP Checkout Port — the contract every UCP adapter must implement.
// Consumers inject UcpCheckoutPort and never know which adapter is active
// (mock in-memory, an inline order book, Shopify Checkout, Stripe Checkout, …).

import {
  CheckoutSession,
  CheckoutResult,
  CreateSessionRequest,
  UpdateSessionRequest,
  CompleteSessionRequest,
  UcpProfile,
} from '@dxp/contracts';

export abstract class UcpCheckoutPort {
  /** Returns the deployment's UCP profile (capabilities + transports). */
  abstract getProfile(): Promise<UcpProfile>;

  /** Create a new checkout session. */
  abstract createSession(
    tenantId: string,
    req: CreateSessionRequest,
  ): Promise<CheckoutSession>;

  /** Get an existing session by id. */
  abstract getSession(tenantId: string, id: string): Promise<CheckoutSession>;

  /** Patch a session — line items, buyer, fulfillment selection. */
  abstract updateSession(
    tenantId: string,
    id: string,
    req: UpdateSessionRequest,
  ): Promise<CheckoutSession>;

  /** Finalize the session with a payment instrument. */
  abstract completeSession(
    tenantId: string,
    id: string,
    req: CompleteSessionRequest,
  ): Promise<CheckoutResult>;

  /** Cancel an open session. */
  abstract cancelSession(tenantId: string, id: string): Promise<CheckoutSession>;
}
