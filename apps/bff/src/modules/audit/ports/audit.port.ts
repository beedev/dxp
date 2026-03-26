export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: { userId: string; email?: string; ip?: string };
  action: string;
  resource: { type: string; id: string; name?: string };
  tenantId: string;
  outcome: 'success' | 'failure' | 'denied';
  metadata?: Record<string, unknown>;
  changes?: { field: string; before: unknown; after: unknown }[];
}

export interface AuditQuery {
  tenantId?: string;
  userId?: string;
  action?: string;
  resourceType?: string;
  outcome?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface ComplianceReport {
  id: string;
  type: 'access' | 'changes' | 'logins' | 'custom';
  generatedAt: string;
  period: { from: string; to: string };
  summary: Record<string, number>;
  entries: AuditEntry[];
}

export abstract class AuditPort {
  abstract log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry>;
  abstract query(query: AuditQuery): Promise<{ data: AuditEntry[]; total: number }>;
  abstract getEntry(id: string): Promise<AuditEntry>;
  abstract generateReport(type: ComplianceReport['type'], from: string, to: string, tenantId?: string): Promise<ComplianceReport>;
  abstract exportEntries(query: AuditQuery, format: 'json' | 'csv'): Promise<string>;
}
