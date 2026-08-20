import type jsPDF from 'jspdf';

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatEuros(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function padZero(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
}

export function generateRef(prefix = 'PRIV'): string {
  return `${prefix}-${new Date().getFullYear()}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
}

export function drawHeaderBanner(
  doc: jsPDF,
  pageW: number,
  marginLeft: number,
  marginRight: number,
  title: string,
  subtitle: string,
  ref: string,
  dateStr: string,
  restaurantNom: string,
  restaurantAdresse: string
) {
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, pageW, 38, 'F');

  doc.setTextColor(197, 160, 89);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(restaurantNom.toUpperCase(), marginLeft, 15);

  doc.setTextColor(220, 220, 220);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(restaurantAdresse, marginLeft, 22);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageW - marginRight, 16, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Réf. : ${ref}`, pageW - marginRight, 23, { align: 'right' });
  doc.text(`${subtitle} : ${dateStr}`, pageW - marginRight, 29, { align: 'right' });
}

export function drawBox(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor = [248, 249, 250],
  strokeColor = [210, 210, 210]
) {
  doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  doc.setDrawColor(strokeColor[0], strokeColor[1], strokeColor[2]);
  doc.roundedRect(x, y, w, h, 3, 3, 'FD');
}
