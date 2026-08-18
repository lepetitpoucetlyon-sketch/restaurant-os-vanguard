import type jsPDF from 'jspdf';
import type { PrivatisationData } from './privatisationTypes';
import { formatDate, formatEuros, drawBox } from './pdfLayoutHelpers';

const FORMULE_LABELS: Record<string, string> = {
  menu: 'Menu assis (service à la table)',
  cocktail_dinatoire: 'Cocktail dînatoire (buffet debout)',
  buffet: 'Buffet libre (self-service)',
};

export function renderContractPage1(
  doc: jsPDF,
  data: PrivatisationData,
  numeroContrat: string,
  dateSignature: string,
  dateLimiteAcompteISO: string,
  tauxTVA: number,
  montantTVA: number,
  montantTTC: number,
  acompte30: number
): void {
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const marginLeft = 18;
  const marginRight = 18;
  const contentW = pageW - marginLeft - marginRight;
  const halfW = (contentW - 6) / 2;

  let y = 0;

  // En-tête
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, pageW, 38, 'F');

  doc.setTextColor(197, 160, 89);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.restaurantNom.toUpperCase(), marginLeft, 15);

  doc.setTextColor(220, 220, 220);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(data.restaurantAdresse, marginLeft, 22);
  if (data.restaurantTelephone) doc.text(data.restaurantTelephone, marginLeft, 27);
  if (data.restaurantEmail) doc.text(data.restaurantEmail, marginLeft, 32);
  if (data.restaurantSiret) doc.text(`SIRET : ${data.restaurantSiret}`, marginLeft, 37);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRAT DE PRIVATISATION', pageW - marginRight, 16, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Réf. : ${numeroContrat}`, pageW - marginRight, 23, { align: 'right' });
  doc.text(`Signé le : ${formatDate(dateSignature)}`, pageW - marginRight, 29, { align: 'right' });

  y = 50;

  // Titre
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ENTRE LES SOUSSIGNÉS', pageW / 2, y, { align: 'center' });
  y += 10;

  // Bloc restaurant
  drawBox(doc, marginLeft, y, halfW, 44);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('LE PRESTATAIRE', marginLeft + 4, y + 7);
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(10);
  doc.text(data.restaurantNom, marginLeft + 4, y + 14);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const restLines = doc.splitTextToSize(data.restaurantAdresse, halfW - 8);
  doc.text(restLines, marginLeft + 4, y + 20);
  if (data.restaurantTelephone) doc.text(`Tél. : ${data.restaurantTelephone}`, marginLeft + 4, y + 32);
  if (data.restaurantEmail) doc.text(`Email : ${data.restaurantEmail}`, marginLeft + 4, y + 37);

  // Bloc client
  const clientX = marginLeft + halfW + 6;
  drawBox(doc, clientX, y, halfW, 44);
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

  // Objet
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);
  doc.text('OBJET DU CONTRAT', marginLeft, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const objetText =
    `Le présent contrat a pour objet la privatisation des espaces du restaurant ${data.restaurantNom} ` +
    `dans le cadre de l'événement « ${data.evenementNom} ». Le Prestataire s'engage à réserver ` +
    `l'établissement exclusivement au Client et à ses convives pour la durée stipulée ci-dessous.`;
  const objetLines = doc.splitTextToSize(objetText, contentW);
  doc.text(objetLines, marginLeft, y);
  y += objetLines.length * 5 + 6;

  // Détails événement
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text("DÉTAILS DE L'ÉVÉNEMENT", marginLeft, y);
  y += 6;

  const details: Array<[string, string]> = [
    ['Événement', data.evenementNom],
    ['Date', formatDate(data.dateEvenement)],
    ['Horaires', `${data.heureDebut} — ${data.heureFin}`],
    ['Nombre de convives attendus', `${data.nombreConvives} personnes`],
    ['Formule choisie', FORMULE_LABELS[data.formule] || data.formule],
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

  // Conditions financières
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

  drawBox(doc, marginLeft, y, contentW, financialRows.length * 8 + 6);
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

  // Conditions d'annulation
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

  // Responsabilités mutuelles
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
    `Contrat de privatisation — ${data.restaurantNom} — Réf. ${numeroContrat} — Page 1/2`,
    pageW / 2,
    pageH - 8,
    { align: 'center' }
  );
}
