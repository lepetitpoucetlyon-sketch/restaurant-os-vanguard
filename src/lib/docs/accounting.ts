// @ts-nocheck
// @ts-nocheck
import { BookOpen } from 'lucide-react';
import { DocCategory } from '@/types';

export const accounting: DocCategory = {
    title: 'Finance & Console Comptable',
    description: 'Transparence financière absolue et conformité fiscale. Le module convertit vos opérations quotidiennes en écritures comptables exploitables par votre direction financière.',
    icon: BookOpen,
    color: '#1c3c2d',
    details: [
        { label: 'Journal de Ventes', content: 'Génération automatique des journaux de recettes et des brouillards comptables exportables en format standard (FEC).' },
        { label: 'Dématérialisation OCR', content: 'Numérisation et extraction automatique des données des factures fournisseurs pour une saisie comptable zéro-papier.' },
        { label: 'Gestion de Trésorerie', content: 'Rapprochement bancaire, suivi des encaissements multi-modes et contrôle des flux de cash en caisse.' },
        { label: 'Reporting P&L Live', content: 'Tableau de bord de rentabilité mensuel (Profits & Pertes) par centre de coût ou par catégorie de produits.' },
        { label: 'Tableaux de Bord TVA', content: 'Calcul automatique de la TVA collectée et déductible par service pour vos déclarations périodiques.' },
        { label: 'Audit & Conformité', content: 'Archivage sécurisé de tous les tickets et documents fiscaux répondant aux exigences anti-fraude (NF525).' }
    ],
    fullTutorial: [
        {
            title: "Suivi Financier Quotidien",
            icon: "🧾",
            content: "Gardez le contrôle sur votre trésorerie.",
            points: [
                "Voir le journal de caisse → [PATH:/accounting] Menu 'Comptabilité' → 'Journal du Jour' → Détail des encaissements par mode.",
                "Exporter pour comptable → Bouton 'Export FEC' → Choisissez la période → Téléchargez le fichier.",
                "Consulter le P&L → Onglet 'Tableau de Bord' → Graphique P&L → Cliquez sur une ligne pour détails."
            ]
        },
        {
            title: "Factures & OCR",
            icon: "📁",
            content: "Digitalisez vos factures fournisseurs.",
            points: [
                "Scanner une facture → Bouton '+ Facture' → Prenez en photo → L'IA extrait montant, TVA, fournisseur.",
                "Valider les données → Vérifiez les champs extraits → Corrigez si nécessaire → 'Valider'.",
                "Voir le rapport TVA → Menu 'Rapports' → 'TVA' → Sélectionnez trimestre → Visualisez collectée vs déductible."
            ]
        }
    ]
};
