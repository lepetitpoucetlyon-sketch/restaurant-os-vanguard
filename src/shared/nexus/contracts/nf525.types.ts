import type { SovereignMap, SovereignData } from './sovereign.types';

export interface SovereignWriteSignature extends SovereignMap {
  scope: 'NF525_WRITE';
  version: 'NF525_WRITE_V1';
  tenantId: string;
  path: string;
  signedAt: string;
  payloadHash: string;
  signature: string;
}

export type SignedSovereignData = SovereignData & {
  __nf525?: SovereignWriteSignature;
};
