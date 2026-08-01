/**
 * Heuristique de rapprochement libellé bancaire → compte PCG.
 * Partagée entre l'import CSV manuel (statementsImporter) et la synchro
 * agrégateur temps réel (Powens & co.) pour éviter toute divergence.
 */
const PCG_ACCOUNT_HEURISTICS: { pattern: RegExp; account: string; label: string }[] = [
    { pattern: /virement|salaire|paie/i, account: '641', label: 'Rémunérations du personnel' },
    { pattern: /urssaf|cotisation|social/i, account: '645', label: 'Charges de sécurité sociale' },
    { pattern: /loyer|bail|locatio/i, account: '613', label: 'Locations' },
    { pattern: /electricit|edf|gaz|energie/i, account: '606', label: 'Énergie' },
    { pattern: /transgourmet|metro|sysco|fournisseur|livraison marchandise/i, account: '607', label: 'Achats de marchandises' },
    { pattern: /assurance/i, account: '616', label: 'Primes d\'assurance' },
    { pattern: /telephone|orange|sfr|bouygues|free/i, account: '626', label: 'Frais postaux et de télécommunication' },
    { pattern: /banque|frais bancaire|commission/i, account: '627', label: 'Services bancaires' },
    { pattern: /vente|cb|tpe|ticket|stripe|sumup/i, account: '706', label: 'Prestations de services' },
    { pattern: /remboursement|avoir/i, account: '709', label: 'Rabais, remises, ristournes accordés' },
];

export function inferPCGAccount(label: string): { account: string; label: string } | undefined {
    for (const h of PCG_ACCOUNT_HEURISTICS) {
        if (h.pattern.test(label)) return { account: h.account, label: h.label };
    }
    return undefined;
}
