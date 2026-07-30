'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Cpu, CheckCircle, Award } from 'lucide-react';

interface AuditReport {
  totalSeals: number;
}

interface CertAuditPanelProps {
  selectedInstanceId: string;
  auditStatus: 'idle' | 'checking' | 'valid' | 'invalid';
  auditReport: AuditReport | null;
  isGenerating: boolean;
  onCheckAudit(): void;
  onGenerate(): void;
}

export function CertAuditPanel({ selectedInstanceId, auditStatus, auditReport, isGenerating, onCheckAudit, onGenerate }: CertAuditPanelProps) {
  return (
    <>
      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
        className={`p-6 bg-surface-card border rounded-2xl transition-all duration-700 relative overflow-hidden ${
          auditStatus === 'valid' ? 'border-emerald-500/30 bg-status-success/5' :
          auditStatus === 'invalid' ? 'border-red-500/30 bg-status-danger/5' :
          'border-border-subtle'
        }`}
      >
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
              auditStatus === 'valid' ? 'text-status-success' :
              auditStatus === 'invalid' ? 'text-status-danger' :
              'text-brand'
            }`}>Analyse Cryptographique du Registre</h4>
            <p className="text-[10px] text-secondary font-medium">Authentification de l'intégrité de la chaîne de blocs (Protocole NF525).</p>
          </div>
          <AnimatePresence mode="wait">
            {auditStatus === 'valid' && (
              <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} key="valid">
                <ShieldCheck className="w-6 h-6 text-status-success shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
              </motion.div>
            )}
            {auditStatus === 'invalid' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key="invalid">
                <AlertTriangle className="w-6 h-6 text-status-danger" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {auditStatus === 'idle' && (
          <button
            onClick={onCheckAudit}
            disabled={!selectedInstanceId}
            className="relative group overflow-hidden text-[10px] font-bold text-text-primary uppercase tracking-widest bg-surface-card px-6 py-3 rounded-xl border border-subtle transition-all disabled:opacity-30"
          >
            <span className="relative z-10">Lancer l'Audit Global</span>
            <div className="absolute inset-0 bg-gradient-to-r from-action-primary/0 via-white/5 to-action-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </button>
        )}

        {auditStatus === 'checking' && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-20 h-20 mb-4">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-focus/20 border-t-indigo-500"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cpu className="w-8 h-8 text-brand animate-pulse" />
                </div>
                <motion.div
                  animate={{ top: ['-10%', '110%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-[-20%] right-[-20%] h-[1px] bg-gradient-to-r from-transparent via-action-primary/50 to-transparent blur-[1px] z-10"
                />
              </div>
              <div className="flex items-center gap-3 text-[10px] text-brand font-black uppercase tracking-[0.3em] animate-pulse">
                Traçage des Sceaux...
              </div>
            </div>
            <div className="h-0.5 w-full bg-surface-card rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: 'easeInOut' }}
                className="h-full bg-action-primary shadow-[0_0_15px_rgba(99,102,241,0.6)]"
              />
            </div>
          </div>
        )}

        {auditStatus === 'valid' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] text-status-success font-black uppercase tracking-[0.2em]">
              <CheckCircle className="w-4 h-4" />
              Consensus Atteint : Intégrité 100%
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface-card p-3 rounded-xl border border-border-subtle">
                <p className="text-[8px] text-secondary uppercase font-black tracking-widest">Sceaux Vérifiés</p>
                <p className="text-sm font-black text-text-primary">{auditReport?.totalSeals ?? 0}</p>
              </div>
              <div className="bg-surface-card p-3 rounded-xl border border-border-subtle">
                <p className="text-[8px] text-secondary uppercase font-black tracking-widest">Continuité de la Chaîne</p>
                <p className="text-sm font-black text-text-primary">SÉCURISÉ</p>
              </div>
            </div>
          </motion.div>
        )}

        {auditStatus === 'invalid' && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-status-danger/10 border border-red-500/20 rounded-xl">
            <p className="text-[10px] text-status-danger font-black uppercase tracking-tight">Violation du Protocole de Sécurité</p>
            <p className="text-[8px] text-status-danger/70 mt-1 leading-relaxed">Lien cryptographique rompu. Échec de la vérification.</p>
          </motion.div>
        )}

        <AnimatePresence>
          {auditStatus === 'checking' && (
            <motion.div
              initial={{ top: '-100%' }}
              animate={{ top: '100%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-action-primary/10 to-transparent pointer-events-none"
            />
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="space-y-4 pt-4">
        <button
          onClick={onGenerate}
          disabled={!selectedInstanceId || isGenerating || auditStatus !== 'valid'}
          className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-4 transition-all duration-500 ${
            !selectedInstanceId || isGenerating || auditStatus !== 'valid'
              ? 'bg-surface-card0 text-secondary cursor-not-allowed border border-border-subtle'
              : 'bg-surface-card text-primary hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-[0.98]'
          }`}
        >
          {isGenerating ? (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span className="animate-pulse">Signature du Registre...</span>
            </div>
          ) : (
            <>
              <Award className="w-5 h-5" />
              Émettre le Certificat Numérique
            </>
          )}
        </button>
        <p className="text-center text-[8px] text-secondary font-black uppercase tracking-[0.3em] opacity-50">
          NF525 · Art. 286 I-3° bis CGI
        </p>
      </motion.div>
    </>
  );
}
