import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import { POST } from '@/app/api/webhooks/docuseal/route';

vi.mock('@/modules/compliance', async () => {
  return {
    SovereignSignatureEngine: {
      handleDocuSealWebhook: vi.fn(async () => ({ id: 'contract-xyz', status: 'SIGNED' })),
    },
  };
});

function makeReq(body: string, signature?: string): Request {
  return new Request('http://localhost/api/webhooks/docuseal', {
    method: 'POST',
    headers: signature ? { 'x-docuseal-signature': signature } : {},
    body,
  });
}

function sign(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

const VALID_PAYLOAD = JSON.stringify({
  event_type: 'submission.completed',
  data: { id: 42, slug: 'sub42', status: 'completed', submitters: [] },
});

describe('POST /api/webhooks/docuseal — HMAC verification', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('accepte un payload signé correctement en production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DOCUSEAL_WEBHOOK_SECRET', 'super_secret_prod_key');

    const signature = sign(VALID_PAYLOAD, 'super_secret_prod_key');
    const res = await POST(makeReq(VALID_PAYLOAD, signature) as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.contractId).toBe('contract-xyz');
  });

  it('rejette une signature invalide en production (401)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DOCUSEAL_WEBHOOK_SECRET', 'super_secret_prod_key');

    const badSignature = sign(VALID_PAYLOAD, 'attacker_key');
    const res = await POST(makeReq(VALID_PAYLOAD, badSignature) as never);

    expect(res.status).toBe(401);
  });

  it("rejette l'absence de header X-Docuseal-Signature en production (401)", async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DOCUSEAL_WEBHOOK_SECRET', 'super_secret_prod_key');

    const res = await POST(makeReq(VALID_PAYLOAD) as never);
    expect(res.status).toBe(401);
  });

  it('rejette le webhook en production quand DOCUSEAL_WEBHOOK_SECRET est absent (401)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DOCUSEAL_WEBHOOK_SECRET', '');

    const res = await POST(makeReq(VALID_PAYLOAD, 'fakesig') as never);
    expect(res.status).toBe(401);
  });

  it('tolère un secret absent en dev/sandbox (200)', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DOCUSEAL_WEBHOOK_SECRET', '');

    const res = await POST(makeReq(VALID_PAYLOAD) as never);
    expect(res.status).toBe(200);
  });

  it("rejette un payload malformé même signé (400)", async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DOCUSEAL_WEBHOOK_SECRET', 'super_secret_prod_key');

    const invalidBody = JSON.stringify({ event_type: 'submission.completed' });
    const signature = sign(invalidBody, 'super_secret_prod_key');
    const res = await POST(makeReq(invalidBody, signature) as never);
    expect(res.status).toBe(400);
  });

  it("résiste à un forgery attempt avec signature de longueur différente (rejet)", async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DOCUSEAL_WEBHOOK_SECRET', 'super_secret_prod_key');

    const res = await POST(makeReq(VALID_PAYLOAD, 'deadbeef') as never);
    expect(res.status).toBe(401);
  });
});
