import { type PermissionRole, PERMISSION_ROLE_LEVELS } from '@/shared/nexus/contracts/permissions.types';

const BASE_URL = process.env.SOVEREIGN_RAG_URL ?? 'http://localhost:9621';
const ADMIN_KEY = process.env.SOVEREIGN_RAG_ADMIN_KEY ?? '';

// ── RBAC : niveau numérique → catégories de documents autorisées ──────────────

// Le veto dans Sovereign RAG utilise workspace_id + role pour filtrer les docs.
// Rôles niveau ≥ 70 → accès "*" (manager/directeur/super_admin)
export function getRoleLevel(role: PermissionRole): number {
  return PERMISSION_ROLE_LEVELS[role] ?? 10;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RAGQueryOptions {
  workspaceId: string;
  role: PermissionRole;
  userId?: string;
  skipMacroRouting?: boolean;
}

export interface RAGQueryResult {
  answer: string;
  sources?: Array<{ title: string; snippet: string }>;
  vetoed?: boolean;
  latencyMs?: number;
}

export interface RAGIngestOptions {
  workspaceId: string;
  fileName: string;
  fileContent: Blob;
  mimeType?: string;
}

export interface RAGIndexResult {
  jobId: string;
  status: 'queued' | 'processing' | 'done' | 'error';
}

export interface RAGHealthResult {
  status: 'online' | 'offline' | 'error';
  version?: string;
  documentCount?: number;
  lastIndexed?: string;
  latencyMs: number;
}

// ── Query ─────────────────────────────────────────────────────────────────────

export async function sovereignQuery(
  question: string,
  opts: RAGQueryOptions,
): Promise<RAGQueryResult> {
  const t0 = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: question,
        workspace_id: opts.workspaceId,
        role: opts.role,
        user_id: opts.userId,
        skip_macro_routing: opts.skipMacroRouting ?? false,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      return { answer: '', vetoed: false, latencyMs: Date.now() - t0 };
    }

    const data = await res.json() as {
      answer?: string;
      response?: string;
      vetoed?: boolean;
      sources?: Array<{ title: string; snippet: string }>;
    };

    return {
      answer: data.answer ?? data.response ?? '',
      sources: data.sources,
      vetoed: data.vetoed ?? false,
      latencyMs: Date.now() - t0,
    };
  } catch {
    return { answer: '', vetoed: false, latencyMs: Date.now() - t0 };
  }
}

// ── Ingest ────────────────────────────────────────────────────────────────────

export async function sovereignIngest(opts: RAGIngestOptions): Promise<RAGIndexResult> {
  const form = new FormData();
  form.append('file', opts.fileContent, opts.fileName);
  form.append('workspace_id', opts.workspaceId);

  const res = await fetch(`${BASE_URL}/api/ingest`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) throw new Error(`Sovereign RAG ingest error: ${res.status}`);
  return res.json() as Promise<RAGIndexResult>;
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function sovereignHealth(): Promise<RAGHealthResult> {
  const t0 = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return { status: 'error', latencyMs: Date.now() - t0 };
    const data = await res.json() as { version?: string; document_count?: number; last_indexed?: string };
    return {
      status: 'online',
      version: data.version,
      documentCount: data.document_count,
      lastIndexed: data.last_indexed,
      latencyMs: Date.now() - t0,
    };
  } catch {
    return { status: 'offline', latencyMs: Date.now() - t0 };
  }
}

// ── Admin (MCC uniquement — server-side) ─────────────────────────────────────

// ── Workspace creation (ProvisioningEngine — server-side uniquement) ──────────

export async function sovereignCreateWorkspace(
  workspaceId: string,
  name: string,
): Promise<{ status: string; workspace_id?: string }> {
  const res = await fetch(`${BASE_URL}/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_KEY,
    },
    body: JSON.stringify({ workspace_id: workspaceId, name }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sovereign RAG workspace creation failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<{ status: string; workspace_id?: string }>;
}

export async function sovereignAdminReindex(workspaceId: string): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/api/admin/workspaces/${workspaceId}/reindex`, {
    method: 'POST',
    headers: { 'x-admin-key': ADMIN_KEY },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Reindex failed: ${res.status}`);
  return res.json() as Promise<{ status: string }>;
}

export async function sovereignAdminStats(): Promise<{
  total_workspaces: number;
  total_queries: number;
  avg_latency_ms: number;
}> {
  const res = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { 'x-admin-key': ADMIN_KEY },
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`Admin stats failed: ${res.status}`);
  return res.json();
}
