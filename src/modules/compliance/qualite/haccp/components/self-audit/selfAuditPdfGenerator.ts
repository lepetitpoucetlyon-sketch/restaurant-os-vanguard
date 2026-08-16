import { toast } from 'sonner';
import type { AuditCheck, CheckStatus } from './selfAuditTypes';

export async function generateNF525AuditPDF(checks: AuditCheck[]) {
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const now = new Date();

  // Header
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, pageWidth, 38, 'F');
  doc.setTextColor(197, 160, 89);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RESTAURANT OS', 15, 18);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Attestation de conformité NF525', 15, 28);
  doc.setFontSize(9);
  doc.text(
    `Générée le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth - 15,
    28,
    { align: 'right' }
  );

  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Self-Audit de conformité NF525', 15, 55);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(
    'Ce document récapitule l\'état de conformité au référentiel NF525 de la caisse enregistreuse.',
    15,
    63,
    { maxWidth: pageWidth - 30 }
  );

  // Checklist
  let y = 78;
  const statusLabel: Record<CheckStatus, string> = {
    ok: '[OK]',
    error: '[ERREUR]',
    warning: '[A VERIFIER]',
    pending: '[NON VERIFIE]',
    checking: '[EN COURS]',
  };

  checks.forEach(check => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    const label = statusLabel[check.status] ?? '[?]';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(
      check.status === 'ok' ? 22 : check.status === 'error' ? 200 : 180,
      check.status === 'ok' ? 163 : check.status === 'error' ? 30 : 120,
      check.status === 'ok' ? 74 : check.status === 'error' ? 30 : 20
    );
    doc.text(`${label} ${check.label}`, 15, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const lines = doc.splitTextToSize(check.description, pageWidth - 30) as string[];
    doc.text(lines, 18, y + 5);
    y += 8 + lines.length * 4;
  });

  // Footer
  const totalPages = (doc.internal as unknown as { pages: unknown[] }).pages?.length ?? 1;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Restaurant OS — NF525 Self-Audit — Page 1/${totalPages} — ${now.getFullYear()}`,
    pageWidth / 2,
    doc.internal.pageSize.height - 10,
    { align: 'center' }
  );

  doc.save(`nf525-conformite-${now.toISOString().slice(0, 10)}.pdf`);
  toast.success('Attestation NF525 générée');
}
