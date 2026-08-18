'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ShieldCheck, X, ExternalLink, Send, Download } from 'lucide-react';
import type { ContractRecord } from '@/modules/compliance';
import { authedFetch } from '@/lib/client/authedFetch';

interface MCCConsultModalProps {
  selectedContract: ContractRecord | null;
  onClose: () => void;
}

export function MCCConsultModal({ selectedContract, onClose }: MCCConsultModalProps) {
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleSendReminder = async () => {
    if (!selectedContract) return;
    try {
      setIsSendingSms(true);
      setFeedbackMessage(null);
      const res = await authedFetch('/api/tenant/contracts/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: selectedContract.id,
          tenantId: selectedContract.tenantId,
          sendSms: true,
          sendEmail: true,
          source: 'MCC_MANUAL',
        }),
      });
      if (res.ok) {
        setFeedbackMessage('Lien de signature renvoyé avec succès par SMS et Email !');
      } else {
        setFeedbackMessage('Erreur lors de l\'envoi');
      }
    } catch {
      setFeedbackMessage('Erreur de connexion');
    } finally {
      setIsSendingSms(false);
    }
  };

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
              {feedbackMessage && (
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
                  {feedbackMessage}
                </div>
              )}

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

              {selectedContract.docusealSignedPdfUrl && (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Document Signé PDF (DocuSeal)</h4>
                      <p className="text-[11px] text-zinc-400">PDF horodaté avec certificat et logs d&apos;audit</p>
                    </div>
                  </div>
                  <a
                    href={selectedContract.docusealSignedPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition"
                  >
                    Télécharger PDF <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-300 max-h-[45vh] overflow-y-auto">
                {selectedContract.document.fullTextContent}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between gap-3">
              <div>
                {selectedContract.status !== 'SIGNED' && (
                  <button
                    onClick={handleSendReminder}
                    disabled={isSendingSms}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSendingSms ? 'Envoi...' : '📱 Relancer le gérant par SMS & Email'}
                  </button>
                )}
              </div>
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
