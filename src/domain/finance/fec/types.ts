/**
 * 🏛️ FEC Types - Grade X+++
 * Types pour l'export Fichier des Écritures Comptables (DGFiP)
 */

export interface FECLine {
    JournalCode: string;          // ex: "VTE", "ACH", "BNQ"
    JournalLib: string;           // ex: "Ventes", "Achats"
    EcritureNum: string;          // numéro séquentiel unique
    EcritureDate: string;         // format YYYYMMDD
    CompteNum: string;            // numéro de compte PCG (ex: "411000")
    CompteLib: string;            // libellé du compte
    CompAuxNum: string;           // compte auxiliaire (client/fournisseur)
    CompAuxLib: string;           // libellé compte auxiliaire
    PieceRef: string;             // référence de la pièce justificative
    PieceDate: string;            // date de la pièce YYYYMMDD
    EcritureLib: string;          // libellé de l'écriture
    Debit: string;                // montant débit (format "0.00", vide si crédit)
    Credit: string;               // montant crédit (format "0.00", vide si débit)
    EcritureLet: string;          // lettre de lettrage
    DateLet: string;              // date du lettrage YYYYMMDD
    ValidDate: string;            // date de validation YYYYMMDD
    Montantdevise: string;        // montant en devise étrangère
    Idevise: string;              // code devise ISO (ex: "EUR")
    EcritureHash: string;         // [EXTENSION NF525] hash de scellage QuantumCrypto
}

export interface FECExportResult {
    content: string;
    filename: string;
    lineCount: number;
    finalHash: string;
}
