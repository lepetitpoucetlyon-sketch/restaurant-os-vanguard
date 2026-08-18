import type jsPDF from 'jspdf';
import type { PrivatisationData } from './privatisationTypes';
import { formatDate, formatEuros, drawBox } from './pdfLayoutHelpers';

const FORMULE_LABELS: Record<string, string> = {
  menu: 'Menu assis (service à la table)',
  cocktail_dinatoire: 'Cocktail dînatoire (buffet debout)',
  buffet: 'Buffet libre (self-service)',
};

export function renderContractPage2(
  doc: jsPDF,
  data: PrivatisationData,
  numeroContrat: string,
  dateSignature: string,
  montantTTC: number
): void {
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const marginLeft = 18;
  const marginRight = 18;
  const contentW = pageW - marginLeft - marginRight;

  doc.addPage();
  let y = 0;

  // En-tête page 2
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, pageW, 20, 'F');
  doc.setTextColor(197, 160, 89);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRAT DE PRIVATISATION — SIGNATURES', pageW / 2, 13, { align: 'center' });

  y = 30;

  // Récapitulatif
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const recap =
    `Contrat n° ${numeroContrat} — Événement : « ${data.evenementNom} » ` +
    `du ${formatDate(data.dateEvenement)}, ${data.heureDebut}–${data.heureFin} — ` +
    `${data.nombreConvives} convives — ${FORMULE_LABELS[data.formule] || data.formule} — ` +
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

  // Blocs signature
  const sigW = (contentW - 10) / 2;
  const sigH = 70;

  // Bloc client
  drawBox(doc, marginLeft, y, sigW, sigH);
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
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(marginLeft + 4, y + 62, marginLeft + sigW - 8, y + 62);
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text('Signature', marginLeft + 4, y + 67);

  // Bloc restaurant
  const sigX2 = marginLeft + sigW + 10;
  drawBox(doc, sigX2, y, sigW, sigH);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('LE PRESTATAIRE', sigX2 + 4, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(8);
  doc.text(data.restaurantNom.toUpperCase(), sigX2 + 4, y + 15);
  if (data.restaurantEmail) doc.text(data.restaurantEmail, sigX2 + 4, y + 21);
  if (data.restaurantSiret) doc.text(`SIRET : ${data.restaurantSiret}`, sigX2 + 4, y + 27);
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.text('Signature et cachet du responsable', sigX2 + 4, y + 38);
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(sigX2 + 4, y + 62, sigX2 + sigW - 8, y + 62);
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text('Signature + cachet', sigX2 + 4, y + 67);

  y += sigH + 12;

  // Note finale
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
    `Contrat de privatisation — ${data.restaurantNom} — Réf. ${numeroContrat} — Page 2/2`,
    pageW / 2,
    pageH - 8,
    { align: 'center' }
  );
}
