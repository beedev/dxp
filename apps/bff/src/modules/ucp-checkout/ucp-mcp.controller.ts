import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UcpCheckoutPort } from './ports/ucp-checkout.port';
import {
  CompleteSessionRequest,
  CreateSessionRequest,
  UpdateSessionRequest,
} from '@dxp/contracts';

/**
 * UCP MCP Transport — JSON-RPC 2.0 facade over the same UcpCheckoutPort.
 *
 * Per UCP spec (https://ucp.dev/specification/checkout-mcp), the same checkout
 * operations the REST controller exposes are mirrored as JSON-RPC methods so
 * MCP-aware agents (ChatGPT, Claude desktop, agent frameworks) can drive them
 * via tool calls instead of REST.
 *
 * Methods:
 *   - create_checkout    → UcpCheckoutPort.createSession
 *   - get_checkout       → UcpCheckoutPort.getSession
 *   - update_checkout    → UcpCheckoutPort.updateSession
 *   - complete_checkout  → UcpCheckoutPort.completeSession
 *   - cancel_checkout    → UcpCheckoutPort.cancelSession
 *
 * Authentication is INTENTIONALLY skipped here so external agents can connect
 * for the demo. In production, gate this with a separate JSON-RPC auth scheme
 * (per UCP profile capability negotiation).
 */

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: {
    _meta?: { ucp?: { profile?: string } };
    id?: string;
    line_items?: any[];
    currency?: string;
    buyer?: any;
    fulfillment?: any;
    payment_data?: any;
    risk_signals?: any;
    idempotency_key?: string;
  };
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

const TENANT_FOR_MCP = 'mcp';

@ApiTags('ucp-mcp')
@Controller('ucp/mcp')
export class UcpMcpController {
  constructor(private readonly ucp: UcpCheckoutPort) {}

  @Post()
  @ApiOperation({
    summary: 'UCP MCP transport (JSON-RPC 2.0). Methods: create_checkout, get_checkout, update_checkout, complete_checkout, cancel_checkout.',
  })
  async invoke(@Body() req: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { jsonrpc, id, method, params } = req;
    if (jsonrpc !== '2.0') {
      return this.error(id, -32600, 'Invalid Request: jsonrpc must be "2.0"');
    }
    try {
      switch (method) {
        case 'create_checkout': {
          if (!params?.line_items?.length) {
            return this.error(id, -32602, 'line_items required');
          }
          const created = await this.ucp.createSession(TENANT_FOR_MCP, {
            line_items: params.line_items,
            currency: params.currency || 'USD',
            buyer: params.buyer,
          } as CreateSessionRequest);
          return this.ok(id, { checkout: created });
        }
        case 'get_checkout': {
          if (!params?.id) return this.error(id, -32602, 'id required');
          const session = await this.ucp.getSession(TENANT_FOR_MCP, params.id);
          return this.ok(id, { checkout: session });
        }
        case 'update_checkout': {
          if (!params?.id) return this.error(id, -32602, 'id required');
          const updated = await this.ucp.updateSession(TENANT_FOR_MCP, params.id, {
            line_items: params.line_items,
            buyer: params.buyer,
            fulfillment: params.fulfillment,
          } as UpdateSessionRequest);
          return this.ok(id, { checkout: updated });
        }
        case 'complete_checkout': {
          if (!params?.id) return this.error(id, -32602, 'id required');
          if (!params?.payment_data) return this.error(id, -32602, 'payment_data required');
          const result = await this.ucp.completeSession(TENANT_FOR_MCP, params.id, {
            payment_data: params.payment_data,
            risk_signals: params.risk_signals,
          } as CompleteSessionRequest);
          return this.ok(id, result);
        }
        case 'cancel_checkout': {
          if (!params?.id) return this.error(id, -32602, 'id required');
          const canceled = await this.ucp.cancelSession(TENANT_FOR_MCP, params.id);
          return this.ok(id, { checkout: canceled });
        }
        default:
          return this.error(id, -32601, `Method not found: ${method}`, {
            available: [
              'create_checkout',
              'get_checkout',
              'update_checkout',
              'complete_checkout',
              'cancel_checkout',
            ],
          });
      }
    } catch (err: any) {
      const status = err?.status ?? err?.response?.statusCode;
      const code = status === 404 ? -32004 : -32000;
      return this.error(id, code, err?.message || 'Server error');
    }
  }

  private ok(id: number | string, result: unknown): JsonRpcResponse {
    return { jsonrpc: '2.0', id, result };
  }

  private error(id: number | string, code: number, message: string, data?: unknown): JsonRpcResponse {
    return { jsonrpc: '2.0', id, error: { code, message, data } };
  }
}
