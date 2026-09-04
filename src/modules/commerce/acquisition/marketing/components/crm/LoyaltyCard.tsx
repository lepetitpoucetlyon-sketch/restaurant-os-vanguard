"use client";

import { useState, useEffect } from "react";
import { Star, Gift, Trophy, Loader2, Award } from "lucide-react";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { toast } from "sonner";

import { useLanguage } from "@/shared/hooks";
interface LoyaltyData {
  loyaltyPoints: number;
  totalRevenue: number;
  totalVisits: number;
}

export interface LoyaltyReward {
  id: string;
  customerId: string;
  rewardType: "discount_5eur" | "free_dessert";
  label: string;
  pointsCost: number;
  isRedeemed: boolean;
  redeemedAt?: string;
  createdAt: string;
}

interface LoyaltyCardProps {
  customerId: string;
  customerName: string;
}

const REWARDS = [
  {
    type: "discount_5eur" as const,
    label: "Remise 5€",
    pointsCost: 10,
    icon: Gift,
    description: "Applicable sur la prochaine commande",
  },
  {
    type: "free_dessert" as const,
    label: "Dessert offert",
    pointsCost: 20,
    icon: Trophy,
    description: "Un dessert au choix de la carte",
  },
] as const;

export function LoyaltyCard({ customerId, customerName }: LoyaltyCardProps) {
    const { t } = useLanguage();
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [activeRewards, setActiveRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // Load customer loyalty data
        const customers = await Nexus.adapter.query<LoyaltyData & { id: string }>("customers", {
          where: [{ field: "__name__", operator: "==", value: customerId }],
          limit: 1,
        }).catch(() => [] as (LoyaltyData & { id: string })[]);

        // Also try direct get for robustness
        const direct = await Nexus.adapter.get<LoyaltyData & { id: string }>(`customers/${customerId}`).catch(() => null);

        const loyaltyData = direct ?? customers[0] ?? null;

        // Load active rewards for this customer
        const rewards = await Nexus.adapter.query<LoyaltyReward>("loyaltyRewards", {
          where: [
            { field: "customerId", operator: "==", value: customerId },
            { field: "isRedeemed", operator: "==", value: false },
          ],
        }).catch(() => [] as LoyaltyReward[]);

        if (cancelled) return;
        setLoyalty(loyaltyData ? {
          loyaltyPoints: loyaltyData.loyaltyPoints ?? 0,
          totalRevenue: loyaltyData.totalRevenue ?? 0,
          totalVisits: loyaltyData.totalVisits ?? 0,
        } : { loyaltyPoints: 0, totalRevenue: 0, totalVisits: 0 });
        setActiveRewards(rewards);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [customerId]);

  const handleRedeem = async (rewardDef: typeof REWARDS[number]) => {
    if (!loyalty) return;
    if (loyalty.loyaltyPoints < rewardDef.pointsCost) {
      toast.error(`Points insuffisants (${loyalty.loyaltyPoints}/${rewardDef.pointsCost} pts)`);
      return;
    }
    setRedeeming(rewardDef.type);
    try {
      const id = Nexus.adapter.generateId("loyaltyRewards");
      const now = new Date().toISOString();
      const reward: LoyaltyReward = {
        id,
        customerId,
        rewardType: rewardDef.type,
        label: `${rewardDef.label} — ${customerName}`,
        pointsCost: rewardDef.pointsCost,
        isRedeemed: false,
        createdAt: now,
      };
      await Nexus.adapter.set(`loyaltyRewards/${id}`, reward);

      // Deduct points
      const newPoints = loyalty.loyaltyPoints - rewardDef.pointsCost;
      await Nexus.adapter.update(`customers/${customerId}`, {
        loyaltyPoints: newPoints,
        updatedAt: now,
      });

      setLoyalty((prev) => prev ? { ...prev, loyaltyPoints: newPoints } : prev);
      setActiveRewards((prev) => [...prev, reward]);
      toast.success(`Récompense "${rewardDef.label}" débloquée !`);
    } catch {
      toast.error("Erreur lors du déblocage de la récompense");
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-text-primary/30">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  const points = loyalty?.loyaltyPoints ?? 0;
  const nextRewardThreshold = REWARDS.find((r) => r.pointsCost > points)?.pointsCost ?? REWARDS[REWARDS.length - 1].pointsCost;
  const progressPct = Math.min((points / nextRewardThreshold) * 100, 100);

  return (
    <div className="space-y-8">
      {/* Points Balance */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Star className="w-5 h-5 text-accent" strokeWidth={1.5} />
          <p className="text-nano font-black uppercase tracking-[0.3em] text-text-primary/40">
            Solde de Points
          </p>
        </div>
        <p className="text-5xl font-mono font-light text-accent italic mb-1">{points}</p>
        <p className="text-xs text-text-primary/40">{t('commerce.crm.loyaltyPoints')}</p>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-nano text-text-primary/40 mb-2">
            <span>{points} pts</span>
            <span>Prochain palier : {nextRewardThreshold} pts</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-amber-400 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-nano text-text-primary/30 mt-2 text-right">
            {Math.max(nextRewardThreshold - points, 0)} pts restants
          </p>
        </div>
      </div>

      {/* Available Rewards */}
      <div>
        <h4 className="text-nano font-black text-text-primary/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Award className="w-3.5 h-3.5 text-accent" />
          Récompenses disponibles
        </h4>
        <div className="space-y-3">
          {REWARDS.map((reward) => {
            const Icon = reward.icon;
            const canRedeem = points >= reward.pointsCost;
            const isLoading = redeeming === reward.type;
            return (
              <div
                key={reward.type}
                className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${
                  canRedeem
                    ? "border-accent/30 bg-accent/5"
                    : "border-white/5 bg-surface-glass opacity-50"
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  canRedeem ? "bg-accent/10" : "bg-white/5"
                }`}>
                  <Icon className={`w-5 h-5 ${canRedeem ? "text-accent" : "text-text-primary/20"}`} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary">{reward.label}</p>
                  <p className="text-micro text-text-primary/40 mt-0.5">{reward.description}</p>
                  <p className="text-nano font-mono text-accent mt-1">{reward.pointsCost} pts requis</p>
                </div>
                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={!canRedeem || isLoading}
                  className={`px-4 py-2 rounded-xl text-micro font-black uppercase tracking-wide transition-all disabled:cursor-not-allowed ${
                    canRedeem
                      ? "bg-accent text-bg-primary hover:bg-action-primary shadow-lg shadow-accent/20"
                      : "bg-white/5 text-text-primary/20"
                  }`}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Débloquer"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active (unredeemed) rewards */}
      {activeRewards.length > 0 && (
        <div>
          <h4 className="text-nano font-black text-text-primary/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Gift className="w-3.5 h-3.5 text-accent" />
            Récompenses actives ({activeRewards.length})
          </h4>
          <div className="space-y-2">
            {activeRewards.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/5 border border-accent/20"
              >
                <Gift className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-medium truncate">{r.label}</p>
                  <p className="text-nano text-text-primary/40 mt-0.5">
                    Obtenue le {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className="text-nano px-2 py-0.5 rounded-full bg-accent/10 text-accent font-black uppercase tracking-wide whitespace-nowrap">
                  À utiliser
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
