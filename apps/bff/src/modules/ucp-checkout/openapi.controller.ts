import { Controller, Get, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';

/**
 * Curated OpenAPI 3 spec for UCP routes only.
 *
 * Why a separate spec when Nest already generates Swagger at /api/docs-json?
 *  - The full BFF spec is ~200 routes — too large/noisy for ChatGPT Custom
 *    GPT Actions (which prefer focused tool surfaces).
 *  - ChatGPT reads `summary`/`description`/`operationId` to decide *when* to
 *    call each tool. A curated spec lets us tune those for agentic UX.
 *  - The `servers[0].url` is set dynamically from the incoming Host header
 *    so the same spec works whether ChatGPT fetches it via ngrok,
 *    cloudflared, a public URL, or localhost.
 *
 * Usage: open ChatGPT → Create a GPT → Configure → Actions → Import from URL
 *   https://<your-public-host>/api/v1/ucp/openapi.json
 */
@ApiExcludeController()
@Controller('ucp/openapi.json')
export class UcpOpenApiController {
  @Get()
  spec(@Req() req: Request) {
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost:4201';
    const serverUrl = `${proto}://${host}`;

    // Inline parameter ChatGPT can read — its OpenAPI importer doesn't resolve
    // refs into components/parameters/, only into components/schemas/.
    const sessionIdParam = {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: 'Checkout session id (e.g. `cs_test_…` from Stripe-backed adapter)',
      example: 'cs_test_a1zAp8KmIMyrkVSl',
    };

    return {
      // ChatGPT Custom GPT Actions requires OpenAPI 3.1.x. Our schemas are
      // 3.1-compatible (no nullable field — we use unions / optional).
      openapi: '3.1.0',
      info: {
        title: 'UCP Shopping Checkout',
        description:
          'Agentic commerce per the UCP open standard (ucp.dev). Search products, ' +
          'create a checkout, attach buyer + fulfillment, then surface payment_url ' +
          'so the buyer pays on the hosted Stripe Elements page (which calls ' +
          'complete for you). Poll getCheckoutSession to confirm.',
        // Semver in info.version — ChatGPT's strict OpenAPI validator
        // rejects date strings here. The protocol version (2026-01-11)
        // lives on the discovery doc, not on this spec's metadata.
        version: '1.0.0',
        contact: { name: 'UCP', url: 'https://ucp.dev' },
      },
      servers: [{ url: serverUrl, description: 'DXP BFF' }],
      tags: [
        { name: 'discovery', description: 'UCP profile / capability discovery' },
        { name: 'catalog', description: 'Merchant product catalog (UCP extension)' },
        { name: 'checkout', description: 'UCP shopping checkout session lifecycle' },
      ],
      paths: {
        '/.well-known/ucp': {
          get: {
            tags: ['discovery'],
            operationId: 'getUcpProfile',
            summary: 'Discover UCP capabilities',
            description:
              'Read the merchant\'s UCP profile — list of supported capabilities and ' +
              'available transports (REST, MCP, A2A). Call this once before driving a ' +
              'checkout to confirm the merchant supports `dev.ucp.shopping.checkout`.',
            responses: {
              '200': {
                description: 'UCP profile',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/UcpProfile' } } },
              },
            },
          },
        },
        '/api/v1/products/search': {
          get: {
            tags: ['catalog'],
            operationId: 'searchProducts',
            summary: 'Search the merchant product catalog',
            description:
              'Call before recommending or checking out a product. Returns live SKUs ' +
              'and prices from the merchant catalog (pgvector + embeddings). Use the ' +
              'result\'s `id` and `price_cents` as `item.id` and `item.price` in ' +
              'createCheckoutSession — never invent SKUs or prices.',
            parameters: [
              {
                name: 'q',
                in: 'query',
                required: true,
                schema: { type: 'string' },
                description:
                  'Natural-language query — pass everything the user said (category, brand, ' +
                  'use case, voltage, etc.) in this field. Embeddings handle semantic ranking; ' +
                  'no separate category filter is needed.',
              },
              {
                name: 'max_price',
                in: 'query',
                required: false,
                schema: { type: 'number' },
                description: 'Max unit price in major units (e.g. 150 for $150).',
              },
              {
                name: 'min_rating',
                in: 'query',
                required: false,
                schema: { type: 'number' },
                description: 'Minimum customer rating, 0-5.',
              },
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: { type: 'integer', minimum: 1, maximum: 25, default: 10 },
              },
            ],
            responses: {
              '200': {
                description: 'Catalog search results',
                content: {
                  'application/json': { schema: { $ref: '#/components/schemas/ProductSearchResult' } },
                },
              },
            },
          },
        },
        '/api/v1/ucp/checkout-sessions': {
          post: {
            tags: ['checkout'],
            operationId: 'createCheckoutSession',
            summary: 'Create a new checkout session',
            description:
              'Open a new checkout session for the given line items. Returns a session ' +
              'with id, totals (subtotal + tax + total), and `status: open`. Hold the ' +
              'returned id — every subsequent operation needs it.',
            requestBody: {
              required: true,
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/CreateSessionRequest' } },
              },
            },
            responses: {
              '200': {
                description: 'Checkout session created',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CheckoutSession' } } },
              },
            },
          },
        },
        '/api/v1/ucp/checkout-sessions/{id}': {
          get: {
            tags: ['checkout'],
            operationId: 'getCheckoutSession',
            summary: 'Get a checkout session by id',
            description:
              'Read the current state of a checkout session. Use this to poll for ' +
              '`status: completed` after the buyer has paid via the hosted page.',
            parameters: [sessionIdParam],
            responses: {
              '200': {
                description: 'Checkout session',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CheckoutSession' } } },
              },
              '404': { description: 'Session not found' },
            },
          },
          put: {
            tags: ['checkout'],
            operationId: 'updateCheckoutSession',
            summary: 'Update buyer + fulfillment on a session',
            description:
              'Patch the session with the buyer (email, name) and fulfillment selection ' +
              '(shipping/pickup, line items per method). Once both buyer and fulfillment ' +
              'are present, the session transitions to `status: ready_for_complete`.',
            parameters: [sessionIdParam],
            requestBody: {
              required: true,
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/UpdateSessionRequest' } },
              },
            },
            responses: {
              '200': {
                description: 'Updated session',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CheckoutSession' } } },
              },
            },
          },
        },
        '/api/v1/ucp/checkout-sessions/{id}/complete': {
          post: {
            tags: ['checkout'],
            operationId: 'completeCheckoutSession',
            summary: 'Complete the session — submit payment, charge the card',
            description:
              'Finalize the purchase. Submit a tokenized payment instrument; the merchant ' +
              'creates a real Stripe PaymentIntent. Returns the order id and Stripe ' +
              'PaymentIntent id. For demos: any token starting with `tok_` is accepted by ' +
              'Stripe test mode (e.g. `tok_visa`).',
            parameters: [sessionIdParam],
            requestBody: {
              required: true,
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/CompleteSessionRequest' } },
              },
            },
            responses: {
              '200': {
                description: 'Checkout completed',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CheckoutResult' } } },
              },
            },
          },
        },
        '/api/v1/ucp/checkout-sessions/{id}/cancel': {
          post: {
            tags: ['checkout'],
            operationId: 'cancelCheckoutSession',
            summary: 'Cancel an open session',
            description:
              'Abandon a checkout session that was created but not completed. ' +
              'Idempotent for already-canceled sessions.',
            parameters: [sessionIdParam],
            responses: {
              '200': {
                description: 'Session canceled',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CheckoutSession' } } },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          UcpProfile: {
            type: 'object',
            properties: {
              ucp: {
                type: 'object',
                properties: {
                  version: { type: 'string', example: '2026-01-11' },
                  capabilities: {
                    type: 'array',
                    items: { type: 'object', properties: { name: { type: 'string' }, version: { type: 'string' } } },
                  },
                  services: {
                    type: 'object',
                    additionalProperties: {
                      type: 'object',
                      properties: {
                        version: { type: 'string' },
                        spec: { type: 'string' },
                        rest: { type: 'object', properties: { schema: { type: 'string' }, endpoint: { type: 'string' } } },
                      },
                    },
                  },
                },
              },
            },
          },
          LineItemRef: {
            type: 'object',
            required: ['id', 'title', 'price'],
            properties: {
              id: { type: 'string', description: 'Catalog SKU / product id' },
              title: { type: 'string', description: 'Display name of the product' },
              price: { type: 'integer', description: 'Unit price in smallest currency units (e.g. cents)' },
            },
          },
          LineItem: {
            type: 'object',
            required: ['item', 'quantity'],
            properties: {
              id: { type: 'string', description: 'Stable id within the session (e.g. `li_1`). Server-assigned.' },
              item: { $ref: '#/components/schemas/LineItemRef' },
              quantity: { type: 'integer', minimum: 1 },
              totals: {
                type: 'array',
                description: 'Per-line-item totals (subtotal, tax, total). Computed by the server on create/update.',
                items: { $ref: '#/components/schemas/CheckoutTotal' },
              },
            },
          },
          Product: {
            type: 'object',
            // OpenAPI 3.1 nullable form — `type: [..., 'null']`.
            // Don't use `nullable: true` here; that's 3.0 syntax and the
            // ChatGPT importer (strict 3.1 parser) silently rejects it.
            properties: {
              id: { type: 'string', description: 'Stable SKU. Use as `item.id` in createCheckoutSession.', example: 'T001' },
              sku: { type: ['string', 'null'] },
              name: { type: 'string', example: 'DeWalt 12V MAX Drill/Driver Kit' },
              brand: { type: ['string', 'null'], example: 'DeWalt' },
              category: { type: ['string', 'null'], example: 'Power Tools' },
              price_cents: {
                type: ['integer', 'null'],
                description: 'Unit price in minor units (cents). Use as `item.price` in createCheckoutSession.',
                example: 12900,
              },
              description: { type: ['string', 'null'] },
              rating: { type: ['number', 'null'], example: 4.7 },
              review_count: { type: ['integer', 'null'] },
              image_url: { type: ['string', 'null'] },
            },
          },
          ProductSearchResult: {
            type: 'object',
            properties: {
              count: { type: 'integer', example: 3 },
              products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
            },
          },
          UcpEnvelope: {
            type: 'object',
            description: 'Capability envelope echoed back by every UCP response so callers can detect supported features without re-reading discovery.',
            properties: {
              version: { type: 'string', example: '2026-01-11' },
              capabilities: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'dev.ucp.shopping.checkout' },
                    version: { type: 'string', example: '2026-01-11' },
                  },
                },
              },
            },
          },
          Buyer: {
            type: 'object',
            required: ['email'],
            properties: {
              email: { type: 'string', format: 'email' },
              first_name: { type: 'string' },
              last_name: { type: 'string' },
            },
          },
          FulfillmentMethod: {
            type: 'object',
            required: ['id', 'type', 'line_item_ids'],
            properties: {
              id: { type: 'string', example: 'fm_1' },
              type: { type: 'string', enum: ['shipping', 'pickup', 'digital'] },
              line_item_ids: { type: 'array', items: { type: 'string' } },
            },
          },
          Fulfillment: {
            type: 'object',
            properties: {
              methods: { type: 'array', items: { $ref: '#/components/schemas/FulfillmentMethod' } },
            },
          },
          CheckoutTotal: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['subtotal', 'tax', 'shipping', 'discount', 'total'] },
              amount: { type: 'integer', description: 'Smallest currency unit' },
            },
          },
          CheckoutSession: {
            type: 'object',
            properties: {
              ucp: { $ref: '#/components/schemas/UcpEnvelope' },
              id: { type: 'string', example: 'pi_3TQtwtBcFyDpOVAP10GNruQv' },
              status: { type: 'string', enum: ['open', 'ready_for_complete', 'completed', 'canceled'] },
              currency: { type: 'string', example: 'USD' },
              line_items: { type: 'array', items: { $ref: '#/components/schemas/LineItem' } },
              buyer: { $ref: '#/components/schemas/Buyer' },
              fulfillment: { $ref: '#/components/schemas/Fulfillment' },
              totals: { type: 'array', items: { $ref: '#/components/schemas/CheckoutTotal' } },
              payment: {
                type: 'object',
                description: 'Embedded card-capture details (used by Stripe Elements).',
                properties: {
                  client_secret: {
                    type: 'string',
                    description: 'Stripe PaymentIntent client_secret. Embedded UIs only — agents that cannot render iframes should use payment_url instead.',
                  },
                  payment_intent_id: { type: 'string', example: 'pi_3TQtwtBcFyDpOVAP10GNruQv' },
                },
              },
              payment_url: {
                type: 'string',
                description: 'Hosted-checkout URL for non-rendering agents (e.g. ChatGPT). Send the buyer here to enter card details, then poll status or wait for the session to reach `completed`.',
                example: 'http://localhost:4500/customer/pay?session=pi_3TQtwtBcFyDpOVAP10GNruQv',
              },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
          CreateSessionRequest: {
            type: 'object',
            required: ['line_items', 'currency'],
            properties: {
              line_items: { type: 'array', items: { $ref: '#/components/schemas/LineItem' } },
              currency: { type: 'string', example: 'USD' },
              buyer: { $ref: '#/components/schemas/Buyer' },
            },
          },
          UpdateSessionRequest: {
            type: 'object',
            properties: {
              line_items: { type: 'array', items: { $ref: '#/components/schemas/LineItem' } },
              buyer: { $ref: '#/components/schemas/Buyer' },
              fulfillment: { $ref: '#/components/schemas/Fulfillment' },
            },
          },
          PaymentCredential: {
            type: 'object',
            required: ['type', 'token'],
            properties: {
              type: { type: 'string', example: 'PAYMENT_GATEWAY' },
              token: {
                type: 'string',
                description: 'Stripe PaymentIntent id (e.g. pi_*) once the buyer has confirmed the card via the hosted-payment URL. The BFF verifies the intent server-side — bogus tokens are rejected.',
                example: 'pi_3TQtwtBcFyDpOVAP10GNruQv',
              },
            },
          },
          PaymentData: {
            type: 'object',
            required: ['id', 'handler_id', 'type', 'credential'],
            properties: {
              id: { type: 'string', example: 'pi_demo' },
              handler_id: { type: 'string', example: 'com.demo.pay' },
              type: { type: 'string', example: 'card' },
              credential: { $ref: '#/components/schemas/PaymentCredential' },
            },
          },
          CompleteSessionRequest: {
            type: 'object',
            required: ['payment_data'],
            properties: {
              payment_data: { $ref: '#/components/schemas/PaymentData' },
            },
          },
          CheckoutResult: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['success', 'declined', 'failed'] },
              session: { $ref: '#/components/schemas/CheckoutSession' },
              order_id: { type: 'string', example: 'ord_a1zAp8KmIMyrkVSl' },
              payment_id: { type: 'string', example: 'pi_3TQrauBDfu1aoUtT0HY5KKGm', description: 'Real Stripe PaymentIntent id' },
              message: { type: 'string' },
            },
          },
        },
      },
    };
  }
}
