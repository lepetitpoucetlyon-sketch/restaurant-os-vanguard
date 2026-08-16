/**
 * PrivatisationContract.ts
 * Génère un contrat de privatisation / événement en PDF via jsPDF.
 * Client-side only — importer de façon lazy depuis un composant 'use client'.
 */
import jsPDF from 'jspdf';
import { padZero, todayISO, generateRef } from './pdf/pdfLayoutHelpers';
import { renderContractPage1 } from './pdf/contractPage1';
import { renderContractPage2 } from './pdf/contractPage2';

export type PrivatisationFormule = 'menu' | 'cocktail_dinatoire' | 'buffet';

export interface PrivatisationData {
  /** Informations client */
  clientNom: string;
  clientPrenom: string;
  clientEmail: string;
  clientTelephone: string;
  clientAdresse?: string;

  /** Informations événement */
  evenementNom: string;
  dateEvenement: string;          // Format ISO : "2026-09-20"
  heureDebut: string;             // Format "HH:MM"
  heureFin: string;               // Format "HH:MM"
  nombreConvives: number;
  formule: PrivatisationFormule;
  descriptionFormule?: string;    // Précisions sur le menu / formule

  /** Tarification (en euros) */
  montantHT: number;              // Montant total hors taxes en euros
  tauxTVA?: number;               // TVA en % — défaut 20

  /** Informations restaurant (depuis tenantConfig / whiteLabelInstanceConfig) */
  restaurantNom: string;
  restaurantAdresse: string;
  restaurantTelephone?: string;
  restaurantEmail?: string;
  restaurantSiret?: string;

  /** Métadonnées */
  numeroContrat?: string;         // Référence du contrat
  dateSignature?: string;         // Format ISO — défaut : aujourd'hui
}

/**
 * Génère et déclenche le téléchargement d'un contrat de privatisation au format PDF.
 */
export function generatePrivatisationContract(data: PrivatisationData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const tauxTVA = data.tauxTVA ?? 20;
  const montantTVA = data.montantHT * (tauxTVA / 100);
  const montantTTC = data.montantHT + montantTVA;
  const acompte30 = data.montantHT * 0.30;

  const dateSignature = data.dateSignature ?? todayISO();
  const numeroContrat = data.numeroContrat ?? generateRef();

  // Date limite versement acompte (J+15 à compter de la signature)
  const dateLimiteAcompte = new Date(dateSignature);
  dateLimiteAcompte.setDate(dateLimiteAcompte.getDate() + 15);
  const dateLimiteAcompteISO = `${dateLimiteAcompte.getFullYear()}-${padZero(dateLimiteAcompte.getMonth() + 1)}-${padZero(dateLimiteAcompte.getDate())}`;

  // Page 1 — Contrat & Conditions
  renderContractPage1(
    doc,
    data,
    numeroContrat,
    dateSignature,
    dateLimiteAcompteISO,
    tauxTVA,
    montantTVA,
    montantTTC,
    acompte30
  );

  // Page 2 — Signatures
  renderContractPage2(
    doc,
    data,
    numeroContrat,
    dateSignature,
    montantTTC
  );

  const safeName = data.evenementNom.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`contrat_privatisation_${safeName}_${numeroContrat}.pdf`);
}
