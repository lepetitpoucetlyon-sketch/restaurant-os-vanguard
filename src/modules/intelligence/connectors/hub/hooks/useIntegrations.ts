"use client";

import { useState, useEffect, useCallback } from 'react';
import type { IConnectorManifest, ConnectorState } from '@/shared/connector-manifest';
import { useConnector } from './useConnector';
import { toError } from "@/lib/toError";

export interface ConnectorEntry {
  manifest: IConnectorManifest;
  state: ConnectorState | null;
}

interface UseIntegrationsReturn {
  connectors: ConnectorEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  activate: (id: string) => Promise<void>;
  deactivate: (id: string) => Promise<void>;
  saveCredentials: (id: string, fields: Record<string, string>) => Promise<{ ok: boolean; error?: string }>;
  testConnection: (id: string) => Promise<{ ok: boolean; error?: string }>;
  syncNow: (id: string) => Promise<{ ok: boolean; itemsSynced?: number; error?: string }>;
  actionLoading: Record<string, boolean>;
}

export function useIntegrations(): UseIntegrationsReturn {
  const [connectors, setConnectors] = useState<ConnectorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const devHeaders = process.env.NODE_ENV !== 'production'
    ? { Authorization: 'Bearer dev-tenant-bypass' }
    : {} as Record<string, string>;

  const fetchConnectors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/connectors', { headers: devHeaders });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { connectors: ConnectorEntry[] };
      setConnectors(data.connectors);
    } catch (err) {
      setError(toError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConnectors(); }, [fetchConnectors]);

  const setItemLoading = (id: string, val: boolean) =>
    setActionLoading(prev => ({ ...prev, [id]: val }));

  const activate = useCallback(async (id: string) => {
    setItemLoading(id, true);
    try {
      await fetch(`/api/connectors/${id}/activate`, { method: 'POST', headers: devHeaders });
      await fetchConnectors();
    } finally { setItemLoading(id, false); }
  }, [fetchConnectors]);

  const deactivate = useCallback(async (id: string) => {
    setItemLoading(id, true);
    try {
      await fetch(`/api/connectors/${id}/activate`, { method: 'DELETE', headers: devHeaders });
      await fetchConnectors();
    } finally { setItemLoading(id, false); }
  }, [fetchConnectors]);

  const saveCredentials = useCallback(async (id: string, fields: Record<string, string>) => {
    setItemLoading(id, true);
    try {
      const res = await fetch(`/api/connectors/${id}/credentials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...devHeaders },
        body: JSON.stringify(fields),
      });
      const data = await res.json() as { message?: string; error?: string; missing?: string[] };
      await fetchConnectors();
      return res.ok ? { ok: true } : { ok: false, error: data.error ?? 'Erreur inconnue' };
    } catch (err) {
      return { ok: false, error: toError(err).message };
    } finally { setItemLoading(id, false); }
  }, [fetchConnectors]);

  const testConnection = useCallback(async (id: string) => {
    setItemLoading(id, true);
    try {
      const res = await fetch(`/api/connectors/${id}/test`, { method: 'POST', headers: devHeaders });
      const data = await res.json() as { ok: boolean; error?: string };
      await fetchConnectors();
      return data;
    } catch (err) {
      return { ok: false, error: toError(err).message };
    } finally { setItemLoading(id, false); }
  }, [fetchConnectors]);

  const syncNow = useCallback(async (id: string) => {
    setItemLoading(id, true);
    try {
      const res = await fetch(`/api/connectors/${id}/sync`, { method: 'POST', headers: devHeaders });
      const data = await res.json() as { ok?: boolean; itemsSynced?: number; queued?: boolean; error?: string };
      return { ok: data.ok ?? data.queued ?? false, itemsSynced: data.itemsSynced, error: data.error };
    } catch (err) {
      return { ok: false, error: toError(err).message };
    } finally { setItemLoading(id, false); }
  }, []);

  return { connectors, loading, error, refresh: fetchConnectors, activate, deactivate, saveCredentials, testConnection, syncNow, actionLoading };
}

// Hook RBAC pour un connecteur individuel — réexporté pour les composants enfants
export { useConnector };
