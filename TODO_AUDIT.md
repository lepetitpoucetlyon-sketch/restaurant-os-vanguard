# 🚨 TODO AUDIT - RESTAURANT OS CORE

## PRIORITÉ 1 : SÉCURITÉ & ISOLATION (IMPACT CRITIQUE)
- [ ] **Point 1 : Isolation Client** -> Créer `src/app/client` et séparer physiquement les routes.
- [ ] **Point 2 : RBAC Granulaire** -> Typage strict des rôles (`CLIENT`, `ADMIN`) et filtres `organization_id` obligatoires.
- [ ] **Point 6 : Découplage Hubs** -> Réduire le ratio (1.62 -> 1.3) en fragmentant `NexusInternalMapper` et `FleetTelemetryService`.

## PRIORITÉ 2 : PERFORMANCE & SCALABILITÉ (IMPACT MOYEN)
- [ ] **Point 3 : Code-Splitting** -> Implémenter le lazy loading dynamique pour les 34 modules dans `LayoutResolver`.
- [ ] **Point 5 : Versioning Zod** -> Structurer les schémas par version (`v1`, `v2`) pour éviter les breaking changes en cascade.

## PRIORITÉ 3 : GOUVERNANCE (IMPACT OPÉRATIONNEL)
- [ ] **Point 4 : MCC Actif** -> Ajouter des seuils d'alerte et des actions correctives automatiques au `TelemetryStream`.
