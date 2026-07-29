"use client";

/**
 * ResellerPortal — mcc-growth-2
 * Gestion des commerciaux indépendants + suivi des commissions 10%.
 */
import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Copy, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";
import { authedFetch } from "@/lib/client/authedFetch";

interface Reseller {
  id: string;
  name: string;
  email: string;
  affiliateCode: string;
  commissionRate: number;
  status: "active" | "inactive";
  totalTenantsReferred: number;
  totalCommissionsEur: number;
}

export function ResellerPortal() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authedFetch("/api/admin/mcc/reseller");
      if (res.ok) {
        const d = await res.json() as { resellers: Reseller[] };
        setResellers(d.resellers ?? []);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function create() {
    if (!form.name || !form.email) { setError("Nom et email requis"); return; }
    setSaving(true); setError(null);
    try {
      const res = await authedFetch("/api/admin/mcc/reseller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json() as { reseller?: Reseller; error?: string };
      if (!res.ok) { setError(d.error ?? "Erreur"); return; }
      setResellers(r => [...r, d.reseller!]);
      setShowForm(false);
      setForm({ name: "", email: "", phone: "" });
    } finally { setSaving(false); }
  }

  async function toggleStatus(r: Reseller) {
    const newStatus = r.status === "active" ? "inactive" : "active";
    await authedFetch("/api/admin/mcc/reseller", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resellerId: r.id, status: newStatus }),
    });
    setResellers(rs => rs.map(x => x.id === r.id ? { ...x, status: newStatus } : x));
  }

  function copyCode(code: string) {
    void navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const totalCommissions = resellers.reduce((s, r) => s + r.totalCommissionsEur, 0);
  const activeResellers = resellers.filter(r => r.status === "active").length;
  const totalReferrals = resellers.reduce((s, r) => s + r.totalTenantsReferred, 0);

  return (
    <div className="p-6 bg-surface-card backdrop-blur-md border border-border-subtle rounded-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-brand" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Reseller Portal</h3>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 bg-action-primary/20 border border-focus/30 text-brand text-xs font-bold px-4 py-2 rounded-xl hover:bg-action-primary/30 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Nouveau revendeur
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Revendeurs actifs", value: String(activeResellers), icon: <Users className="w-4 h-4 text-brand" /> },
          { label: "Tenants apportés", value: String(totalReferrals), icon: <TrendingUp className="w-4 h-4 text-status-success" /> },
          { label: "Commissions cumulées", value: `€${totalCommissions.toFixed(2)}`, icon: <TrendingUp className="w-4 h-4 text-action-primary" /> },
        ].map(k => (
          <div key={k.label} className="bg-surface-card border border-border-subtle rounded-xl p-3 text-center">
            <div className="flex justify-center mb-1">{k.icon}</div>
            <div className="text-lg font-bold text-text-primary">{k.value}</div>
            <div className="text-[10px] text-secondary uppercase tracking-wider">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-surface-card border border-border-subtle rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Nouveau revendeur</p>
          {error && (
            <div className="flex items-center gap-2 text-status-danger text-xs bg-red-950/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-3 h-3" /> {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom complet" className="bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-focus/50 col-span-2 sm:col-span-1" />
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" type="email" className="bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-focus/50 col-span-2 sm:col-span-1" />
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Téléphone" className="bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-focus/50 col-span-2 sm:col-span-1" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-2 text-xs text-secondary hover:text-text-primary transition-colors">Annuler</button>
            <button onClick={create} disabled={saving} className="px-4 py-2 bg-action-primary text-text-primary text-xs font-bold rounded-lg disabled:opacity-50">
              {saving ? "Création..." : "Créer"}
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="text-center text-secondary text-sm py-4">Chargement...</div>
      ) : resellers.length === 0 ? (
        <div className="text-center text-secondary text-sm py-4 italic">Aucun revendeur enregistré</div>
      ) : (
        <div className="space-y-2">
          {resellers.map(r => (
            <div key={r.id} className="flex items-center gap-3 bg-surface-card border border-border-subtle rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary truncate">{r.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${r.status === "active" ? "bg-status-success/20 text-status-success" : "bg-slate-600/30 text-text-secondary"}`}>{r.status}</span>
                </div>
                <div className="text-[11px] text-secondary">{r.email} · {r.totalTenantsReferred} tenants · €{r.totalCommissionsEur.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyCode(r.affiliateCode)}
                  className="flex items-center gap-1.5 bg-surface-card px-2.5 py-1.5 rounded-lg text-[11px] font-mono hover:bg-surface-hover transition-colors"
                  title="Copier le code d'affiliation"
                >
                  {copied === r.affiliateCode ? <CheckCircle2 className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3 text-secondary" />}
                  {r.affiliateCode}
                </button>
                <button
                  onClick={() => toggleStatus(r)}
                  className="text-[10px] px-2 py-1 rounded-lg border border-border-subtle hover:bg-surface-card transition-colors text-secondary"
                >
                  {r.status === "active" ? "Désactiver" : "Activer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-secondary opacity-60">
        Commission : {(resellers[0]?.commissionRate ?? 0.10) * 100}% du MRR par tenant apporté.
        Le code d'affiliation s'entre lors du provisioning d'un nouveau tenant (champ "Referred by").
      </p>
    </div>
  );
}
