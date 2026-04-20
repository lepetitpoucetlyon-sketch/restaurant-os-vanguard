// @ts-nocheck
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { User } from '@/types';

export const generatePaySlip = (user: User) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- Header ---
    doc.setFillColor(26, 26, 26); // #1A1A1A Header
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(0, 215, 100); // #C5A059
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text("RESTAURANT OS", 15, 20);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("123 Avenue de la Gastronomie", 15, 28);
    doc.text("75001 Paris - France", 15, 33);
    doc.text("SIRET: 890 123 456 00012", 15, 38);

    doc.setFontSize(14);
    doc.text("BULLETIN DE PAIE", pageWidth - 15, 25, { align: 'right' });
    doc.setFontSize(10);
    doc.text("Décembre 2025", pageWidth - 15, 32, { align: 'right' });

    // --- Employee Info Box ---
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(15, 50, pageWidth - 30, 35, 3, 3, 'FD');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Salarié désigné :", 20, 60);
    doc.text(user.name.toUpperCase(), 20, 67);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Emploi : ${user.role}`, 100, 60);
    doc.text("Classification : Niv 4 Echelon 2", 100, 67);
    doc.text("Matricule : 0045/23", 100, 74);
    doc.text("Entrée : 01/03/2023", 100, 81);

    // --- Pay Details Table ---
    const head = [['Rubrique', 'Base', 'Taux', 'Montant Salarial', 'Montant Patronal']];
    const body: any[] = [
        ['Salaire de base', '151.67h', '16.15 €', '2 450.00 €', '-'],
        ['Heures Supplémenaires 25%', '4.00h', '20.19 €', '80.76 €', '-'],
        ['Prime de Service', '-', '-', '150.00 €', '-'],
        ['Avantage en nature (Repas)', '22', '4.15 €', '91.30 €', '-'],
        ['', '', '', '', ''],
        [{ content: 'SANTÉ', colSpan: 5, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' as const } }],
        ['Sécurité Sociale - Maladie', '2 772.06', '0.75 %', '20.79 €', '180.18 €'],
        ['Complémentaire Santé', '2 772.06', '1.20 %', '33.26 €', '33.26 €'],
        ['', '', '', '', ''],
        [{ content: 'RETRAITE', colSpan: 5, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' as const } }],
        ['Retraite Plafonnée', '2 772.06', '6.90 %', '191.27 €', '235.62 €'],
        ['Retraite Déplafonnée', '2 772.06', '0.40 %', '11.09 €', '52.67 €'],
        ['', '', '', '', ''],
        [{ content: 'CHÔMAGE', colSpan: 5, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' as const } }],
        ['Assurance Chômage', '2 772.06', '4.05 %', '-', '112.27 €'],
        ['CSG / CRDS', '2 850.25', '9.70 %', '276.47 €', '-'],
    ];

    // @ts-ignore
    autoTable(doc, {
        startY: 95,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 80 },
            3: { halign: 'right', fontStyle: 'bold' },
            4: { halign: 'right' }
        }
    });

    // --- Footer Totals ---
    // @ts-ignore
    let finalY = doc.lastAutoTable.finalY + 15;

    // Check if we need a new page for totals to avoid "crowding"
    if (finalY > 220) {
        doc.addPage();
        finalY = 20;
    }

    // Payment Block Background
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(230, 230, 230);
    doc.roundedRect(pageWidth - 95, finalY, 80, 50, 2, 2, 'FD');

    // Total Lines
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);

    // Line 1
    doc.text("Total Brut:", pageWidth - 85, finalY + 12);
    doc.setTextColor(0, 0, 0);
    doc.text("2 772.06 €", pageWidth - 25, finalY + 12, { align: 'right' });

    // Line 2
    doc.setTextColor(100, 100, 100);
    doc.text("Total Cotisations:", pageWidth - 85, finalY + 22);
    doc.setTextColor(239, 68, 68); // Red for deductions
    doc.text("- 532.88 €", pageWidth - 25, finalY + 22, { align: 'right' });

    // Line 3
    doc.setTextColor(100, 100, 100);
    doc.text("Net Imposable:", pageWidth - 85, finalY + 32);
    doc.setTextColor(0, 0, 0);
    doc.text("2 356.12 €", pageWidth - 25, finalY + 32, { align: 'right' });

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(pageWidth - 90, finalY + 38, pageWidth - 20, finalY + 38);

    // NET TO PAY
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 26, 26); // Dark
    doc.text("NET À PAYER", pageWidth - 85, finalY + 46);

    doc.setTextColor(0, 215, 100); // Premium Green Highlight
    doc.text("2 239.18 €", pageWidth - 25, finalY + 46, { align: 'right' });

    // Payment Info
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text("Payé par virement le 28/12/2025", pageWidth - 25, finalY + 56, { align: 'right' });

    // --- Bottom Page Legal Footer ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("Pour vous aider à faire valoir vos droits, conservez ce bulletin sans limitation de durée.", 15, pageHeight - 15);
    doc.text("Restaurant OS - Executive Edition", pageWidth - 15, pageHeight - 15, { align: 'right' });

    // Save
    const fileName = `Bulletin_Salaire_${user.name.replace(/\s+/g, '_')}_Dec2025.pdf`;
    doc.save(fileName);
};
