'use client';

import { motion } from 'framer-motion';
import { Send, Bell, Mail, Smartphone } from 'lucide-react';
import type { MaintenanceAlertRule, NotificationChannel } from '@/modules/facility';

interface MaintenanceRulesTabProps {
  rules: MaintenanceAlertRule[];
  testingAlert: boolean;
  onToggleRuleEnabled: (ruleId: string) => void;
  onToggleRecipientChannel: (ruleId: string, recipientId: string, channel: NotificationChannel) => void;
  onTestAlert: (rule: MaintenanceAlertRule) => void;
}

export function MaintenanceRulesTab({
  rules,
  testingAlert,
  onToggleRuleEnabled,
  onToggleRecipientChannel,
  onTestAlert,
}: MaintenanceRulesTabProps) {
  return (
    <div className="space-y-4">
      {rules.map((rule) => (
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
                  onClick={() => onToggleRuleEnabled(rule.id)}
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
                onClick={() => onTestAlert(rule)}
                disabled={testingAlert || !rule.enabled}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all disabled:opacity-40"
                title="Simuler et envoyer une alerte test"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Tester l alerte</span>
              </button>
            </div>
          </div>

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
                    onClick={() => onToggleRecipientChannel(rule.id, rec.id, 'IN_APP')}
                    title="Canal In-App"
                    className={`p-1 rounded ${
                      rec.channels.includes('IN_APP') ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-600'
                    }`}
                  >
                    <Bell className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onToggleRecipientChannel(rule.id, rec.id, 'EMAIL')}
                    title="Canal Email"
                    className={`p-1 rounded ${
                      rec.channels.includes('EMAIL') ? 'text-blue-400 bg-blue-500/10' : 'text-slate-600'
                    }`}
                  >
                    <Mail className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onToggleRecipientChannel(rule.id, rec.id, 'SMS')}
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
  );
}
