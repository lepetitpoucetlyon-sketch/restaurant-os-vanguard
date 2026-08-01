/**
 * PlanMaitriseSanitaire — Grade X
 * Génère le Plan de Maîtrise Sanitaire (PMS) au format PDF.
 * Utilise jsPDF + jspdf-autotable (client-side only, lazy import).
 */

import { Nexus } from '@/lib/nexus/NexusAdapter';

// ── Types internes ─────────────────────────────────────────────────────────────

interface EstablishmentInfo {
    name: string;
    address: string;
    siret?: string;
}

interface TemperatureLogRaw {
    id?: string;
    recordedAt?: string;
    createdAt?: string;
    item?: string;
    zone?: string;
    value?: string;
    temperature?: number;
    recordedBy?: string;
    user?: string;
    isCompliant?: boolean;
    status?: string;
}

// ── Données référentielles HACCP ───────────────────────────────────────────────

const RISK_ANALYSIS = [
    {
        zone: 'Réception matières premières',
        risk: 'Contamination biologique / Rupture chaîne du froid',
        measure: 'Contrôle température à réception, vérification DLC, tri des produits',
        isCCP: 'Oui',
    },
    {
        zone: 'Stockage froid',
        risk: 'Développement microbien (T° hors norme)',
        measure: 'Relevés T° 2×/jour, alarme automatique, séparation cru/cuit',
        isCCP: 'Oui',
    },
    {
        zone: 'Préparation',
        risk: 'Contamination croisée, mauvaise hygiène des mains',
        measure: 'Procédure lavage mains, planches couleur codifiées, désinfection plan de travail',
        isCCP: 'Non',
    },
    {
        zone: 'Cuisson',
        risk: 'Survie des pathogènes (T° cœur insuffisante)',
        measure: 'Mesure T° cœur ≥ 63°C (viandes), protocole de réchauffage ≥ 75°C',
        isCCP: 'Oui',
    },
    {
        zone: 'Service',
        risk: 'Maintien en T° insuffisant, contamination en salle',
        measure: 'Chaud ≥ 63°C / Froid ≤ 4°C, temps de service limité à 2h',
        isCCP: 'Non',
    },
];

const CLEANING_PROCEDURES = [
    { zone: 'Cuisine (plans de travail)', product: 'Détergent-désinfectant alimentaire NF EN 1040', frequency: 'Après chaque service', responsible: 'Chef de partie' },
    { zone: 'Sol cuisine', product: 'Désinfectant sol alimentaire', frequency: 'Quotidien (fin de service)', responsible: 'Plongeur / Aide-cuisine' },
    { zone: 'Chambres froides', product: 'Détergent neutre + désinfectant quaternaire', frequency: 'Hebdomadaire', responsible: 'Responsable stocks' },
    { zone: 'Matériel de découpe', product: 'Lavage + désinfection thermique 82°C', frequency: 'Après chaque utilisation', responsible: 'Cuisinier responsable' },
    { zone: 'Salle & tables', product: 'Multi-surfaces désinfectant', frequency: 'Après chaque service', responsible: 'Chef de rang' },
    { zone: 'Sanitaires', product: 'Produit WC + désinfectant surfaces', frequency: '3×/jour minimum', responsible: 'Agent de nettoyage' },
    { zone: 'Bac à graisse / siphons', product: 'Dégraissant puissant', frequency: 'Hebdomadaire', responsible: 'Plombier / Prestataire' },
];

// ── Helpers PDF ────────────────────────────────────────────────────────────────

function addHeader(doc: InstanceType<typeof import('jspdf').default>, title: string, subtitle: string) {
    const W = doc.internal.pageSize.width;
    doc.setFillColor(20, 60, 40);
    doc.rect(0, 0, W, 34, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 14, 27);
    doc.text('Plan de Maîtrise Sanitaire', W - 14, 20, { align: 'right' });
    doc.setTextColor(0, 0, 0);
}

function addFooter(doc: InstanceType<typeof import('jspdf').default>, pageNum: number) {
    const W = doc.internal.pageSize.width;
    const H = doc.internal.pageSize.height;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
        `PMS — Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} — Page ${pageNum}`,
        14,
        H - 8
    );
    doc.text('Restaurant OS Core — Document confidentiel', W - 14, H - 8, { align: 'right' });
    doc.setTextColor(0, 0, 0);
}

// ── Export principal ───────────────────────────────────────────────────────────

export class PlanMaitriseSanitaire {

    static async export(info: EstablishmentInfo, tenantId?: string): Promise<void> {
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF();
        const W = doc.internal.pageSize.width;
        const dateStr = new Date().toLocaleDateString('fr-FR');

        // ── Page 1 : Identification de l'établissement ─────────────────────────

        addHeader(doc, 'PLAN DE MAÎTRISE SANITAIRE', `Édition du ${dateStr}`);
        addFooter(doc, 1);

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('1. Identification de l\'établissement', 14, 48);

        doc.setFillColor(245, 248, 245);
        doc.roundedRect(14, 54, W - 28, 72, 3, 3, 'FD');

        const fields: Array<[string, string]> = [
            ['Raison sociale', info.name],
            ['Adresse', info.address],
            ['SIRET', info.siret ?? 'XXX XXX XXX XXXXX'],
            ['Activité', 'Restauration commerciale — Code NAF 5610A'],
            ['Type d\'agrément', 'Notification sanitaire (PMS obligatoire)'],
            ['Date de mise à jour', dateStr],
        ];

        doc.setFontSize(10);
        let y = 64;
        for (const [label, value] of fields) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 60);
            doc.text(label + ' :', 20, y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(value, 80, y);
            y += 11;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Engagement du responsable', 14, 142);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const engagement =
            'Le présent Plan de Maîtrise Sanitaire engage l\'établissement à respecter les bonnes pratiques ' +
            'd\'hygiène (BPH) et les procédures HACCP conformément au règlement CE 852/2004. ' +
            'Ce document est mis à jour à chaque modification significative de l\'activité.';
        const lines = doc.splitTextToSize(engagement, W - 28);
        doc.text(lines, 14, 150);

        doc.setDrawColor(20, 60, 40);
        doc.setLineWidth(0.5);
        doc.line(14, 172, 100, 172);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('Signature du responsable & cachet', 14, 178);

        // ── Page 2 : Analyse des risques ───────────────────────────────────────

        doc.addPage();
        addHeader(doc, 'ANALYSE DES RISQUES — POINTS CRITIQUES', `Établissement : ${info.name}`);
        addFooter(doc, 2);

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('2. Analyse HACCP — Zones et CCP', 14, 48);

        autoTable(doc, {
            startY: 54,
            head: [['Zone HACCP', 'Risque identifié', 'Mesure préventive', 'CCP ?']],
            body: RISK_ANALYSIS.map(r => [r.zone, r.risk, r.measure, r.isCCP]),
            theme: 'grid',
            headStyles: { fillColor: [20, 80, 45], textColor: 255, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 8, cellPadding: 4 },
            columnStyles: {
                0: { cellWidth: 42 },
                1: { cellWidth: 48 },
                2: { cellWidth: 72 },
                3: { cellWidth: 18, halign: 'center' },
            },
            didParseCell: (data) => {
                if (data.column.index === 3 && data.cell.raw === 'Oui') {
                    data.cell.styles.textColor = [200, 50, 50];
                    data.cell.styles.fontStyle = 'bold';
                }
            },
        });

        const afterRisk = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
            'CCP = Point de Contrôle Critique. Toute déviation doit déclencher une action corrective immédiate et un enregistrement.',
            14, afterRisk
        );

        // ── Page 3 : Procédures de nettoyage ───────────────────────────────────

        doc.addPage();
        addHeader(doc, 'PROCÉDURES DE NETTOYAGE & DÉSINFECTION', `Établissement : ${info.name}`);
        addFooter(doc, 3);

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('3. Plan de nettoyage et désinfection', 14, 48);

        autoTable(doc, {
            startY: 54,
            head: [['Zone / Équipement', 'Produit utilisé', 'Fréquence', 'Responsable']],
            body: CLEANING_PROCEDURES.map(p => [p.zone, p.product, p.frequency, p.responsible]),
            theme: 'striped',
            headStyles: { fillColor: [20, 80, 45], textColor: 255, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 8, cellPadding: 4 },
            alternateRowStyles: { fillColor: [240, 248, 240] },
            columnStyles: {
                0: { cellWidth: 46 },
                1: { cellWidth: 62 },
                2: { cellWidth: 36 },
                3: { cellWidth: 36 },
            },
        });

        const afterCleaning = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
            'Tous les produits utilisés doivent être approuvés par la réglementation en vigueur (CE 648/2004, EN 1276). Conserver les fiches de données de sécurité (FDS).',
            14, afterCleaning, { maxWidth: W - 28 }
        );

        // ── Page 4 : Enregistrements de températures ───────────────────────────

        doc.addPage();
        addHeader(doc, 'ENREGISTREMENTS DES TEMPÉRATURES', `30 derniers relevés — ${info.name}`);
        addFooter(doc, 4);

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('4. Historique des relevés de températures', 14, 48);

        // Fetch 30 last temperature logs from Nexus
        let tempRows: Array<string[]> = [];
        try {
            const basePath = tenantId && tenantId !== 'restaurant-os'
                ? `tenants/${tenantId}/temperatureLogs`
                : 'temperatureLogs';

            const logs = await Nexus.adapter.query<TemperatureLogRaw>(basePath, {
                orderBy: { field: 'createdAt', direction: 'desc' },
                limit: 30,
            });

            if (logs.length > 0) {
                tempRows = logs.map(l => {
                    const dateRaw = l.recordedAt ?? l.createdAt ?? '';
                    const dateFormatted = dateRaw
                        ? new Date(dateRaw).toLocaleString('fr-FR')
                        : '—';
                    const zone = l.zone ?? l.item ?? '—';
                    const temp = l.temperature != null
                        ? `${l.temperature} °C`
                        : l.value != null
                        ? `${l.value} °C`
                        : '—';
                    const operator = l.recordedBy ?? l.user ?? '—';
                    const compliant = l.isCompliant != null
                        ? (l.isCompliant ? 'Conforme' : 'NON CONFORME')
                        : l.status === 'ok' ? 'Conforme'
                        : l.status === 'alert' ? 'NON CONFORME'
                        : '—';
                    return [dateFormatted, zone, temp, operator, compliant];
                });
            }
        } catch {
            // Pas de logs disponibles ou adaptateur non initialisé
        }

        if (tempRows.length === 0) {
            tempRows = [['Aucun relevé disponible', '—', '—', '—', '—']];
        }

        autoTable(doc, {
            startY: 54,
            head: [['Date / Heure', 'Zone / Équipement', 'Température', 'Opérateur', 'Conformité']],
            body: tempRows,
            theme: 'grid',
            headStyles: { fillColor: [20, 80, 45], textColor: 255, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 38 },
                1: { cellWidth: 44 },
                2: { cellWidth: 26, halign: 'center' },
                3: { cellWidth: 36 },
                4: { cellWidth: 36, halign: 'center' },
            },
            didParseCell: (data) => {
                if (data.column.index === 4 && typeof data.cell.raw === 'string' && data.cell.raw.includes('NON')) {
                    data.cell.styles.textColor = [200, 50, 50];
                    data.cell.styles.fontStyle = 'bold';
                }
            },
        });

        const fileName = `PMS_${info.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
    }
}
