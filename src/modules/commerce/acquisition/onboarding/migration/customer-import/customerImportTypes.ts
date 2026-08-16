import type { CustomerImportResult, CustomerCSVRow } from '../CustomerCSVImporter';

export type PanelPhase =
  | { phase: "idle" }
  | { phase: "ready"; file: File; rows: CustomerCSVRow[]; maskedCount: number }
  | { phase: "importing"; progress: number }
  | { phase: "done"; result: CustomerImportResult; fileName: string }
  | { phase: "error"; message: string };

export const ACCEPTED_TYPES = ["text/csv", "application/csv", "text/plain", "application/vnd.ms-excel"];

export const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  prenom: "Prénom", first_name: "Prénom", firstname: "Prénom",
  nom: "Nom", last_name: "Nom", lastname: "Nom",
  telephone: "Téléphone", téléphone: "Téléphone", tel: "Téléphone", phone: "Téléphone",
  nb_visites: "Nb visites", visits: "Nb visites",
  derniere_visite: "Dernière visite", last_visit: "Dernière visite",
  notes: "Notes", commentaire: "Notes",
  anniversaire: "Anniversaire", birthday: "Anniversaire",
};
