import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DocumentPort, DocumentMetadata, UploadDocumentDto, DocumentQuery } from '../ports/document.port';

@Injectable()
export class SharePointAdapter extends DocumentPort {
  private readonly logger = new Logger(SharePointAdapter.name);
  private readonly siteId: string;
  private readonly driveId: string;

  constructor(private config: ConfigService) {
    super();
    this.siteId = this.config.get<string>('SHAREPOINT_SITE_ID', '');
    this.driveId = this.config.get<string>('SHAREPOINT_DRIVE_ID', '');
  }

  // In production: use @azure/identity for managed identity token
  private async getToken(): Promise<string> {
    const tenantId = this.config.get<string>('AZURE_AD_TENANT_ID', '');
    const clientId = this.config.get<string>('AZURE_AD_CLIENT_ID', '');
    const clientSecret = this.config.get<string>('AZURE_AD_CLIENT_SECRET', '');
    const { data } = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret, scope: 'https://graph.microsoft.com/.default' }),
    );
    return data.access_token;
  }

  async upload(tenantId: string, dto: UploadDocumentDto): Promise<DocumentMetadata> {
    this.logger.log(`SharePoint: upload ${dto.name} to ${tenantId}/${dto.category}`);
    const token = await this.getToken();
    const path = `${tenantId}/${dto.category}/${dto.name}`;
    // PUT /drives/{driveId}/items/root:/{path}:/content
    const { data } = await axios.put(
      `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/root:/${path}:/content`,
      dto.data, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': dto.mimeType } },
    );
    return { id: data.id, name: data.name, mimeType: dto.mimeType, size: data.size, category: dto.category, uploadedBy: 'system', uploadedAt: data.createdDateTime, url: data.webUrl };
  }

  async getById(tenantId: string, id: string): Promise<DocumentMetadata> {
    this.logger.debug(`SharePoint: getById ${id}`);
    const token = await this.getToken();
    const { data } = await axios.get(`https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    return { id: data.id, name: data.name, mimeType: data.file?.mimeType || '', size: data.size, category: '', uploadedBy: data.createdBy?.user?.displayName || '', uploadedAt: data.createdDateTime, url: data.webUrl };
  }

  async list(tenantId: string, query: DocumentQuery): Promise<{ data: DocumentMetadata[]; total: number }> {
    this.logger.debug(`SharePoint: list for ${tenantId}`);
    const token = await this.getToken();
    const { data } = await axios.get(`https://graph.microsoft.com/v1.0/drives/${this.driveId}/root:/${tenantId}:/children`, { headers: { Authorization: `Bearer ${token}` } });
    const items = (data.value || []).map((item: Record<string, unknown>) => ({
      id: String(item.id), name: String(item.name), mimeType: (item as Record<string, Record<string, string>>).file?.mimeType || '', size: item.size as number, category: '', uploadedBy: '', uploadedAt: String(item.createdDateTime), url: String(item.webUrl),
    }));
    return { data: items, total: items.length };
  }

  async getDownloadUrl(tenantId: string, id: string): Promise<string> {
    const token = await this.getToken();
    const { data } = await axios.get(`https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    return data['@microsoft.graph.downloadUrl'] || data.webUrl;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const token = await this.getToken();
    await axios.delete(`https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  }
}
