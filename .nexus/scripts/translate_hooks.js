const fs = require('fs');

const path = './public/blueprint/data.js';
let content = fs.readFileSync(path, 'utf8');

const translations = {
    '"orders"': '"Commandes"',
    '"addOrder"': '"Ajouter Commande"',
    '"updateOrderStatus"': '"Mettre à Jour Statut Commande"',
    '"updateOrderItemStatus"': '"Mettre à Jour Statut Article"',
    '"updateOrderItem"': '"Modifier Article Commande"',
    '"deleteOrder"': '"Supprimer Commande"',
    '"requestItemModification"': '"Demander Modification Article"',
    '"respondToModification"': '"Répondre Modification"',
    '"getPendingModifications"': '"Lire Modifications en Attente"',
    '"totalRevenue"': '"Revenu Total"',
    '"isLoading"': '"Chargement en Cours"',
    '"currentUser"': '"Utilisateur Actuel"',
    '"isAuthenticated"': '"Est Authentifié"',
    '"login"': '"Connexion"',
    '"loginAsUser"': '"Connexion au Compte"',
    '"logout"': '"Déconnexion"',
    '"users"': '"Utilisateurs"',
    '"updateUserStatus"': '"Modifier Statut Utilisateur"',
    '"rolePermissions"': '"Permissions de Rôle"',
    '"updateRolePermissions"': '"Mettre à Jour Permissions"',
    '"addUser"': '"Ajouter Utilisateur"',
    '"deleteUser"': '"Supprimer Utilisateur"',
    '"hasAccess"': '"Vérifier Accès"',
    '"getAccessibleCategories"': '"Lire Catégories Accessibles"',
    '"canDo"': '"Autorisation Active"',
    '"logAction"': '"Consigner Action (Log)"',
    '"verifyPin"': '"Vérifier Code PIN"',
    '"duerp"': '"Saisie DUERP"',
    '"cerfa"': '"Documents CERFA"',
    '"pmrDoc"': '"Registres PMR"',
    '"incendieDoc"': '"Dossiers Incendie"',
    '"hottesDoc"': '"Maintenance Hottes"',
    '"certHalal"': '"Certificats Halal"',
    '"agrementBoucher"': '"Agréments Sanitaires"',
    '"prestataires"': '"Prestataires Agréés"',
    '"interventions"': '"Carnet Interventions"',
    '"extincteurs"': '"Contrôle Extincteurs"',
    '"exercices"': '"Exercices Évacuation"',
    '"pmrAmenagements"': '"Aménagements PMR"',
    '"getOverallStatus"': '"Statut Conformité Global"',
    '"accounts"': '"Plan Comptable"',
    '"journalEntries"': '"Écritures Journalières"',
    '"expenseClaims"': '"Notes de Frais"',
    '"fiscalPeriods"': '"Périodes Fiscales"',
    '"ledger"': '"Grand Livre"',
    '"metrics"': '"Métriques et Indicateurs"',
    '"legacyMetrics"': '"Métriques Historiques"',
    '"submitExpense"': '"Soumettre Dépense"',
    '"approveExpense"': '"Valider Dépense"',
    '"rejectExpense"': '"Rejeter Dépense"',
    '"createManualEntry"': '"Saisie Écriture Manuelle"',
    '"validateEntry"': '"Contrôler Écriture"',
    '"generatePandL"': '"Compte de Résultat (P&L)"',
    '"generateBalanceSheet"': '"Bilan Comptable"',
    '"generateTrialBalance"': '"Balance Générale"',
    '"getAccountByCode"': '"Recherche Compte par Code"',
    '"getLedgerForAccount"': '"Extrait Grand Livre"',
    '"treasury"': '"Trésorerie Active"',
    '"bankTransactions"': '"Relevés Bancaires"',
    '"addBankTransaction"': '"Ajouter Opération Banque"',
    '"reconcileTransaction"': '"Rapprochement Bancaire"',
    '"alerts"': '"Alertes Métier"',
    '"isAuthLoading"': '"Chargement Authentification"'
};

for (const [eng, fr] of Object.entries(translations)) {
    content = content.replace(new RegExp(eng, 'g'), fr);
}

fs.writeFileSync(path, content);
console.log("Hooks translations applied successfully!");
