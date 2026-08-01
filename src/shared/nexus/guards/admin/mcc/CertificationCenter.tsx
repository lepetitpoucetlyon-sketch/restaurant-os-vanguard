'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Search, CheckCircle } from 'lucide-react';
import { LegalCertificateA4 } from './components/LegalCertificateA4';
import { CertAuditPanel } from './components/CertAuditPanel';
import { CertPreviewPanel } from './components/CertPreviewPanel';
import { CertHistoryTab } from './components/CertHistoryTab';
import { useNexusFleet } from '@/modules/intelligence/ia/fleet';
import { logger } from '@/lib/logger';
import { useAuth } from '@/shared/hooks';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { SiteIntegrityReport, GlobalComplianceCertificate } from '@modules/intelligence/ia/fleet/FleetComplianceService';

interface AuditReport {
  isValid: boolean;
  totalSeals: number;
  isChainValid: boolean;
  entryCount: number;
}

interface DigitalCertificate {
  id: string;
  instanceId: string;
  instanceName: string;
  year: number;
  type: string;
  issuedAt: string;
  issuer: string;
}

export function CertificationCenter() {
  const { instances, complianceService } = useNexusFleet();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [auditStatus, setAuditStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [certificates, setCertificates] = useState<DigitalCertificate[]>([]);
  const [printingCert, setPrintingCert] = useState<DigitalCertificate | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (printingCert) {
      setTimeout(() => { window.print(); setPrintingCert(null); }, 100);
    }
  }, [printingCert]);

  useEffect(() => {
    Nexus.adapter.query<DigitalCertificate>('mcc/certificates')
      .then(certs => setCertificates((certs ?? []).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))))
      .catch(err => logger.warn('[CertificationCenter] Failed to load certs', String(err)));
  }, []);

  const selectedInstance = instances.find(i => i.id === selectedInstanceId);

  const handleDownloadCert = (cert: DigitalCertificate) => {
    const blob = new Blob([JSON.stringify(cert, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cert_${cert.instanceId}_${cert.year}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCheckAudit = async () => {
    if (!selectedInstanceId) return;
    setAuditStatus('checking');
    try {
      const report = await complianceService.verifySiteIntegrity(selectedInstanceId) as SiteIntegrityReport;
      setAuditReport({ isValid: report.isChainValid, totalSeals: report.entryCount, isChainValid: report.isChainValid, entryCount: report.entryCount });
      setAuditStatus(report.isChainValid ? 'valid' : 'invalid');
      logger.info('CertificationCenter: Audit check complete', { isValid: report.isChainValid });
    } catch (error) {
      logger.error('CertificationCenter: Audit check failed', { error });
      setAuditStatus('invalid');
    }
  };

  const handleGenerate = async () => {
    if (!selectedInstanceId || auditStatus !== 'valid') return;
    setIsGenerating(true);
    try {
      const operatorId = currentUser?.email ?? currentUser?.id ?? 'FLEET_CMDR';
      const cert = await complianceService.issueGlobalCertificate(operatorId) as GlobalComplianceCertificate;
      const digitalCert: DigitalCertificate = {
        id: cert.id,
        instanceId: selectedInstanceId,
        instanceName: selectedInstance?.name || 'Unknown',
        year: new Date(cert.issuedAt).getFullYear(),
        type: cert.status,
        issuedAt: new Date(cert.issuedAt).toISOString(),
        issuer: cert.issuedBy,
      };
      await Nexus.adapter.set(`mcc/certificates/${digitalCert.id}`, digitalCert);
      setCertificates(prev => [digitalCert, ...prev]);
      setIsGenerating(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      logger.error('CertificationCenter: Generation failed', { error });
      setIsGenerating(false);
    }
  };

  const handleSyncArchives = async () => {
    setIsSyncing(true);
    try {
      const primary = await Nexus.adapter.query<DigitalCertificate>('mcc/certificates');
      const fleetCerts = await Nexus.adapter.query<GlobalComplianceCertificate>('fleet-compliance');
      const primaryIds = new Set(primary.map(c => c.id));
      const toIndex: DigitalCertificate[] = [];
      for (const fc of fleetCerts) {
        if (primaryIds.has(fc.id)) continue;
        const digitalCert: DigitalCertificate = {
          id: fc.id, instanceId: '__FLEET__', instanceName: 'Empire Fleet',
          year: new Date(fc.issuedAt).getFullYear(), type: fc.status,
          issuedAt: fc.issuedAt, issuer: fc.issuedBy,
        };
        await Nexus.adapter.set(`mcc/certificates/${digitalCert.id}`, digitalCert);
        toIndex.push(digitalCert);
      }
      const merged = [...(primary ?? []), ...toIndex].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
      setCertificates(merged);
      logger.info(`[CertificationCenter] Archives synced — ${merged.length} certificat(s), ${toIndex.length} indexé(s)`);
    } catch (err) {
      logger.error('CertificationCenter: Sync failed', { err });
    } finally {
      setIsSyncing(false);
    }
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  return (
    <div className="bg-surface-card border border-border-subtle rounded-3xl p-8 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-status-warning/10 rounded-2xl flex items-center justify-center border border-action-primary/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <Award className="w-6 h-6 text-status-warning" />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-text-primary">Centre de Certification</h2>
            <p className="text-secondary text-xs font-medium">Auto-Certification Éditeur (NF525)</p>
          </div>
        </div>
        <div className="flex bg-surface-card p-1 rounded-xl border border-border-subtle">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'generate' ? 'bg-surface-card text-text-primary shadow-lg border border-border-subtle' : 'text-secondary hover:text-muted'}`}
          >Générer</button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-surface-card text-text-primary shadow-lg border border-border-subtle' : 'text-secondary hover:text-muted'}`}
          >Archives {certificates.length > 0 && `(${certificates.length})`}</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'generate' ? (
            <motion.div key="generate" initial="hidden" animate="visible" exit="exit" variants={tabVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-secondary uppercase mb-3 ml-1 tracking-[0.3em]">Sélection de l'Instance (Nœud)</label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-action-primary/20 to-action-primary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                    <select
                      className="relative w-full bg-surface-card border border-subtle rounded-2xl p-4 text-sm text-muted focus:outline-none focus:border-focus/50 appearance-none cursor-pointer transition-all hover:border-default"
                      value={selectedInstanceId}
                      onChange={(e) => { setSelectedInstanceId(e.target.value); setAuditStatus('idle'); setAuditReport(null); }}
                    >
                      <option value="">Choisir une instance dans l'Empire...</option>
                      {instances.map(instance => (
                        <option key={instance.id} value={instance.id}>{instance.name} ({instance.id})</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
                      <Search className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <CertAuditPanel
                  selectedInstanceId={selectedInstanceId}
                  auditStatus={auditStatus}
                  auditReport={auditReport}
                  isGenerating={isGenerating}
                  onCheckAudit={handleCheckAudit}
                  onGenerate={handleGenerate}
                />
              </motion.div>
              <CertPreviewPanel selectedInstance={selectedInstance} />
            </motion.div>
          ) : (
            <CertHistoryTab
              certificates={certificates}
              isSyncing={isSyncing}
              onDownload={handleDownloadCert}
              onPrint={setPrintingCert}
              onSync={handleSyncArchives}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 right-10 bg-status-success text-text-primary px-8 py-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex items-center gap-6 z-50 border border-default backdrop-blur-xl"
          >
            <div className="w-12 h-12 bg-surface-card rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-[0.2em] mb-1">Certification Réussie</p>
              <p className="text-[11px] font-medium opacity-90 leading-relaxed">
                Attestation signée cryptographiquement.<br />
                FEC {new Date().getFullYear()} généré et archivé.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {printingCert && (
        <LegalCertificateA4
          instanceId={printingCert.instanceId}
          instanceName={printingCert.instanceName}
          issuedAt={printingCert.issuedAt}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
