'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ShieldCheck, X } from 'lucide-react';
import type { ContractRecord } from '@/modules/compliance';

interface MCCConsultModalProps {
  selectedContract: ContractRecord | null;
  onClose: () => void;
}

export function MCCConsultModal({ selectedContract, onClose }: MCCConsultModalProps) {
  return (
    <AnimatePresence>
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  {selectedContract.document.title}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Réf : {selectedContract.id} — Statut : {selectedContract.status}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-sm text-zinc-300 font-sans">
              {selectedContract.proofCertificate && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-4">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0 mt-1" />
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-emerald-300 text-sm">
                      Preuve de Signature Électronique eIDAS (Certifiée)
                    </div>
                    <div>
                      Signataire : <strong>{selectedContract.proofCertificate.signerName}</strong> (
                      {selectedContract.proofCertificate.signerRole}) — {selectedContract.proofCertificate.signerEmail}
                    </div>
                    <div>
                      Horodatage UTC : {selectedContract.proofCertificate.signedAtIso} (IP:{' '}
                      {selectedContract.proofCertificate.ipAddress})
                    </div>
                    <div className="font-mono text-[10px] text-emerald-400/80 break-all">
                      Master Seal SHA-256 : {selectedContract.proofCertificate.masterSealSha256}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-300 max-h-[50vh] overflow-y-auto">
                {selectedContract.document.fullTextContent}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-white hover:bg-zinc-700 transition"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
