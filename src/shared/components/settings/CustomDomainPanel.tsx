"use client";

/**
 * CustomDomainPanel — res-arch-3
 * Permet au tenant de renseigner son propre domaine (bistro.com).
 * Affiche les instructions CNAME à transmettre à son registrar.
 */
import { useState, useEffect } from "react";
import { Globe, Copy, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";

interface DomainStatus {
  customDomain: string | null;
  cnameTarget: string;
  instructions: string;
}

export default function CustomDomainPanel() {
  const [status, setStatus] = useState<DomainStatus | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/tenant/custom-domain")
      .then(r => r.json())
      .then((d: DomainStatus) => { setStatus(d); if (d.customDomain) setInput(d.customDomain); })
      .catch((e) => console.error("[CustomDomainPanel]", e));
  }, []);

  async function save() {
    setError(null); setSuccess(null); setLoading(true);
    try {
      const res = await fetch("/api/tenant/custom-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customDomain: input.trim() }),
      });
      const data = await res.json() as DomainStatus & { message?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setStatus(data);
      setSuccess(data.message ?? "Domaine enregistré");
    } finally { setLoading(false); }
  }

  async function remove() {
    setError(null); setLoading(true);
    try {
      await fetch("/api/tenant/custom-domain", { method: "DELETE" });
      setStatus(s => s ? { ...s, customDomain: null } : null);
      setInput("");
      setSuccess("Domaine supprimé");
    } finally { setLoading(false); }
  }

  function copyTarget() {
    if (!status?.cnameTarget) return;
    void navigator.clipboard.writeText(status.cnameTarget);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-surface-card/40 p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Globe className="w-5 h-5 text-accent" />
        <div>
          <h3 className="font-semibold text-text-primary">Domaine personnalisé</h3>
          <p className="text-xs text-text-secondary">Faites pointer votre domaine vers votre site vitrine Restaurant OS</p>
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="bistro.com ou www.bistro.com"
          className="flex-1 rounded-xl border border-border/50 bg-surface-card px-4 py-2.5 text-sm focus:outline-none focus:border-accent/50"
        />
        <button
          onClick={save}
          disabled={loading || !input.trim()}
          className="px-5 py-2.5 rounded-xl bg-accent text-text-primary text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          Enregistrer
        </button>
        {status?.customDomain && (
          <button
            onClick={remove}
            disabled={loading}
            aria-label="Supprimer le domaine personnalisé"
            className="p-2.5 rounded-xl border border-border/50 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-text-secondary" aria-hidden="true" />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-status-danger bg-red-50 dark:bg-red-950/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" /> {success}
        </div>
      )}

      {/* CNAME instructions */}
      {status && (
        <div className="rounded-xl border border-border/30 bg-surface-card/60 p-4 space-y-3">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Configuration DNS chez votre registrar</p>
          <div className="flex items-center gap-3 bg-bg-tertiary rounded-lg px-4 py-3">
            <code className="flex-1 text-sm font-mono text-text-primary">
              CNAME → <span className="text-accent">{status.cnameTarget}</span>
            </code>
            <button 
              onClick={copyTarget} 
              aria-label="Copier la cible CNAME"
              className="shrink-0 cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-status-success" aria-hidden="true" /> : <Copy className="w-4 h-4 text-text-secondary hover:text-text-primary transition-colors" aria-hidden="true" />}
            </button>
          </div>
          <p className="text-xs text-text-secondary">{status.instructions}</p>
          <p className="text-xs text-text-secondary opacity-60">
            La propagation DNS peut prendre jusqu'à 48h. Votre domaine existant reste actif pendant la transition.
          </p>
        </div>
      )}
    </div>
  );
}
