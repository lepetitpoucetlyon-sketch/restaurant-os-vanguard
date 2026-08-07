'use client';
import React, { useState } from 'react';
import type { ConnectorId, ConnectorCredentials } from '@/modules/commerce/acquisition/onboarding/migration/connectors/types';
import { ConnectorRegistry } from '@/modules/commerce/acquisition/onboarding/migration/connectors';
import { ExportGuidePanel } from '@/modules/commerce/acquisition/onboarding/guides';

interface ConnectorOAuthPanelProps {
  connectorId: ConnectorId;
  onConnected: (credentials: ConnectorCredentials, accountInfo?: Record<string, unknown>) => void;
}

export function ConnectorOAuthPanel({ connectorId, onConnected }: ConnectorOAuthPanelProps) {
  const meta = ConnectorRegistry.get(connectorId).meta;
  const [creds, setCreds] = useState<ConnectorCredentials>({});
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/tenant/onboarding/connector/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: connectorId, credentials: creds }),
      });
      const json = await res.json() as { ok?: boolean; error?: string; accountInfo?: Record<string, unknown> };
      if (json.ok) {
        setSuccess(true);
        onConnected(creds, json.accountInfo);
      } else {
        setError(json.error ?? 'Connexion échouée');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{meta.logo}</span>
        <div>
          <h3 className="font-semibold text-gray-900">{meta.displayName}</h3>
          <p className="text-xs text-gray-500">
            {meta.authMethod === 'api_key' ? 'Clé API requise' : 'Authentification OAuth2'}
          </p>
        </div>
      </div>

      {meta.exportGuide && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          💡 {meta.exportGuide}
        </div>
      )}

      <div className="space-y-3">
        {meta.authMethod === 'api_key' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clé API</label>
            <input
              type="password"
              placeholder="sk-..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={creds.apiKey ?? ''}
              onChange={(e) => setCreds({ ...creds, apiKey: e.target.value })}
            />
          </div>
        )}

        {meta.authMethod === 'oauth2' && meta.oauthUrl && (
          <a
            href={meta.oauthUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
          >
            Connecter via OAuth →
          </a>
        )}

        {meta.authMethod === 'basic' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Identifiant</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={creds.clientId ?? ''}
                onChange={(e) => setCreds({ ...creds, clientId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={creds.clientSecret ?? ''}
                onChange={(e) => setCreds({ ...creds, clientSecret: e.target.value })}
              />
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
          ✅ Connexion établie avec succès
        </div>
      )}

      {meta.authMethod !== 'oauth2' && (
        <button
          onClick={handleTest}
          disabled={testing}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {testing ? 'Test en cours…' : 'Tester la connexion'}
        </button>
      )}

      <ExportGuidePanel connectorId={connectorId} />

      {meta.guideUrl && (
        <a
          href={meta.guideUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs text-indigo-500 hover:underline"
        >
          Comment trouver ma clé API ?
        </a>
      )}
    </div>
  );
}
