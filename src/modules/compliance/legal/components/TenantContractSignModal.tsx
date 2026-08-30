// @wip owner:compliance-team échéance:2026-Q4 — écran HACCP à intégrer dans le flow qualité (audit orphelins 2026-08-30)
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Lock,
} from 'lucide-react';
import type { ContractRecord } from '../services/SovereignSignatureEngine';

interface TenantContractSignModalProps {
  contract: ContractRecord;
  isOpen: boolean;
  onClose: () => void;
  onSignedSuccess: (signedContract: ContractRecord) => void;
}

export function TenantContractSignModal({
  contract,
  isOpen,
  onClose,
  onSignedSuccess,
}: TenantContractSignModalProps) {
  const [signerName, setSignerName] = useState(contract.client.representativeName || '');
  const [signerRole, setSignerRole] = useState(contract.client.representativeRole || 'Gérant');
  const [signerEmail, setSignerEmail] = useState(contract.client.email || '');
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Canvas Drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#10b981'; // Emerald 500
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSignSubmit = async () => {
    try {
      setErrorMessage(null);

      if (!consentConfirmed) {
        setErrorMessage('Vous devez cocher la case d acceptation des CGU/CGV et du DPA RGPD.');
        return;
      }

      if (!hasDrawn || !canvasRef.current) {
        setErrorMessage('Veuillez apposer votre signature manuscrite dans le cadre ci-dessous.');
        return;
      }

      setIsSubmitting(true);

      const signatureCanvasBase64 = canvasRef.current.toDataURL('image/png');

      const res = await fetch(`/api/tenant/contracts/${contract.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: contract.tenantId,
          signerName,
          signerRole,
          signerEmail,
          signatureCanvasBase64,
          consentConfirmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Échec de la signature électronique.');
      }

      onSignedSuccess({
        ...contract,
        status: 'SIGNED',
        proofCertificate: data.proofCertificate,
      });
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-hidden="true"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Signature Électronique Certifiée eIDAS"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface-card border border-border-default rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-border-default flex items-center justify-between bg-surface-card/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Signature Électronique Certifiée eIDAS</h3>
              <p className="text-xs text-text-muted">
                Contrat SaaS & DPA RGPD Art. 28 — {contract.client.companyName} ({contract.vertical})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-glass text-text-muted hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reader & Signature Form */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-text-secondary">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-xs font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Contract Full Text Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              1. Consultation intégrale des termes contractuels
            </label>
            <div className="p-5 rounded-2xl bg-surface-glass border border-border-default max-h-56 overflow-y-auto font-mono text-xs text-text-secondary leading-relaxed whitespace-pre-wrap select-text">
              {contract.document.fullTextContent}
            </div>
          </div>

          {/* Signer Identity Information */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              2. Informations et pouvoir du signataire
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-micro text-text-muted mb-1">Nom et Prénom</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-glass border border-border-default rounded-xl text-text-primary text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-micro text-text-muted mb-1">Qualité / Titre</label>
                <input
                  type="text"
                  value={signerRole}
                  onChange={(e) => setSignerRole(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-glass border border-border-default rounded-xl text-text-primary text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-micro text-text-muted mb-1">Email Professionnel</label>
                <input
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-glass border border-border-default rounded-xl text-text-primary text-xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* Canvas Signature Pad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                3. Apposez votre signature manuscrite (Pad tactile / Souris)
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-text-muted hover:text-emerald-400 flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Effacer
              </button>
            </div>

            <div className="relative border-2 border-dashed border-border-default hover:border-emerald-500/50 rounded-2xl bg-surface-glass overflow-hidden">
              <canvas
                ref={canvasRef}
                width={760}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 cursor-crosshair touch-none"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-text-muted/70 text-xs">
                  Signez ici avec votre doigt ou la souris
                </div>
              )}
            </div>
          </div>

          {/* Legal Consent Checkbox */}
          <div className="p-4 rounded-2xl bg-surface-glass border border-border-default flex items-start gap-3">
            <input
              type="checkbox"
              id="consent"
              checked={consentConfirmed}
              onChange={(e) => setConsentConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-border-default text-emerald-500 focus:ring-emerald-500 bg-surface-card cursor-pointer"
            />
            <label htmlFor="consent" className="text-xs text-text-secondary leading-relaxed cursor-pointer select-none">
              Je confirme être dûment habilité(e) à engager la société{' '}
              <strong>{contract.client.companyName}</strong>, avoir lu et accepté sans réserve l intégralité des{' '}
              <strong>CGU/CGV SaaS</strong>, les tarifs de la formule <strong>{contract.pricing.planName}</strong> (
              {contract.pricing.monthlyPriceInEuros} € HT/mois), l addendum spécifique{' '}
              <strong>{contract.vertical}</strong> et l <strong>Accord RGPD Art. 28 (DPA)</strong>.
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border-default bg-surface-card/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Scellement SHA-256 & Certificat eIDAS Horodaté
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-surface-glass text-xs font-semibold text-text-primary hover:bg-surface-glass-hover transition"
            >
              Annuler
            </button>
            <button
              onClick={handleSignSubmit}
              disabled={isSubmitting || !consentConfirmed || !hasDrawn}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Scellement en cours...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Sceller et Signer Électroniquement
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
