/**
 * 👥 Staff — ré-exports & types locaux à l'écran.
 * La logique pure de calcul (paie HCR, facturation freelance) vit dans le pilier
 * `human` (`staffComputations`) pour éviter le cycle hooks ↔ app.
 */

export {
    computePayroll,
    computeContractorBilling,
} from "@/modules/human";
export type { StaffTab, PayrollRow, ContractorRow, StaffDocument } from "@/modules/human";


// ── Known skills (extend as needed) ───────────────────────────────────────────

export const KNOWN_SKILLS = [
    "Service en salle",
    "Sommellerie",
    "Cuisine",
    "Pâtisserie",
    "Barista",
    "Caisse / POS",
    "HACCP",
    "Management",
    "Langues étrangères",
    "Permis B",
];
