/**
 * ServiceSubject — le bien ou la personne prise en charge par un ServiceTicket.
 *
 * Invariant PII : si isPii === true, `ref` pointe sur une entrée PiiVault et `label`
 * est systématiquement anonymisé (ex. "Patient ****1234"). Le détail réel ne vit
 * jamais dans un document fiscal immuable (NF525 / RGPD art. 9).
 */

export type ServiceSubjectKind =
    | 'vehicle'   // Garage — immatriculation, VIN
    | 'patient'   // Clinic — données de santé RGPD art. 9 → isPii obligatoire
    | 'guest'     // Hôtel — chambre / identité voyageur
    | 'table'     // Restaurant — table ou prise en charge comptoir
    | 'asset'     // Facility — équipement, machine
    | 'custom';   // Autres verticales

export interface ServiceSubject {
    kind: ServiceSubjectKind;
    /**
     * Si isPii === false : identifiant direct (ex. tableId, vehicleId).
     * Si isPii === true  : clé PiiVault — jamais exposée dans les logs NF525.
     */
    ref: string;
    isPii: boolean;
    /** Label anonymisé affichable (ex. "Table 12", "Véhicule ****5478", "Patient ****1234"). */
    label: string;
}

/** Construit un sujet non-PII (table, véhicule sans données client, asset). */
export function createSubject(kind: ServiceSubjectKind, ref: string, label: string): ServiceSubject {
    return { kind, ref, isPii: false, label };
}

/**
 * Construit un sujet PII (patient, voyageur avec données personnelles).
 * `piiVaultRef` = clé retournée par PiiVault.store(). Le label doit être anonymisé
 * par l'appelant avant d'appeler cette fonction.
 */
export function createPiiSubject(kind: ServiceSubjectKind, piiVaultRef: string, anonymizedLabel: string): ServiceSubject {
    return { kind, ref: piiVaultRef, isPii: true, label: anonymizedLabel };
}
