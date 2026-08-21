# 📋 À faire — Bloqueurs restants

Ce fichier liste les chantiers **non commençables sans décision externe** (infra, budget, ou compte fournisseur). Le reste du Plan Master a été exécuté (voir ADR-008 à ADR-013).

---

## 🚧 Bloqueurs commerciaux / prod

### ❌ Preview deploys — nécessite décision infra (Vercel / Cloud Run)

**Ce que c'est** : à chaque commit ou PR, une URL temporaire est créée avec le code de la branche pour tester avant que ça touche `main` (prod).

**Ce que ça débloque** : zéro régression n'atteint jamais un client — chaque changement est testé sur un site jetable avant merge.

**Décision requise** :
- Choix hébergeur : Vercel (le plus simple pour Next.js) / Google Cloud Run / OVH / Hostinger
- Ouverture du compte + carte de paiement
- Variables d'env preview (base de données isolée ou clone jetable)
- Éventuellement câbler les preview deploys aux tenants système `_test_*` créés dans `SystemTenantRegistry.ts`

**Une fois décidé** : job GitLab CI qui build + déploie sur URL éphémère, TTL 7 jours, destruction auto au merge.

---

### ❌ Observabilité (Sentry + Grafana + OpenTelemetry) — nécessite comptes fournisseurs

**Ce que c'est** : trois briques qui donnent la visibilité temps réel sur ce qui se passe chez les clients :
1. **Sentry** — capture chaque crash JS/Node avec contexte (utilisateur, écran, action)
2. **Grafana Cloud** — dashboards latence, erreurs, disponibilité par tenant
3. **OpenTelemetry** — instrumentation code pour collecter traces + métriques + logs

**Ce que ça débloque** : quand un client appelle "mon POS a planté à 20h47 samedi soir", on sait déjà ce qui s'est passé avant qu'il termine sa phrase.

**Décision requise** :
- Compte Sentry Team (~26 $/mois pour 100k events)
- Compte Grafana Cloud (gratuit jusqu'à 10 k series)
- Compte BetterStack ou PagerDuty pour l'alerting mobile
- Décision : instrumenter au niveau Nexus (interceptor pattern déjà en place) OU au niveau Next.js SDK

**Une fois décidé** :
- Ajouter les DSN dans `.env.example` (déjà cadré par ADR-003 fail-fast Sentry)
- Config OTel dans `next.config.js`
- Dashboard MCC "santé flotte" branché sur Grafana API

---

## 📌 Rappel : ce qui est déjà fait

- ✅ ADR-008 : Isolation IA MCC ↔ Tenant (Phases A→E)
- ✅ Kill-switch MCC pour landing + signup public
- ✅ Tests routes signup (`/api/signup` + `/api/billing/signup`, 27 tests)
- ✅ ADR-009 → 013 : Migration sovereign (12 collections, 5 piliers, 65 tests)
- ✅ 6 pages légales rédigées + linkées (CGV, CGU, RGPD, DPA, NF525, Security)
- ✅ Landing + parcours signup autonome multi-vertical
- ✅ CI/CD GitLab de base + MigrationRunner
- ✅ Health checks + incident webhook + runbooks SRE
