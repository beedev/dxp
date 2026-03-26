export interface SignatureRequest {
  documentUrl: string;
  signers: { name: string; email: string; role?: string }[];
  subject: string;
  message?: string;
  callbackUrl?: string;
}

export interface SignatureEnvelope {
  id: string;
  status: 'created' | 'sent' | 'delivered' | 'signed' | 'completed' | 'declined' | 'voided';
  documentUrl: string;
  signers: { name: string; email: string; status: string; signedAt?: string }[];
  createdAt: string;
  completedAt?: string;
}

export abstract class ESignaturePort {
  abstract createEnvelope(request: SignatureRequest): Promise<SignatureEnvelope>;
  abstract getEnvelope(envelopeId: string): Promise<SignatureEnvelope>;
  abstract listEnvelopes(status?: string): Promise<SignatureEnvelope[]>;
  abstract voidEnvelope(envelopeId: string, reason: string): Promise<void>;
  abstract getSigningUrl(envelopeId: string, signerEmail: string): Promise<string>;
}
