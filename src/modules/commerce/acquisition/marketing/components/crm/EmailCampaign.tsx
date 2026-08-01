"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, Send, Users, Eye, Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { toast } from "sonner";
import { authedFetch } from "@/lib/client/authedFetch";
import { useActionPermission } from "@/shared/hooks/useActionPermission";

type CampaignSegment = "all_active" | "inactive_3m" | "birthdays_this_month";

interface SegmentOption {
  value: CampaignSegment;
  label: string;
  description: string;
}

const SEGMENTS: SegmentOption[] = [
  {
    value: "all_active",
    label: "Tous les clients actifs",
    description: "Clients ayant visité au moins une fois",
  },
  {
    value: "inactive_3m",
    label: "Inactifs 3+ mois",
    description: "Clients sans visite depuis plus de 90 jours",
  },
  {
    value: "birthdays_this_month",
    label: "Anniversaires ce mois",
    description: "Clients dont l'anniversaire tombe ce mois-ci",
  },
];

interface CustomerRecord {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  lastVisitDate?: string;
  birthDate?: string;
  visitCount?: number;
}

function useRecipientCount(segment: CampaignSegment): { count: number; loading: boolean } {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const compute = useCallback(async () => {
    setLoading(true);
    try {
      const all = await Nexus.adapter.query<CustomerRecord>("customers").catch(() => [] as CustomerRecord[]);
      const withEmail = all.filter((c) => Boolean(c.email));
      const now = new Date();
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const currentMonth = now.getMonth();

      let filtered: CustomerRecord[];
      if (segment === "all_active") {
        filtered = withEmail.filter((c) => (c.visitCount ?? 0) > 0);
      } else if (segment === "inactive_3m") {
        filtered = withEmail.filter((c) => {
          if (!c.lastVisitDate) return true;
          return new Date(c.lastVisitDate) < threeMonthsAgo;
        });
      } else {
        // birthdays_this_month
        filtered = withEmail.filter((c) => {
          if (!c.birthDate) return false;
          const birthMonth = new Date(c.birthDate).getMonth();
          return birthMonth === currentMonth;
        });
      }
      setCount(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [segment]);

  useEffect(() => {
    compute();
  }, [compute]);

  return { count, loading };
}

type SendStatus = "idle" | "sending" | "success";

export function EmailCampaign() {
  const [segment, setSegment] = useState<CampaignSegment>("all_active");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const { count, loading: countLoading } = useRecipientCount(segment);
  const sendPermission = useActionPermission("crm", "send_campaign");

  const handleSend = async () => {
    if (!sendPermission.allowed) {
      toast.error(sendPermission.reason ?? "Action non autorisée");
      return;
    }
    if (!subject.trim()) { toast.error("L'objet est obligatoire"); return; }
    if (!body.trim()) { toast.error("Le corps du message est obligatoire"); return; }
    if (count === 0) { toast.error("Aucun destinataire pour ce segment"); return; }

    setSendStatus("sending");
    try {
      const res = await authedFetch("/api/crm/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segment, subject: subject.trim(), body: body.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Erreur inconnue" }));
        throw new Error((err as { message?: string }).message ?? "Erreur lors de l'envoi");
      }

      const data = await res.json() as { sent?: number };
      setSendStatus("success");
      toast.success(`Campagne envoyée à ${data.sent ?? count} destinataire(s)`);
      // Reset after 3s
      setTimeout(() => {
        setSendStatus("idle");
        setSubject("");
        setBody("");
      }, 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi");
      setSendStatus("idle");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-action-primary/10 flex items-center justify-center">
          <Mail className="w-5 h-5 text-action-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Campagnes Email</h2>
          <p className="text-xs text-text-muted">Envoi groupé via Resend</p>
        </div>
      </div>

      {/* Segment Selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
          Segment cible
        </label>
        <div className="grid grid-cols-1 gap-2">
          {SEGMENTS.map((seg) => (
            <button
              key={seg.value}
              onClick={() => setSegment(seg.value)}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                segment === seg.value
                  ? "border-action-primary bg-action-primary/5"
                  : "border-border bg-surface-card hover:border-action-primary/30"
              }`}
            >
              <div className={`w-4 h-4 rounded-full mt-0.5 border-2 shrink-0 transition-colors ${
                segment === seg.value ? "border-action-primary bg-action-primary" : "border-border"
              }`} />
              <div>
                <p className="text-sm font-medium text-text-primary">{seg.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{seg.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recipient count */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-card border border-border">
        <Users className="w-4 h-4 text-action-primary shrink-0" />
        {countLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
        ) : (
          <span className="text-sm text-text-primary">
            <strong className="font-bold">{count}</strong>
            {" "}destinataire{count !== 1 ? "s" : ""} estimé{count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Objet</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex: Offre exclusive ce week-end 🎉"
          className="w-full h-10 px-3 rounded-lg border border-border bg-surface-base text-sm text-text-primary focus:outline-none focus:border-action-primary"
        />
      </div>

      {/* Body */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Corps (HTML simple)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`<p>Bonjour {{prenom}},</p>\n<p>Nous avons une offre spéciale pour vous...</p>`}
          rows={8}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-base text-sm text-text-primary font-mono focus:outline-none focus:border-action-primary resize-y"
        />
      </div>

      {/* Preview toggle */}
      {body.trim() && (
        <div>
          <button
            onClick={() => setPreview((p) => !p)}
            className="flex items-center gap-2 text-xs text-action-primary hover:underline"
          >
            <Eye className="w-3.5 h-3.5" />
            {preview ? "Masquer" : "Aperçu HTML"}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${preview ? "rotate-180" : ""}`} />
          </button>
          {preview && (
            <div
              className="mt-3 p-4 rounded-xl border border-border bg-white text-black text-sm max-h-64 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: body.replace(/{{prenom}}/g, "Jean") }}
            />
          )}
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={sendStatus !== "idle" || count === 0 || !sendPermission.allowed}
        title={!sendPermission.allowed ? sendPermission.reason : undefined}
        className={`w-full h-12 rounded-xl text-sm font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
          sendStatus === "success"
            ? "bg-status-success text-text-primary"
            : "bg-action-primary text-text-primary hover:opacity-90 disabled:opacity-50"
        }`}
      >
        {sendStatus === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
        {sendStatus === "success" && <CheckCircle2 className="w-4 h-4" />}
        {sendStatus === "idle" && <Send className="w-4 h-4" />}
        {sendStatus === "sending" ? "Envoi en cours..." : sendStatus === "success" ? "Envoyé !" : `Envoyer à ${count} destinataire${count !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}
