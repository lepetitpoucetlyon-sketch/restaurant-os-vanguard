'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Wrench,
  Shield,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  Smartphone,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Building2,
  Flame,
  Snowflake,
  Coffee,
  Monitor,
  Sparkles,
  Layers,
  Send,
  Zap,
} from 'lucide-react';
import {
  MaintenanceSettingsConfig,
  MaintenanceAlertRule,
  RestaurantZone,
  RESTAURANT_ZONE_LABELS,
  AlertRecipient,
  NotificationChannel,
} from '@/modules/facility/assets/domain/schemas/maintenanceAlerts';
import { useAuth } from '@/infrastructure/auth/hooks/useAuth';

const ZONE_ICONS: Record<RestaurantZone, React.ReactNode> = {
  ALL: <Building2 className="w-4 h-4 text-emerald-400" />,
  KITCHEN_HOT: <Flame className="w-4 h-4 text-amber-400" />,
  KITCHEN_COLD: <Snowflake className="w-4 h-4 text-cyan-400" />,
  BAR_BEVERAGE: <Coffee className="w-4 h-4 text-orange-400" />,
  DINING_ROOM_POS: <Monitor className="w-4 h-4 text-indigo-400" />,
  DISHWASHING_HYGIENE: <Sparkles className="w-4 h-4 text-blue-400" />,
  STORAGE_CELLAR: <Layers className="w-4 h-4 text-purple-400" />,
  HVAC_FACILITY: <Zap className="w-4 h-4 text-rose-400" />,
  TERRACE_OUTDOOR: <Building2 className="w-4 h-4 text-teal-400" />,
};

export function MaintenanceSettingsPanel() {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState<MaintenanceSettingsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingAlert, setTestingAlert] = useState(false);
  const [selectedZone, setSelectedZone] = useState<RestaurantZone>('ALL');
  const [activeTab, setActiveTab] = useState<'rules' | 'recipients' | 'providers'>('rules');

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/facility/settings/maintenance');
      if (res.ok) {
        const json = await res.json();
        setConfig(json.data);
      }
    } catch (err) {
      toast.error('Erreur lors du chargement des réglages de maintenance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    try {
      setSaving(true);
      const res = await fetch('/api/facility/settings/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        toast.success('Réglages et alertes de maintenance synchronisés');
      } else {
        toast.error('Échec de l enregistrement');
      }
    } catch (err) {
      toast.error('Erreur réseau lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleTestAlert = async (rule: MaintenanceAlertRule) => {
    try {
      setTestingAlert(true);
      const res = await fetch('/api/facility/settings/maintenance/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertType: rule.alertType,
          severity: 'critical',
          zone: selectedZone,
          equipmentName: `Équipement Test (${RESTAURANT_ZONE_LABELS[selectedZone]})`,
        }),
      });

      const json = await res.json();
      if (res.ok && json.data.dispatched) {
        toast.success(`Alerte test transmise à ${json.data.recipientsNotified} destinataire(s) via [${json.data.channelsUsed.join(', ')}]`);
      } else {
        toast.warning('Aucun destinataire n a correspondu aux filtres de cette zone/sévérité.');
      }
    } catch (err) {
      toast.error('Erreur lors du test d alerte');
    } finally {
      setTestingAlert(false);
    }
  };

  const toggleRuleEnabled = (ruleId: string) => {
    if (!config) return;
    setConfig({
      ...config,
      rules: config.rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)),
    });
  };

  const toggleRecipientChannel = (ruleId: string, recipientId: string, channel: NotificationChannel) => {
    if (!config) return;
    setConfig({
      ...config,
      rules: config.rules.map((r) => {
        if (r.id !== ruleId) return r;
        return {
          ...r,
          recipients: r.recipients.map((rec) => {
            if (rec.id !== recipientId) return rec;
            const hasChannel = rec.channels.includes(channel);
            const newChannels = hasChannel
              ? rec.channels.filter((c) => c !== channel)
              : [...rec.channels, channel];
            return { ...rec, channels: newChannels.length > 0 ? newChannels : ['IN_APP'] };
          }),
        };
      }),
    });
  };

  if (loading && !config) {
    return (
      <div className="p-16 text-center text-slate-500 text-xs space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
        <span>Chargement des réglages de maintenance & alertes...</span>
      </div>
    );
  }

  // Filtrage des règles applicables à la zone sélectionnée
  const rulesInZone = (config?.rules || []).filter(
    (r) => selectedZone === 'ALL' || r.applicableZones.includes('ALL') || r.applicableZones.includes(selectedZone)
  );

  const providersInZone = (config?.externalProviders || []).filter(
    (p) => selectedZone === 'ALL' || p.assignedZones.includes('ALL') || p.assignedZones.includes(selectedZone)
  );

  return (
    <div className="space-y-6">
      {/* Header avec sélecteur de zone et actions globales */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold uppercase tracking-wider">
                GMAO & Maintenance Intelligente
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                Pilier 8 Facility
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Paramètres de Maintenance & Routage des Alertes
            </h2>
            <p className="text-xs text-slate-400">
              Définissez les règles de déclenchement, les canaux de notification (In-app, SMS, Email) et qui reçoit les alertes par zone du restaurant.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchConfig}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </div>

        {/* Barre de sélection de Zone (L'entièreté ou partie du restaurant) */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Périmètre & Zone d Établissement :</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {(Object.keys(RESTAURANT_ZONE_LABELS) as RestaurantZone[]).map((zoneKey) => {
              const isSelected = selectedZone === zoneKey;
              return (
                <button
                  key={zoneKey}
                  onClick={() => setSelectedZone(zoneKey)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {ZONE_ICONS[zoneKey]}
                  <span>{RESTAURANT_ZONE_LABELS[zoneKey]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Onglets secondaires de configuration */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rules'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Règles d Alertes & Déclencheurs ({rulesInZone.length})
        </button>
        <button
          onClick={() => setActiveTab('recipients')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'recipients'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Destinataires & Canaux de Réception
        </button>
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'providers'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Prestataires SAV & Contrats ({providersInZone.length})
        </button>
      </div>

      {/* Contenu Onglet 1 : Règles d'Alertes */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {rulesInZone.map((rule) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl border transition-all ${
                rule.enabled
                  ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-900/30 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => toggleRuleEnabled(rule.id)}
                      className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                        rule.enabled ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          rule.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <h4 className="text-sm font-bold text-white tracking-tight">{rule.label}</h4>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono">
                      {rule.alertType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{rule.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTestAlert(rule)}
                    disabled={testingAlert || !rule.enabled}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all disabled:opacity-40"
                    title="Simuler et envoyer une alerte test"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Tester l alerte</span>
                  </button>
                </div>
              </div>

              {/* Destinataires configurés pour cette règle */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-bold text-slate-500">Destinataires notifiés :</span>
                {rule.recipients.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <span className="font-semibold text-white">{rec.name || rec.role}</span>
                    <span className="text-slate-500">({rec.minSeverity}+)</span>
                    <div className="flex items-center gap-1 ml-1 border-l border-slate-800 pl-2">
                      <button
                        onClick={() => toggleRecipientChannel(rule.id, rec.id, 'IN_APP')}
                        title="Canal In-App"
                        className={`p-1 rounded ${
                          rec.channels.includes('IN_APP') ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-600'
                        }`}
                      >
                        <Bell className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleRecipientChannel(rule.id, rec.id, 'EMAIL')}
                        title="Canal Email"
                        className={`p-1 rounded ${
                          rec.channels.includes('EMAIL') ? 'text-blue-400 bg-blue-500/10' : 'text-slate-600'
                        }`}
                      >
                        <Mail className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleRecipientChannel(rule.id, rec.id, 'SMS')}
                        title="Canal SMS"
                        className={`p-1 rounded ${
                          rec.channels.includes('SMS') ? 'text-purple-400 bg-purple-500/10' : 'text-slate-600'
                        }`}
                      >
                        <Smartphone className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Contenu Onglet 2 : Destinataires & Rôles */}
      {activeTab === 'recipients' && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Matrice des Responsabilités & Canaux de Contact</h3>
            <p className="text-xs text-slate-400">
              Configurez les coordonnées de contact (Email, Mobile) des postes clés pour la réception des alertes d urgence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Directeur / Gérant</span>
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-300 font-medium">Reçoit les alertes critiques (Panne bloquante, J-30 fin de garantie, contrôle CERFA).</p>
              <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                <div>Canaux activés : In-App, Email, SMS</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Manager de Shift</span>
                <Clock className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-xs text-slate-300 font-medium">Reçoit toutes les alertes de maintenance préventive J-7, pannes dégradées et retards de nettoyage.</p>
              <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                <div>Canaux activés : In-App, Email</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Chef de Cuisine & Barman</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xs text-slate-300 font-medium">Reçoit les anomalies de température des chambres froides et les incidents matériel de cuisson/bar.</p>
              <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                <div>Canaux activés : In-App, SMS</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Technicien SAV d Astreinte</span>
                <Phone className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-xs text-slate-300 font-medium">Notification immédiate par email/SMS dès la déclaration d une panne critique bloquante.</p>
              <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                <div>Canaux activés : Email, SMS</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu Onglet 3 : Prestataires SAV par Zone */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providersInZone.map((prov) => (
              <div key={prov.id} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white">{prov.name}</h4>
                    <p className="text-xs text-emerald-400">{prov.specialty}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-400">
                    {prov.contractNumber || 'Contrat Standard'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-white">{prov.phone}</span>
                  </div>
                  {prov.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prov.email}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-bold">Zones :</span>
                  {prov.assignedZones.map((z) => (
                    <span key={z} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300">
                      {RESTAURANT_ZONE_LABELS[z] || z}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
