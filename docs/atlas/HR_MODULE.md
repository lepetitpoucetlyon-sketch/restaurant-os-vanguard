# 🧑‍🍳 HR MODULE (Brigade & Planning)

Le cœur social de Restaurant OS qui gère le staff, les plannings de travail et les données de paie.

## 1. Responsabilités & Objets (Domain)
- **Brigade (Staff Members)** : Profils, compétences et rôles des collaborateurs.
- **Planning (Shifts)** : Organisation des horaires et rotation des équipes.
- **Badgeuse (Clock-in/out)** : Enregistrement réel du temps de travail.
- **Absences (Leaves)** : Gestion des congés payés et des balances.
- **Recrutement** : Pipeline de candidatures pour les nouveaux talents.

## 2. Flux de Synchronisation (`hr.sync.ts`)
- **Staff Sync** : Synchronisation des utilisateurs rattachés au tenant.
- **Shift Logs Sync** : Limité aux 100 dernières entrées pour la performance.
- **Temps Réel** : Mise à jour instantanée des "Active Shifts" pour savoir qui est présent dans le restaurant à tout moment.

## 3. Sécurité & Confidentialité (PII)
- **Protection des Données** : Les données personnelles (RGPD) sont strictement isolées. Seuls les rôles `admin` et `manager` ont accès aux détails sensibles (salaires, adresses, contrats).
- **Audit Immuable** : Chaque modification de contrat ou de planning est enregistrée via `useNexusMutation` pour garantir une traçabilité parfaite face à l'inspection du travail.

## 4. Gouvernance & Liaisons
- **Liaison Finance** : Envoi d'un `PAYROLL_PULSE` pour intégrer les coûts de personnel dans le grand livre comptable.
- **Liaison Ops** : Le module Ops envoie des données de charge de travail (`WORKLOAD_PULSE`) pour permettre au module RH de suggérer des plannings optimisés basés sur les prévisions de vente.

## 5. Points de Vigilance
- **Gestion des Droits** : L'accès aux fichiers RH est le point le plus sensible du système. Une faille ici compromettrait la confidentialité de toute la brigade.
- **Conformité Légale** : Le système doit être régulièrement mis à jour pour suivre les évolutions du droit du travail (calcul des heures supplémentaires, durées de repos, etc.).
