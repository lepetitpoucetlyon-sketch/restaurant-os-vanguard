import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ADMIN_GUARDS = [
  'requireAdminAuth',
  'requireAnyAuth',
  'requireMccAuth',
  'adminAuthGuard',
  'withAdminGuard',
  'CRON_SECRET',
];

const WEBHOOK_GUARDS = [
  'verifySignature',
  'checkFallbackWebhookSecret',
  'stripe.webhooks.constructEvent',
  'computeHmacHex',
  'timingSafeCompareHex',
  'secret',
  'Signature',
];

const CRON_GUARDS = [
  'CRON_SECRET',
  'x-vercel-cron-signature',
  'x-cron-secret',
];

function findRouteFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findRouteFiles(fullPath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe('🔒 API Route Security Guards Gate (Priorité 1.3)', () => {
  const apiDir = path.resolve(process.cwd(), 'src/app/api');
  const routes = findRouteFiles(apiDir);

  it('finds all API routes in src/app/api', () => {
    expect(routes.length).toBeGreaterThan(50);
  });

  it('enforces admin authentication guards on all /api/admin/ routes', () => {
    const adminRoutes = routes.filter(r => r.includes('/src/app/api/admin/'));
    const unguarded = adminRoutes.filter(route => {
      const content = fs.readFileSync(route, 'utf-8');
      return !ADMIN_GUARDS.some(guard => content.includes(guard));
    }).map(r => path.relative(process.cwd(), r));

    expect(unguarded, `Routes admin sans garde : \n${unguarded.join('\n')}`).toEqual([]);
  });

  it('enforces secret verification on cron routes', () => {
    const cronRoutes = routes.filter(r => r.includes('/src/app/api/cron/'));
    for (const route of cronRoutes) {
      const content = fs.readFileSync(route, 'utf-8');
      const hasSecretCheck = CRON_GUARDS.some(guard => content.includes(guard));
      expect(hasSecretCheck, `Route cron sans vérification de secret : ${route}`).toBe(true);
    }
  });

  it('enforces signature verification on webhook routes', () => {
    const webhookRoutes = routes.filter(r => r.includes('/webhook'));
    for (const route of webhookRoutes) {
      const content = fs.readFileSync(route, 'utf-8');
      const hasWebhookAuth = WEBHOOK_GUARDS.some(guard => content.includes(guard));
      expect(hasWebhookAuth, `Webhook sans vérification de signature : ${route}`).toBe(true);
    }
  });
});

