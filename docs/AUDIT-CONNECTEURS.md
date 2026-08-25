# 🔌 Audit des connecteurs & de leur câblage

> Réalisé le **2026-08-25** · mesuré sur `main@42db98605`
> Périmètre : les 40 connecteurs du catalogue, leurs providers, factories, routes et UI.
> Méthode : chaque chiffre provient d'une commande exécutée (Loi 7 — Zero-Claim).

---

## Verdict

| Étage | Mesure | Verdict |
|---|---|---|
| **Catalogue** (ce qui est promis à l'écran) | 40 connecteurs sur 7 piliers | ✅ Riche |
| **Providers** (le code qui parle à l'API tierce) | 23 fichiers | 🟠 18/40 appariés |
| **Factories** (le point d'entrée) | 13 déclarées | 🔴 **5 câblées, 8 orphelines** |
| **Route de synchronisation générique** | `connectors/[id]/sync` | 🔴 **3 familles sur 13** |
| **UI** | `IntegrationsPage` lit bien `ConnectorHub` | ✅ Fonctionnelle |
| **Credentials** | `tenants/{id}/connectors/{id}`, jamais renvoyés au client | ✅ Correct |

> **Le même pattern que partout ailleurs dans ce projet :** l'architecture est bonne,
> le catalogue est ambitieux, et le câblage s'arrête à un tiers du chemin.

---

## 1 — L'architecture est saine

Le système est correctement conçu, en quatre étages :

```
catalogue (connector-manifest/pillars/*.ts)   → ce que le tenant voit
   ↓
ConnectorHub                                  → filtrage par verticale + capability
   ↓
API générique /api/connectors/*               → list · detail · test · activate · sync
   ↓
Factory du pilier → Provider concret          → appel de l'API tierce
```

**Ce qui est bien fait :**

- **Le catalogue est déclaratif et riche.** Chaque entrée porte `authType`, ses `fields`
  de configuration, les `verticals` concernées, `autoActivateFor`, `requiredCapability`
  et `isPremium` :
  ```typescript
  { id: 'zenchef', displayName: 'Zenchef', logo: '🗓️',
    category: 'reservations', pillar: 'ops', authType: 'api_key',
    fields: [{ key: 'apiKey', label: 'Clé API', type: 'password', placeholder: 'zc_live_...' }],
    verticals: ['restaurant', 'hotel', 'bakery'],
    autoActivateFor: ['restaurant'],
    requiredCapability: 'mod_reservations', isPremium: false }
  ```

- **Les credentials sont correctement protégés.** `api/connectors/[id]/route.ts:29-30`
  lit depuis `tenants/{tenantId}/connectors/{id}` — donc **sous SovereignGuard** — et les
  retire explicitement de la réponse avant de la renvoyer au client.

- **L'UI est réellement branchée.** `IntegrationsPage.tsx` (209 l) consomme
  `ConnectorHub.byCategory()` — contrairement aux 142 réglages inertes de
  `config-registry`, cette page-là lit bien sa source.

---

## 2 — Le câblage des factories 🔴

**Mesure :** pour chacune des 13 factories, nombre de fichiers qui l'importent
(hors sa propre définition et hors ré-export de barrel).

### Les 5 câblées

| Factory | Consommateurs | Où |
|---|---|---|
| `PayrollConnectorFactory` | **6** | routes `admin/hr/payroll/provider/{sync,connect}` · `PayrollExportHandler` · catalogue · types |
| `ReservationProviderFactory` | **3** | webhook `[provider]` · `reservations/sync` · `[id]/sync` |
| `ReviewProviderFactory` | **2** | `reviews/sync` · `[id]/sync` |
| `DeliveryProviderFactory` | **2** | webhook `[provider]` · `[id]/sync` |
| `IoTProviderFactory` | **1** | webhook `iot/[provider]` |

`PayrollConnectorFactory` est le seul à être branché **au-delà des routes** : il est
consommé par un handler du bus d'événements. C'est le modèle le plus abouti.

### Les 8 orphelines

```
EmailMarketingProviderFactory   0 consommateur   (Brevo · NativeEmailMarketing)
AccountingProviderFactory       0 consommateur   (Pennylane)
InvoiceProviderFactory          0 consommateur   (ImapInvoice · GmailInvoice)
PaymentProviderFactory          0 consommateur   (StripePayment)
RecruitmentProviderFactory      0 consommateur   (NativeForm)
TimeclockProviderFactory        0 consommateur   (QrCodeTimeclock · ManualTimeclock)
WeatherProviderFactory          0 consommateur   (OpenWeatherMap · MétéoFrance · Ticketmaster)
SupplierProviderFactory         0 consommateur   (EmailPdfSupplier)
```

**11 providers écrits, testés, exportés — que rien n'appelle.**

Le cas le plus frappant est `WeatherProviderFactory` : trois providers réels
(OpenWeatherMap, MétéoFrance, Ticketmaster Events). Or `PredictiveProcurementEngine.ts:29`
ajuste les approvisionnements « si température > 25 °C » — mais **ne va pas chercher la
météo via cette factory**. La donnée doit venir d'ailleurs, ou ne jamais arriver.

---

## 3 — La route de synchronisation générique 🔴

`api/connectors/[id]/sync/route.ts` est le point d'entrée universel de synchronisation.
Elle ne connaît que **3 familles sur 13** :

```typescript
ReservationProviderFactory   // ligne 15
ReviewProviderFactory        // ligne 22
DeliveryProviderFactory      // ligne 30
```

**Conséquence :** un tenant qui active Pennylane, Brevo, Silae ou OpenWeatherMap depuis
l'écran Intégrations verra le connecteur passer en « actif » — et **aucune synchronisation
ne se produira jamais**. Le bouton « Synchroniser » ne sait pas quoi appeler.

C'est la même mécanique que les 142 réglages inertes : l'interface promet une action que
le back-end ne sait pas exécuter.

---

## 4 — Catalogue vs implémentation réelle 🟠

**40 connecteurs déclarés · 18 appariés à un provider par nom.**

Les 22 restants se répartissent en trois catégories très différentes :

### 4.1 — Implémentés ailleurs, hors de `connectors/` ✅

Ceux-là **existent réellement**, mais dans une autre arborescence — mon appariement
automatique ne pouvait pas les trouver :

| Catalogue | Implémentation réelle |
|---|---|
| `finance/gocardless` | `finance/tresorerie/banking/openBanking/GoCardlessProvider.ts` (310 l) |
| `intelligence/claude` · `openai` · `mistral` | `intelligence/ia/ai/AIProviderRouter.ts` — 6 providers |
| `compliance/iot-mqtt` | `connectors/iot/providers/MqttProvider.ts` |
| `human/merge-payroll` | `connectors/payroll/providers/MergeConnectorProvider.ts` |
| `ops/deliveroo` · `just-eat` | routes webhook `delivery/[provider]` + OAuth |
| `commerce/doctolib` | `commerce/acquisition/doctolib-sync/` (module dédié) |

> ⚠️ **Incohérence d'architecture :** les connecteurs bancaires et LLM vivent hors de
> `modules/*/connectors/`. Ils sont excellents (5 providers open banking, 6 providers LLM),
> mais un développeur qui cherche « où sont les connecteurs » ne les trouvera pas.

### 4.2 — Simple mention, pas d'implémentation 🟠

Présents dans des types, des prompts ou des données marketing, mais **aucun connecteur** :

| Catalogue | Ce qu'on trouve réellement |
|---|---|
| `commerce/tripadvisor` | `settings-schemas.ts` · `common.types.ts` — des types, pas un connecteur |
| `commerce/whatsapp-business` | routes CRM consent / anti-spam — pas un connecteur |
| `ops/booking-com` | `middleware.ts` · données marketing |
| `logistics/tecdoc` | prompt builder · `SectorStudy` |
| `intelligence/bofip` | `useConnector.ts` uniquement |
| `intelligence/dgfip-api` | routes inspection-mode / export FEC — pas une API tierce |

### 4.3 — Aucune trace 🔴

```
finance/quickbooks · finance/xero
commerce/shopify · commerce/google-shopping
ops/mews-pms · ops/treatwell · ops/fresha
```

**7 connecteurs affichés au catalogue avec zéro ligne de code.** Un tenant peut les voir,
cliquer, saisir des identifiants — et rien n'existe derrière.

---

## 5 — Les webhooks 🟠

**12 routes webhook**, réparties sur deux conventions concurrentes :

```
api/connectors/{delivery,iot,reservations}/webhook/[provider]/route.ts   ← convention A
api/webhooks/{delivery/[provider],docuseal,google-reserve,sms/inbound,stripe,thefork}/  ← convention B
api/{billing,finance/bank}/webhook/route.ts                              ← convention C
```

**Doublon confirmé :** `connectors/delivery/webhook/[provider]` **et**
`webhooks/delivery/[provider]` coexistent. Lequel un agrégateur doit-il appeler ?

**Point de sécurité — déjà signalé dans `AUDIT-23-AXES` :** ces routes figurent parmi les
39 sans garde détectée. Pour un webhook c'est normal *à condition* que chacun valide sa
signature. **À vérifier route par route.**

---

## 6 — Synthèse chiffrée

```
Catalogue déclaré                    40
├─ apparié à un provider             18
├─ implémenté hors connectors/        6   (gocardless, LLM ×3, mqtt, merge, deliveroo…)
├─ simple mention                     6   (tripadvisor, whatsapp, booking, tecdoc, bofip, dgfip)
└─ AUCUNE trace                       7   (quickbooks, xero, shopify, google-shopping,
                                            mews-pms, treatwell, fresha)

Factories                            13
├─ câblées                            5
└─ orphelines                         8   (11 providers inertes)

Route sync générique — familles        3 / 13
Webhooks                              12   (2 conventions + 1 doublon)
```

---

## 7 — Plan d'action

### 🔴 Lot 1 — Cesser de promettre ce qui n'existe pas *(0,5 session)*

Les 7 connecteurs sans aucune ligne de code doivent être **retirés du catalogue** ou
marqués `comingSoon: true`.

Un tenant qui saisit ses identifiants QuickBooks et attend une synchro qui n'arrivera
jamais, c'est pire qu'une absence de connecteur — et c'est une promesse commerciale
non tenue.

*Critère :* tout `id` du catalogue a soit du code, soit un marqueur explicite.

### 🔴 Lot 2 — Compléter la route de synchronisation *(1 session)*

Étendre `connectors/[id]/sync/route.ts` aux 10 familles manquantes, ou — mieux — inverser
la logique : que chaque factory **s'enregistre** dans un registre commun, pour que la route
n'ait plus à connaître les familles une par une.

```typescript
// au lieu d'un switch qui grandit à chaque connecteur
ConnectorRegistry.register('reservations', ReservationProviderFactory);
// la route fait simplement
const factory = ConnectorRegistry.resolve(manifest.category);
```

*Critère :* activer n'importe quel connecteur du catalogue et cliquer « Synchroniser »
appelle bien son provider.

### 🟠 Lot 3 — Brancher les 8 factories orphelines *(2 sessions)*

Par ordre de valeur métier :

| Ordre | Factory | Pourquoi | Consommateur cible |
|---|---|---|---|
| 1 | `AccountingProviderFactory` | Pennylane est le connecteur le plus demandé en restauration | export comptable |
| 2 | `SupplierProviderFactory` | commandes fournisseurs = usage quotidien | `AutoProcurementEngine` |
| 3 | `WeatherProviderFactory` | **`PredictiveProcurementEngine.ts:29` en a besoin** et ne l'utilise pas | prévision d'appro |
| 4 | `InvoiceProviderFactory` | rapprochement automatique des factures | OCR + `AccountingMatchingService` |
| 5 | `EmailMarketingProviderFactory` | campagnes CRM | marketing |
| 6 | `TimeclockProviderFactory` · `RecruitmentProviderFactory` | RH | pointage · recrutement |
| 7 | `PaymentProviderFactory` | ⚠️ Stripe est déjà branché ailleurs — vérifier la redondance avant |

### 🟠 Lot 4 — Unifier les webhooks *(0,5 session)*

Une seule convention. Supprimer le doublon `delivery`. Vérifier que chacun valide sa
signature (croise avec `AUDIT-23-AXES` axe 1).

### 🟡 Lot 5 — Rapatrier ou documenter les connecteurs hors arborescence *(0,5 session)*

Open banking (5 providers) et LLM (6 providers) sont excellents mais invisibles depuis
`modules/*/connectors/`. Soit les rapatrier, soit ajouter un `README.md` dans
`connectors/` qui pointe vers eux.

---

## 8 — Séquencement

```
Lot 1  0,5  Retirer/marquer les 7 fantômes    ← immédiat, aucune dépendance
Lot 2  1    Registre de connecteurs           ← débloque tous les autres
Lot 3  2    Brancher les 8 orphelines         ← dépend du Lot 2
Lot 4  0,5  Unifier les webhooks
Lot 5  0,5  Rapatrier ou documenter
```

**Total : 4,5 sessions.**

**Le Lot 1 est le plus urgent et le moins cher** — il ne code rien, il arrête de mentir.

---

## Ce que cet audit confirme

Troisième occurrence du même pattern en une journée :

| Système | Promesse | Réalité |
|---|---|---|
| Réglages | 150 déclarés | **8** lus par le code |
| Briques custom | 6 exportées | **1** rendue |
| **Connecteurs** | **40 au catalogue** | **3 familles synchronisables** |

Le projet ne souffre pas d'un défaut de conception — chacune de ces trois architectures est
bien pensée. Il souffre d'un **déficit systématique de dernier kilomètre** : la valeur ne se
matérialise qu'au branchement, et c'est toujours là que ça s'arrête.

---

*Mesuré le 2026-08-25 sur `main@42db98605`. Chaque chiffre est reproductible.*
