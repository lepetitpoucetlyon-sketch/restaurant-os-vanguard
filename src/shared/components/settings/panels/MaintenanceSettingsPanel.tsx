'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import {
  type RestaurantZone,
  type MaintenanceAlertRule,
  type NotificationChannel,
  type MaintenanceSettingsConfig,
  RESTAURANT_ZONE_LABELS,
} from '@/modules/facility';
import { useAuth } from '@/infrastructure/auth/hooks/useAuth';

import { MaintenanceHeader } from './maintenance/MaintenanceHeader';
import { MaintenanceRulesTab } from './maintenance/MaintenanceRulesTab';
import { MaintenanceRecipientsTab } from './maintenance/MaintenanceRecipientsTab';
import { MaintenanceProvidersTab } from './maintenance/MaintenanceProvidersTab';

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
    } catch {
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
    } catch {
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
    } catch {
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
      <div className="p-16 text-center text-text-muted/80 text-xs space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
        <span>Chargement des réglages de maintenance & alertes...</span>
      </div>
    );
  }

  const rulesInZone = (config?.rules || []).filter(
    (r) => selectedZone === 'ALL' || r.applicableZones.includes('ALL') || r.applicableZones.includes(selectedZone)
  );

  const providersInZone = (config?.externalProviders || []).filter(
    (p) => selectedZone === 'ALL' || p.assignedZones.includes('ALL') || p.assignedZones.includes(selectedZone)
  );

  return (
    <div className="space-y-6">
      <MaintenanceHeader
        selectedZone={selectedZone}
        setSelectedZone={setSelectedZone}
        loading={loading}
        saving={saving}
        onRefresh={fetchConfig}
        onSave={handleSave}
      />

      {/* Navigation Onglets */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rules'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Règles d Alertes & Déclencheurs ({rulesInZone.length})
        </button>
        <button
          onClick={() => setActiveTab('recipients')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'recipients'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Destinataires & Canaux de Réception
        </button>
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'providers'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Prestataires SAV & Contrats ({providersInZone.length})
        </button>
      </div>

      {activeTab === 'rules' && (
        <MaintenanceRulesTab
          rules={rulesInZone}
          testingAlert={testingAlert}
          onToggleRuleEnabled={toggleRuleEnabled}
          onToggleRecipientChannel={toggleRecipientChannel}
          onTestAlert={handleTestAlert}
        />
      )}

      {activeTab === 'recipients' && <MaintenanceRecipientsTab />}

      {activeTab === 'providers' && <MaintenanceProvidersTab providers={providersInZone} />}
    </div>
  );
}
