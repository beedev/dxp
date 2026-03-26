import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { IdentityPort, UserProfile, UpdateProfileDto } from '../ports/identity.port';

@Injectable()
export class AzureAdAdapter extends IdentityPort {
  private readonly logger = new Logger(AzureAdAdapter.name);
  private readonly client: AxiosInstance;
  private readonly tenantId: string;

  constructor(private config: ConfigService) {
    super();
    this.tenantId = this.config.get<string>('AZURE_AD_TENANT_ID', '');
    this.client = axios.create({
      baseURL: `https://graph.microsoft.com/v1.0`,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // In production: use @azure/identity + @azure/msal-node for token management
  private async getGraphToken(): Promise<string> {
    const clientId = this.config.get<string>('AZURE_AD_CLIENT_ID', '');
    const clientSecret = this.config.get<string>('AZURE_AD_CLIENT_SECRET', '');
    const { data } = await axios.post(
      `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret, scope: 'https://graph.microsoft.com/.default' }),
    );
    return data.access_token;
  }

  async getUser(userId: string): Promise<UserProfile> {
    this.logger.debug(`Azure AD: getUser ${userId}`);
    const token = await this.getGraphToken();
    const { data } = await this.client.get(`/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
    return this.mapUser(data);
  }

  async listUsers(tenantId: string, page = 1, pageSize = 20): Promise<{ data: UserProfile[]; total: number }> {
    this.logger.debug(`Azure AD: listUsers`);
    const token = await this.getGraphToken();
    const { data } = await this.client.get(`/users?$top=${pageSize}&$skip=${(page - 1) * pageSize}`, { headers: { Authorization: `Bearer ${token}` } });
    return { data: (data.value || []).map(this.mapUser), total: data['@odata.count'] || 0 };
  }

  async updateUser(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    const token = await this.getGraphToken();
    await this.client.patch(`/users/${userId}`, { givenName: dto.firstName, surname: dto.lastName }, { headers: { Authorization: `Bearer ${token}` } });
    return this.getUser(userId);
  }

  async resetPassword(userId: string): Promise<void> {
    this.logger.log(`Azure AD: password reset for ${userId}`);
    // POST /users/{id}/authentication/methods — requires admin consent
  }

  private mapUser(u: Record<string, unknown>): UserProfile {
    return {
      id: String(u.id), email: String(u.mail || u.userPrincipalName || ''),
      firstName: String(u.givenName || ''), lastName: String(u.surname || ''),
      roles: [], tenantId: '', enabled: u.accountEnabled as boolean ?? true,
      createdAt: String(u.createdDateTime || ''),
    };
  }
}
