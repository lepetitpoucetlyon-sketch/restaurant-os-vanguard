'use client';

import { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Trash2, Copy, Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  keyPrefix: string;
  name: string;
  permissions: string[];
  createdAt: string;
  lastUsedAt: string | null;
}

interface NewKeyResult {
  key: string;
  keyPrefix: string;
  id: string;
  name: string;
  createdAt: string;
}

export default function ApiKeysPanel() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<NewKeyResult | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tenant/api-keys');
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json() as { keys: ApiKey[] };
      setKeys(data.keys);
    } catch {
      toast.error('Impossible de charger les clés API');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/tenant/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json() as NewKeyResult;
      setCreatedKey(data);
      setShowForm(false);
      setNewKeyName('');
      await loadKeys();
    } catch {
      toast.error('Erreur lors de la création de la clé');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (keyId: string, keyName: string) => {
    setRevokingId(keyId);
    try {
      const res = await fetch(`/api/tenant/api-keys/${keyId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(String(res.status));
      toast.success(`Clé "${keyName}" révoquée`);
      setKeys(prev => prev.filter(k => k.id !== keyId));
    } catch {
      toast.error('Erreur lors de la révocation');
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value).then(() => toast.success('Clé copiée'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-accent">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">Clés API Externes</h3>
            <p className="text-xs text-text-muted">Intégration ERP et systèmes tiers via <code className="bg-bg-secondary px-1 rounded">ros_*</code></p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setCreatedKey(null); setShowKey(false); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-bg-primary text-xs font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          Générer
        </button>
      </div>

      {/* One-time key display */}
      {createdKey && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-emerald-500">Clé générée — copiez-la maintenant</p>
          </div>
          <p className="text-xs text-text-muted">Cette clé ne sera plus affichée après fermeture de cette section.</p>
          <div className="flex items-center gap-2">
            <code className={`flex-1 text-xs font-mono bg-bg-secondary rounded-lg px-3 py-2.5 text-text-primary truncate transition-all ${!showKey ? 'blur-sm select-none pointer-events-none' : ''}`}>
              {createdKey.key}
            </code>
            <button
              onClick={() => setShowKey(v => !v)}
              className="p-2 rounded-lg border border-border text-text-muted hover:text-text-primary transition-colors"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => copyToClipboard(createdKey.key)}
              className="p-2 rounded-lg border border-border text-text-muted hover:text-emerald-500 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => setCreatedKey(null)}
            className="text-xs text-text-muted hover:text-text-primary underline"
          >
            J&apos;ai bien sauvegardé la clé
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-3">
          <p className="text-sm font-semibold text-text-primary">Nouvelle clé API</p>
          <input
            type="text"
            placeholder="Nom (ex: ERP Compta, App Mobile…)"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
            className="w-full rounded-xl border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setNewKeyName(''); }}
              className="flex-1 px-3 py-2 rounded-xl border border-border text-text-muted text-xs font-semibold hover:bg-bg-primary transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={!newKeyName.trim() || isCreating}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-accent text-bg-primary text-xs font-bold disabled:opacity-40 transition-opacity"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
              Générer
            </button>
          </div>
        </div>
      )}

      {/* Keys list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-text-muted text-xs">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Chargement…
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <Key className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-muted">Aucune clé API active.</p>
          <p className="text-xs text-text-muted mt-1">Générez une clé pour intégrer des systèmes tiers.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map(k => (
            <div key={k.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-bg-primary">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-text-primary truncate block">{k.name}</span>
                <p className="text-xs text-text-muted mt-0.5 font-mono">{k.keyPrefix}…</p>
                <p className="text-xs text-text-muted">
                  Créée le {new Intl.DateTimeFormat('fr-FR').format(new Date(k.createdAt))}
                  {k.lastUsedAt
                    ? ` · Dernière utilisation ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(k.lastUsedAt))}`
                    : ' · Jamais utilisée'}
                </p>
              </div>
              <button
                onClick={() => handleRevoke(k.id, k.name)}
                disabled={revokingId === k.id}
                className="p-2 rounded-lg border border-border text-text-muted hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-colors disabled:opacity-40"
              >
                {revokingId === k.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-bg-secondary border border-border p-3">
        <p className="text-xs text-text-muted leading-relaxed">
          Utilisez <code className="bg-bg-primary px-1.5 py-0.5 rounded text-text-primary">Authorization: Bearer &lt;key&gt;</code> dans vos appels HTTP.
          <br />Validation : <code className="bg-bg-primary px-1.5 py-0.5 rounded text-text-primary">POST /api/tenant/api-keys/validate</code>
        </p>
      </div>
    </div>
  );
}
