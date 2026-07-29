'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, FileText, Download, CheckCircle, ShieldCheck, AlertTriangle, Search, Cpu } from 'lucide-react';
import { useNexusFleet } from '@/modules/intelligence/fleet';
import { logger } from '@/lib/logger';
import { auth } from '@/lib/firebase';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SiteIntegrityReport, GlobalComplianceCertificate } from '@modules/intelligence/fleet/FleetComplianceService';

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
  
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [auditStatus, setAuditStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

  // mcc-comp-1 — persisté dans Nexus (plus de perte au refresh)
  const [certificates, setCertificates] = useState<DigitalCertificate[]>([]);

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
        // 🛡️ INDUSTRIAL AUDIT: Real cross-tenant ledger check
        const report = await complianceService.verifySiteIntegrity(selectedInstanceId) as SiteIntegrityReport;
        setAuditReport({ 
            isValid: report.isChainValid, 
            totalSeals: report.entryCount,
            isChainValid: report.isChainValid,
            entryCount: report.entryCount
        });
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
        // 🔒 GLOBAL SEAL: Signing the fleet manifest
        const operatorId = auth.currentUser?.email ?? auth.currentUser?.uid ?? 'FLEET_CMDR';
        const cert = await complianceService.issueGlobalCertificate(operatorId) as GlobalComplianceCertificate;
        
        const digitalCert: DigitalCertificate = {
            id: cert.id,
            instanceId: selectedInstanceId,
            instanceName: selectedInstance?.name || 'Unknown',
            year: new Date(cert.issuedAt).getFullYear(),
            type: cert.status,
            issuedAt: new Date(cert.issuedAt).toISOString(),
            issuer: cert.issuedBy
        };

        // Persister dans Nexus
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


  return (
    <div className="bg-surface-card border border-border-subtle rounded-3xl p-8 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-status-warning/10 rounded-2xl flex items-center justify-center border border-action-primary/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <Award className="w-6 h-6 text-status-warning" />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-text-primary">Certification Center</h2>
            <p className="text-secondary text-xs font-medium">Manufacturer Self-Certification (NF525)</p>
          </div>
        </div>

        <div className="flex bg-surface-card p-1 rounded-xl border border-border-subtle">
            <button 
                onClick={() => setActiveTab('generate')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'generate' ? 'bg-surface-card text-text-primary shadow-lg border border-border-subtle' : 'text-secondary hover:text-muted'}`}
            >
                Generate
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-surface-card text-text-primary shadow-lg border border-border-subtle' : 'text-secondary hover:text-muted'}`}
            >
                Archive {certificates.length > 0 && `(${certificates.length})`}
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="wait">
            {activeTab === 'generate' ? (
                    <motion.div 
                        key="generate"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                            exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
                        }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-12"
                    >
                        <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-secondary uppercase mb-3 ml-1 tracking-[0.3em]">Node Instance Selection</label>
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-action-primary/20 to-action-primary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                    <select 
                                        className="relative w-full bg-surface-card border border-subtle rounded-2xl p-4 text-sm text-muted focus:outline-none focus:border-focus/50 appearance-none cursor-pointer transition-all hover:border-default"
                                        value={selectedInstanceId}
                                        onChange={(e) => {
                                            setSelectedInstanceId(e.target.value);
                                            setAuditStatus('idle');
                                            setAuditReport(null);
                                        }}
                                    >
                                        <option value="">Choisir une instance dans l'Empire...</option>
                                        {instances.map(instance => (
                                            <option key={instance.id} value={instance.id}>
                                                {instance.name} ({instance.id})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
                                        <Search className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            {/* Audit Verification Step */}
                            <motion.div 
                                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                                className={`p-6 bg-surface-card border rounded-2xl transition-all duration-700 relative overflow-hidden ${
                                auditStatus === 'valid' ? 'border-emerald-500/30 bg-status-success/5 text-status-success' : 
                                auditStatus === 'invalid' ? 'border-red-500/30 bg-status-danger/5 text-status-danger' : 
                                'border-border-subtle'
                            }`}>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div>
                                        <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
                                            auditStatus === 'valid' ? 'text-status-success' : 
                                            auditStatus === 'invalid' ? 'text-status-danger' : 
                                            'text-brand'
                                        }`}>Cryptographic Ledger Scan</h4>
                                        <p className="text-[10px] text-secondary font-medium">Authenticating block chain integrity (NF525 Protocol).</p>
                                    </div>
                                    <AnimatePresence mode="wait">
                                        {auditStatus === 'valid' ? (
                                            <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} key="valid">
                                                <ShieldCheck className="w-6 h-6 text-status-success shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                                            </motion.div>
                                        ) : auditStatus === 'invalid' ? (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key="invalid">
                                                <AlertTriangle className="w-6 h-6 text-status-danger" />
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>
                                </div>

                                {auditStatus === 'idle' && (
                                    <button 
                                        onClick={handleCheckAudit}
                                        disabled={!selectedInstanceId}
                                        className="relative group overflow-hidden text-[10px] font-bold text-text-primary uppercase tracking-widest bg-surface-card hover:bg-surface-card px-6 py-3 rounded-xl border border-subtle transition-all disabled:opacity-30"
                                    >
                                        <span className="relative z-10">Run Global Audit</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-action-primary/0 via-white/5 to-action-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    </button>
                                )}

                                {auditStatus === 'checking' && (
                                    <div className="space-y-6 py-4">
                                        <div className="flex flex-col items-center justify-center py-6">
                                            <div className="relative w-20 h-20 mb-4">
                                                <motion.div 
                                                    animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
                                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                    className="absolute inset-0 rounded-full border-2 border-focus/20 border-t-indigo-500"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Cpu className="w-8 h-8 text-brand animate-pulse" />
                                                </div>
                                                {/* Vertical Data Line */}
                                                <motion.div 
                                                    animate={{ top: ['-10%', '110%'] }}
                                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                    className="absolute left-[-20%] right-[-20%] h-[1px] bg-gradient-to-r from-transparent via-action-primary/50 to-transparent blur-[1px] z-10"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-brand font-black uppercase tracking-[0.3em] animate-pulse">
                                                Tracing Seals...
                                            </div>
                                        </div>
                                        <div className="h-0.5 w-full bg-surface-card rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 2, ease: "easeInOut" }}
                                                className="h-full bg-action-primary shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                                            />
                                        </div>
                                    </div>
                                )}

                                {auditStatus === 'valid' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] text-status-success font-black uppercase tracking-[0.2em]">
                                            <CheckCircle className="w-4 h-4" />
                                            Consensus Reached: 100% Integrity
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-surface-card p-3 rounded-xl border border-border-subtle">
                                                <p className="text-[8px] text-secondary uppercase font-black tracking-widest">Seals Verified</p>
                                                <p className="text-sm font-black text-text-primary">{auditReport?.totalSeals || 0}</p>
                                            </div>
                                            <div className="bg-surface-card p-3 rounded-xl border border-border-subtle">
                                                <p className="text-[8px] text-secondary uppercase font-black tracking-widest">Chain Continuity</p>
                                                <p className="text-sm font-black text-text-primary">SECURED</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {auditStatus === 'invalid' && (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-status-danger/10 border border-red-500/20 rounded-xl">
                                        <p className="text-[10px] text-status-danger font-black uppercase tracking-tight">Security Protocol Violation</p>
                                        <p className="text-[8px] text-status-danger/70 mt-1 leading-relaxed">Cryptographic link broken. Verification failed.</p>
                                    </motion.div>
                                )}
                                
                                {/* Background Scanning Effect */}
                                <AnimatePresence>
                                    {auditStatus === 'checking' && (
                                        <motion.div 
                                            initial={{ top: "-100%" }}
                                            animate={{ top: "100%" }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-action-primary/10 to-transparent pointer-events-none"
                                        />
                                    )}
                                </AnimatePresence>
                            </motion.div>
                            
                            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="space-y-4 pt-4">
                                <button 
                                    onClick={handleGenerate}
                                    disabled={!selectedInstanceId || isGenerating || auditStatus !== 'valid'}
                                    className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-4 transition-all duration-500 ${
                                        !selectedInstanceId || isGenerating || auditStatus !== 'valid'
                                        ? 'bg-surface-card0 text-secondary cursor-not-allowed border border-border-subtle' 
                                        : 'bg-surface-card text-primary hover:bg-surface-card hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-[0.98]'
                                    }`}
                                >
                                    {isGenerating ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            <span className="animate-pulse">Signing Ledger...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Award className="w-5 h-5" />
                                            Issue Digital Certificate
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[8px] text-secondary font-black uppercase tracking-[0.3em] opacity-50">
                                    Legal Vault: Empire-Compliance-v16.2
                                </p>
                            </motion.div>
                        </motion.div>

                        <motion.div 
                            variants={{ 
                                hidden: { opacity: 0, rotateY: -15, scale: 0.95, x: 50 }, 
                                visible: { opacity: 1, rotateY: 0, scale: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } 
                            }}
                            className="relative group perspective-2000"
                        >
                            {/* Certificate Preview with advanced hover */}
                            <motion.div 
                                initial={false}
                                animate={{ 
                                    rotateY: selectedInstance ? 0 : -10, 
                                    opacity: selectedInstance ? 1 : 0.3,
                                    scale: selectedInstance ? 1 : 0.98,
                                    // Holographic flickering
                                    filter: selectedInstance ? [
                                        'brightness(1) contrast(1)',
                                        'brightness(1.03) contrast(1.01)',
                                        'brightness(1) contrast(1)',
                                        'brightness(0.98) contrast(1)',
                                        'brightness(1) contrast(1)'
                                    ] : 'none'
                                }}
                                transition={{ 
                                    duration: 0.8,
                                    filter: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                                }}
                                whileHover={selectedInstance ? { scale: 1.02, rotateY: 5, rotateX: 2 } : {}}
                                className="aspect-[1/1.414] bg-surface-card rounded-lg p-12 text-primary shadow-2xl relative overflow-hidden flex flex-col transition-all duration-1000 group"
                            >
                                {/* Dynamic Background Scanning Shimmer */}
                                {selectedInstance && (
                                    <motion.div 
                                        animate={{ x: ['100%', '-100%'] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-action-primary/[0.04] to-transparent pointer-events-none"
                                    />
                                )}

                                <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-10">
                                    <div className="text-left">
                                        <h1 className="text-2xl font-black uppercase leading-[0.9] tracking-tighter">CERTIFICAT<br/>DE CONFORMITÉ</h1>
                                        <p className="text-[9px] font-black text-muted uppercase mt-3 tracking-[0.2em]">Norme NF525 / Art. 286 I-3° bis</p>
                                    </div>
                                    <motion.div 
                                        animate={selectedInstance ? { rotateY: [0, 180, 360] } : {}}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                        className="w-16 h-16 bg-surface-sidebar flex items-center justify-center rounded-2xl shadow-xl"
                                    >
                                        <Award className="w-10 h-10 text-text-primary" />
                                    </motion.div>
                                </div>

                                <div className="space-y-8 text-xs leading-relaxed flex-1">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-muted uppercase tracking-widest">Constructeur</p>
                                            <p className="font-bold text-primary uppercase tracking-tight">Restaurant OS Empire</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-muted uppercase tracking-widest">Logiciel</p>
                                            <p className="font-bold text-primary uppercase tracking-tight">Nexus CORE v16</p>
                                        </div>
                                    </div>
                                    
                                    <div className="h-px bg-surface-tertiary" />
                                    
                                    <p className="font-medium text-secondary text-[13px]">Par la présente, la Direction de la Conformité atteste que l'instance suivante :</p>
                                    
                                    <div className="p-6 bg-surface-bg border border-subtle rounded-2xl space-y-2 relative overflow-hidden group/item">
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/item:opacity-30 transition-opacity">
                                            <ShieldCheck className="w-12 h-12" />
                                        </div>
                                        <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em]">Destination ID</p>
                                        <p className="font-black text-xl text-primary uppercase tracking-tight">
                                            {selectedInstance ? selectedInstance.name : 'AWAITING NODE'}
                                        </p>
                                        <p className="font-mono text-[11px] text-brand font-bold">
                                            {selectedInstance ? selectedInstance.id.toUpperCase() : 'EMP-XX-XXX-XXXX'}
                                        </p>
                                    </div>

                                    <p className="text-secondary italic text-[11px] leading-relaxed">
                                        Cette instance opère sous un régime de scellement cryptographique continu, garantissant l'inaltérabilité et la conservation intègre des données de gestion.
                                    </p>
                                    
                                    <div className="mt-auto flex justify-between items-end">
                                        <div className="space-y-2">
                                            <p className="font-black text-[10px] text-muted uppercase tracking-[0.2em]">Validated on</p>
                                            <p className="font-black text-lg tracking-tighter">{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}</p>
                                        </div>
                                        <div className="w-40 h-20 border-2 border-dashed border-default rounded-2xl flex items-center justify-center text-[9px] text-muted font-black uppercase text-center px-4 leading-tight rotate-3">
                                            Fingerprint Signed<br/>NF525-V16-NEXUS
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Aesthetic high-end details */}
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-action-primary/5 blur-[50px] rounded-full" />
                                <div className="absolute bottom-1/4 left-1/4 opacity-[0.03] rotate-12 scale-150">
                                    <ShieldCheck className="w-64 h-64" />
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
            ) : (
                <motion.div 
                    key="history"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4"
                >
                    {certificates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {certificates.map((cert) => (
                                <div key={cert.id} className="p-6 bg-surface-card border border-border-subtle rounded-2xl flex items-center justify-between group hover:border-focus/30 transition-all">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-10 h-10 bg-action-primary/10 rounded-xl flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                                            <Award className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-text-primary text-[11px] font-black uppercase tracking-tight">{cert.instanceName}</h4>
                                            <p className="text-secondary text-[9px] font-medium uppercase tracking-widest">{cert.year} | {cert.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleDownloadCert(cert)} className="p-2 bg-surface-card rounded-lg text-muted hover:bg-surface-hover hover:text-brand transition-all" title="Télécharger le certificat">
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <div className="w-8 h-8 rounded-full border border-emerald-500/20 bg-status-success/10 flex items-center justify-center text-status-success">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 space-y-6">
                            <div className="w-20 h-20 bg-surface-card rounded-full flex items-center justify-center border border-subtle text-primary">
                                <FileText className="w-10 h-10" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-1">Archive Légale</h3>
                                <p className="text-xs text-secondary font-medium">Aucun duplicata ou attestation d'instance trouvée dans l'Empire.</p>
                            </div>
                        </div>
                    )}
                    <div className="pt-8 border-t border-border-subtle">
                        <button className="w-full text-[10px] font-black text-secondary hover:text-brand uppercase tracking-widest transition-all">
                            Synchroniser les Archives Globales
                        </button>
                    </div>
                </motion.div>
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
                        Attestation signée cryptographiquement.<br/>
                        FEC {new Date().getFullYear()} généré et archivé.
                    </p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .perspective-1000 {
            perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
