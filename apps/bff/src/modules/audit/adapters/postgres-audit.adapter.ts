import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditPort, AuditEntry, AuditQuery, ComplianceReport } from '../ports/audit.port';

@Injectable()
export class PostgresAuditAdapter extends AuditPort {
  private readonly logger = new Logger(PostgresAuditAdapter.name);

  constructor(private config: ConfigService) { super(); }

  // In production: use TypeORM/Prisma with an audit_log table
  // CREATE TABLE audit_log (id UUID PRIMARY KEY, timestamp TIMESTAMPTZ, actor JSONB, action VARCHAR, resource JSONB, tenant_id VARCHAR, outcome VARCHAR, metadata JSONB, changes JSONB);

  async log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry> {
    const record: AuditEntry = { id: `audit-${Date.now()}`, timestamp: new Date().toISOString(), ...entry };
    this.logger.log(`AUDIT: ${record.actor.userId} ${record.action} ${record.resource.type}/${record.resource.id} => ${record.outcome}`);
    // INSERT INTO audit_log ...
    return record;
  }

  async query(query: AuditQuery): Promise<{ data: AuditEntry[]; total: number }> {
    this.logger.debug(`Audit query: ${JSON.stringify(query)}`);
    // SELECT * FROM audit_log WHERE ... ORDER BY timestamp DESC LIMIT $page_size OFFSET $offset
    return { data: [], total: 0 };
  }

  async getEntry(id: string): Promise<AuditEntry> {
    this.logger.debug(`Get audit entry: ${id}`);
    return { id, timestamp: '', actor: { userId: '' }, action: '', resource: { type: '', id: '' }, tenantId: '', outcome: 'success' };
  }

  async generateReport(type: ComplianceReport['type'], from: string, to: string, tenantId?: string): Promise<ComplianceReport> {
    this.logger.log(`Generating ${type} report: ${from} to ${to}`);
    // Aggregate queries against audit_log
    return {
      id: `report-${Date.now()}`, type, generatedAt: new Date().toISOString(),
      period: { from, to },
      summary: { totalEvents: 0, successCount: 0, failureCount: 0, deniedCount: 0, uniqueUsers: 0 },
      entries: [],
    };
  }

  async exportEntries(query: AuditQuery, format: 'json' | 'csv'): Promise<string> {
    const { data } = await this.query(query);
    if (format === 'csv') {
      const headers = 'id,timestamp,userId,action,resourceType,resourceId,outcome\n';
      return headers + data.map((e) => `${e.id},${e.timestamp},${e.actor.userId},${e.action},${e.resource.type},${e.resource.id},${e.outcome}`).join('\n');
    }
    return JSON.stringify(data, null, 2);
  }
}
