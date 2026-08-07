# Plan — Self-Service Onboarding & Landing Page
## Restaurant OS · Autonomisation B2B client

> **Première mission obligatoire : état des lieux complet du projet**  
> Beaucoup de modules ont été ajoutés depuis le dernier audit global.  
> Aucune ligne de code ne sera écrite avant que cet état des lieux soit validé.

---

## PHASE 0 — État des lieux (Audit pré-chantier)

> Durée estimée : **2-3 jours**  
> Objectif : cartographier ce qui existe vraiment, ce qui est stub, ce qui est cassé, ce qui est dupliqué.

### 0.1 — Audit des modules critiques pour ce chantier

Pour chaque brique ci-dessous, l'audit doit répondre à 3 questions :
- **Existe-t-il ?** (fichier présent)
- **Fonctionne-t-il ?** (logique métier complète, pas un stub `return true`)
- **Est-il branché ?** (appelé depuis quelque part, testé)

| Brique | Chemin attendu | Questions clés |
|--------|---------------|----------------|
| Route signup publique | `src/app/api/billing/signup/route.ts` | Crée vraiment un tenant ? Stripe appelé ? |
| BrandingService.extractFromUrl | `src/lib/BrandingService.ts` | Playwright disponible ? Gemini Vision câblé ? |
| Module onboarding | `src/modules/onboarding/` | Wizard UI complet ? Checklist persistée ? |
| ProvisioningEngine | `src/lib/ProvisioningEngine.ts` | Toutes les étapes non-stub ? RBAC seeded ? |
| TenantSeeder | `src/lib/TenantSeeder.ts` | Demo data réelle ? Verticals tous couverts ? |
| Stripe subscription auto | `src/lib/mcc/provisioning/TenantProvisioningService.ts` | Create subscription appelé ? Webhook reçu ? |
| Resend email | `src/lib/resend/` ou équivalent | Templates prêts ? Envoi réel testé ? |
| ConnectorHub auto-activation | `src/modules/intelligence/connectors/hub/` | Auto-activate au seeding ? Auth flows complets ? |
| Migration données | `src/modules/onboarding/` → importers | Zelty, Lightspeed, TheFork : stubs ou vrais ? |
| MCC fleet auto-populate | `fleetTelemetry.pushSiteTelemetry()` | Temps réel ou polling ? |
| Contrat PDF | introuvable à ce jour | À créer de zéro |
| Landing page publique | introuvable à ce jour | À créer de zéro |

### 0.2 — Audit de la route `/api/billing/signup`

C'est le point d'entrée central du flow. Il faut vérifier :

```
□ Valide l'email + slug unicité
□ Appelle ProvisioningEngine (pas TenantSeeder directement)
□ Crée le Stripe Customer
□ Démarre le trial (trialDays configuré)
□ Déclenche l'email de bienvenue (Resend)
□ Retourne tenantId + URL de l'app demo
□ Gère les erreurs (slug collision, Stripe KO, email KO) sans laisser de tenant orphelin
□ Rate-limit (pas de spam provisioning)
```

### 0.3 — Audit `BrandingService.extractFromUrl`

Ce service existe mais dépend de Playwright (screenshot côté serveur) + Gemini Vision.

```
□ Playwright installé dans le projet ?
□ Fonctionne en environnement serverless (Vercel) ? → Playwright ne tourne pas sur Vercel Functions
□ Alternative : puppeteer-core + chrome-aws-lambda ?
□ Gemini Vision : modèle correct (flash vs pro) ? Quota ?
□ Fallback si extraction échoue (pas de crash utilisateur)
□ Instagram : URL publique accessible sans auth ? (stories = non, feed = oui)
□ Résultat : primaryColor validé hex ? logoUrl accessible publiquement ?
```

**Point bloquant potentiel** : Playwright en serverless est une contrainte majeure.  
Solutions à évaluer pendant l'audit :
- `@sparticuz/chromium` + Vercel Fluid Compute (> 3Go RAM)
- Service externe (Browserless.io, Apify)
- Fallback : simple fetch du HTML + extraction CSS/meta OG sans screenshot

### 0.4 — Audit module onboarding `src/modules/onboarding/`

```
□ Wizard UI : combien d'étapes ? Toutes rendues ?
□ Checklist "sans migration" : items définis ? Persistés en Nexus ?
□ Checklist "avec migration" : connecteurs détectés auto ?
□ Import Zelty : vrai parser ou stub ?
□ Import Lightspeed : vrai parser ou stub ?
□ Import TheFork : vrai parser ou stub ?
□ Import générique CSV : fonctionne ?
□ État wizard persisté entre sessions (rafraîchissement page = perdu ?)
□ Progression trackée dans tenantConfig (pour que MCC voie l'avancement)
```

### 0.5 — Audit Stripe

```
□ STRIPE_SECRET_KEY en env ? STRIPE_WEBHOOK_SECRET ?
□ Produits/prix créés dans Stripe dashboard (STANDARD, PREMIUM, ENTERPRISE) ?
□ Webhook handler : /api/webhooks/stripe → gère checkout.session.completed ?
□ Trial end → subscription active → tenant status TRIAL → ACTIVE ?
□ Annulation → tenant status → SUSPENDED ?
□ Portail client Stripe (gestion abonnement en self-service) câblé ?
```

### 0.6 — Audit Resend / emails transactionnels

```
□ RESEND_API_KEY en env ?
□ Templates existants : bienvenue, trial expiring, contrat, facture ?
□ Domaine vérifié sur Resend (pas d'envoi depuis @gmail.com) ?
□ Queue emails (retry si KO) ?
```

### 0.7 — Audit dette technique bloquante

Avant d'ajouter le flow self-service, vérifier :

```
□ TypeScript : 0 erreur (npx tsc --noEmit)
□ Tests : tous verts (npx vitest run)
□ Sentrux : 0 cycle, 0 god file nouveau
□ Variables d'env : .env.example à jour avec toutes les nouvelles clés
□ NEXT_PUBLIC_APP_MODE=tenant (la landing tourne en mode tenant, pas mcc)
□ Middleware : /api/public/* non protégé par auth (accessible sans PIN)
```

### 0.8 — Livrable de l'audit

À l'issue de la Phase 0, produire un fichier `docs/AUDIT_LANDING_PREFLIGHT.md` avec :

```markdown
## Briques prêtes (✅)
## Briques à compléter (⚠️ + ce qui manque)
## Briques à créer de zéro (🔴)
## Bloquants techniques (🚨 + solution retenue)
## Décisions d'architecture validées
```

**Ce fichier est le GO/NO-GO avant de coder quoi que ce soit.**

---

## PHASE 1 — Extraction de marque (Brand Intelligence)

> Prérequis : audit Phase 0 terminé et validé  
> Durée estimée : **3-4 jours**

### 1.1 — Route API d'extraction

```
POST /api/public/extract-brand
  body  : { url: string }          ← Instagram ou site web
  auth  : aucune (publique)
  rate  : 10 req/IP/heure

  pipeline :
    1. Valider l'URL (zod, http/https uniquement)
    2. Tenter screenshot via service choisi (voir 0.3)
    3. BrandingService.extractFromUrl(url)
       → Gemini Vision → { primaryColor, logoUrl, brandName, atmosphere }
    4. Si échec screenshot → fallback HTML :
       fetch(url) → parse <meta og:image>, <meta theme-color>, manifest.json
    5. Retourner { primaryColor, logoUrl, brandName, suggestedTagline }
    6. Timeout : 12s max (UX)
```

### 1.2 — Fallback extraction sans screenshot

Pour les cas où Playwright/Chrome n'est pas disponible :

```typescript
// Ordre de tentative :
// 1. <meta name="theme-color" content="#...">
// 2. manifest.json → theme_color
// 3. <meta property="og:image"> → logoUrl
// 4. CSS body background-color (fetch + regex)
// 5. Favicon → logoUrl de dernier recours
// 6. Défaut : #C5A059 (gold RestaurantOS) + null logo
```

### 1.3 — Cas Instagram spécifique

Instagram bloque le scraping. Solution :
- Extraire depuis l'URL de profil : `instagram.com/<handle>`
- Fetch la page publique → extraire l'image de profil (og:image)
- Extraire le nom du compte (og:title)
- Pas d'extraction de couleur possible → proposer color picker manuel

---

## PHASE 2 — Landing page publique

> Durée estimée : **4-5 jours**

### 2.1 — Route et layout

```
/signup                  ← landing principale
/signup/demo             ← redirection post-création
/signup/[tenantKey]      ← onboarding wizard du tenant
```

Layout : pas de header auth, pas de sidebar, fond `--color-surface-sidebar` (#111827), header minimaliste avec logo RestaurantOS.

### 2.2 — UX du formulaire d'inscription (3 étapes)

**Étape A — Analyse de marque**
```
┌─────────────────────────────────────┐
│  Votre restaurant, votre identité.  │
│                                     │
│  [ Entrez votre URL ou Instagram  ] │
│  ex: monrestaurant.fr ou @lepetit   │
│                                     │
│  [ Analyser ma marque → ]           │
└─────────────────────────────────────┘
  ↓ loader 3-8s "Analyse en cours…"
┌─────────────────────────────────────┐
│  Votre charte détectée :            │
│  ● Couleur : [preview]  [modifier]  │
│  ● Logo    : [img]      [changer]   │
│  ● Nom     : Le Petit Poucet        │
│                                     │
│  [ C'est parfait → Continuer ]      │
└─────────────────────────────────────┘
```

**Étape B — Compte**
```
Prénom · Nom · Email pro · Mot de passe
Vertical : [Restaurant] [Hôtel] [Boulangerie] …
Période d'essai : 14 jours gratuits (pas de CB)
[ Créer ma démo → ]
```

**Étape C — Splash de bienvenue**
```
Animation : logo détecté apparaît en grand
"Votre Restaurant OS est prêt."
Fond : couleur primaire extraite
[ Accéder à ma démo → ]
→ redirect vers /signup/[tenantKey]
```

### 2.3 — Ce que la création déclenche (back)

```
POST /api/public/extract-brand         (étape A)
POST /api/billing/signup               (étape B)
  → ProvisioningEngine.provisionNewInstance({
      branding: { mode: 'custom', accentColor, logoUrl, splashEnabled: true },
      trialDays: 14,
      copyBaseTemplates: true,
    })
  → TenantSeeder.seed() → demo data complète
  → injectBrandingVars()
  → email bienvenue (Resend)
  → fleetTelemetry.pushSiteTelemetry() → MCC notifié
```

---

## PHASE 3 — Onboarding wizard post-inscription

> Durée estimée : **5-7 jours**  
> Route : `/signup/[tenantKey]` ou dans l'app `/onboarding`

### 3.1 — Checklist dynamique selon le profil

L'onboarding s'adapte selon deux profils :

**Profil A — Nouveau restaurant (sans données existantes)**
```
□ Configurer le plan de salle (tables, zones)
□ Ajouter la carte (plats, catégories, prix)
□ Paramétrer les imprimantes
□ Inviter l'équipe (serveurs, cuisiniers)
□ Tester une première commande
□ Activer les connecteurs utiles (TheFork, Deliveroo…)
□ Configurer les alertes stock
□ Planifier la formation équipe
```

**Profil B — Migration depuis un logiciel existant**
```
□ Choisir la source (Zelty / Lightspeed / Addition / CSV)
□ Importer la carte produits
□ Importer l'historique clients (CRM)
□ Vérifier les données importées
□ Configurer les connecteurs actifs
□ Valider la conformité NF525
□ Former l'équipe sur les différences
□ Basculer en production
```

### 3.2 — Détection auto du profil

```typescript
// Au début de l'onboarding, 1 question :
"Vous utilisez déjà un logiciel de caisse ?"
  → Oui → Profil B (migration)
  → Non  → Profil A (nouveau)
```

### 3.3 — Persistance de la progression

```typescript
// Stocké dans tenants/{tenantId}/onboarding :
{
  profile: 'new' | 'migration',
  completedSteps: string[],
  currentStep: string,
  startedAt: string,
  completedAt: string | null,
}
// Lu par MCC pour afficher la progression de chaque tenant en démo
```

---

## PHASE 4 — Conversion Demo → Client réel

> Durée estimée : **4-5 jours**

### 4.1 — Déclencheurs de conversion

La conversion peut être initiée par :
- Le client (bouton "Passer en production" dans l'app)
- Expiration du trial (email J-7, J-3, J-0)
- L'opérateur MCC (upgrade manuel depuis fleet)

### 4.2 — Flow de conversion

```
Client clique "Passer en production"
    │
    ▼
Choix du plan (STANDARD / PREMIUM / ENTERPRISE)
    │
    ▼
Stripe Checkout Session créée
    │  (redirect vers Stripe)
    ▼
Paiement validé → webhook Stripe → checkout.session.completed
    │
    ├── tenant.status TRIAL → ACTIVE
    ├── Contrat PDF généré et envoyé (Resend)
    ├── Facture Stripe envoyée
    └── MCC notifié (status change en temps réel)
```

### 4.3 — Contrat auto-généré

Le contrat PDF doit contenir :
```
- Nom du restaurant / SIRET / Adresse
- Plan souscrit + prix TTC
- Date de début
- CGU (lien)
- Signature électronique (optionnel : DocuSign ou simple "J'accepte")
```

Librairie recommandée : `@react-pdf/renderer` (déjà potentiellement dans la stack).  
Template stocké dans `src/modules/finance/comptabilite/documents/templates/contrat.tsx`.

### 4.4 — Portail abonnement self-service

```typescript
// Stripe Customer Portal — permet au client de :
// - Changer de plan
// - Mettre à jour sa CB
// - Télécharger ses factures
// - Annuler son abonnement

GET /api/billing/portal
  → stripe.billingPortal.sessions.create({ customer: stripeCustomerId })
  → redirect vers le portail Stripe
```

---

## PHASE 5 — Intégration MCC

> Durée estimée : **2-3 jours**

### 5.1 — Vue dédiée "Nouvelles inscriptions" dans le MCC

Un nouveau tab dans le MCC ou une section dans Fleet :

```
[DEMO] 3 nouveaux cette semaine          [ACTIFS] 47 clients
─────────────────────────────────────────────────────────────
Le Petit Poucet    J+3  onboarding 60%   [Voir] [Upgrade]
Brasserie Lumière  J+1  onboarding 20%   [Voir] [Relancer]
Sushi Zen          J+7  onboarding 100%  [Voir] [Upgrade ⚡]
```

### 5.2 — Notification temps réel

```typescript
// Quand un nouveau signup arrive :
NexusEventBus.emit('fleet.tenant_created', {
  tenantId, name, variant, brandingMode,
  trialEndsAt, onboardingProfile,
})
// MCC reçoit en push → badge sur le tab Fleet
```

### 5.3 — Actions MCC sur les tenants demo

```
[Voir l'onboarding]     → ouvre le wizard du tenant en lecture
[Envoyer un email]      → template "Besoin d'aide ?" via Resend
[Upgrade manuel]        → crée la subscription Stripe depuis le MCC
[Prolonger le trial]    → +X jours sur le trial
[Archiver]              → tenant passe INACTIVE si jamais converti
```

---

## PHASE 6 — Emails transactionnels (séquence complète)

> Durée estimée : **2 jours**

| Email | Déclencheur | Template |
|-------|-------------|----------|
| Bienvenue | Signup réussi | Logo détecté, lien démo, checklist |
| J+1 | 24h après signup | "Avez-vous essayé le POS ?" |
| J+7 | Fin de 1ère semaine | Résumé progression onboarding |
| J-7 | Trial expire dans 7j | CTA upgrade + comparatif plans |
| J-3 | Trial expire dans 3j | Urgence douce + témoignage client |
| J-1 | Trial expire demain | CTA direct Stripe Checkout |
| J+0 | Trial expiré | Grace period 48h ou suspension |
| Upgrade | Paiement réussi | Contrat en PJ, bienvenue client |
| Facture | Renouvellement mensuel | Via Stripe (automatique) |

---

## PHASE 7 — Migration données (feature premium)

> Durée estimée : **3-4 semaines** (scope distinct, feature payante)  
> Ne pas bloquer les phases 1-6 sur ce point.

### Sources à supporter

| Source | Complexité | État actuel |
|--------|-----------|-------------|
| CSV générique | Faible | À vérifier (audit 0.4) |
| Zelty | Moyenne | Importer existant ? |
| Lightspeed | Moyenne | Connecteur existe |
| L'Addition | Moyenne | À implémenter |
| TheFork | Faible | Réservations seulement |
| Popina | Moyenne | À implémenter |
| Cashpad | Haute | Format propriétaire |

### Règle de migration

```
Toute migration passe par un preview "avant/après" :
  1. Upload du fichier / connexion API source
  2. Mapping colonnes → champs RestaurantOS
  3. Preview : 10 premières lignes rendues
  4. Validation manuelle avant import définitif
  5. Import atomique (tout ou rien)
  6. Rapport : X produits importés, Y ignorés, Z erreurs
```

---

## Ordre d'exécution recommandé

```
Semaine 1   Phase 0  — Audit complet + AUDIT_LANDING_PREFLIGHT.md
Semaine 2   Phase 1  — Extraction marque (API + fallbacks)
Semaine 3   Phase 2  — Landing page publique
Semaine 4   Phase 3  — Onboarding wizard
Semaine 5   Phase 4  — Conversion Demo → Prod (Stripe + contrat)
Semaine 6   Phase 5  — Intégration MCC (notifications, actions)
Semaine 6   Phase 6  — Emails transactionnels (séquence complète)
Semaine 7+  Phase 7  — Migration données (scope optionnel / premium)
```

**Règle absolue** : la Phase 0 est bloquante pour tout le reste.  
Un état des lieux incomplet génère de la dette cachée dans un chantier aussi transversal.

---

## Variables d'environnement nécessaires (nouvelles)

```env
# Extraction marque
BROWSERLESS_API_KEY=          # si service externe retenu
# ou
GEMINI_API_KEY=               # déjà présent — vérifier quota Vision

# Stripe (compléter si manquant)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_STANDARD=
STRIPE_PRICE_ID_PREMIUM=
STRIPE_PRICE_ID_ENTERPRISE=

# Resend (compléter si manquant)
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@restaurant-os.app

# Contrat PDF
PDF_SIGNING_SECRET=           # signature HMAC des contrats générés
```

---

*Dernière mise à jour : 2026-08-07 — Restaurant OS Core*
