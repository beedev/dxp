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

export type ModuleDomain = 'Core Platform' | 'Healthcare — FHIR / Da Vinci' | 'Wealth — APAC Markets' | 'Retail — ACE Hardware' | 'Conversational AI Assistant';

export interface AdapterModule {
  name: string;
  domain: ModuleDomain;
  badge?: string;
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
    domain: 'Core Platform',
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
    domain: 'Core Platform',
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
    domain: 'Core Platform',
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
    domain: 'Core Platform',
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
    domain: 'Core Platform',
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
    domain: 'Core Platform',
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
    domain: 'Core Platform',
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

  // ── Core Platform (continued) ──────────────────────────────────────────

  {
    name: 'Scheduling',
    domain: 'Core Platform',
    description: 'Appointment booking and availability. Google Calendar adapter included — swap for Outlook/Calendly via env var.',
    port: 'SchedulingPort',
    portInterface: `abstract class SchedulingPort {
  abstract createAppointment(dto: CreateAppointmentDto): Promise<Appointment>;
  abstract getAppointment(id: string): Promise<Appointment>;
  abstract listAppointments(from: string, to: string): Promise<Appointment[]>;
  abstract cancelAppointment(id: string, reason?: string): Promise<void>;
  abstract getAvailability(userId: string, date: string): Promise<AvailabilitySlot[]>;
}`,
    adapters: [
      { name: 'GoogleCalendarAdapter', envValue: 'google', description: 'Connects to Google Calendar API. Creates events, checks free/busy, handles attendees.', config: `GOOGLE_SERVICE_ACCOUNT=path/to/sa.json\nGOOGLE_CALENDAR_ID=primary` },
    ],
    envVar: 'SCHEDULING_PROVIDER',
    endpoints: [
      { method: 'POST', path: '/scheduling/appointments', description: 'Create appointment', sampleBody: JSON.stringify({ title: 'Store visit', startTime: '2026-04-15T10:00:00Z', endTime: '2026-04-15T10:30:00Z', attendees: ['user@example.com'] }, null, 2) },
      { method: 'GET', path: '/scheduling/appointments?from=2026-04-01&to=2026-04-30', description: 'List appointments in range' },
      { method: 'GET', path: '/scheduling/appointments/apt-123', description: 'Get appointment' },
      { method: 'DELETE', path: '/scheduling/appointments/apt-123', description: 'Cancel appointment' },
      { method: 'GET', path: '/scheduling/availability/user-1?date=2026-04-15', description: 'Get available slots' },
    ],
    sdkUsage: `// No SDK hook yet — call via apiFetch
import { apiFetch } from '@dxp/sdk-react';
const slots = await apiFetch('/scheduling/availability/user-1?date=2026-04-15');`,
    setupGuide: `1. Set SCHEDULING_PROVIDER=google in .env
2. Provide a Google service account JSON with Calendar API access
3. Set GOOGLE_CALENDAR_ID (or 'primary' for the SA's default calendar)
4. Restart BFF

For Outlook: build OutlookAdapter implementing SchedulingPort, using Microsoft Graph /events endpoint.`,
  },
  {
    name: 'Payments',
    domain: 'Core Platform',
    description: 'Payment processing and subscriptions. Stripe adapter included — swap providers via PAYMENTS_PROVIDER.',
    port: 'PaymentsPort',
    portInterface: `abstract class PaymentsPort {
  abstract createPayment(dto: CreatePaymentDto): Promise<PaymentIntent>;
  abstract getPayment(id: string): Promise<PaymentIntent>;
  abstract listPayments(customerId?: string): Promise<PaymentIntent[]>;
  abstract refundPayment(id: string, amount?: number): Promise<PaymentIntent>;
  abstract createSubscription(customerId: string, planId: string): Promise<Subscription>;
  abstract cancelSubscription(subscriptionId: string): Promise<void>;
  abstract listSubscriptions(customerId: string): Promise<Subscription[]>;
}`,
    adapters: [
      { name: 'StripeAdapter', envValue: 'stripe', description: 'Full Stripe integration — payment intents, subscriptions, refunds. Uses Stripe Node SDK.', config: `STRIPE_SECRET_KEY=sk_test_...\nSTRIPE_WEBHOOK_SECRET=whsec_...` },
    ],
    envVar: 'PAYMENTS_PROVIDER',
    endpoints: [
      { method: 'POST', path: '/payments', description: 'Create payment intent', sampleBody: JSON.stringify({ amount: 4999, currency: 'usd', description: 'Order #1234', customerId: 'cus_abc' }, null, 2) },
      { method: 'GET', path: '/payments?customerId=cus_abc', description: 'List payments' },
      { method: 'GET', path: '/payments/pi_123', description: 'Get payment' },
      { method: 'POST', path: '/payments/pi_123/refund', description: 'Refund payment' },
      { method: 'POST', path: '/payments/subscriptions', description: 'Create subscription', sampleBody: JSON.stringify({ customerId: 'cus_abc', planId: 'plan_monthly' }, null, 2) },
      { method: 'GET', path: '/payments/subscriptions/cus_abc', description: 'List subscriptions' },
    ],
    sdkUsage: `// No SDK hook yet — call via apiFetch
import { apiFetch } from '@dxp/sdk-react';
const intent = await apiFetch('/payments', {
  method: 'POST',
  body: JSON.stringify({ amount: 4999, currency: 'usd' })
});`,
    setupGuide: `1. Set PAYMENTS_PROVIDER=stripe in .env
2. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
3. Restart BFF

For Square: build SquareAdapter implementing PaymentsPort.`,
  },
  {
    name: 'E-Signature',
    domain: 'Core Platform',
    description: 'Electronic signature workflows. DocuSign adapter included — create envelopes, track status, get signing URLs.',
    port: 'ESignaturePort',
    portInterface: `abstract class ESignaturePort {
  abstract createEnvelope(request: SignatureRequest): Promise<SignatureEnvelope>;
  abstract getEnvelope(envelopeId: string): Promise<SignatureEnvelope>;
  abstract listEnvelopes(status?: string): Promise<SignatureEnvelope[]>;
  abstract voidEnvelope(envelopeId: string, reason: string): Promise<void>;
  abstract getSigningUrl(envelopeId: string, signerEmail: string): Promise<string>;
}`,
    adapters: [
      { name: 'DocuSignAdapter', envValue: 'docusign', description: 'Full DocuSign eSignature API integration — envelopes, embedded signing, webhooks.', config: `DOCUSIGN_INTEGRATION_KEY=...\nDOCUSIGN_SECRET_KEY=...\nDOCUSIGN_ACCOUNT_ID=...\nDOCUSIGN_BASE_URL=https://demo.docusign.net` },
    ],
    envVar: 'ESIGNATURE_PROVIDER',
    endpoints: [
      { method: 'POST', path: '/esignature/envelopes', description: 'Create signing envelope', sampleBody: JSON.stringify({ documentUrl: 'https://...', signers: [{ name: 'Jane Doe', email: 'jane@example.com', role: 'signer' }], subject: 'Please sign' }, null, 2) },
      { method: 'GET', path: '/esignature/envelopes', description: 'List envelopes' },
      { method: 'GET', path: '/esignature/envelopes/env-123', description: 'Get envelope status' },
      { method: 'POST', path: '/esignature/envelopes/env-123/signing-url', description: 'Get embedded signing URL', sampleBody: JSON.stringify({ signerEmail: 'jane@example.com' }, null, 2) },
    ],
    sdkUsage: `import { apiFetch } from '@dxp/sdk-react';
const envelope = await apiFetch('/esignature/envelopes', {
  method: 'POST',
  body: JSON.stringify({
    documentUrl: 'https://storage.example.com/contract.pdf',
    signers: [{ name: 'Jane Doe', email: 'jane@example.com', role: 'signer' }],
    subject: 'Contract for review'
  })
});`,
    setupGuide: `1. Set ESIGNATURE_PROVIDER=docusign in .env
2. Register a DocuSign app and get integration + secret keys
3. Set DOCUSIGN_ACCOUNT_ID and DOCUSIGN_BASE_URL
4. Restart BFF

For Adobe Sign: build AdobeSignAdapter implementing ESignaturePort.`,
  },
  {
    name: 'Chat',
    domain: 'Core Platform',
    description: 'Customer support chat — conversations, messages, agent assignment. Intercom adapter included.',
    port: 'ChatPort',
    portInterface: `abstract class ChatPort {
  abstract createConversation(userId: string, dto: CreateConversationDto): Promise<Conversation>;
  abstract getConversation(conversationId: string): Promise<Conversation>;
  abstract listConversations(userId: string, status?: string): Promise<Conversation[]>;
  abstract sendMessage(conversationId: string, content: string, sender: 'user' | 'agent'): Promise<ChatMessage>;
  abstract closeConversation(conversationId: string): Promise<void>;
}`,
    adapters: [
      { name: 'IntercomAdapter', envValue: 'intercom', description: 'Connects to Intercom Conversations API. Maps Intercom conversations/messages to ChatPort types.', config: `INTERCOM_ACCESS_TOKEN=...\nINTERCOM_WORKSPACE_ID=...` },
    ],
    envVar: 'CHAT_PROVIDER',
    endpoints: [
      { method: 'POST', path: '/chat/conversations', description: 'Start a conversation', sampleBody: JSON.stringify({ subject: 'Order issue', message: 'My order is delayed', category: 'support', priority: 'high' }, null, 2) },
      { method: 'GET', path: '/chat/conversations?status=open', description: 'List conversations' },
      { method: 'GET', path: '/chat/conversations/conv-123', description: 'Get conversation' },
      { method: 'POST', path: '/chat/conversations/conv-123/messages', description: 'Send message', sampleBody: JSON.stringify({ content: 'Can you check the tracking?', sender: 'user' }, null, 2) },
      { method: 'POST', path: '/chat/conversations/conv-123/close', description: 'Close conversation' },
    ],
    sdkUsage: `import { apiFetch } from '@dxp/sdk-react';
const conv = await apiFetch('/chat/conversations', {
  method: 'POST',
  body: JSON.stringify({ subject: 'Help with order', message: 'Order #123 is delayed' })
});`,
    setupGuide: `1. Set CHAT_PROVIDER=intercom in .env
2. Set INTERCOM_ACCESS_TOKEN from Intercom Developer Hub
3. Restart BFF

For Zendesk: build ZendeskAdapter implementing ChatPort.`,
  },
  {
    name: 'Workflow',
    domain: 'Core Platform',
    description: 'Workflow automation — trigger, monitor, and manage workflows. n8n adapter included.',
    port: 'WorkflowPort',
    portInterface: `abstract class WorkflowPort {
  abstract triggerWorkflow(dto: TriggerWorkflowDto): Promise<WorkflowExecution>;
  abstract getExecution(executionId: string): Promise<WorkflowExecution>;
  abstract listExecutions(workflowId?: string, status?: string): Promise<WorkflowExecution[]>;
  abstract listWorkflows(active?: boolean): Promise<WorkflowDefinition[]>;
  abstract activateWorkflow(workflowId: string): Promise<void>;
  abstract deactivateWorkflow(workflowId: string): Promise<void>;
}`,
    adapters: [
      { name: 'N8nAdapter', envValue: 'n8n', description: 'Connects to n8n REST API. Triggers workflows, reads execution history, manages activation.', config: `N8N_URL=http://localhost:5678\nN8N_API_KEY=...` },
    ],
    envVar: 'WORKFLOW_PROVIDER',
    endpoints: [
      { method: 'POST', path: '/workflow/trigger', description: 'Trigger a workflow', sampleBody: JSON.stringify({ workflowId: 'wf-claim-review', data: { claimId: 'CLM-001' } }, null, 2) },
      { method: 'GET', path: '/workflow/executions?workflowId=wf-claim-review', description: 'List executions' },
      { method: 'GET', path: '/workflow/executions/exec-456', description: 'Get execution status' },
      { method: 'GET', path: '/workflow/definitions?active=true', description: 'List workflow definitions' },
      { method: 'POST', path: '/workflow/definitions/wf-123/activate', description: 'Activate workflow' },
      { method: 'POST', path: '/workflow/definitions/wf-123/deactivate', description: 'Deactivate workflow' },
    ],
    sdkUsage: `import { apiFetch } from '@dxp/sdk-react';
const execution = await apiFetch('/workflow/trigger', {
  method: 'POST',
  body: JSON.stringify({ workflowId: 'wf-claim-review', data: { claimId: 'CLM-001' } })
});`,
    setupGuide: `1. Set WORKFLOW_PROVIDER=n8n in .env
2. Set N8N_URL and N8N_API_KEY
3. Create workflows in n8n UI, note their IDs
4. Restart BFF

For Temporal: build TemporalAdapter (see optional/temporal for starter code).`,
  },
  {
    name: 'Audit',
    domain: 'Core Platform',
    description: 'Immutable audit trail — log actions, query history, generate compliance reports. PostgreSQL adapter included.',
    port: 'AuditPort',
    portInterface: `abstract class AuditPort {
  abstract log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry>;
  abstract query(query: AuditQuery): Promise<{ data: AuditEntry[]; total: number }>;
  abstract getEntry(id: string): Promise<AuditEntry>;
  abstract generateReport(type: string, from: string, to: string, tenantId?: string): Promise<ComplianceReport>;
  abstract exportEntries(query: AuditQuery, format: 'json' | 'csv'): Promise<string>;
}`,
    adapters: [
      { name: 'PostgresAuditAdapter', envValue: 'postgres', description: 'Stores audit entries in PostgreSQL. Supports compliance report generation and CSV export.', config: `# Uses the same DATABASE_URL as the BFF\n# Auto-creates audit_entries table on first run` },
    ],
    envVar: 'AUDIT_PROVIDER',
    endpoints: [
      { method: 'GET', path: '/audit?action=login&from=2026-04-01', description: 'Query audit log' },
      { method: 'GET', path: '/audit/entry-789', description: 'Get audit entry' },
      { method: 'POST', path: '/audit/report', description: 'Generate compliance report', sampleBody: JSON.stringify({ type: 'access', from: '2026-01-01', to: '2026-03-31' }, null, 2) },
      { method: 'GET', path: '/audit/export?format=csv&from=2026-04-01', description: 'Export audit entries' },
    ],
    sdkUsage: `import { apiFetch } from '@dxp/sdk-react';
// Query audit log
const { data, total } = await apiFetch('/audit?action=login&from=2026-04-01');`,
    setupGuide: `1. Set AUDIT_PROVIDER=postgres in .env (default)
2. The audit_entries table is auto-created on first BFF start
3. All BFF modules auto-log via the AuditPort

For OpenSearch/Elasticsearch: build an ElasticAuditAdapter for scalable audit storage.`,
  },

  // ── Healthcare — FHIR / Da Vinci ───────────────────────────────────────

  {
    name: 'Prior Auth (Da Vinci PAS)',
    domain: 'Healthcare — FHIR / Da Vinci',
    badge: 'FHIR R4',
    description: 'Prior authorization via Da Vinci PAS IG. Submit, check, and decide PA requests using FHIR Claim resources.',
    port: 'PriorAuthPort',
    portInterface: `abstract class PriorAuthPort {
  abstract submitPA(dto: PASubmitDto): Promise<PriorAuth>;
  abstract getPA(id: string): Promise<PriorAuth>;
  abstract listPAs(filters: PAFilters): Promise<{ data: PriorAuth[]; total: number }>;
  abstract checkRequired(dto: PACheckDto): Promise<PACheckResult>;
  abstract getTemplate(serviceCode: string): Promise<PATemplate>;
  abstract decide(id: string, decision: PADecisionDto): Promise<PriorAuth>;
  abstract getQueue(filters: PAQueueFilters): Promise<PAQueueItem[]>;
  abstract getDashboard(): Promise<PADashboard>;
}`,
    adapters: [
      { name: 'MockPriorAuthAdapter', envValue: 'mock', description: 'Full mock adapter with realistic PA workflows, auto-approval rules, and queue management.', config: `PA_ADAPTER=mock` },
    ],
    envVar: 'PA_ADAPTER',
    endpoints: [
      { method: 'POST', path: '/prior-auth/submit', description: 'Submit PA request' },
      { method: 'GET', path: '/prior-auth/pa-123', description: 'Get PA status' },
      { method: 'GET', path: '/prior-auth?status=pending', description: 'List PAs with filters' },
      { method: 'POST', path: '/prior-auth/check', description: 'Check if PA required' },
      { method: 'GET', path: '/prior-auth/template/surgery', description: 'Get PA template for service' },
      { method: 'POST', path: '/prior-auth/pa-123/decide', description: 'Approve/deny PA', sampleBody: JSON.stringify({ decision: 'approved', notes: 'Meets criteria' }, null, 2) },
      { method: 'GET', path: '/prior-auth/queue', description: 'Get review queue' },
      { method: 'GET', path: '/prior-auth/dashboard', description: 'Get PA dashboard stats' },
    ],
    sdkUsage: `import { usePriorAuths, usePASubmit, usePACheck } from '@dxp/sdk-react';

const { data } = usePriorAuths({ status: 'pending' });
const submit = usePASubmit();
submit.mutate({ memberId: 'M001', serviceCode: 'knee-replacement', ... });`,
    setupGuide: `1. Set PA_ADAPTER=mock in .env (default)
2. The mock adapter simulates a full PA workflow with auto-decision rules
3. For a real payer system: build adapter implementing PriorAuthPort using X12 278 or FHIR PAS`,
  },
  {
    name: 'Claims (FHIR EOB)',
    domain: 'Healthcare — FHIR / Da Vinci',
    badge: 'FHIR R4',
    description: 'Claims processing via FHIR ExplanationOfBenefit. Submit, track, and appeal claims.',
    port: 'ClaimsPort',
    portInterface: `abstract class ClaimsPort {
  abstract listClaims(filters: ClaimFilters): Promise<{ data: Claim[]; total: number }>;
  abstract getClaimDetail(id: string): Promise<ClaimDetail>;
  abstract getEOB(claimId: string): Promise<EOBSummary>;
  abstract submitAppeal(claimId: string, dto: AppealDto): Promise<AppealResult>;
  abstract getDashboard(memberId?: string): Promise<ClaimsDashboard>;
}`,
    adapters: [
      { name: 'MockClaimsAdapter', envValue: 'mock', description: 'Mock claims with realistic EOB data, ICD-10/CPT codes, and appeal workflows.', config: `CLAIMS_ADAPTER=mock` },
    ],
    envVar: 'CLAIMS_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/claims?status=processed', description: 'List claims' },
      { method: 'GET', path: '/claims/CLM-001', description: 'Get claim detail' },
      { method: 'GET', path: '/claims/CLM-001/eob', description: 'Get EOB summary' },
      { method: 'POST', path: '/claims/CLM-001/appeal', description: 'Submit appeal' },
      { method: 'GET', path: '/claims/dashboard', description: 'Get claims dashboard' },
    ],
    sdkUsage: `import { useClaims, useClaimDetail, useAppeal } from '@dxp/sdk-react';

const { data } = useClaims({ status: 'processed' });
const { data: detail } = useClaimDetail('CLM-001');
const appeal = useAppeal();`,
    setupGuide: `1. Set CLAIMS_ADAPTER=mock in .env (default)
2. The mock adapter provides realistic claims with EOB data
3. For production: build adapter connecting to your claims adjudication system`,
  },
  {
    name: 'Eligibility (FHIR Coverage)',
    domain: 'Healthcare — FHIR / Da Vinci',
    badge: 'FHIR R4',
    description: 'Member eligibility via FHIR Coverage. Benefits, accumulators, cost estimates, and ID cards.',
    port: 'EligibilityPort',
    portInterface: `abstract class EligibilityPort {
  abstract getBenefits(memberId: string): Promise<BenefitsSummary>;
  abstract getAccumulators(memberId: string): Promise<Accumulator[]>;
  abstract getCostEstimate(dto: CostEstimateRequest): Promise<CostEstimate>;
  abstract getIdCard(memberId: string): Promise<IdCardData>;
}`,
    adapters: [
      { name: 'MockEligibilityAdapter', envValue: 'mock', description: 'Mock benefits, accumulators, and cost estimates with realistic plan data.', config: `ELIGIBILITY_ADAPTER=mock` },
    ],
    envVar: 'ELIGIBILITY_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/eligibility/benefits/M001', description: 'Get benefits summary' },
      { method: 'GET', path: '/eligibility/accumulators/M001', description: 'Get accumulators (deductible, OOP max)' },
      { method: 'POST', path: '/eligibility/cost-estimate', description: 'Estimate cost for a service' },
      { method: 'GET', path: '/eligibility/id-card/M001', description: 'Get digital ID card data' },
    ],
    sdkUsage: `import { useBenefits, useAccumulators, useCostEstimate, useIdCard } from '@dxp/sdk-react';

const { data: benefits } = useBenefits('M001');
const { data: accumulators } = useAccumulators('M001');`,
    setupGuide: `1. Set ELIGIBILITY_ADAPTER=mock in .env (default)
2. For production: integrate with your TPA or benefits administration system via FHIR Coverage`,
  },
  {
    name: 'Provider Directory',
    domain: 'Healthcare — FHIR / Da Vinci',
    badge: 'FHIR R4',
    description: 'Provider search via FHIR Practitioner/PractitionerRole. Search by specialty, location, network status.',
    port: 'ProviderDirectoryPort',
    portInterface: `abstract class ProviderDirectoryPort {
  abstract searchProviders(query: ProviderSearchQuery): Promise<{ data: Provider[]; total: number }>;
  abstract getProviderDetail(npi: string): Promise<ProviderDetail>;
}`,
    adapters: [
      { name: 'MockProviderAdapter', envValue: 'mock', description: 'Mock provider directory with realistic NPI data, specialties, and locations.', config: `PROVIDER_ADAPTER=mock` },
    ],
    envVar: 'PROVIDER_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/providers?specialty=cardiology&zip=60540', description: 'Search providers' },
      { method: 'GET', path: '/providers/1234567890', description: 'Get provider detail by NPI' },
    ],
    sdkUsage: `import { useProviderSearch, useProviderDetail } from '@dxp/sdk-react';

const { data } = useProviderSearch({ specialty: 'cardiology', zip: '60540' });
const { data: detail } = useProviderDetail('1234567890');`,
    setupGuide: `1. Set PROVIDER_ADAPTER=mock in .env (default)
2. For production: connect to NPPES or your network's provider data source`,
  },
  {
    name: 'Risk Stratification (HCC)',
    domain: 'Healthcare — FHIR / Da Vinci',
    badge: 'FHIR R4',
    description: 'Population health risk scoring — HCC risk factors, care gaps, and risk worklists for care management.',
    port: 'RiskStratificationPort',
    portInterface: `abstract class RiskStratificationPort {
  abstract getDashboard(): Promise<PopulationDashboard>;
  abstract getRiskWorklist(filters: RiskFilters): Promise<RiskWorklistItem[]>;
  abstract getMemberRiskProfile(memberId: string): Promise<MemberRiskProfile>;
  abstract getCareGaps(memberId: string): Promise<CareGap[]>;
  abstract closeCareGap(memberId: string, gapId: string, dto: CloseGapDto): Promise<CareGap>;
}`,
    adapters: [
      { name: 'MockRiskAdapter', envValue: 'mock', description: 'Mock population health data with HCC risk scores, care gaps, and worklists.', config: `RISK_ADAPTER=mock` },
    ],
    envVar: 'RISK_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/population/dashboard', description: 'Get population dashboard' },
      { method: 'GET', path: '/population/worklist?riskLevel=high', description: 'Get risk worklist' },
      { method: 'GET', path: '/population/members/M001/risk', description: 'Get member risk profile' },
      { method: 'GET', path: '/population/members/M001/care-gaps', description: 'Get care gaps' },
      { method: 'POST', path: '/population/members/M001/care-gaps/gap-1/close', description: 'Close care gap' },
    ],
    sdkUsage: `import { usePopulationDashboard, useRiskWorklist, useCareGaps } from '@dxp/sdk-react';

const { data: dashboard } = usePopulationDashboard();
const { data: worklist } = useRiskWorklist({ riskLevel: 'high' });`,
    setupGuide: `1. Set RISK_ADAPTER=mock in .env (default)
2. For production: integrate with your analytics/risk engine (Arcadia, Cotiviti, etc.)`,
  },

  // ── Wealth — APAC Markets ──────────────────────────────────────────────

  {
    name: 'Market Data',
    domain: 'Wealth — APAC Markets',
    description: 'Real-time stock quotes, APAC indices, symbol search, price history. Multiple provider adapters.',
    port: 'MarketDataPort',
    portInterface: `abstract class MarketDataPort {
  abstract getQuote(symbol: string): Promise<StockQuote>;
  abstract getQuotes(symbols: string[]): Promise<StockQuote[]>;
  abstract getApacIndices(): Promise<ApacIndex[]>;
  abstract searchSymbols(query: string): Promise<SymbolSearchResult[]>;
  abstract getPriceHistory(symbol: string, range: string): Promise<PriceBar[]>;
}`,
    adapters: [
      { name: 'MockMarketAdapter', envValue: 'mock', description: 'Mock APAC market data — realistic quotes for SGX, HKEX, TSE, ASX stocks.', config: `MARKET_DATA_ADAPTER=mock` },
      { name: 'AlphaVantageAdapter', envValue: 'alpha-vantage', description: 'Alpha Vantage API — global quotes, search, and time series.', config: `ALPHA_VANTAGE_KEY=...` },
      { name: 'YahooFinanceAdapter', envValue: 'yahoo-finance', description: 'Yahoo Finance v8 chart API — real-time quotes and OHLCV history.', config: `# No API key required (rate-limited)` },
    ],
    envVar: 'MARKET_DATA_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/market/quote/D05.SI', description: 'Get real-time quote' },
      { method: 'GET', path: '/market/quotes?symbols=D05.SI,O39.SI', description: 'Get multiple quotes' },
      { method: 'GET', path: '/market/indices', description: 'Get APAC market indices' },
      { method: 'GET', path: '/market/search?q=DBS', description: 'Search symbols' },
      { method: 'GET', path: '/market/history/D05.SI?range=1mo', description: 'Get price history (1d/5d/1mo/6mo/1y/5y)' },
    ],
    sdkUsage: `import { useStockQuote, useApacIndices, usePriceHistory } from '@dxp/sdk-react';

const { data: quote } = useStockQuote('D05.SI');
const { data: indices } = useApacIndices();
const { data: history } = usePriceHistory('D05.SI', '1mo');`,
    setupGuide: `1. Set MARKET_DATA_ADAPTER=mock for development
2. For live data: MARKET_DATA_ADAPTER=yahoo-finance (no key) or alpha-vantage (free key)
3. Yahoo v8 chart is preferred — never use v7 quote (needs crumb token)`,
  },
  {
    name: 'FX Rates',
    domain: 'Wealth — APAC Markets',
    description: 'Foreign exchange rates — APAC currencies, SGD buy/sell spreads, currency conversion.',
    port: 'FxRatesPort',
    portInterface: `abstract class FxRatesPort {
  abstract getRates(base: string): Promise<FxRatesSnapshot>;
  abstract getApacRates(): Promise<FxRate[]>;
  abstract convert(from: string, to: string, amount: number): Promise<FxConvertResult>;
  abstract getSgdRates(): Promise<SgdRate[]>;
}`,
    adapters: [
      { name: 'MockFxAdapter', envValue: 'mock', description: 'Mock APAC FX rates with realistic SGD, HKD, JPY, AUD spreads.', config: `FX_ADAPTER=mock` },
      { name: 'ExchangeRateApiAdapter', envValue: 'exchangerate-api', description: 'ExchangeRate-API.com — live rates for 160+ currencies.', config: `EXCHANGERATE_API_KEY=...` },
    ],
    envVar: 'FX_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/fx/rates?base=USD', description: 'Get FX rates' },
      { method: 'GET', path: '/fx/apac', description: 'Get APAC currency rates vs USD' },
      { method: 'GET', path: '/fx/convert?from=USD&to=SGD&amount=1000', description: 'Convert currency' },
      { method: 'GET', path: '/fx/sgd', description: 'Get SGD buy/sell rates' },
    ],
    sdkUsage: `import { useFxRates, useApacFxRates, useFxConvert } from '@dxp/sdk-react';

const { data: rates } = useFxRates('USD');
const { data: apac } = useApacFxRates();
const { data: converted } = useFxConvert('USD', 'SGD', 1000);`,
    setupGuide: `1. Set FX_ADAPTER=mock for development
2. For live rates: FX_ADAPTER=exchangerate-api with EXCHANGERATE_API_KEY`,
  },
  {
    name: 'Macro Data',
    domain: 'Wealth — APAC Markets',
    description: 'Macroeconomic indicators — APAC country profiles, GDP, inflation, interest rates from World Bank.',
    port: 'MacroDataPort',
    portInterface: `abstract class MacroDataPort {
  abstract getCountryProfiles(): Promise<CountryProfile[]>;
  abstract getMacroIndicators(countryCode: string, filters: MacroFilters): Promise<MacroIndicator[]>;
}`,
    adapters: [
      { name: 'MockMacroAdapter', envValue: 'mock', description: 'Mock APAC macro data — GDP, CPI, rates for SG, HK, JP, AU, CN, KR, IN.', config: `MACRO_ADAPTER=mock` },
      { name: 'WorldBankAdapter', envValue: 'worldbank', description: 'World Bank Open Data API — real macro indicators.', config: `# No API key required` },
    ],
    envVar: 'MACRO_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/macro/countries', description: 'Get APAC country profiles' },
      { method: 'GET', path: '/macro/SGP?years=5', description: 'Get macro indicators for Singapore' },
    ],
    sdkUsage: `import { useCountryProfiles, useMacroIndicators } from '@dxp/sdk-react';

const { data: countries } = useCountryProfiles();
const { data: indicators } = useMacroIndicators('SGP', 5);`,
    setupGuide: `1. Set MACRO_ADAPTER=mock for development
2. For real data: MACRO_ADAPTER=worldbank (no key required, rate-limited)`,
  },
  {
    name: 'Financial News',
    domain: 'Wealth — APAC Markets',
    description: 'Financial news aggregation — APAC markets, company news, sentiment analysis. Multiple source adapters.',
    port: 'FinancialNewsPort',
    portInterface: `abstract class FinancialNewsPort {
  abstract getApacNews(filters: NewsFilters): Promise<{ articles: NewsArticle[]; total: number }>;
  abstract getCompanyNews(symbol: string): Promise<NewsArticle[]>;
}`,
    adapters: [
      { name: 'MockNewsAdapter', envValue: 'mock', description: 'Mock APAC financial news with sentiment data.', config: `NEWS_ADAPTER=mock` },
      { name: 'NewsApiAdapter', envValue: 'newsapi', description: 'NewsAPI.org — 80K+ sources, sentiment analysis.', config: `NEWSAPI_KEY=...` },
      { name: 'BraveNewsAdapter', envValue: 'brave', description: 'Brave Search News API — privacy-focused, no tracking.', config: `BRAVE_API_KEY=...` },
      { name: 'GoogleNewsAdapter', envValue: 'google-news', description: 'Google News RSS feeds — free, no API key.', config: `# No API key required` },
    ],
    envVar: 'NEWS_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/news?country=sg&sector=banking', description: 'Get APAC financial news' },
      { method: 'GET', path: '/news/D05.SI', description: 'Get company-specific news' },
    ],
    sdkUsage: `import { useApacNews, useCompanyNews } from '@dxp/sdk-react';

const { data } = useApacNews({ country: 'sg', sector: 'banking' });
const { data: dbs } = useCompanyNews('D05.SI');`,
    setupGuide: `1. Set NEWS_ADAPTER=mock for development
2. For live news: NEWS_ADAPTER=google-news (free) or newsapi/brave (with key)`,
  },
  {
    name: 'Wealth Portfolio',
    domain: 'Wealth — APAC Markets',
    description: 'Portfolio management — holdings, transactions, P&L tracking. Multi-currency with APAC exchange support.',
    port: 'WealthPortfolioPort',
    portInterface: `abstract class WealthPortfolioPort {
  abstract getPortfolio(userId: string, baseCurrency: string): Promise<PortfolioSummary>;
  abstract getHoldings(userId: string, baseCurrency: string, filters: PortfolioFilters): Promise<Holding[]>;
  abstract getTransactions(userId: string, page: number, pageSize: number): Promise<{ data: Transaction[]; total: number }>;
  abstract addTransaction(userId: string, tx: Omit<Transaction, 'id'>): Promise<Transaction>;
}`,
    adapters: [
      { name: 'MockPortfolioAdapter', envValue: 'mock', description: 'Mock portfolio with SGX, HKEX, ASX holdings and trade history.', config: `PORTFOLIO_ADAPTER=mock` },
    ],
    envVar: 'PORTFOLIO_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/wealth/portfolio?baseCurrency=SGD', description: 'Get portfolio summary' },
      { method: 'GET', path: '/wealth/holdings?baseCurrency=SGD', description: 'Get holdings' },
      { method: 'GET', path: '/wealth/transactions?page=1&pageSize=20', description: 'Get transactions' },
      { method: 'POST', path: '/wealth/transactions', description: 'Record transaction', sampleBody: JSON.stringify({ symbol: 'D05.SI', exchange: 'SGX', type: 'buy', quantity: 100, price: 35.50, currency: 'SGD', date: '2026-04-10' }, null, 2) },
    ],
    sdkUsage: `import { usePortfolio, useHoldings, useAddTransaction } from '@dxp/sdk-react';

const { data: portfolio } = usePortfolio('SGD');
const { data: holdings } = useHoldings('SGD');
const add = useAddTransaction();`,
    setupGuide: `1. Set PORTFOLIO_ADAPTER=mock for development
2. For production: build a PostgresPortfolioAdapter to persist real trades`,
  },
  {
    name: 'Watchlist',
    domain: 'Wealth — APAC Markets',
    description: 'Stock watchlist — add/remove symbols, track across APAC exchanges.',
    port: 'WatchlistPort',
    portInterface: `abstract class WatchlistPort {
  abstract getWatchlist(userId: string): Promise<WatchlistItem[]>;
  abstract addToWatchlist(userId: string, symbol: string, exchange: string): Promise<WatchlistItem>;
  abstract removeFromWatchlist(userId: string, itemId: string): Promise<void>;
}`,
    adapters: [
      { name: 'MockWatchlistAdapter', envValue: 'mock', description: 'In-memory watchlist with preset APAC stocks.', config: `WATCHLIST_ADAPTER=mock` },
    ],
    envVar: 'WATCHLIST_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/watchlist', description: 'Get watchlist' },
      { method: 'POST', path: '/watchlist', description: 'Add to watchlist', sampleBody: JSON.stringify({ symbol: 'D05.SI', exchange: 'SGX' }, null, 2) },
      { method: 'DELETE', path: '/watchlist/item-123', description: 'Remove from watchlist' },
    ],
    sdkUsage: `import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '@dxp/sdk-react';

const { data: items } = useWatchlist();
const add = useAddToWatchlist();
add.mutate({ symbol: 'D05.SI', exchange: 'SGX' });`,
    setupGuide: `1. Set WATCHLIST_ADAPTER=mock for development
2. For production: build a PostgresWatchlistAdapter`,
  },
  {
    name: 'Paper Trading',
    domain: 'Wealth — APAC Markets',
    description: 'Simulated trading engine — place orders, manage a paper portfolio, set price alerts. No real money.',
    port: 'PaperTradingPort',
    portInterface: `abstract class PaperTradingPort {
  abstract getPaperPortfolio(userId: string): Promise<PaperPortfolio>;
  abstract getOrders(userId: string, status?: OrderStatus): Promise<Order[]>;
  abstract placeOrder(userId: string, req: PlaceOrderRequest): Promise<Order>;
  abstract cancelOrder(userId: string, orderId: string): Promise<Order>;
  abstract getAlerts(userId: string): Promise<Alert[]>;
  abstract createAlert(userId: string, req: CreateAlertRequest): Promise<Alert>;
  abstract deleteAlert(userId: string, alertId: string): Promise<void>;
}`,
    adapters: [
      { name: 'PaperEngineAdapter', envValue: 'paper', description: 'In-memory paper trading engine — simulates order execution using live market data prices.', config: `TRADING_ADAPTER=paper` },
    ],
    envVar: 'TRADING_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/paper/portfolio', description: 'Get paper portfolio' },
      { method: 'GET', path: '/paper/orders?status=filled', description: 'Get orders' },
      { method: 'POST', path: '/paper/orders', description: 'Place order', sampleBody: JSON.stringify({ symbol: 'D05.SI', exchange: 'SGX', side: 'buy', type: 'market', quantity: 100 }, null, 2) },
      { method: 'DELETE', path: '/paper/orders/ord-123', description: 'Cancel pending order' },
      { method: 'GET', path: '/paper/alerts', description: 'Get price alerts' },
      { method: 'POST', path: '/paper/alerts', description: 'Create price alert', sampleBody: JSON.stringify({ symbol: 'D05.SI', condition: 'above', price: 40.00 }, null, 2) },
      { method: 'DELETE', path: '/paper/alerts/alert-456', description: 'Delete alert' },
    ],
    sdkUsage: `import { usePaperPortfolio, usePlaceOrder, useAlerts, useCreateAlert } from '@dxp/sdk-react';

const { data: portfolio } = usePaperPortfolio();
const place = usePlaceOrder();
place.mutate({ symbol: 'D05.SI', side: 'buy', type: 'market', quantity: 100 });`,
    setupGuide: `1. Set TRADING_ADAPTER=paper in .env (default)
2. The paper engine uses MarketDataPort for live prices
3. Orders execute immediately at current market price (market orders) or when price crosses (limit orders)`,
  },
  {
    name: 'Broker Gateway',
    domain: 'Wealth — APAC Markets',
    description: 'Live broker integration — real order execution through Tiger Brokers or Interactive Brokers.',
    port: 'BrokerGatewayPort',
    portInterface: `abstract class BrokerGatewayPort {
  abstract getBrokerAccount(userId: string): Promise<BrokerAccount>;
  abstract placeBrokerOrder(userId: string, req: PlaceOrderRequest): Promise<Order>;
  abstract getBrokerOrders(userId: string): Promise<Order[]>;
  abstract cancelBrokerOrder(userId: string, orderId: string): Promise<Order>;
}`,
    adapters: [
      { name: 'TigerBrokerAdapter', envValue: 'tiger', description: 'Tiger Brokers Open API — SGX, HKEX, US markets. Requires Tiger developer account.', config: `TIGER_PRIVATE_KEY=path/to/key.pem\nTIGER_TIGER_ID=...\nTIGER_ACCOUNT=...` },
      { name: 'IBKRAdapter', envValue: 'ibkr', description: 'Interactive Brokers Client Portal API — global markets coverage.', config: `IBKR_HOST=https://localhost:5000\nIBKR_ACCOUNT=...` },
    ],
    envVar: 'BROKER_PROVIDER',
    endpoints: [
      { method: 'GET', path: '/broker/account', description: 'Get broker account balance' },
      { method: 'POST', path: '/broker/orders', description: 'Place live order', sampleBody: JSON.stringify({ symbol: 'D05.SI', exchange: 'SGX', side: 'buy', type: 'limit', quantity: 100, price: 35.00 }, null, 2) },
      { method: 'GET', path: '/broker/orders', description: 'Get live orders' },
      { method: 'DELETE', path: '/broker/orders/ord-789', description: 'Cancel live order' },
    ],
    sdkUsage: `import { useBrokerAccount, usePlaceBrokerOrder, useBrokerOrders } from '@dxp/sdk-react';

const { data: account } = useBrokerAccount();
const place = usePlaceBrokerOrder();
place.mutate({ symbol: 'D05.SI', side: 'buy', type: 'limit', quantity: 100, price: 35.00 });`,
    setupGuide: `1. Set BROKER_PROVIDER=tiger (or ibkr) in .env
2. For Tiger: provide private key PEM, Tiger ID, and account number
3. For IBKR: run Client Portal Gateway, set IBKR_HOST and IBKR_ACCOUNT
4. WARNING: This executes REAL trades with REAL money`,
  },

  // ── Retail — ACE Hardware ──────────────────────────────────────────────

  {
    name: 'Inventory',
    domain: 'Retail — ACE Hardware',
    description: 'Product catalog and stock management — SKU lookup, stock levels, barcode scan, reorder alerts.',
    port: 'InventoryPort',
    portInterface: `abstract class InventoryPort {
  abstract listProducts(query: ProductQuery): Promise<ProductList>;
  abstract getProduct(id: string): Promise<InventoryProduct>;
  abstract getStockLevels(storeId: string): Promise<StockLevel[]>;
  abstract barcodeLookup(code: string): Promise<InventoryProduct | null>;
  abstract adjustStock(storeId: string, productId: string, dto: AdjustStockDto): Promise<StockLevel>;
}`,
    adapters: [
      { name: 'MockInventoryAdapter', envValue: 'mock', description: 'Mock inventory with 50 products across Paint, Tools, Plumbing, Electrical, Outdoor, Hardware. Real brands.', config: `INVENTORY_ADAPTER=mock` },
    ],
    envVar: 'INVENTORY_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/inventory/products?category=tools', description: 'List products' },
      { method: 'GET', path: '/inventory/products/T001', description: 'Get product by ID' },
      { method: 'GET', path: '/inventory/stock/S001', description: 'Get stock levels for store' },
      { method: 'GET', path: '/inventory/barcode/012345678901', description: 'Barcode lookup' },
    ],
    sdkUsage: `import { useProducts, useProduct, useStockLevels, useBarcodeLookup } from '@dxp/sdk-react';

const { data } = useProducts({ category: 'tools' });
const { data: product } = useProduct('T001');
const { data: stock } = useStockLevels('S001');`,
    setupGuide: `1. Set INVENTORY_ADAPTER=mock in .env (default)
2. For SAP: build SapInventoryAdapter implementing InventoryPort
3. For Shopify: build ShopifyInventoryAdapter using Shopify Admin API`,
  },
  {
    name: 'POS Connector',
    domain: 'Retail — ACE Hardware',
    description: 'Point-of-sale data — daily sales, category breakdown, top sellers, transaction history.',
    port: 'PosConnectorPort',
    portInterface: `abstract class PosConnectorPort {
  abstract getDailySales(storeId: string, date: string): Promise<DailySales>;
  abstract getSalesRange(storeId: string, from: string, to: string): Promise<DailySales[]>;
  abstract getCategoryBreakdown(storeId: string): Promise<CategoryBreakdown[]>;
  abstract getTopSellers(storeId: string): Promise<TopSeller[]>;
  abstract getTransactions(storeId: string, date: string): Promise<Transaction[]>;
}`,
    adapters: [
      { name: 'MockPosAdapter', envValue: 'mock', description: 'Mock POS data — 30 days of hourly sales data per store with realistic retail patterns.', config: `POS_ADAPTER=mock` },
    ],
    envVar: 'POS_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/pos/sales/daily/S001?date=2026-04-10', description: 'Get daily sales' },
      { method: 'GET', path: '/pos/sales/range/S001?from=2026-04-01&to=2026-04-10', description: 'Get sales range' },
      { method: 'GET', path: '/pos/categories/S001', description: 'Get category breakdown' },
      { method: 'GET', path: '/pos/top-sellers/S001', description: 'Get top sellers' },
    ],
    sdkUsage: `import { useDailySales, useCategoryBreakdown, useTopSellers } from '@dxp/sdk-react';

const { data: sales } = useDailySales('S001');
const { data: categories } = useCategoryBreakdown('S001');
const { data: top } = useTopSellers('S001');`,
    setupGuide: `1. Set POS_ADAPTER=mock in .env (default)
2. For Square POS: build SquarePosAdapter
3. For Clover: build CloverPosAdapter using Clover REST API`,
  },
  {
    name: 'Project Planner',
    domain: 'Retail — ACE Hardware',
    description: 'DIY project templates — materials lists, cost estimates, step-by-step guides for common home projects.',
    port: 'ProjectPlannerPort',
    portInterface: `abstract class ProjectPlannerPort {
  abstract listTemplates(): Promise<ProjectTemplate[]>;
  abstract getTemplate(id: string): Promise<ProjectTemplate>;
  abstract getMaterialsList(id: string): Promise<MaterialItem[]>;
  abstract estimateCost(id: string): Promise<CostEstimate>;
}`,
    adapters: [
      { name: 'MockProjectAdapter', envValue: 'mock', description: '5 DIY templates: Deck Building, Bathroom Remodel, Kitchen Backsplash, Fence Installation, Garage Organization.', config: `PROJECT_PLANNER_ADAPTER=mock` },
    ],
    envVar: 'PROJECT_PLANNER_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/projects', description: 'List project templates' },
      { method: 'GET', path: '/projects/deck-building', description: 'Get project template' },
      { method: 'GET', path: '/projects/deck-building/materials', description: 'Get materials list' },
    ],
    sdkUsage: `import { useProjectTemplates, useProjectTemplate, useMaterialsList } from '@dxp/sdk-react';

const { data: templates } = useProjectTemplates();
const { data: deck } = useProjectTemplate('deck-building');
const { data: materials } = useMaterialsList('deck-building');`,
    setupGuide: `1. Set PROJECT_PLANNER_ADAPTER=mock in .env (default)
2. Templates include materials lists linked to inventory SKUs
3. Cost estimates pull live prices from the Inventory module`,
  },
  {
    name: 'Loyalty',
    domain: 'Retail — ACE Hardware',
    description: 'Loyalty program — member profiles, points earn/redeem, tier management, rewards catalog.',
    port: 'LoyaltyPort',
    portInterface: `abstract class LoyaltyPort {
  abstract getMember(memberId: string): Promise<LoyaltyMember>;
  abstract getPointsBalance(memberId: string): Promise<number>;
  abstract getTransactionHistory(memberId: string): Promise<PointsTransaction[]>;
  abstract earnPoints(memberId: string, points: number, description: string, orderId?: string): Promise<PointsTransaction>;
  abstract redeemPoints(memberId: string, rewardId: string): Promise<PointsTransaction>;
  abstract getRewardsCatalog(): Promise<Reward[]>;
  abstract getTierStatus(memberId: string): Promise<TierStatus>;
}`,
    adapters: [
      { name: 'MockLoyaltyAdapter', envValue: 'mock', description: '3 members (Bronze/Silver/Gold/Platinum), 10 rewards, tier progression with benefits.', config: `LOYALTY_ADAPTER=mock` },
    ],
    envVar: 'LOYALTY_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/loyalty/members/LM001', description: 'Get loyalty member' },
      { method: 'GET', path: '/loyalty/members/LM001/points', description: 'Get points balance' },
      { method: 'GET', path: '/loyalty/members/LM001/transactions', description: 'Get points history' },
      { method: 'POST', path: '/loyalty/members/LM001/earn', description: 'Earn points', sampleBody: JSON.stringify({ points: 150, description: 'Purchase #ORD-1050' }, null, 2) },
      { method: 'POST', path: '/loyalty/members/LM001/redeem', description: 'Redeem reward', sampleBody: JSON.stringify({ rewardId: 'R002' }, null, 2) },
      { method: 'GET', path: '/loyalty/rewards', description: 'Get rewards catalog' },
      { method: 'GET', path: '/loyalty/members/LM001/tier', description: 'Get tier status' },
    ],
    sdkUsage: `import { useLoyaltyMember, usePointsBalance, useRewardsCatalog } from '@dxp/sdk-react';

const { data: member } = useLoyaltyMember('LM001');
const { data: points } = usePointsBalance('LM001');
const { data: rewards } = useRewardsCatalog();`,
    setupGuide: `1. Set LOYALTY_ADAPTER=mock in .env (default)
2. For production: build adapter connecting to your loyalty platform (Salesforce, Punchh, etc.)
3. Points earn/redeem transactions are logged via the Audit module`,
  },

  // ── Agentic Commerce ──────────────────────────────────────────────────
  {
    name: 'Agentic Assistant',
    domain: 'Conversational AI Assistant',
    badge: 'ReAct',
    description: 'Configurable AI conversation assistant — uses a ReAct agent (LLM + tools) driven by JSON persona configs. Supports retail, insurance, wealth, any vertical. Multi-modal: text, voice (Whisper + TTS), file upload (vision + PDF).',
    port: 'AgenticPort',
    portInterface: `abstract class AgenticPort {
  abstract listConfigs(): Promise<AgentConfig[]>;
  abstract getUIConfig(): Promise<AgentUIConfig>;
  abstract getReadiness(): Promise<ReadinessReport>;
  abstract getUserPreferences(userId: string): Promise<Record<string, unknown>>;
  abstract getChatWebSocketUrl(sessionId: string): string;
}`,
    adapters: [
      { name: 'LangGraphAdapter', envValue: 'langgraph', description: 'Proxies to FastAPI + LangGraph ReAct agent backend on port 8002.', config: `AGENTIC_ADAPTER=langgraph\nAGENTIC_BACKEND_URL=http://localhost:8002` },
      { name: 'MockAgenticAdapter', envValue: 'mock', description: 'Canned responses for offline development/demo without the agent backend.', config: `AGENTIC_ADAPTER=mock` },
    ],
    envVar: 'AGENTIC_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/agentic/configs', description: 'List available agent persona configs' },
      { method: 'GET', path: '/agentic/config', description: 'Get active deployment UI config (title, suggestions)' },
      { method: 'GET', path: '/agentic/readiness', description: 'Agent readiness score (data quality)' },
      { method: 'GET', path: '/agentic/users/11111111-1111-1111-1111-111111111111/preferences', description: 'Get user preferences' },
      { method: 'GET', path: '/agentic/chat-url?session_id=demo', description: 'Get WebSocket URL for chat' },
    ],
    sdkUsage: `// In any portal — drop-in AI assistant
import { AgenticAssistant } from './components/agent/AgenticAssistant';

// Customer-facing chat
<AgenticAssistant />

// Manager tools
import { AgentReadiness } from './pages/manager/AgentReadiness';
import { ConfigBuilder } from './pages/manager/ConfigBuilder';`,
    setupGuide: `1. Start the agent backend:
   cd agenticcommerce/apps/api && . .venv/bin/activate
   uvicorn src.main:app --port 8002

2. Set AGENTIC_ADAPTER=langgraph in BFF .env

3. To switch verticals:
   AGENTIC_CONFIG_ID=ace-hardware    (retail)
   AGENTIC_CONFIG_ID=insurance-claims (insurance)

4. To create a new vertical:
   Use the Config Builder UI or POST /api/agent-configs/generate

5. To ingest catalog data:
   python -m src.db.ingest your-config-id

6. To enrich the knowledge graph:
   python -m src.db.enrich_graph`,
  },
  {
    name: 'Config Builder',
    domain: 'Conversational AI Assistant',
    description: 'LLM-powered agent configuration generator. Describe your domain in natural language → get a full persona config (voice, clarifiers, playbooks, UI). Domain-scoped: prevents cross-vertical configs.',
    port: 'AgenticPort',
    portInterface: `// Config generation via LLM
POST /api/agent-configs/generate
  { description: "I need an assistant for a garden center...", portal_domain: "retail" }
  → { config: { id, name, domain_tags, persona, playbooks, ui, ... } }

POST /api/agent-configs/save
  { config: {...}, portal_domain: "retail" }
  → { id: "garden-center", saved: true }`,
    adapters: [
      { name: 'LangGraphAdapter', envValue: 'langgraph', description: 'Generates config via the same OpenAI LLM used by the agent.', config: `AGENTIC_ADAPTER=langgraph\nOPENAI_API_KEY=sk-...` },
    ],
    envVar: 'AGENTIC_ADAPTER',
    endpoints: [
      { method: 'POST', path: '/agentic/configs/generate', description: 'Generate a config from natural language', sampleBody: JSON.stringify({ description: "I need an assistant for a garden center that helps customers choose plants, fertilizers, and garden tools based on their conditions (sun, shade, soil type)", portal_domain: "retail" }, null, 2) },
      { method: 'POST', path: '/agentic/configs/save', description: 'Save a generated config', sampleBody: JSON.stringify({ config: { id: "example", name: "Example" }, portal_domain: "retail" }, null, 2) },
    ],
    sdkUsage: `// Config Builder page for managers
import { ConfigBuilder } from './pages/manager/ConfigBuilder';

// In manager nav:
{ label: 'Config Builder', href: '/manager/config-builder' }`,
    setupGuide: `1. Add ConfigBuilder page to your portal's manager view
2. Describe your domain in plain English
3. Click Generate → Preview → Save
4. New config appears in /agentic/configs and is immediately usable
5. Domain scoping: portal_domain prevents cross-vertical configs`,
  },
  {
    name: 'Readiness Monitor',
    domain: 'Conversational AI Assistant',
    description: 'Agent Readiness Monitor — scores catalog/data quality across 5 dimensions: data completeness, embedding coverage, graph connectivity, preference data, data freshness. Provides specific issues and remediation recommendations.',
    port: 'AgenticPort',
    portInterface: `// Readiness scoring
GET /api/readiness → {
  overall: 100.0,
  dimensions: {
    data_completeness: 100.0,
    embedding_coverage: 100.0,
    graph_connectivity: 100.0,
    preference_data: 100.0,
    data_freshness: 100.0
  },
  stats: { total_products, embedded_products, total_edges, ... },
  issues: [],
  recommendations: []
}`,
    adapters: [
      { name: 'LangGraphAdapter', envValue: 'langgraph', description: 'Scores the live PostgreSQL + pgvector + AGE database.', config: `AGENTIC_ADAPTER=langgraph` },
    ],
    envVar: 'AGENTIC_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/agentic/readiness', description: 'Get agent readiness score and breakdown' },
    ],
    sdkUsage: `// Readiness dashboard for managers
import { AgentReadiness } from './pages/manager/AgentReadiness';

// In manager nav:
{ label: 'Agent Readiness', href: '/manager/agent-readiness' }`,
    setupGuide: `1. Add AgentReadiness page to your portal's manager view
2. Ensure the agent backend is running and has ingested catalog data
3. Score improves as you: ingest more products, generate embeddings, enrich the graph, and build user preferences
4. Target: 90+ overall score for production-ready agentic experience`,
  },
  {
    name: 'Data Pipeline',
    domain: 'Conversational AI Assistant',
    description: 'Data Pipeline Manager — upload catalog/content data, trigger ingestion into pgvector + Apache AGE graph, and enrich with LLM-inferred features. Config-driven: define field mappings and embedding templates per data source.',
    port: 'AgenticPort',
    portInterface: `// Data pipeline endpoints
GET  /api/data-pipeline/configs        → list data source configs
POST /api/data-pipeline/upload-source  → upload JSON/CSV data file
POST /api/data-pipeline/ingest         → trigger ingestion (async)
POST /api/data-pipeline/enrich         → trigger graph enrichment (async)
GET  /api/data-pipeline/status         → check pipeline run status
POST /api/data-pipeline/create-config  → create a new data config`,
    adapters: [
      { name: 'LangGraphAdapter', envValue: 'langgraph', description: 'Runs ingestion against PostgreSQL + pgvector + AGE on the agent backend.', config: 'AGENTIC_ADAPTER=langgraph' },
    ],
    envVar: 'AGENTIC_ADAPTER',
    endpoints: [
      { method: 'GET', path: '/data-pipeline/configs', description: 'List data configs' },
      { method: 'POST', path: '/data-pipeline/upload-source', description: 'Upload catalog JSON/CSV', sampleBody: '(multipart: config_id + file)' },
      { method: 'POST', path: '/data-pipeline/ingest', description: 'Trigger ingestion', sampleBody: JSON.stringify({ config_id: 'ace-hardware' }, null, 2) },
      { method: 'POST', path: '/data-pipeline/enrich', description: 'Trigger graph enrichment' },
      { method: 'GET', path: '/data-pipeline/status', description: 'Check run status' },
    ],
    sdkUsage: `// Data Pipeline Manager page
import { DataPipeline } from './pages/manager/DataPipeline';

// In manager nav:
{ label: 'Data Pipeline', href: '/manager/data-pipeline' }`,
    setupGuide: `1. Add DataPipeline page to your portal's manager view
2. Create a data config (JSON) defining source, field mapping, and embedding template
3. Upload your catalog data file (JSON or CSV)
4. Click "Run Ingestion" → generates embeddings + writes to pgvector + builds graph
5. Click "Enrich Graph" → adds HAS_FEATURE + FREQUENTLY_BOUGHT_WITH edges
6. Check Agent Readiness score → target 90+`,
  },
];
