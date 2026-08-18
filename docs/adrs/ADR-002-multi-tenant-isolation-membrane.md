# ADR-002 : Isolation Contextuelle Multi-Tenant & Membrane SovereignGuard

- **Statut** : ACCEPTÉ
- **Date** : 2026-08-18
- **Auteurs** : Fleet Vanguard & Architecture Core

## 1. Contexte & Problématique
Restaurant OS gère des milliers d'instances d'établissements (restaurants, cliniques, salons, hôtels, etc.) sur un socle multi-tenant unifié. Les risques de fuite de données (« data bleed ») ou de contamination croisée de l'état mémoire représentent une brèche de sécurité absolue de grade P0.

## 2. Décision Architecturale
1. **Scoping Strict par Path** : Toutes les écritures et lectures au niveau de la couche `INexusAdapter` passent par le middleware `NexusInterceptor` qui préfixe et valide systématiquement les chemins sous `tenants/${tenantId}/*`.
2. **SovereignGuard & Shadow Context** :
   - Tout accès à un document d'un autre tenant déclenche immédiatement `SovereignGuard.triggerFailSafe()`, émet un événement critique `sovereign.breach`, purge le stockage local et déconnecte l'opérateur.
   - Les tenants de référence (`_ref_*`) et de démonstration (`_demo_*`) sont strictement protégés en écriture directe. Seul le tenant `_test_*` est inscriptible pour les suites de tests automatisées.
3. **Périmètre Zéro-Trust** : Les points d'entrée d'API (`/api/tenant/*`, `/api/admin/*`) valident l'ancrage du tenant via les claims JWT (`caller.tenantId`) et rejettent toute requête croisée avec un code 403/404.

## 3. Conséquences
- Élimination totale des fuites de données inter-locataires.
- Auditabilité permanente via les pulses de télémétrie `NexusTelemetryService`.
