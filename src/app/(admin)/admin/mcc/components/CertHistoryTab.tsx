'use client';

import { motion } from 'framer-motion';
import { Award, Download, Printer, ShieldCheck, FileText } from 'lucide-react';

interface DigitalCertificate {
  id: string;
  instanceId: string;
  instanceName: string;
  year: number;
  type: string;
  issuedAt: string;
  issuer: string;
}

interface CertHistoryTabProps {
  certificates: DigitalCertificate[];
  isSyncing: boolean;
  onDownload(cert: DigitalCertificate): void;
  onPrint(cert: DigitalCertificate): void;
  onSync(): void;
}

export function CertHistoryTab({ certificates, isSyncing, onDownload, onPrint, onSync }: CertHistoryTabProps) {
  return (
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
                  <h4 className="text-text-primary text-micro font-black uppercase tracking-tight">{cert.instanceName}</h4>
                  <p className="text-secondary text-nano font-medium uppercase tracking-widest">{cert.year} | {cert.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPrint(cert)}
                  className="p-2 bg-surface-card rounded-lg text-muted hover:bg-surface-hover hover:text-brand transition-all"
                  title="Imprimer le certificat officiel (PDF)"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDownload(cert)}
                  className="p-2 bg-surface-card rounded-lg text-muted hover:bg-surface-hover hover:text-brand transition-all"
                  title="Télécharger le certificat (JSON)"
                >
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
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="w-full text-nano font-black text-secondary hover:text-brand uppercase tracking-widest transition-all disabled:opacity-40"
        >
          {isSyncing ? 'Synchronisation…' : 'Synchroniser les Archives Globales'}
        </button>
      </div>
    </motion.div>
  );
}
