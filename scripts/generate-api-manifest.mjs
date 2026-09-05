#!/usr/bin/env node
/**
 * 🗺️ generate-api-manifest.mjs (Phase 4 Audit Remediation)
 *
 * Scanner et générateur du manifeste API exhaustif de Restaurant OS Core.
 * Parcourt les 222 routes API, détecte les verbes HTTP et produit l'inventaire
 * opposable dans src/lib/api/apiManifest.ts.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const API_DIR = path.join(ROOT, 'src/app/api');
const TARGET_FILE = path.join(ROOT, 'src/lib/api/apiManifest.ts');

function findRoutes(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findRoutes(full, list);
    } else if (entry.name === 'route.ts') {
      list.push(full);
    }
  }
  return list;
}

function extractMethods(content) {
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  return methods.filter((m) => {
    const fnRegex = new RegExp(`\\bexport\\s+(async\\s+)?function\\s+${m}\\b`);
    const constRegex = new RegExp(`\\bexport\\s+const\\s+${m}\\b`);
    return fnRegex.test(content) || constRegex.test(content);
  });
}

const PUBLIC_EXACT = new Set([
  '/api/health',
  '/api/status',
  '/api/resolve-domain',
  '/api/menu.json',
  '/api/v1/openapi.json',
  '/api/share-target',
  '/api/signup',
]);
const PUBLIC_PREFIXES = ['/api/health/', '/api/status/', '/api/widget/', '/api/auth/'];

function isPublicRoute(apiPath) {
  if (PUBLIC_EXACT.has(apiPath)) return true;
  return PUBLIC_PREFIXES.some((prefix) => apiPath.startsWith(prefix));
}

function inferAudience(apiPath) {
  if (apiPath.startsWith('/api/admin/') || apiPath.startsWith('/api/mcc/')) {
    return 'mcc';
  }
  if (apiPath.startsWith('/api/webhooks/') || apiPath.includes('/webhook')) {
    return 'webhook';
  }
  if (isPublicRoute(apiPath)) {
    return 'public';
  }
  return 'tenant';
}

function inferMccRole(content) {
  if (content.includes('mcc_support') || content.includes('support-ai')) return 'mcc_support';
  if (content.includes('mcc_readonly')) return 'mcc_readonly';
  return 'mcc_admin';
}

const TENANT_ROLE_KEYWORDS = [
  { role: 'chef_cuisinier', keywords: ["'chef_cuisinier'", '"chef_cuisinier"'] },
  { role: 'comptable', keywords: ["'comptable'", '"comptable"'] },
  { role: 'serveur', keywords: ["'serveur'", '"serveur"'] },
  { role: 'admin', keywords: ['requireTenantAdmin', "'admin'", '"admin"'] },
  { role: 'manager', keywords: ["'manager'", '"manager"'] },
];

function inferTenantRole(content, method) {
  for (const entry of TENANT_ROLE_KEYWORDS) {
    if (entry.keywords.some((kw) => content.includes(kw))) {
      return entry.role;
    }
  }
  return method === 'GET' ? 'employee' : 'manager';
}

function inferRole(audience, content, method) {
  if (audience === 'public' || audience === 'webhook') return undefined;
  if (audience === 'mcc') return inferMccRole(content);
  return inferTenantRole(content, method);
}

function inferIdempotency(apiPath, method) {
  if (method === 'GET' || method === 'DELETE') return false;
  const critical = [
    '/orders',
    '/split-bill',
    '/einvoicing',
    '/inventory',
    '/finance',
    '/billing',
    '/clock-in',
    '/cash-count',
    '/reservations',
    '/procurement',
    '/haccp',
  ];
  return critical.some((c) => apiPath.includes(c));
}

function generateSummary(apiPath, method, content) {
  // Try extracting description from JSDoc
  const jsdocMatch = content.match(/\/\*\*\s*([\s\S]*?)\*\//);
  if (jsdocMatch) {
    const lines = jsdocMatch[1]
      .split('\n')
      .map((l) => l.replace(/^\s*\*\s?/, '').trim())
      .filter((l) => l && !l.startsWith('@') && !l.startsWith('GET') && !l.startsWith('POST') && !l.startsWith('PUT'));
    if (lines.length > 0) {
      const summary = lines[0].replace(/"/g, "'").slice(0, 100);
      if (summary.length > 10) return summary;
    }
  }

  // Fallback cleanly formatted summary
  const cleanPath = apiPath.replace('/api/', '').replace(/\//g, ' ');
  return `${method} ${cleanPath}`;
}

export function buildManifestEntries() {
  const routeFiles = findRoutes(API_DIR).sort();
  const entries = [];

  for (const file of routeFiles) {
    const rel = path.relative(path.join(ROOT, 'src/app'), file);
    const apiPath = '/' + rel.replace(/\/route\.ts$/, '').replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    const methods = extractMethods(content);

    for (const method of methods) {
      const audience = inferAudience(apiPath);
      const minRole = inferRole(audience, content, method);
      const tenantSource =
        audience === 'public'
          ? (apiPath === '/api/resolve-domain' ? 'query' : 'none')
          : audience === 'webhook'
          ? 'signature'
          : 'header';
      const idempotencyRequired = inferIdempotency(apiPath, method);
      const summary = generateSummary(apiPath, method, content);

      entries.push({
        path: apiPath,
        method,
        audience,
        ...(minRole ? { minRole } : {}),
        tenantSource,
        rateLimited: true,
        ...(idempotencyRequired ? { idempotencyRequired: true } : {}),
        summary,
      });
    }
  }

  return { routeFilesCount: routeFiles.length, entries };
}

export function generateManifestSource(entries, routeFilesCount) {
  const json = JSON.stringify(entries, null, 2);

  return `export type RouteAudience = 'public' | 'tenant' | 'mcc' | 'webhook';
export type TenantSource = 'header' | 'subdomain' | 'token' | 'query' | 'signature' | 'none';

export interface ApiRouteContract {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  audience: RouteAudience;
  minRole?: string;
  tenantSource: TenantSource;
  paginated?: boolean;
  rateLimited: boolean;
  idempotencyRequired?: boolean;
  summary: string;
  testFile?: string;
}

/**
 * 🗺️ API Route Manifest Exhaustif (Phase 4 Audit Remediation)
 *
 * Inventaire complet et opposable des ${routeFilesCount} routes API (${entries.length} endpoints HTTP).
 * Auto-généré et vérifié par scripts/generate-api-manifest.mjs.
 */
export const API_MANIFEST: ApiRouteContract[] = ${json};

/**
 * Utilitaires de validation et consultation du contrat d'API
 */
export function getRouteContract(path: string, method: string): ApiRouteContract | undefined {
  return API_MANIFEST.find(
    (r) => r.path === path && r.method.toUpperCase() === method.toUpperCase(),
  );
}

export function listRoutesByAudience(audience: RouteAudience): ApiRouteContract[] {
  return API_MANIFEST.filter((r) => r.audience === audience);
}

export function validateApiRouteManifest(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const routeSet = new Set<string>();

  for (const route of API_MANIFEST) {
    const key = \`\${route.method} \${route.path}\`;
    if (routeSet.has(key)) {
      errors.push(\`Route dupliquée dans le manifeste : \${key}\`);
    }
    routeSet.add(key);

    if (route.audience === 'tenant' && route.tenantSource === 'none') {
      errors.push(\`Route tenant sans source tenant spécifiée : \${key}\`);
    }

    if (route.audience === 'mcc' && !route.minRole) {
      errors.push(\`Route MCC sans rôle minimum déclaré : \${key}\`);
    }

    if (route.idempotencyRequired && route.method === 'GET') {
      errors.push(\`Route GET avec exigence d idempotence invalide : \${key}\`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
`;
}

// CLI entry point
const isCheck = process.argv.includes('--check');
const { routeFilesCount, entries } = buildManifestEntries();

if (isCheck) {
  console.log(`Vérification API Manifest: ${routeFilesCount} fichiers de routes, ${entries.length} endpoints.`);
  const current = fs.readFileSync(TARGET_FILE, 'utf8');
  const expected = generateManifestSource(entries, routeFilesCount);
  if (current !== expected) {
    console.error('❌ Le manifeste API n est pas à jour avec l arbre courant ! Lancez: node scripts/generate-api-manifest.mjs');
    process.exit(1);
  }
  console.log('✅ Manifeste API exhaustif conforme à 100%.');
} else {
  const output = generateManifestSource(entries, routeFilesCount);
  fs.writeFileSync(TARGET_FILE, output, 'utf8');
  console.log(`✅ Manifeste API exhaustif généré avec succès dans ${TARGET_FILE}`);
  console.log(`   - Routes fichiers : ${routeFilesCount}`);
  console.log(`   - Endpoints HTTP   : ${entries.length}`);
}
