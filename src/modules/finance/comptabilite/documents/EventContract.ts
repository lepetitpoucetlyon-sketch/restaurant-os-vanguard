/**
 * EventContract.ts
 * Génère un contrat événementiel en PDF via jsPDF — multi-vertical
 * (restaurant, hôtel, salle de fêtes, clinique…).
 * Client-side only — importer de façon lazy depuis un composant 'use client'.
 */
import jsPDF from 'jspdf';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Formules d'événements — périmètre food-service (restaurant, hôtel, traiteur).
 * Gated par usesCulinaryStock(variant) côté UI.
 * Extension pour d'autres verticales : ajouter des valeurs ici + entrées dans FORMULE_LABELS.
 */
export type EventFormule = 'menu' | 'cocktail_dinatoire' | 'buffet';
/** @deprecated use EventFormule */
export type PrivatisationFormule = EventFormule;

export interface EventContractData {
  /** Informations client */
  clientNom: string;
  clientPrenom: string;
  clientEmail: string;
  clientTelephone: string;
  clientAdresse?: string;

  /** Informations événement */
  evenementNom: string;
  dateEvenement: string;          // Format ISO : "2026-09-20"
  heureDebut: string;             // Format "HH:MM"
  heureFin: string;               // Format "HH:MM"
  nombreConvives: number;
  formule: EventFormule;
  descriptionFormule?: string;    // Précisions sur le menu / formule

  /** Tarification (en euros) */
  montantHT: number;              // Montant total hors taxes en euros
  tauxTVA?: number;               // TVA en % — défaut 20

  /** Informations du prestataire (tenant) */
  merchantNom: string;
  merchantAdresse: string;
  merchantTelephone?: string;
  merchantEmail?: string;
  merchantSiret?: string;

  /** Métadonnées */
  numeroContrat?: string;         // Référence du contrat
  dateSignature?: string;         // Format ISO — défaut : aujourd'hui
}
/** @deprecated use EventContractData */
export type PrivatisationData = EventContractData;

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

const FORMULE_LABELS: Record<EventFormule, string> = {
  menu: 'Menu assis (service à la table)',
  cocktail_dinatoire: 'Cocktail dînatoire (buffet debout)',
  buffet: 'Buffet libre (self-service)',
};

import {
  formatDate,
  formatEuros,
  padZero,
  todayISO,
  generateRef,
} from './pdf/pdfLayoutHelpers';

// ---------------------------------------------------------------------------
// Génération du PDF
// ---------------------------------------------------------------------------

/**
 * Génère et déclenche le téléchargement d'un contrat événementiel au format PDF.
 */
export function generateEventContract(data: EventContractData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const marginLeft = 18;
  const marginRight = 18;
  const contentW = pageW - marginLeft - marginRight;

  const tauxTVA = data.tauxTVA ?? 20;
  const montantTVA = data.montantHT * (tauxTVA / 100);
  const montantTTC = data.montantHT + montantTVA;
  const acompte30 = data.montantHT * 0.30;

  const dateSignature = data.dateSignature ?? todayISO();
  const numeroContrat = data.numeroContrat ?? generateRef();

  // Date limite versement acompte (J+15 à compter de la signature)
  const dateLimiteAcompte = new Date(dateSignature);
  dateLimiteAcompte.setDate(dateLimiteAcompte.getDate() + 15);
  const dateLimiteAcompteISO = `${dateLimiteAcompte.getFullYear()}-${padZero(dateLimiteAcompte.getMonth() + 1)}-${padZero(dateLimiteAcompte.getDate())}`;

  // ---------------------------------------------------------------------------
  // PAGE 1 — Contrat
  // ---------------------------------------------------------------------------

  let y = 0;

  // ── En-tête ────────────────────────────────────────────────────────────────
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, pageW, 38, 'F');

  doc.setTextColor(197, 160, 89); // #C5A059
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.merchantNom.toUpperCase(), marginLeft, 15);

  doc.setTextColor(220, 220, 220);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(data.merchantAdresse, marginLeft, 22);
  if (data.merchantTelephone) doc.text(data.merchantTelephone, marginLeft, 27);
  if (data.merchantEmail) doc.text(data.merchantEmail, marginLeft, 32);
  if (data.merchantSiret) doc.text(`SIRET : ${data.merchantSiret}`, marginLeft, 37);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRAT ÉVÉNEMENTIEL', pageW - marginRight, 16, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Réf. : ${numeroContrat}`, pageW - marginRight, 23, { align: 'right' });
  doc.text(`Signé le : ${formatDate(dateSignature)}`, pageW - marginRight, 29, { align: 'right' });

  y = 50;

  // ── Titre ─────────────────────────────────────────────────────────────────
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ENTRE LES SOUSSIGNÉS', pageW / 2, y, { align: 'center' });
  y += 10;

  // ── Parties ───────────────────────────────────────────────────────────────
  const drawBox = (x: number, bY: number, w: number, h: number) => {
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(210, 210, 210);
    doc.roundedRect(x, bY, w, h, 3, 3, 'FD');
  };

  const halfW = (contentW - 6) / 2;

  // Bloc restaurant
  drawBox(marginLeft, y, halfW, 44);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('LE PRESTATAIRE', marginLeft + 4, y + 7);
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(10);
  doc.text(data.merchantNom, marginLeft + 4, y + 14);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const restLines = doc.splitTextToSize(data.merchantAdresse, halfW - 8);
  doc.text(restLines, marginLeft + 4, y + 20);
  if (data.merchantTelephone) doc.text(`Tél. : ${data.merchantTelephone}`, marginLeft + 4, y + 32);
  if (data.merchantEmail) doc.text(`Email : ${data.merchantEmail}`, marginLeft + 4, y + 37);

  // Bloc client
  const clientX = marginLeft + halfW + 6;
  drawBox(clientX, y, halfW, 44);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('LE CLIENT', clientX + 4, y + 7);
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(10);
  doc.text(`${data.clientPrenom} ${data.clientNom}`.toUpperCase(), clientX + 4, y + 14);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  if (data.clientAdresse) {
    const clientLines = doc.splitTextToSize(data.clientAdresse, halfW - 8);
    doc.text(clientLines, clientX + 4, y + 20);
  }
  doc.text(`Tél. : ${data.clientTelephone}`, clientX + 4, y + 32);
  doc.text(`Email : ${data.clientEmail}`, clientX + 4, y + 37);

  y += 52;

  // ── Objet ─────────────────────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);
  doc.text('OBJET DU CONTRAT', marginLeft, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const objetText =
    `Le présent contrat a pour objet la privatisation des espaces de ${data.merchantNom} ` +
    `dans le cadre de l'événement « ${data.evenementNom} ». Le Prestataire s'engage à réserver ` +
    `l'établissement exclusivement au Client et à ses convives pour la durée stipulée ci-dessous.`;
  const objetLines = doc.splitTextToSize(objetText, contentW);
  doc.text(objetLines, marginLeft, y);
  y += objetLines.length * 5 + 6;

  // ── Détails événement ─────────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text("DÉTAILS DE L'ÉVÉNEMENT", marginLeft, y);
  y += 6;

  const details: Array<[string, string]> = [
    ['Événement', data.evenementNom],
    ['Date', formatDate(data.dateEvenement)],
    ['Horaires', `${data.heureDebut} — ${data.heureFin}`],
    ['Nombre de convives attendus', `${data.nombreConvives} personnes`],
    ['Formule choisie', FORMULE_LABELS[data.formule]],
  ];
  if (data.descriptionFormule) {
    details.push(['Précisions / menu', data.descriptionFormule]);
  }

  doc.setFontSize(9);
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(`${label} :`, marginLeft + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(26, 26, 26);
    const valueLines = doc.splitTextToSize(value, contentW - 70);
    doc.text(valueLines, marginLeft + 65, y);
    y += Math.max(valueLines.length * 5, 6);
  });
  y += 4;

  // ── Conditions financières ─────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);
  doc.text('CONDITIONS FINANCIÈRES', marginLeft, y);
  y += 6;

  const financialRows: Array<[string, string]> = [
    ['Montant HT', formatEuros(data.montantHT)],
    [`TVA (${tauxTVA} %)`, formatEuros(montantTVA)],
    ['Montant TTC', formatEuros(montantTTC)],
    ['Acompte (30 % du HT)', formatEuros(acompte30)],
    ['Date limite versement acompte', `${formatDate(dateLimiteAcompteISO)} (J+15 à compter de la signature)`],
    ['Solde restant dû (HT)', formatEuros(data.montantHT - acompte30)],
  ];

  drawBox(marginLeft, y, contentW, financialRows.length * 8 + 6);
  y += 5;
  doc.setFontSize(9);
  financialRows.forEach(([label, value], idx) => {
    const rowY = y + idx * 8;
    const isBold = label.startsWith('Montant TTC') || label.startsWith('Acompte');
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(label, marginLeft + 4, rowY);
    doc.setTextColor(isBold ? 197 : 26, isBold ? 160 : 26, isBold ? 89 : 26);
    doc.text(value, pageW - marginRight - 4, rowY, { align: 'right' });
  });
  y += financialRows.length * 8 + 10;

  // ── Conditions d'annulation ────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);
  doc.text("CONDITIONS D'ANNULATION", marginLeft, y);
  y += 6;

  const annulationText =
    `En cas d'annulation par le Client, les pénalités suivantes s'appliquent sur le montant TTC :\n` +
    `• Annulation plus de 30 jours avant l'événement : aucune pénalité (acompte restitué).\n` +
    `• Annulation entre 7 et 30 jours avant l'événement : retenue de 50 % du montant TTC.\n` +
    `• Annulation moins de 7 jours avant l'événement : retenue de 100 % du montant TTC.`;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const annulationLines = doc.splitTextToSize(annulationText, contentW);
  doc.text(annulationLines, marginLeft, y);
  y += annulationLines.length * 5 + 6;

  // ── Responsabilités mutuelles ──────────────────────────────────────────────
  if (y < pageH - 60) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 26, 26);
    doc.text('RESPONSABILITÉS MUTUELLES', marginLeft, y);
    y += 6;

    const respText =
      `Le Prestataire s'engage à mettre à disposition les locaux propres et en état de fonctionnement, ` +
      `à fournir le personnel nécessaire et à respecter les engagements de qualité définis dans la formule choisie. ` +
      `Le Client s'engage à respecter le règlement intérieur de l'établissement, à ne pas dépasser le nombre ` +
      `de convives convenu et à régler les sommes dues aux échéances prévues. ` +
      `Toute dégradation causée par le Client ou ses convives sera facturée au coût de remplacement réel.`;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const respLines = doc.splitTextToSize(respText, contentW);
    doc.text(respLines, marginLeft, y);
  }

  // Pied de page page 1
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Contrat événementiel — ${data.merchantNom} — Réf. ${numeroContrat} — Page 1/2`,
    pageW / 2,
    pageH - 8,
    { align: 'center' }
  );

  // ---------------------------------------------------------------------------
  // PAGE 2 — Signatures
  // ---------------------------------------------------------------------------

  doc.addPage();
  y = 0;

  // En-tête page 2
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, pageW, 20, 'F');
  doc.setTextColor(197, 160, 89);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRAT ÉVÉNEMENTIEL — SIGNATURES', pageW / 2, 13, { align: 'center' });

  y = 30;

  // Récapitulatif
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const recap =
    `Contrat n° ${numeroContrat} — Événement : « ${data.evenementNom} » ` +
    `du ${formatDate(data.dateEvenement)}, ${data.heureDebut}–${data.heureFin} — ` +
    `${data.nombreConvives} convives — ${FORMULE_LABELS[data.formule]} — ` +
    `Montant TTC : ${formatEuros(montantTTC)}`;
  const recapLines = doc.splitTextToSize(recap, contentW);
  doc.text(recapLines, marginLeft, y);
  y += recapLines.length * 5 + 8;

  // Clause de consentement
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(210, 210, 210);
  doc.roundedRect(marginLeft, y, contentW, 28, 3, 3, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const consentText =
    `Les parties reconnaissent avoir pris connaissance de l'intégralité du présent contrat et acceptent ` +
    `les conditions qui y sont stipulées. En signant ce document, le Client reconnaît avoir lu et approuvé ` +
    `les conditions financières, les conditions d'annulation et les responsabilités mutuelles définies ` +
    `dans le présent contrat. Le contrat prend effet à la date de signature et au versement de l'acompte.`;
  const consentLines = doc.splitTextToSize(consentText, contentW - 8);
  doc.text(consentLines, marginLeft + 4, y + 7);
  y += 36;

  // Date et lieu
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(26, 26, 26);
  doc.text(
    `Fait à _________________________, le ${formatDate(dateSignature)}, en deux exemplaires originaux.`,
    marginLeft,
    y
  );
  y += 14;

  // ── Blocs signature ───────────────────────────────────────────────────────
  const sigW = (contentW - 10) / 2;
  const sigH = 70;

  // Bloc client
  drawBox(marginLeft, y, sigW, sigH);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('LE CLIENT', marginLeft + 4, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(8);
  doc.text(`${data.clientPrenom} ${data.clientNom}`.toUpperCase(), marginLeft + 4, y + 15);
  doc.text(data.clientTelephone, marginLeft + 4, y + 21);
  doc.text(data.clientEmail, marginLeft + 4, y + 27);
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.text('Lu et approuvé — Signature précédée de la mention manuscrite', marginLeft + 4, y + 38);
  doc.text('"Bon pour accord"', marginLeft + 4, y + 43);
  // Ligne de signature
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(marginLeft + 4, y + 62, marginLeft + sigW - 8, y + 62);
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text('Signature', marginLeft + 4, y + 67);

  // Bloc restaurant
  const sigX2 = marginLeft + sigW + 10;
  drawBox(sigX2, y, sigW, sigH);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('LE PRESTATAIRE', sigX2 + 4, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(8);
  doc.text(data.merchantNom.toUpperCase(), sigX2 + 4, y + 15);
  if (data.merchantEmail) doc.text(data.merchantEmail, sigX2 + 4, y + 21);
  if (data.merchantSiret) doc.text(`SIRET : ${data.merchantSiret}`, sigX2 + 4, y + 27);
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.text('Signature et cachet du responsable', sigX2 + 4, y + 38);
  // Ligne de signature
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(sigX2 + 4, y + 62, sigX2 + sigW - 8, y + 62);
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text('Signature + cachet', sigX2 + 4, y + 67);

  y += sigH + 12;

  // ── Note finale ───────────────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  const noteText =
    `Ce contrat est soumis au droit français. Tout litige relatif à son interprétation ou exécution ` +
    `sera porté devant le Tribunal compétent du ressort du siège du Prestataire. ` +
    `Chaque partie conserve un exemplaire original signé du présent contrat.`;
  const noteLines = doc.splitTextToSize(noteText, contentW);
  doc.text(noteLines, marginLeft, y);

  // Pied de page page 2
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Contrat événementiel — ${data.merchantNom} — Réf. ${numeroContrat} — Page 2/2`,
    pageW / 2,
    pageH - 8,
    { align: 'center' }
  );

  // ---------------------------------------------------------------------------
  // Téléchargement
  // ---------------------------------------------------------------------------

  const safeName = data.evenementNom.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`contrat_evenement_${safeName}_${numeroContrat}.pdf`);
}

/** @deprecated use generateEventContract */
export const generatePrivatisationContract = generateEventContract;
