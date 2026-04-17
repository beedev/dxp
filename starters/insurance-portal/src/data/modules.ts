interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  sampleBody?: string;
}

interface AdapterInfo {
  name: string;
  envValue: string;
  description: string;
  config: string;
}

export interface AdapterModule {
  name: string;
  description: string;
  port: string;
  portInterface: string;
  adapters: AdapterInfo[];
  envVar: string;
  endpoints: Endpoint[];
  sdkUsage: string;
  setupGuide: string;
}

export const adapterModules: AdapterModule[] = [
  {
    name: 'CMS',
    description: 'Content management — pages, articles, FAQs. Swap CMS providers via CMS_ADAPTER env var.',
    port: 'CmsPort',
    portInterface: `abstract class CmsPort {
  abstract getContent(type: string, id: string): Promise<CmsContent>;
  abstract listContent(type: string, query: CmsContentQuery): Promise<CmsContentList>;
  abstract createContent(type: string, data: CreateContentDto): Promise<CmsContent>;
  abstract publishContent(type: string, id: string): Promise<void>;
  abstract deleteContent(type: string, id: string): Promise<void>;
}`,
    adapters: [
      {
        name: 'StrapiAdapter',
        envValue: 'strapi',
        description: 'Connects to Strapi v4+ REST API. Maps Strapi response format to CmsContent.',
        config: `STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-api-token`,
      },
      {
        name: 'PayloadAdapter',
        envValue: 'payload',
        description: 'Connects to Payload CMS REST API. Maps Payload docs format to CmsContent.',
        config: `PAYLOAD_URL=http://localhost:3001`,
      },
    ],
    envVar: 'CMS_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/cms/articles', description: 'List content by type' },
      { method: 'GET', path: '/cms/articles/1', description: 'Get content by ID' },
      { method: 'POST', path: '/cms/articles', description: 'Create content', sampleBody: JSON.stringify({ type: 'article', title: 'New Policy FAQ', slug: 'new-faq', body: { content: 'FAQ content here' } }, null, 2) },
      { method: 'POST', path: '/cms/articles/1/publish', description: 'Publish content' },
      { method: 'DELETE', path: '/cms/articles/1', description: 'Delete content' },
    ],
    sdkUsage: `import { useCms, useCmsItem, useCmsCreate } from '@dxp/sdk-react';

// List content
const { data } = useCms('articles', { page: 1 });

// Get single item
const { data: article } = useCmsItem('articles', '123');

// Create content
const create = useCmsCreate('articles');
create.mutate({ title: 'New FAQ', body: { content: '...' } });`,
    setupGuide: `1. Set CMS_ADAPTER=strapi in .env
2. Set STRAPI_URL to your Strapi instance
3. Generate an API token in Strapi admin > Settings > API Tokens
4. Set STRAPI_API_TOKEN in .env
5. Restart BFF — CMS endpoints now proxy to Strapi

To switch to Payload: change CMS_ADAPTER=payload, set PAYLOAD_URL. Zero code changes.`,
  },
  {
    name: 'Storage',
    description: 'File storage — presigned URLs for direct upload/download. Swap providers via STORAGE_PROVIDER.',
    port: 'StoragePort',
    portInterface: `abstract class StoragePort {
  abstract upload(key: string, data: Buffer, options?: UploadOptions): Promise<StorageObject>;
  abstract download(key: string, bucket?: string): Promise<Buffer>;
  abstract getPresignedUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<PresignedUrl>;
  abstract getPresignedDownloadUrl(key: string, expiresIn?: number): Promise<PresignedUrl>;
  abstract delete(key: string, bucket?: string): Promise<void>;
  abstract list(prefix: string, bucket?: string): Promise<StorageObject[]>;
}`,
    adapters: [
      {
        name: 'MinioAdapter (S3-compatible)',
        envValue: 's3',
        description: 'Works with AWS S3, MinIO, or any S3-compatible storage. Uses presigned URLs for direct browser upload.',
        config: `S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_BUCKET=dxp-documents
S3_ACCESS_KEY=AKIA...
S3_SECRET_KEY=secret`,
      },
      {
        name: 'AzureBlobAdapter',
        envValue: 'azure',
        description: 'Connects to Azure Blob Storage. Generates SAS URLs for direct browser upload/download.',
        config: `AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER=dxp-documents`,
      },
    ],
    envVar: 'STORAGE_PROVIDER',
    endpoints: [
      { method: 'POST', path: '/storage/presign/upload', description: 'Get presigned upload URL', sampleBody: JSON.stringify({ key: 'claims/photo.jpg', contentType: 'image/jpeg' }, null, 2) },
      { method: 'POST', path: '/storage/presign/download', description: 'Get presigned download URL', sampleBody: JSON.stringify({ key: 'claims/photo.jpg' }, null, 2) },
      { method: 'GET', path: '/storage/list?prefix=claims/', description: 'List objects by prefix' },
      { method: 'DELETE', path: '/storage/claims-photo.jpg', description: 'Delete object' },
    ],
    sdkUsage: `import { usePresignedUpload, usePresignedDownload } from '@dxp/sdk-react';

// Get upload URL, then upload directly from browser
const presign = usePresignedUpload();
const { url } = await presign.mutateAsync({
  key: 'claims/photo.jpg',
  contentType: 'image/jpeg'
});
await fetch(url, { method: 'PUT', body: file });

// Get download URL
const download = usePresignedDownload();
const { url } = await download.mutateAsync({ key: 'claims/photo.jpg' });
window.open(url);`,
    setupGuide: `1. Set STORAGE_PROVIDER=s3 in .env
2. Configure S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY
3. Create the bucket in S3/MinIO with appropriate CORS policy
4. Restart BFF

For Azure: change STORAGE_PROVIDER=azure, set AZURE_STORAGE_CONNECTION_STRING and AZURE_STORAGE_CONTAINER.`,
  },
  {
    name: 'Notifications',
    description: 'Send notifications via email/SMS. Swap providers via NOTIFICATION_ADAPTER.',
    port: 'NotificationPort',
    portInterface: `abstract class NotificationPort {
  abstract send(dto: SendNotificationDto): Promise<NotificationResult>;
  abstract sendBulk(dtos: SendNotificationDto[]): Promise<NotificationResult[]>;
}

interface SendNotificationDto {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
  channel?: 'email' | 'sms';
}`,
    adapters: [
      {
        name: 'SmtpAdapter',
        envValue: 'smtp',
        description: 'Sends email via SMTP (any mail server, Exchange, Gmail). Uses nodemailer under the hood.',
        config: `SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=portal@company.com
SMTP_PASS=app-password`,
      },
      {
        name: 'SendGridAdapter',
        envValue: 'sendgrid',
        description: 'Sends email via SendGrid REST API. Supports templates and tracking.',
        config: `SENDGRID_API_KEY=SG.xxxx
SENDGRID_FROM_EMAIL=portal@company.com`,
      },
    ],
    envVar: 'NOTIFICATION_ADAPTER',
    endpoints: [
      { method: 'POST', path: '/notifications/send', description: 'Send a notification', sampleBody: JSON.stringify({ to: 'user@example.com', subject: 'Claim Update', template: 'claim-status', data: { claimId: 'CLM-001', status: 'Approved' } }, null, 2) },
      { method: 'POST', path: '/notifications/send-bulk', description: 'Send bulk notifications', sampleBody: JSON.stringify([{ to: 'a@example.com', subject: 'Update', template: 'general', data: {} }], null, 2) },
    ],
    sdkUsage: `import { useSendNotification } from '@dxp/sdk-react';

const send = useSendNotification();
send.mutate({
  to: 'user@example.com',
  subject: 'Your claim has been approved',
  template: 'claim-status',
  data: { claimId: 'CLM-001', status: 'Approved', amount: '$4,200' }
});`,
    setupGuide: `1. Set NOTIFICATION_ADAPTER=smtp (or sendgrid) in .env
2. For SMTP: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
3. For SendGrid: set SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
4. Restart BFF

Templates are rendered server-side. Pass template name + data object — the adapter fills in the template.`,
  },
  {
    name: 'Search',
    description: 'Full-text search and autocomplete. Uses PostgreSQL tsvector/tsquery by default — no separate search engine needed.',
    port: 'SearchPort',
    portInterface: `abstract class SearchPort {
  abstract search<T>(query: SearchQuery): Promise<SearchResult<T>>;
  abstract suggest(table: string, term: string, limit?: number): Promise<string[]>;
}

interface SearchQuery {
  table: string;
  term: string;
  filters?: Record<string, unknown>;
  page?: number;
  pageSize?: number;
}`,
    adapters: [
      {
        name: 'PostgresFtsAdapter',
        envValue: 'default',
        description: 'Uses PostgreSQL full-text search (tsvector/tsquery). Good for < 100K records. No additional infrastructure needed.',
        config: `# Uses the same DATABASE_URL as the BFF
# Requires a tsvector column on searchable tables:
# ALTER TABLE policies ADD COLUMN search_vector tsvector;
# CREATE INDEX idx_policies_search ON policies USING gin(search_vector);`,
      },
    ],
    envVar: 'default (Postgres)',
    endpoints: [
      { method: 'GET', path: '/search?table=policies&q=auto', description: 'Full-text search' },
      { method: 'GET', path: '/search/suggest?table=policies&q=tes', description: 'Autocomplete suggestions' },
    ],
    sdkUsage: `import { useSearch, useSuggest } from '@dxp/sdk-react';

// Search with debouncing (built into the hook)
const { data } = useSearch('policies', searchTerm, {
  page: 1,
  pageSize: 20,
  enabled: searchTerm.length > 0
});

// Autocomplete (triggers at 2+ chars)
const { data: suggestions } = useSuggest('policies', partial);`,
    setupGuide: `1. Add a tsvector column to searchable tables
2. Create a GIN index on the tsvector column
3. Optionally create a trigger to auto-update the vector on INSERT/UPDATE
4. No env var needed — Postgres FTS is the default

For OpenSearch (> 100K records): add OpenSearch from optional/, create OpenSearchAdapter, set SEARCH_PROVIDER=opensearch.`,
  },
  {
    name: 'Documents',
    description: 'Document lifecycle — upload metadata, get download URLs, categorize. Tenant-scoped.',
    port: 'DocumentPort',
    portInterface: `abstract class DocumentPort {
  abstract upload(tenantId: string, dto: UploadDocumentDto): Promise<DocumentMetadata>;
  abstract getById(tenantId: string, id: string): Promise<DocumentMetadata>;
  abstract list(tenantId: string, query: DocumentQuery): Promise<{ data: DocumentMetadata[]; total: number }>;
  abstract getDownloadUrl(tenantId: string, id: string): Promise<string>;
  abstract delete(tenantId: string, id: string): Promise<void>;
}

interface DocumentMetadata {
  id: string; name: string; mimeType: string;
  size: number; category: string;
  uploadedBy: string; uploadedAt: string; url?: string;
}`,
    adapters: [
      {
        name: 'S3DocumentAdapter',
        envValue: 's3',
        description: 'Stores documents in S3 with tenant-scoped key prefixes: {tenantId}/{category}/{docId}-{name}. Metadata can be stored in PostgreSQL or S3 tags.',
        config: `S3_BUCKET=dxp-documents
S3_REGION=us-east-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...`,
      },
    ],
    envVar: 'DOCUMENT_PROVIDER',
    endpoints: [
      { method: 'GET', path: '/documents', description: 'List all documents' },
      { method: 'GET', path: '/documents?category=claims', description: 'List by category' },
      { method: 'GET', path: '/documents/doc-123', description: 'Get document metadata' },
      { method: 'GET', path: '/documents/doc-123/download-url', description: 'Get download URL' },
      { method: 'POST', path: '/documents', description: 'Upload document', sampleBody: JSON.stringify({ name: 'damage-photo.jpg', category: 'claims', mimeType: 'image/jpeg', data: 'base64...' }, null, 2) },
      { method: 'DELETE', path: '/documents/doc-123', description: 'Delete document' },
    ],
    sdkUsage: `import { useDocuments, useDocumentUpload } from '@dxp/sdk-react';

// List documents by category
const { data } = useDocuments('claims');

// Upload a document
const upload = useDocumentUpload();
upload.mutate({
  name: 'damage-photo.jpg',
  category: 'claims',
  mimeType: 'image/jpeg',
  data: base64String
});`,
    setupGuide: `1. Set DOCUMENT_PROVIDER=s3 in .env
2. Configure S3 credentials (same as Storage module)
3. Documents are stored with tenant-scoped prefixes for isolation
4. The /documents endpoints auto-scope to the authenticated user's tenant

For SharePoint: build SharePointAdapter implementing DocumentPort, using Microsoft Graph API.`,
  },
  {
    name: 'Identity',
    description: 'User profile management. Reads/writes user data via Keycloak Admin API.',
    port: 'IdentityPort',
    portInterface: `abstract class IdentityPort {
  abstract getUser(userId: string): Promise<UserProfile>;
  abstract listUsers(tenantId: string, page?: number, pageSize?: number): Promise<{ data: UserProfile[]; total: number }>;
  abstract updateUser(userId: string, dto: UpdateProfileDto): Promise<UserProfile>;
  abstract resetPassword(userId: string): Promise<void>;
}

interface UserProfile {
  id: string; email: string;
  firstName: string; lastName: string;
  roles: string[]; tenantId: string;
  enabled: boolean; createdAt: string;
}`,
    adapters: [
      {
        name: 'KeycloakAdminAdapter',
        envValue: 'default',
        description: 'Uses Keycloak Admin REST API to manage users. Requires a service account with realm-management role.',
        config: `KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=dxp
# BFF uses its service account token to call admin API`,
      },
    ],
    envVar: 'default (Keycloak)',
    endpoints: [
      { method: 'GET', path: '/identity/me', description: 'Current user profile' },
      { method: 'GET', path: '/identity/users', description: 'List tenant users' },
      { method: 'PUT', path: '/identity/users/user-123', description: 'Update user profile', sampleBody: JSON.stringify({ firstName: 'Sarah', lastName: 'Thompson' }, null, 2) },
      { method: 'POST', path: '/identity/users/user-123/reset-password', description: 'Trigger password reset' },
    ],
    sdkUsage: `import { useAuth } from '@dxp/sdk-react';

// Get current user (from JWT + Keycloak)
const { user, isAuthenticated, isLoading } = useAuth();
// user.email, user.firstName, user.roles, user.tenantId`,
    setupGuide: `1. Keycloak is already configured — no additional setup
2. The BFF's service account (dxp-bff client) has realm-management permissions
3. /identity/me reads from the JWT token + Keycloak user info
4. /identity/users requires portal-admin role

For Azure AD: build AzureAdAdapter implementing IdentityPort, using Microsoft Graph API /users endpoint.`,
  },
  {
    name: 'Integration',
    description: 'Generic proxy to external client systems. Configure integrations via JSON — no code needed for REST APIs.',
    port: 'IntegrationPort',
    portInterface: `abstract class IntegrationPort {
  abstract call(integration: string, request: IntegrationRequest): Promise<IntegrationResponse>;
  abstract listIntegrations(): Promise<IntegrationConfig[]>;
}

interface IntegrationRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  queryParams?: Record<string, string>;
}`,
    adapters: [
      {
        name: 'RestAdapter',
        envValue: 'default',
        description: 'Config-driven REST proxy. Define integrations in JSON — the adapter handles auth, URL construction, and error mapping. Covers 60% of integration needs without custom code.',
        config: `INTEGRATIONS_CONFIG='[
  {
    "name": "salesforce",
    "baseUrl": "https://myorg.salesforce.com",
    "authType": "oauth2"
  },
  {
    "name": "billing-api",
    "baseUrl": "https://billing.internal.com/api",
    "authType": "apikey"
  }
]'`,
      },
    ],
    envVar: 'INTEGRATIONS_CONFIG',
    endpoints: [
      { method: 'GET', path: '/integrations', description: 'List configured integrations' },
      { method: 'POST', path: '/integrations/salesforce/call', description: 'Call an integration', sampleBody: JSON.stringify({ method: 'GET', path: '/services/data/v58.0/sobjects/Account', headers: {}, queryParams: { limit: '10' } }, null, 2) },
    ],
    sdkUsage: `import { apiFetch } from '@dxp/sdk-react';

// Call any configured integration
const accounts = await apiFetch('/integrations/salesforce/call', {
  method: 'POST',
  body: JSON.stringify({
    method: 'GET',
    path: '/services/data/v58.0/sobjects/Account',
    queryParams: { limit: '10' }
  })
});`,
    setupGuide: `1. Define integrations in INTEGRATIONS_CONFIG env var (JSON array)
2. Each integration needs: name, baseUrl, authType (basic|bearer|apikey|oauth2)
3. The RestAdapter proxies requests to the configured baseUrl
4. Portal calls POST /integrations/{name}/call with the request details

For SAP/SOAP: build SapAdapter or SoapAdapter implementing IntegrationPort. The port interface stays the same.`,
  },

  // ── FHIR / Da Vinci Healthcare Modules ────────────────────────────────────

  {
    name: 'Prior Auth (Da Vinci PAS)',
    description:
      'Prior Authorization Support following the HL7 Da Vinci PAS IG. Maps FHIR Claim (use=preauthorization) + ClaimResponse. Also implements CRD (Coverage Requirements Discovery) and DTR (Documentation Templates & Rules).',
    port: 'PriorAuthPort',
    portInterface: `abstract class PriorAuthPort {
  abstract listPriorAuths(tenantId: string, filters: PAQueueFilters): Promise<FhirPaginatedResult<PriorAuthSummary>>;
  abstract getPriorAuthDetail(tenantId: string, id: string): Promise<PriorAuthDetail>;

  // CRD — check if prior auth is required before ordering
  abstract checkRequirement(tenantId: string, serviceCode: string, memberId: string): Promise<CRDResponse>;

  // DTR — fetch questionnaire for a service code
  abstract getDocTemplate(tenantId: string, serviceCode: string): Promise<DTRTemplate>;

  // PAS — submit a new prior auth request
  abstract submitRequest(tenantId: string, data: PASubmission): Promise<PriorAuthSummary>;

  // Record a payer decision (approved / denied / pended)
  abstract decide(tenantId: string, id: string, decision: PADecision): Promise<PriorAuthDetail>;

  abstract getDashboardMetrics(tenantId: string): Promise<PADashboardMetrics>;
  abstract getReviewQueue(tenantId: string, filters: PAQueueFilters): Promise<FhirPaginatedResult<PriorAuthSummary>>;
}`,
    adapters: [
      {
        name: 'DaVinciPASAdapter',
        envValue: 'davinci-pas',
        description:
          'Reads/writes FHIR R4 Claim (use=preauthorization) and ClaimResponse. Uses _include=Claim:patient to resolve member names in a single round-trip. Follows the Da Vinci PAS v2.0 IG.',
        config: `PRIOR_AUTH_ADAPTER=davinci-pas
FHIR_BASE_URL=http://localhost:8090/fhir
FHIR_AUTH_TOKEN=   # optional SMART-on-FHIR bearer token`,
      },
      {
        name: 'ManualPAAdapter',
        envValue: 'manual-pa',
        description: 'Returns stub data. No FHIR server required. Useful for demos and CI.',
        config: `PRIOR_AUTH_ADAPTER=manual-pa`,
      },
    ],
    envVar: 'PRIOR_AUTH_ADAPTER',
    endpoints: [
      { method: 'GET',  path: '/prior-auth',                    description: 'List prior authorizations' },
      { method: 'GET',  path: '/prior-auth/queue',               description: 'Clinical review queue (internal payer)' },
      { method: 'GET',  path: '/prior-auth/dashboard',           description: 'Dashboard metrics (approval rate, turnaround, top services)' },
      { method: 'GET',  path: '/prior-auth/template/27447',      description: 'DTR — questionnaire for CPT 27447' },
      { method: 'POST', path: '/prior-auth/check',               description: 'CRD — check if prior auth is required', sampleBody: JSON.stringify({ serviceCode: '27447', memberId: 'member-001' }, null, 2) },
      { method: 'POST', path: '/prior-auth/submit',              description: 'PAS — submit a new PA request', sampleBody: JSON.stringify({ memberId: 'member-001', serviceCode: '27447', urgency: 'routine', clinicalReasonCode: 'M17.11', requestedServiceDate: { start: '2026-05-01' }, notes: 'Conservative treatment failed after 6 months.' }, null, 2) },
      { method: 'PUT',  path: '/prior-auth/pa-id-here/decide',   description: 'Record a payer decision', sampleBody: JSON.stringify({ decision: 'approved', rationale: 'Medical necessity criteria met.', expirationDate: '2026-12-31' }, null, 2) },
    ],
    sdkUsage: `import { usePriorAuths, usePACheck, usePASubmit, usePAQueue, usePADashboard } from '@dxp/sdk-react';

// Member — list their PAs
const { data } = usePriorAuths({ status: 'in-review' });

// Provider — CRD check before ordering
const check = usePACheck();
const { requiresAuth } = await check.mutateAsync({ serviceCode: '27447', memberId });

// Provider — submit PAS request
const submit = usePASubmit();
submit.mutate({ memberId, serviceCode: '27447', urgency: 'routine', ... });

// Internal — payer review queue + decisions
const { data: queue } = usePAQueue({ urgency: 'urgent' });`,
    setupGuide: `Da Vinci PAS (Prior Authorization Support)
1. Set PRIOR_AUTH_ADAPTER=davinci-pas
2. Set FHIR_BASE_URL=http://localhost:8090/fhir
3. Run "make up" to start HAPI FHIR, then "pnpm seed:fhir" to seed 30 PA requests
4. Restart BFF — all /prior-auth endpoints now read from HAPI FHIR

FHIR Resource Mapping:
  Claim (use=preauthorization)  →  PriorAuthSummary / PriorAuthDetail
  ClaimResponse                 →  decision, rationale, expirationDate
  CoverageEligibilityResponse   →  CRD check (/prior-auth/check)
  Questionnaire                 →  DTR template (/prior-auth/template/:code)

Da Vinci IGs implemented: PAS v2.0, CRD v2.0, DTR v2.0
Stub mode (no FHIR): set PRIOR_AUTH_ADAPTER=manual-pa`,
  },
  {
    name: 'Claims (FHIR EOB)',
    description:
      'Reads claims and Explanations of Benefit from FHIR R4 ExplanationOfBenefit resources. Supports member-facing claims history, itemized EOB detail, and appeal submission.',
    port: 'ClaimsPort',
    portInterface: `abstract class ClaimsPort {
  abstract listClaims(tenantId: string, memberId: string, filters: ClaimFilters): Promise<FhirPaginatedResult<ClaimSummary>>;
  abstract getClaimDetail(tenantId: string, id: string): Promise<ClaimSummary>;
  abstract getEOB(tenantId: string, id: string): Promise<EOBDetail>;
  abstract submitAppeal(tenantId: string, claimId: string, data: AppealSubmission): Promise<Appeal>;
  abstract getDashboardMetrics(tenantId: string): Promise<ClaimDashboardMetrics>;
}`,
    adapters: [
      {
        name: 'FhirClaimAdapter',
        envValue: 'fhir-claim',
        description: 'Queries FHIR R4 ExplanationOfBenefit. Resolves patient via _include. Maps adjudication arrays to billed/allowed/paid amounts.',
        config: `CLAIMS_ADAPTER=fhir-claim
FHIR_BASE_URL=http://localhost:8090/fhir`,
      },
      {
        name: 'ManualClaimAdapter',
        envValue: 'manual',
        description: 'Returns stub claims. No FHIR server required.',
        config: `CLAIMS_ADAPTER=manual`,
      },
    ],
    envVar: 'CLAIMS_ADAPTER',
    endpoints: [
      { method: 'GET',  path: '/claims?memberId=member-001',       description: 'List claims for a member' },
      { method: 'GET',  path: '/claims/dashboard',                  description: 'Claims dashboard (totals, denial rate, avg processing time)' },
      { method: 'POST', path: '/claims/claim-id/appeal',            description: 'Submit a claim appeal', sampleBody: JSON.stringify({ reason: 'Medical necessity not evaluated', supportingNotes: 'See clinical documentation', documentIds: [] }, null, 2) },
    ],
    sdkUsage: `import { useClaims, useClaimEOB, useAppeal } from '@dxp/sdk-react';

// Member — list their claims
const { data } = useClaims({ status: 'processed', page: 1 });

// Itemized EOB
const { data: eob } = useClaimEOB(claimId);
// eob.billedAmount, eob.allowedAmount, eob.memberResponsibility

// Appeal
const appeal = useAppeal();
appeal.mutate({ claimId, reason: 'Billing error on service date' });`,
    setupGuide: `FHIR Claims (ExplanationOfBenefit)
1. Set CLAIMS_ADAPTER=fhir-claim
2. Set FHIR_BASE_URL=http://localhost:8090/fhir
3. Run "pnpm seed:fhir" — seeds ~200 ExplanationOfBenefit across 50 patients
4. Query: GET /claims?memberId=<patient-uuid>

FHIR Resource Mapping:
  ExplanationOfBenefit  →  ClaimSummary, EOBDetail
    .patient            →  memberId (resolved via _include=EOB:patient)
    .item[]             →  service line items
    .adjudication[]     →  billed / allowed / paid amounts
    .outcome            →  status (complete = processed, queued = pending)`,
  },
  {
    name: 'Eligibility (FHIR Coverage)',
    description:
      'Member benefits, deductible accumulators, cost estimates, and digital ID card. Reads FHIR R4 Coverage + CoverageEligibilityResponse. Enables real-time eligibility verification for providers.',
    port: 'EligibilityPort',
    portInterface: `abstract class EligibilityPort {
  abstract getBenefits(tenantId: string, memberId: string): Promise<BenefitCategory[]>;
  abstract getAccumulators(tenantId: string, memberId: string): Promise<Accumulators>;
  abstract getCostEstimate(tenantId: string, serviceCode: string, memberId: string): Promise<CostEstimate>;
  abstract getIdCard(tenantId: string, memberId: string): Promise<DigitalIdCard>;
}`,
    adapters: [
      {
        name: 'FhirCoverageAdapter',
        envValue: 'fhir-coverage',
        description: 'Reads FHIR Coverage resources for plan details. Uses CoverageEligibilityResponse for real-time eligibility checks.',
        config: `ELIGIBILITY_ADAPTER=fhir-coverage
FHIR_BASE_URL=http://localhost:8090/fhir`,
      },
      {
        name: 'ManualEligibilityAdapter',
        envValue: 'manual',
        description: 'Returns stub benefits and ID card. No FHIR server required.',
        config: `ELIGIBILITY_ADAPTER=manual`,
      },
    ],
    envVar: 'ELIGIBILITY_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/eligibility/benefits?memberId=member-001',      description: 'Benefit categories (medical, dental, vision, Rx)' },
      { method: 'GET', path: '/eligibility/accumulators?memberId=member-001',   description: 'Deductible and OOP max progress' },
      { method: 'GET', path: '/eligibility/id-card?memberId=member-001',        description: 'Digital ID card (plan, group, member number)' },
      { method: 'GET', path: '/eligibility/cost-estimate?serviceCode=27447&memberId=member-001', description: 'Real-time cost estimate for a service' },
    ],
    sdkUsage: `import { useBenefits, useAccumulators, useIdCard, useCostEstimate } from '@dxp/sdk-react';

const { data: benefits }     = useBenefits(memberId);
const { data: accumulators } = useAccumulators(memberId);
// accumulators.deductible.met / .total, accumulators.oopMax.met / .total

const { data: card }         = useIdCard(memberId);
// card.memberName, card.memberId, card.planName, card.groupNumber

const { data: estimate }     = useCostEstimate('27447', memberId);
// estimate.estimatedCost, estimate.memberResponsibility`,
    setupGuide: `FHIR Eligibility (Coverage)
1. Set ELIGIBILITY_ADAPTER=fhir-coverage
2. Set FHIR_BASE_URL=http://localhost:8090/fhir
3. Run "pnpm seed:fhir" — seeds Coverage for each of 50 patients (HMO, PPO, Medicare Advantage)

FHIR Resource Mapping:
  Coverage                     →  planName, planType, groupNumber, effectiveDate
  CoverageEligibilityResponse  →  benefit limits, remaining amounts, accumulators

Provider Eligibility Check:
  /eligibility/id-card is designed for point-of-service verification.
  Providers confirm active coverage before rendering care.`,
  },
  {
    name: 'Provider Directory',
    description:
      'Search, validate, and retrieve quality metrics for providers. Reads FHIR Practitioner, PractitionerRole, Organization, and Location. Supports NPPES NPI Registry as an alternative adapter.',
    port: 'ProviderDirectoryPort',
    portInterface: `abstract class ProviderDirectoryPort {
  abstract search(tenantId: string, params: ProviderSearchParams): Promise<FhirPaginatedResult<ProviderSummary>>;
  abstract getByNPI(tenantId: string, npi: string): Promise<ProviderDetail>;
  abstract validate(tenantId: string, npi: string): Promise<ProviderValidation>;
  abstract getQualityMetrics(tenantId: string): Promise<ProviderQualityMetrics[]>;
}`,
    adapters: [
      {
        name: 'FhirProviderAdapter',
        envValue: 'fhir-provider',
        description: 'Reads Practitioner + PractitionerRole + Organization from HAPI. Filters by name, specialty, location, network status.',
        config: `PROVIDER_DIR_ADAPTER=fhir-provider
FHIR_BASE_URL=http://localhost:8090/fhir`,
      },
      {
        name: 'NppesAdapter',
        envValue: 'nppes',
        description: 'Queries the CMS NPPES NPI Registry (public, no auth). Useful when the client has no internal FHIR provider directory.',
        config: `PROVIDER_DIR_ADAPTER=nppes
# NPPES_BASE_URL=https://npiregistry.cms.hhs.gov/api  (default)`,
      },
    ],
    envVar: 'PROVIDER_DIR_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/providers/search?specialty=Cardiology&pageSize=5', description: 'Search by specialty' },
      { method: 'GET', path: '/providers/1000000000',                              description: 'Full provider profile by NPI' },
      { method: 'GET', path: '/providers/1000000000/validate',                     description: 'Validate NPI — license, sanctions, network' },
      { method: 'GET', path: '/providers/quality?pageSize=10',                     description: 'Provider quality metrics (HEDIS, star ratings)' },
    ],
    sdkUsage: `import { useProviderSearch, useProviderDetail } from '@dxp/sdk-react';

// Find in-network providers
const { data } = useProviderSearch({
  specialty: 'Cardiology',
  location: '90210',
  network: 'in-network',
});

// Profile + quality metrics
const { data: provider } = useProviderDetail(npi);
// provider.name, provider.specialties[], provider.qualityMetrics.hedisStarRating`,
    setupGuide: `Provider Directory
Option A — Internal FHIR Directory:
1. Set PROVIDER_DIR_ADAPTER=fhir-provider
2. Run "pnpm seed:fhir" — seeds 100 Practitioner + PractitionerRole + Organization
3. GET /providers/search?specialty=Cardiology

Option B — NPPES NPI Registry (CMS public data):
1. Set PROVIDER_DIR_ADAPTER=nppes
2. No credentials needed — resolves from national NPI registry in real time

Da Vinci PDex Plan Net IG:
  FhirProviderAdapter follows the Da Vinci PDex Plan Net IG for provider directory
  interoperability — health plans can exchange directory data with other payers.`,
  },
  {
    name: 'Risk Stratification (HCC)',
    description:
      'Population health risk scoring using CMS-HCC v28 methodology. Computes RAF scores from FHIR Condition and Claim resources. Powers care manager worklist, member risk profiles, and care gap closure.',
    port: 'RiskStratificationPort',
    portInterface: `abstract class RiskStratificationPort {
  abstract getPopulationDashboard(tenantId: string): Promise<PopulationDashboardMetrics>;
  abstract getRiskWorklist(tenantId: string, params: WorklistParams): Promise<WorklistEntry[]>;
  abstract getMemberRiskProfile(tenantId: string, memberId: string): Promise<MemberRiskProfile>;
  abstract getCareGaps(tenantId: string, memberId: string): Promise<CareGap[]>;
  abstract closeCareGap(tenantId: string, gapId: string, data: CloseGapRequest): Promise<CareGap>;
}`,
    adapters: [
      {
        name: 'HccEngineAdapter',
        envValue: 'hcc-engine',
        description: 'Computes CMS-HCC v28 RAF scores from FHIR Condition (ICD-10) resources. Generates care gaps and ranks members by risk tier for proactive outreach.',
        config: `RISK_STRAT_ADAPTER=hcc-engine
FHIR_BASE_URL=http://localhost:8090/fhir
HCC_MODEL_VERSION=v28`,
      },
    ],
    envVar: 'RISK_STRAT_ADAPTER',
    endpoints: [
      { method: 'GET',  path: '/population/dashboard',                          description: 'Population KPIs (high-risk count, avg RAF, gap closure rate)' },
      { method: 'GET',  path: '/population/worklist?tier=high&pageSize=10',     description: 'Care manager worklist — members ranked by risk tier' },
      { method: 'GET',  path: '/population/member/member-id/risk',              description: 'Member risk profile (RAF score, HCC categories, care gaps)' },
      { method: 'GET',  path: '/population/care-gaps?memberId=member-001',      description: 'Open care gaps for a member (HEDIS-based)' },
      { method: 'POST', path: '/population/care-gaps/gap-id/close',             description: 'Close a care gap with evidence', sampleBody: JSON.stringify({ closureType: 'documented', notes: 'A1c lab resulted 7.2% on 2026-03-15.' }, null, 2) },
    ],
    sdkUsage: `import { usePopulationDashboard, useRiskWorklist, useMemberRiskProfile, useCareGaps } from '@dxp/sdk-react';

// Population KPIs
const { data: pop } = usePopulationDashboard();
// pop.highRiskMembers, pop.avgRafScore, pop.openCareGaps

// Care manager worklist (highest RAF first)
const { data: worklist } = useRiskWorklist({ tier: 'high', pageSize: 25 });

// Member drill-down
const { data: risk } = useMemberRiskProfile(memberId);
// risk.rafScore, risk.hccCategories[], risk.tier, risk.careGaps[]`,
    setupGuide: `Risk Stratification (CMS-HCC v28)
1. Set RISK_STRAT_ADAPTER=hcc-engine
2. Set FHIR_BASE_URL=http://localhost:8090/fhir
3. Run "pnpm seed:fhir" — seeds ICD-10 Condition resources for 50 patients.
   The HCC engine computes RAF scores at query time from these Conditions.

HCC Score Computation:
  Condition.code (ICD-10)  →  HCC Category lookup  →  RAF addend
  Sum of addends           →  Member RAF score
  Risk banding: < 0.8 = low | 0.8–1.5 = medium | > 1.5 = high | > 2.5 = critical

Care Gap Logic:
  Cross-references HEDIS measures against member claims to identify open gaps
  (e.g. A1c not tested in 12 months, mammogram overdue, colorectal screening missing).`,
  },

  // ── Core Platform (continued) ──────────────────────────────────────────

  {
    name: 'Scheduling',
    description: 'Appointment booking and availability. Google Calendar adapter included.',
    port: 'SchedulingPort',
    portInterface: `abstract class SchedulingPort {\n  abstract createAppointment(dto: CreateAppointmentDto): Promise<Appointment>;\n  abstract getAppointment(id: string): Promise<Appointment>;\n  abstract listAppointments(from: string, to: string): Promise<Appointment[]>;\n  abstract cancelAppointment(id: string, reason?: string): Promise<void>;\n  abstract getAvailability(userId: string, date: string): Promise<AvailabilitySlot[]>;\n}`,
    adapters: [{ name: 'GoogleCalendarAdapter', envValue: 'google', description: 'Google Calendar API integration.', config: 'GOOGLE_SERVICE_ACCOUNT=path/to/sa.json' }],
    envVar: 'SCHEDULING_PROVIDER',
    endpoints: [
      { method: 'POST', path: '/scheduling/appointments', description: 'Create appointment' },
      { method: 'GET', path: '/scheduling/appointments', description: 'List appointments' },
      { method: 'GET', path: '/scheduling/appointments/:id', description: 'Get appointment' },
      { method: 'DELETE', path: '/scheduling/appointments/:id', description: 'Cancel appointment' },
      { method: 'GET', path: '/scheduling/availability/:userId', description: 'Get available slots' },
    ],
    sdkUsage: `import { apiFetch } from '@dxp/sdk-react';\nconst slots = await apiFetch('/scheduling/availability/user-1?date=2026-04-15');`,
    setupGuide: '1. Set SCHEDULING_PROVIDER=google\n2. Provide Google service account JSON\n3. Set GOOGLE_CALENDAR_ID',
  },
  {
    name: 'Payments',
    description: 'Payment processing and subscriptions. Stripe adapter included.',
    port: 'PaymentsPort',
    portInterface: `abstract class PaymentsPort {\n  abstract createPayment(dto: CreatePaymentDto): Promise<PaymentIntent>;\n  abstract getPayment(id: string): Promise<PaymentIntent>;\n  abstract listPayments(customerId?: string): Promise<PaymentIntent[]>;\n  abstract refundPayment(id: string, amount?: number): Promise<PaymentIntent>;\n  abstract createSubscription(customerId: string, planId: string): Promise<Subscription>;\n  abstract cancelSubscription(subscriptionId: string): Promise<void>;\n}`,
    adapters: [{ name: 'StripeAdapter', envValue: 'stripe', description: 'Full Stripe integration — intents, subscriptions, refunds.', config: 'STRIPE_SECRET_KEY=sk_test_...\nSTRIPE_WEBHOOK_SECRET=whsec_...' }],
    envVar: 'PAYMENTS_PROVIDER',
    endpoints: [
      { method: 'POST', path: '/payments', description: 'Create payment intent' },
      { method: 'GET', path: '/payments', description: 'List payments' },
      { method: 'GET', path: '/payments/:id', description: 'Get payment' },
      { method: 'POST', path: '/payments/:id/refund', description: 'Refund payment' },
      { method: 'POST', path: '/payments/subscriptions', description: 'Create subscription' },
    ],
    sdkUsage: `import { apiFetch } from '@dxp/sdk-react';\nconst intent = await apiFetch('/payments', { method: 'POST', body: JSON.stringify({ amount: 4999, currency: 'usd' }) });`,
    setupGuide: '1. Set PAYMENTS_PROVIDER=stripe\n2. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET',
  },
  {
    name: 'E-Signature',
    description: 'Electronic signature workflows. DocuSign adapter included.',
    port: 'ESignaturePort',
    portInterface: `abstract class ESignaturePort {\n  abstract createEnvelope(request: SignatureRequest): Promise<SignatureEnvelope>;\n  abstract getEnvelope(envelopeId: string): Promise<SignatureEnvelope>;\n  abstract listEnvelopes(status?: string): Promise<SignatureEnvelope[]>;\n  abstract voidEnvelope(envelopeId: string, reason: string): Promise<void>;\n  abstract getSigningUrl(envelopeId: string, signerEmail: string): Promise<string>;\n}`,
    adapters: [{ name: 'DocuSignAdapter', envValue: 'docusign', description: 'DocuSign eSignature API — envelopes, embedded signing.', config: 'DOCUSIGN_INTEGRATION_KEY=...\nDOCUSIGN_ACCOUNT_ID=...' }],
    envVar: 'ESIGNATURE_PROVIDER',
    endpoints: [
      { method: 'POST', path: '/esignature/envelopes', description: 'Create signing envelope' },
      { method: 'GET', path: '/esignature/envelopes', description: 'List envelopes' },
      { method: 'GET', path: '/esignature/envelopes/:id', description: 'Get envelope status' },
      { method: 'POST', path: '/esignature/envelopes/:id/signing-url', description: 'Get signing URL' },
    ],
    sdkUsage: `import { apiFetch } from '@dxp/sdk-react';\nconst envelope = await apiFetch('/esignature/envelopes', { method: 'POST', body: JSON.stringify({ documentUrl: '...', signers: [{ name: 'Jane', email: 'jane@example.com' }] }) });`,
    setupGuide: '1. Set ESIGNATURE_PROVIDER=docusign\n2. Set DOCUSIGN_INTEGRATION_KEY and DOCUSIGN_ACCOUNT_ID',
  },
  {
    name: 'Chat',
    description: 'Customer support chat — conversations, messages, agent assignment. Intercom adapter.',
    port: 'ChatPort',
    portInterface: `abstract class ChatPort {\n  abstract createConversation(userId: string, dto: CreateConversationDto): Promise<Conversation>;\n  abstract getConversation(conversationId: string): Promise<Conversation>;\n  abstract listConversations(userId: string, status?: string): Promise<Conversation[]>;\n  abstract sendMessage(conversationId: string, content: string, sender: 'user' | 'agent'): Promise<ChatMessage>;\n  abstract closeConversation(conversationId: string): Promise<void>;\n}`,
    adapters: [{ name: 'IntercomAdapter', envValue: 'intercom', description: 'Intercom Conversations API integration.', config: 'INTERCOM_ACCESS_TOKEN=...' }],
    envVar: 'CHAT_PROVIDER',
    endpoints: [
      { method: 'POST', path: '/chat/conversations', description: 'Start conversation' },
      { method: 'GET', path: '/chat/conversations', description: 'List conversations' },
      { method: 'POST', path: '/chat/conversations/:id/messages', description: 'Send message' },
      { method: 'POST', path: '/chat/conversations/:id/close', description: 'Close conversation' },
    ],
    sdkUsage: `import { apiFetch } from '@dxp/sdk-react';\nconst conv = await apiFetch('/chat/conversations', { method: 'POST', body: JSON.stringify({ subject: 'Help', message: 'Order delayed' }) });`,
    setupGuide: '1. Set CHAT_PROVIDER=intercom\n2. Set INTERCOM_ACCESS_TOKEN',
  },
  {
    name: 'Workflow',
    description: 'Workflow automation — trigger, monitor, manage. n8n adapter included.',
    port: 'WorkflowPort',
    portInterface: `abstract class WorkflowPort {\n  abstract triggerWorkflow(dto: TriggerWorkflowDto): Promise<WorkflowExecution>;\n  abstract getExecution(executionId: string): Promise<WorkflowExecution>;\n  abstract listExecutions(workflowId?: string, status?: string): Promise<WorkflowExecution[]>;\n  abstract listWorkflows(active?: boolean): Promise<WorkflowDefinition[]>;\n  abstract activateWorkflow(workflowId: string): Promise<void>;\n  abstract deactivateWorkflow(workflowId: string): Promise<void>;\n}`,
    adapters: [{ name: 'N8nAdapter', envValue: 'n8n', description: 'n8n REST API — trigger workflows, read execution history.', config: 'N8N_URL=http://localhost:5678\nN8N_API_KEY=...' }],
    envVar: 'WORKFLOW_PROVIDER',
    endpoints: [
      { method: 'POST', path: '/workflow/trigger', description: 'Trigger a workflow' },
      { method: 'GET', path: '/workflow/executions', description: 'List executions' },
      { method: 'GET', path: '/workflow/definitions', description: 'List workflow definitions' },
    ],
    sdkUsage: `import { apiFetch } from '@dxp/sdk-react';\nconst exec = await apiFetch('/workflow/trigger', { method: 'POST', body: JSON.stringify({ workflowId: 'wf-claim-review', data: { claimId: 'CLM-001' } }) });`,
    setupGuide: '1. Set WORKFLOW_PROVIDER=n8n\n2. Set N8N_URL and N8N_API_KEY',
  },
  {
    name: 'Audit',
    description: 'Immutable audit trail — log actions, query history, compliance reports. PostgreSQL adapter.',
    port: 'AuditPort',
    portInterface: `abstract class AuditPort {\n  abstract log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry>;\n  abstract query(query: AuditQuery): Promise<{ data: AuditEntry[]; total: number }>;\n  abstract getEntry(id: string): Promise<AuditEntry>;\n  abstract generateReport(type: string, from: string, to: string): Promise<ComplianceReport>;\n  abstract exportEntries(query: AuditQuery, format: 'json' | 'csv'): Promise<string>;\n}`,
    adapters: [{ name: 'PostgresAuditAdapter', envValue: 'postgres', description: 'PostgreSQL audit storage with compliance reporting.', config: '# Uses DATABASE_URL' }],
    envVar: 'AUDIT_PROVIDER',
    endpoints: [
      { method: 'GET', path: '/audit', description: 'Query audit log' },
      { method: 'GET', path: '/audit/:id', description: 'Get audit entry' },
      { method: 'POST', path: '/audit/report', description: 'Generate compliance report' },
      { method: 'GET', path: '/audit/export', description: 'Export audit entries' },
    ],
    sdkUsage: `import { apiFetch } from '@dxp/sdk-react';\nconst { data } = await apiFetch('/audit?action=login&from=2026-04-01');`,
    setupGuide: '1. Set AUDIT_PROVIDER=postgres (default)\n2. The audit_entries table auto-creates on first run',
  },

  // ── Wealth — APAC Markets ──────────────────────────────────────────────

  {
    name: 'Market Data',
    description: 'Real-time stock quotes, APAC indices, symbol search, price history.',
    port: 'MarketDataPort',
    portInterface: `abstract class MarketDataPort {\n  abstract getQuote(symbol: string): Promise<StockQuote>;\n  abstract getQuotes(symbols: string[]): Promise<StockQuote[]>;\n  abstract getApacIndices(): Promise<ApacIndex[]>;\n  abstract searchSymbols(query: string): Promise<SymbolSearchResult[]>;\n  abstract getPriceHistory(symbol: string, range: string): Promise<PriceBar[]>;\n}`,
    adapters: [
      { name: 'MockMarketAdapter', envValue: 'mock', description: 'Mock APAC market data.', config: 'MARKET_DATA_ADAPTER=mock' },
      { name: 'YahooFinanceAdapter', envValue: 'yahoo-finance', description: 'Yahoo Finance v8 chart API.', config: '# No key required' },
      { name: 'AlphaVantageAdapter', envValue: 'alpha-vantage', description: 'Alpha Vantage API.', config: 'ALPHA_VANTAGE_KEY=...' },
    ],
    envVar: 'MARKET_DATA_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/market/quote/D05.SI', description: 'Get real-time quote' },
      { method: 'GET', path: '/market/indices', description: 'Get APAC indices' },
      { method: 'GET', path: '/market/search?q=DBS', description: 'Search symbols' },
      { method: 'GET', path: '/market/history/D05.SI?range=1mo', description: 'Get price history' },
    ],
    sdkUsage: `import { useStockQuote, useApacIndices, usePriceHistory } from '@dxp/sdk-react';\nconst { data } = useStockQuote('D05.SI');`,
    setupGuide: '1. MARKET_DATA_ADAPTER=mock for dev\n2. yahoo-finance for live data (no key)\n3. Never use v7 quote — always v8 chart',
  },
  {
    name: 'FX Rates',
    description: 'Foreign exchange rates — APAC currencies, SGD spreads, conversion.',
    port: 'FxRatesPort',
    portInterface: `abstract class FxRatesPort {\n  abstract getRates(base: string): Promise<FxRatesSnapshot>;\n  abstract getApacRates(): Promise<FxRate[]>;\n  abstract convert(from: string, to: string, amount: number): Promise<FxConvertResult>;\n  abstract getSgdRates(): Promise<SgdRate[]>;\n}`,
    adapters: [
      { name: 'MockFxAdapter', envValue: 'mock', description: 'Mock APAC FX rates.', config: 'FX_ADAPTER=mock' },
      { name: 'ExchangeRateApiAdapter', envValue: 'exchangerate-api', description: 'Live rates for 160+ currencies.', config: 'EXCHANGERATE_API_KEY=...' },
    ],
    envVar: 'FX_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/fx/rates?base=USD', description: 'Get FX rates' },
      { method: 'GET', path: '/fx/apac', description: 'Get APAC rates vs USD' },
      { method: 'GET', path: '/fx/convert?from=USD&to=SGD&amount=1000', description: 'Convert currency' },
    ],
    sdkUsage: `import { useFxRates, useFxConvert } from '@dxp/sdk-react';\nconst { data } = useFxRates('USD');`,
    setupGuide: '1. FX_ADAPTER=mock for dev\n2. exchangerate-api for live rates',
  },
  {
    name: 'Wealth Portfolio',
    description: 'Portfolio management — holdings, transactions, P&L. Multi-currency APAC.',
    port: 'WealthPortfolioPort',
    portInterface: `abstract class WealthPortfolioPort {\n  abstract getPortfolio(userId: string, baseCurrency: string): Promise<PortfolioSummary>;\n  abstract getHoldings(userId: string, baseCurrency: string, filters: PortfolioFilters): Promise<Holding[]>;\n  abstract getTransactions(userId: string, page: number, pageSize: number): Promise<{ data: Transaction[]; total: number }>;\n  abstract addTransaction(userId: string, tx: Omit<Transaction, 'id'>): Promise<Transaction>;\n}`,
    adapters: [{ name: 'MockPortfolioAdapter', envValue: 'mock', description: 'Mock portfolio with SGX/HKEX/ASX holdings.', config: 'PORTFOLIO_ADAPTER=mock' }],
    envVar: 'PORTFOLIO_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/wealth/portfolio?baseCurrency=SGD', description: 'Get portfolio' },
      { method: 'GET', path: '/wealth/holdings', description: 'Get holdings' },
      { method: 'POST', path: '/wealth/transactions', description: 'Record transaction' },
    ],
    sdkUsage: `import { usePortfolio, useHoldings } from '@dxp/sdk-react';\nconst { data } = usePortfolio('SGD');`,
    setupGuide: '1. PORTFOLIO_ADAPTER=mock for dev\n2. Build PostgresPortfolioAdapter for production',
  },
  {
    name: 'Paper Trading',
    description: 'Simulated trading engine — orders, paper portfolio, price alerts. No real money.',
    port: 'PaperTradingPort',
    portInterface: `abstract class PaperTradingPort {\n  abstract getPaperPortfolio(userId: string): Promise<PaperPortfolio>;\n  abstract getOrders(userId: string, status?: OrderStatus): Promise<Order[]>;\n  abstract placeOrder(userId: string, req: PlaceOrderRequest): Promise<Order>;\n  abstract cancelOrder(userId: string, orderId: string): Promise<Order>;\n  abstract getAlerts(userId: string): Promise<Alert[]>;\n  abstract createAlert(userId: string, req: CreateAlertRequest): Promise<Alert>;\n}`,
    adapters: [{ name: 'PaperEngineAdapter', envValue: 'paper', description: 'In-memory paper trading engine using live market prices.', config: 'TRADING_ADAPTER=paper' }],
    envVar: 'TRADING_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/paper/portfolio', description: 'Get paper portfolio' },
      { method: 'POST', path: '/paper/orders', description: 'Place order' },
      { method: 'GET', path: '/paper/alerts', description: 'Get price alerts' },
      { method: 'POST', path: '/paper/alerts', description: 'Create alert' },
    ],
    sdkUsage: `import { usePaperPortfolio, usePlaceOrder } from '@dxp/sdk-react';\nconst { data } = usePaperPortfolio();`,
    setupGuide: '1. TRADING_ADAPTER=paper (default)\n2. Uses MarketDataPort for live prices',
  },
  {
    name: 'Broker Gateway',
    description: 'Live broker integration — real order execution via Tiger Brokers or IBKR.',
    port: 'BrokerGatewayPort',
    portInterface: `abstract class BrokerGatewayPort {\n  abstract getBrokerAccount(userId: string): Promise<BrokerAccount>;\n  abstract placeBrokerOrder(userId: string, req: PlaceOrderRequest): Promise<Order>;\n  abstract getBrokerOrders(userId: string): Promise<Order[]>;\n  abstract cancelBrokerOrder(userId: string, orderId: string): Promise<Order>;\n}`,
    adapters: [
      { name: 'TigerBrokerAdapter', envValue: 'tiger', description: 'Tiger Brokers Open API — SGX, HKEX, US.', config: 'TIGER_PRIVATE_KEY=path/to/key.pem\nTIGER_TIGER_ID=...' },
      { name: 'IBKRAdapter', envValue: 'ibkr', description: 'Interactive Brokers Client Portal API.', config: 'IBKR_HOST=https://localhost:5000' },
    ],
    envVar: 'BROKER_PROVIDER',
    endpoints: [
      { method: 'GET', path: '/broker/account', description: 'Get broker account' },
      { method: 'POST', path: '/broker/orders', description: 'Place live order' },
      { method: 'GET', path: '/broker/orders', description: 'Get live orders' },
    ],
    sdkUsage: `import { useBrokerAccount, usePlaceBrokerOrder } from '@dxp/sdk-react';\nconst { data } = useBrokerAccount();`,
    setupGuide: '1. BROKER_PROVIDER=tiger or ibkr\n2. WARNING: Real trades with real money',
  },

  // ── Retail — ACE Hardware ──────────────────────────────────────────────

  {
    name: 'Inventory',
    description: 'Product catalog and stock management — SKU lookup, stock levels, barcode scan.',
    port: 'InventoryPort',
    portInterface: `abstract class InventoryPort {\n  abstract listProducts(query: ProductQuery): Promise<ProductList>;\n  abstract getProduct(id: string): Promise<InventoryProduct>;\n  abstract getStockLevels(storeId: string): Promise<StockLevel[]>;\n  abstract barcodeLookup(code: string): Promise<InventoryProduct | null>;\n  abstract adjustStock(storeId: string, productId: string, dto: AdjustStockDto): Promise<StockLevel>;\n}`,
    adapters: [{ name: 'MockInventoryAdapter', envValue: 'mock', description: '50 products across Paint, Tools, Plumbing, Electrical, Outdoor, Hardware.', config: 'INVENTORY_ADAPTER=mock' }],
    envVar: 'INVENTORY_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/inventory/products', description: 'List products' },
      { method: 'GET', path: '/inventory/products/:id', description: 'Get product' },
      { method: 'GET', path: '/inventory/stock/:storeId', description: 'Get stock levels' },
      { method: 'GET', path: '/inventory/barcode/:code', description: 'Barcode lookup' },
    ],
    sdkUsage: `import { useProducts, useStockLevels } from '@dxp/sdk-react';\nconst { data } = useProducts({ category: 'tools' });`,
    setupGuide: '1. INVENTORY_ADAPTER=mock (default)\n2. For SAP: build SapInventoryAdapter',
  },
  {
    name: 'POS Connector',
    description: 'Point-of-sale data — daily sales, category breakdown, top sellers.',
    port: 'PosConnectorPort',
    portInterface: `abstract class PosConnectorPort {\n  abstract getDailySales(storeId: string, date: string): Promise<DailySales>;\n  abstract getSalesRange(storeId: string, from: string, to: string): Promise<DailySales[]>;\n  abstract getCategoryBreakdown(storeId: string): Promise<CategoryBreakdown[]>;\n  abstract getTopSellers(storeId: string): Promise<TopSeller[]>;\n}`,
    adapters: [{ name: 'MockPosAdapter', envValue: 'mock', description: '30 days of hourly sales data per store.', config: 'POS_ADAPTER=mock' }],
    envVar: 'POS_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/pos/sales/daily/:storeId', description: 'Get daily sales' },
      { method: 'GET', path: '/pos/categories/:storeId', description: 'Category breakdown' },
      { method: 'GET', path: '/pos/top-sellers/:storeId', description: 'Top sellers' },
    ],
    sdkUsage: `import { useDailySales, useTopSellers } from '@dxp/sdk-react';\nconst { data } = useDailySales('S001');`,
    setupGuide: '1. POS_ADAPTER=mock (default)\n2. For Square: build SquarePosAdapter',
  },
  {
    name: 'Project Planner',
    description: 'DIY project templates — materials lists, cost estimates, step-by-step guides.',
    port: 'ProjectPlannerPort',
    portInterface: `abstract class ProjectPlannerPort {\n  abstract listTemplates(): Promise<ProjectTemplate[]>;\n  abstract getTemplate(id: string): Promise<ProjectTemplate>;\n  abstract getMaterialsList(id: string): Promise<MaterialItem[]>;\n  abstract estimateCost(id: string): Promise<CostEstimate>;\n}`,
    adapters: [{ name: 'MockProjectAdapter', envValue: 'mock', description: '5 DIY templates: Deck, Bathroom, Kitchen, Fence, Garage.', config: 'PROJECT_PLANNER_ADAPTER=mock' }],
    envVar: 'PROJECT_PLANNER_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/projects', description: 'List templates' },
      { method: 'GET', path: '/projects/:id', description: 'Get template' },
      { method: 'GET', path: '/projects/:id/materials', description: 'Materials list' },
    ],
    sdkUsage: `import { useProjectTemplates, useMaterialsList } from '@dxp/sdk-react';\nconst { data } = useProjectTemplates();`,
    setupGuide: '1. PROJECT_PLANNER_ADAPTER=mock (default)\n2. Materials linked to inventory SKUs',
  },
  {
    name: 'Loyalty',
    description: 'Loyalty program — member profiles, points earn/redeem, tiers, rewards catalog.',
    port: 'LoyaltyPort',
    portInterface: `abstract class LoyaltyPort {\n  abstract getMember(memberId: string): Promise<LoyaltyMember>;\n  abstract getPointsBalance(memberId: string): Promise<number>;\n  abstract getTransactionHistory(memberId: string): Promise<PointsTransaction[]>;\n  abstract earnPoints(memberId: string, points: number, description: string, orderId?: string): Promise<PointsTransaction>;\n  abstract redeemPoints(memberId: string, rewardId: string): Promise<PointsTransaction>;\n  abstract getRewardsCatalog(): Promise<Reward[]>;\n  abstract getTierStatus(memberId: string): Promise<TierStatus>;\n}`,
    adapters: [{ name: 'MockLoyaltyAdapter', envValue: 'mock', description: '3 members, 10 rewards, tier progression.', config: 'LOYALTY_ADAPTER=mock' }],
    envVar: 'LOYALTY_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/loyalty/members/:id', description: 'Get member' },
      { method: 'GET', path: '/loyalty/members/:id/points', description: 'Get points' },
      { method: 'POST', path: '/loyalty/members/:id/earn', description: 'Earn points' },
      { method: 'POST', path: '/loyalty/members/:id/redeem', description: 'Redeem reward' },
      { method: 'GET', path: '/loyalty/rewards', description: 'Rewards catalog' },
    ],
    sdkUsage: `import { useLoyaltyMember, useRewardsCatalog } from '@dxp/sdk-react';\nconst { data } = useLoyaltyMember('LM001');`,
    setupGuide: '1. LOYALTY_ADAPTER=mock (default)\n2. For production: connect to Salesforce/Punchh',
  },
  // ── Conversational AI Assistant ─────────────────────────────────────────
  {
    name: 'Conversational AI',
    description: 'Configurable AI conversation assistant — ReAct agent (LLM + tools) driven by JSON persona configs. Multi-modal: text, voice (Whisper + TTS), file upload (vision + PDF). Works for any vertical.',
    port: 'AgenticPort',
    portInterface: `abstract class AgenticPort {\n  abstract listConfigs(): Promise<AgentConfig[]>;\n  abstract getUIConfig(): Promise<AgentUIConfig>;\n  abstract getReadiness(): Promise<ReadinessReport>;\n  abstract getUserPreferences(userId: string): Promise<Record<string, unknown>>;\n  abstract getChatWebSocketUrl(sessionId: string): string;\n}`,
    adapters: [
      { name: 'LangGraphAdapter', envValue: 'langgraph', description: 'FastAPI + LangGraph ReAct agent.', config: 'AGENTIC_ADAPTER=langgraph\nAGENTIC_BACKEND_URL=http://localhost:8002' },
      { name: 'MockAgenticAdapter', envValue: 'mock', description: 'Canned responses for offline dev.', config: 'AGENTIC_ADAPTER=mock' },
    ],
    envVar: 'AGENTIC_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/agentic/configs', description: 'List agent configs' },
      { method: 'GET', path: '/agentic/config', description: 'Active UI config' },
      { method: 'GET', path: '/agentic/readiness', description: 'Data quality score' },
    ],
    sdkUsage: `import { AgenticAssistant } from './components/agent/AgenticAssistant';\n<AgenticAssistant />`,
    setupGuide: '1. cd apps/conversational-assistant && ./setup.sh\n2. pnpm nx run conversational-assistant:dev\n3. Set AGENTIC_CONFIG_ID in .env',
  },
  {
    name: 'Config Builder',
    description: 'LLM-powered persona generator — describe your domain in natural language, get a full agent config. Domain-scoped.',
    port: 'AgenticPort',
    portInterface: `POST /api/agent-configs/generate → { config: {...} }\nPOST /api/agent-configs/save → { id, saved: true }`,
    adapters: [{ name: 'LangGraphAdapter', envValue: 'langgraph', description: 'Uses OpenAI LLM for generation.', config: 'AGENTIC_ADAPTER=langgraph' }],
    envVar: 'AGENTIC_ADAPTER',
    endpoints: [
      { method: 'POST', path: '/agent-configs/generate', description: 'Generate config from text' },
      { method: 'POST', path: '/agent-configs/save', description: 'Save generated config' },
    ],
    sdkUsage: `import { ConfigBuilder } from './pages/manager/ConfigBuilder';`,
    setupGuide: '1. Add ConfigBuilder page to manager view\n2. Describe domain → Generate → Save',
  },
  {
    name: 'Data Pipeline',
    description: 'Upload data, trigger ingestion into pgvector + graph, enrich with LLM-inferred features.',
    port: 'AgenticPort',
    portInterface: `POST /api/data-pipeline/ingest\nPOST /api/data-pipeline/enrich\nGET  /api/data-pipeline/status`,
    adapters: [{ name: 'LangGraphAdapter', envValue: 'langgraph', description: 'Runs against PostgreSQL + pgvector + AGE.', config: 'AGENTIC_ADAPTER=langgraph' }],
    envVar: 'AGENTIC_ADAPTER',
    endpoints: [
      { method: 'POST', path: '/data-pipeline/ingest', description: 'Run ingestion' },
      { method: 'POST', path: '/data-pipeline/enrich', description: 'Enrich graph' },
      { method: 'GET', path: '/data-pipeline/status', description: 'Pipeline status' },
    ],
    sdkUsage: `import { DataPipeline } from './pages/manager/DataPipeline';`,
    setupGuide: '1. Create data config with field_map + embedding template\n2. Upload source → Ingest → Enrich → Check Readiness',
  },
  {
    name: 'Readiness Monitor',
    description: 'Scores data quality across 5 dimensions. Target ≥ 90 for production.',
    port: 'AgenticPort',
    portInterface: `GET /api/readiness → { overall, dimensions, issues, recommendations }`,
    adapters: [{ name: 'LangGraphAdapter', envValue: 'langgraph', description: 'Scores live database.', config: 'AGENTIC_ADAPTER=langgraph' }],
    envVar: 'AGENTIC_ADAPTER',
    endpoints: [{ method: 'GET', path: '/agentic/readiness', description: 'Readiness score' }],
    sdkUsage: `import { AgentReadiness } from './pages/manager/AgentReadiness';`,
    setupGuide: '1. Ensure backend running with ingested data\n2. Target: overall ≥ 90',
  },
];
