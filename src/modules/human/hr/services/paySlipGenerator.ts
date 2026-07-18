/**
 * ⛔ DÉSACTIVÉ EN PRODUCTION — NE PAS APPELER
 *
 * Ce générateur est un prototype de démo. Il produit un PDF avec :
 *   - Un SIRET fictif hardcodé ("890 123 456 00012")
 *   - Un salaire fixe hardcodé (2 450 € brut pour TOUS les employés)
 *   - Une classification fixe hardcodé ("Niv 4 Echelon 2")
 *   - Des taux de cotisations figés dans le code (ne suivent pas le droit)
 *   - Un mois hardcodé ("Décembre 2025")
 *
 * RISQUES LÉGAUX SI UTILISÉ EN PRODUCTION :
 *   → Redressement URSSAF (cotisations incorrectes)
 *   → Litige prud'homal (salaire du document ≠ salaire réel)
 *   → Responsabilité de l'employeur (pas de l'éditeur logiciel)
 *
 * REMPLACEMENT PRÉVU :
 *   Intégration Silae API ou PayFit Partner API.
 *   Jusqu'à là, exporter les données pré-paie en CSV pour l'expert-comptable.
 *
 * @deprecated Ne pas utiliser. Voir /api/oracle/index pour l'indexation RH.
 */

import type { User } from '@nexus/contracts';

export const generatePaySlip = (_user: User): never => {
    throw new Error(
        '[LEGAL] generatePaySlip est désactivé — SIRET fictif 890 123 456 00012, salaire hardcodé, ' +
        "cotisations figées. Intégrer Silae API ou exporter CSV pour l'expert-comptable."
    );
};
