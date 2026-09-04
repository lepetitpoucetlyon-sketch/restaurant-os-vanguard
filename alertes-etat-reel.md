# Alertes & Notifications — État réel après le passage d'Antigravity

> **Mise à jour de [`alertes.md`](./alertes.md).** Entre la rédaction de ce plan et maintenant,
> Antigravity a livré l'implémentation intégrale de `flexibilité.md` (8 commits, `0762ac5c7` →
> `0d1e25b1a`, aujourd'hui 11h40–11h47), **dont** un étage de notifications : commit
> `c0e757c4e feat(ui): alertes de flexibilité temporelle`.
>
> Ce document répond à la question directe : **qu'est-ce qui est fait, qu'est-ce qui manque, et où
> le câblage se coupe.** Vérifié sur le HEAD courant (`0d1e25b1a`), pas sur le snapshot d'audit initial.

---

## 0. Verdict

Antigravity a construit **tout l'étage d'émission** — proprement, testé, en 5 langues. Il n'a **pas**
construit l'étage d'affichage/livraison. Le résultat est le même qu'avant, aggravé d'un cran :

> **Le système émet désormais 6 signaux de flexibilité de plus vers un centre de notifications qui
> reste structurellement vide.** La chaîne s'arrête à l'écriture Nexus ; rien ne relit, rien ne
> s'affiche, rien n'est réellement poussé.

C'est un cas d'école de **Loi 8** : la fonctionnalité est *écrite* (handler + composant + i18n +
tests verts), elle n'est pas *livrée* (rien n'est rendu à un utilisateur).

---

## 1. Ce qui est FAIT (réel, câblé, testé)

| Élément | Fichier | Preuve |
|---|---|---|
| Handler de 6 signaux de flexibilité | `FlexibilityNotificationHandler.ts` | 182 l., émet `notification.urgent` + `notification.created` |
| Enregistré au boot (client **et** serveur) | `registerHandlers/index.ts:45,72` | `...registerNotificationHandlers()` dans les deux fonctions |
| Les 6 signaux ont un émetteur métier réel | `StockDeductionHandler.ts` + 5 autres | `stock.negative_alert`, `stock.pending_recipe_deduction`, `stock.deductions_reconciled`, `finance.purchase_variance_detected`, `hr.shift_regularized`, `finance.period_closed_batch` → **1 émetteur chacun** |
| Composant bandeau | `FlexibilityAlertBanner.tsx` | 101 l., 4 types visuels, bouton d'action + fermeture |
| i18n 5 langues | `en/es/fr/ja/pt.ts` | +127 clés par locale |
| Tests | `flexibility-notifications.test.ts` | 6 tests, verts |

C'est du bon travail sur la moitié amont. **Il ne faut pas le refaire — il faut le brancher.**

---

## 2. Ce qui MANQUE (le câblage aval, inchangé)

La chaîne, telle qu'elle existe **aujourd'hui** :

```
 événement métier (ex. stock.negative_alert)          ✅ émis
        │
        ▼
 FlexibilityNotificationHandler                        ✅ enregistré, testé
        │
        ├──► emit('notification.urgent')  ──► NotificationUrgentDispatchHandler
        │         │                                   │
        │         │                                   ▼
        │         │                          browserPush.sendToRole('ADMIN'…)   ✂️ CASSÉ (§2.3)
        │         │                                   │
        │         │                          /api/push/internal  ✂️ requireTenantAdmin (§2.4)
        │         │                                   │
        │         │                          WebPushService.sendToRole
        │         │                          query role == 'ADMIN'  → 0 user → return silencieux
        │         │
        │         └── emit (pas emitDurable) → aucune durabilité de l'alerte sanitaire
        │
        └──► emitDurable('notification.created') ──► NotificationCreatedHandler   ✅
                                                          │
                                                          ▼
                                        Nexus.adapter.set('tenants/{id}/notifications/{id}')  ✅ écrit
                                                          │
                                                          ▼
                                        ✂️✂️ FIN DE CHAÎNE — AUCUN LECTEUR ✂️✂️
                                                          │
        ┌─────────────────────────────────────────────────┘
        ▼
 notificationsAtom = atom([])   ← AUCUN écrivain          ✂️ CASSÉ (§2.1)
        │
        ▼
 NotificationPanel / FlexibilityAlertBanner
   flexibilityAlerts = notifications.filter(...)  → toujours []  → bandeau jamais rendu
   onDismissAlert = removeNotification            → stub logger.debug (§2.2)
```

Cinq coupures, toutes vérifiées sur le HEAD courant.

### 2.1 `notificationsAtom` n'a toujours aucun écrivain — **la coupure principale**

```bash
grep -n "const notifications = atom" src/shared/nexus/state/SovereignGenome.ts
# → 11:const notifications = atom<AppNotification[]>([]);

grep -rn "notificationsAtom" src --include='*.ts' --include='*.tsx' | grep -v __tests__
# → 2 résultats : NotificationProvider (lecture) + sovereign.ts (ré-export). AUCUN writer.
```

`NotificationCreatedHandler` écrit dans `tenants/{id}/notifications/{id}`. **Rien ne relit cette
collection** pour hydrater l'atome :

```bash
grep -rn "/notifications" src --include='*.ts' --include='*.tsx' | grep -v __tests__ \
  | grep -iE "query|subscribe|onSnapshot|watch"
# → (vide)
```

Conséquence : `notifications` reste `[]` en permanence → la cloche affiche `0`, le panneau est vide,
et `flexibilityAlerts` (dérivé de `notifications`) est toujours vide → **`FlexibilityAlertBanner` ne
se rend jamais**, quel que soit le nombre de ruptures de stock.

### 2.2 Les 4 actions du panneau sont toujours des souches

```bash
grep -nE "markAsRead|markAllAsRead|removeNotification|clearAll" src/shared/providers/NotificationProvider.tsx
# 29: markAsRead:         (id) => logger.debug('Mark as read', id),
# 30: markAllAsRead:      ()   => logger.debug('Mark all read'),
# 31: removeNotification: (id) => logger.debug('Remove notification', id),
# 32: clearAll:           ()   => logger.debug('Clear all notifications')
```

Le bandeau branche sa fermeture sur `removeNotification` (`NotificationPanel.tsx:166`) — c'est-à-dire
sur un `logger.debug`. Fermer une alerte ne fait rien.

### 2.3 Ciblage de rôles non canonique — l'alerte n'atteint personne

Le nouveau handler cible en **majuscules** :

```ts
// FlexibilityNotificationHandler.ts:32
roles: ['ADMIN', 'MANAGER', 'CHEF_CUISINIER'],
```

`WebPushService.sendToRole` interroge `role == 'ADMIN'`. Les utilisateurs portent les rôles
**canoniques minuscules** (`admin`, `manager`, `chef_cuisinier`). La requête retourne 0 utilisateur,
un `warn`, et retourne. **Exactement le même défaut que l'alerte frigo (`kitchen_chef`)** décrit dans
`alertes.md` § 2.3 — le dispatcher n'appelle toujours pas `normalizeRbacRole`.

### 2.4 `/api/push/internal` toujours gardée `requireTenantAdmin`

Inchangé (`route.ts:27`). Le push ne part que si l'auteur de l'événement est admin/directeur/manager.
Une rupture de stock déclenchée par un `serveur` ou un `chef_cuisinier` → refus avalé.

### 2.5 Le push d'alerte n'est pas durable

`stock.negative_alert` → `emit('notification.urgent')` (`:29`), pas `emitDurable`. Si le handler de
dispatch échoue, l'alerte n'est ni rejouée ni mise en DLQ.

---

## 3. Ce qui n'a pas été abordé du tout

Tout l'étage « qualité d'alerte » de `alertes.md` reste absent. Aucun de ces mécanismes n'existe :

| Attendu (`alertes.md`) | État |
|---|---|
| Déduplication persistante (`alertKey` + compteur) | ❌ — `notif_..._${Date.now()}` : chaque occurrence crée une nouvelle notification |
| Sévérité → canal (INFO/ATTENTION/URGENT/CRITIQUE) | ❌ — `priority` posé mais ne route rien |
| Table de routage `AlertRouting` lue | ❌ — toujours 0 lecteur |
| Heures calmes / `doNotDisturb` lus | ❌ — toujours 0 lecteur |
| Escalade temporelle | ❌ |
| Accusé de réception / journal de livraison | ❌ |
| Résolution automatique (alerte s'éteint quand traité) | ❌ |
| Période de grâce à l'ouverture (profil A) | ❌ |
| Budget anti-fatigue | ❌ |

La dédup mérite un mot : les ids `notif_neg_stock_${itemId}_${Date.now()}` incluent l'horodatage,
donc **chaque émission crée une notification distincte**. Un article en rupture qui redéclenche
l'événement à chaque vente produirait N notifications — l'exact opposé de P5. (Sans effet visible
aujourd'hui puisque rien ne s'affiche, mais le défaut est en place dès qu'on branchera l'atome.)

---

## 4. Le correctif : le « dernier kilomètre »

Rien de ce qui manque ne nécessite de refaire le travail d'Antigravity. Il faut **fermer 5 coupures**.
C'est précisément le **Lot N0** de `alertes.md`, toujours entièrement à faire, ré-ordonné par impact :

| # | Correctif | Fichier | Effet |
|---|---|---|---|
| **1** | Hydrater `notificationsAtom` depuis `tenants/{id}/notifications` (abonnement Nexus au boot, scopé tenant, tri par `timestamp`) | `NotificationProvider.tsx` / nouveau hook `useNotificationSync` | La cloche et le bandeau **affichent enfin** ce qui est déjà écrit |
| **2** | Implémenter `markAsRead` / `markAllAsRead` / `removeNotification` / `clearAll` contre Nexus + atome | `NotificationProvider.tsx` | Les boutons agissent réellement |
| **3** | Normaliser les rôles dans le dispatch (`normalizeRbacRole`) ; corriger `['ADMIN'…]` → canoniques | `FlexibilityNotificationHandler.ts:32` + `NotificationUrgentDispatchHandler` | Le push atteint les bons destinataires |
| **4** | Déplacer le dispatch push côté serveur (consommer `notification.urgent` dans `ServerEventBus`) ; `/api/push/internal` interne | `route.ts` + serveur | Une alerte déclenchée par un serveur/chef atteint le manager |
| **5** | Dédup déterministe : id = `signal + subject` (sans `Date.now()`), `occurrences++` | `FlexibilityNotificationHandler.ts` + `NotificationCreatedHandler.ts` | Une alerte, une ligne |

**Correctifs 1 et 2 seuls** (≈ 1 journée) suffisent à rendre le système **visible** : c'est le
plus haut rapport valeur/effort des deux plans réunis. Le reste (sévérité→canal, routage, escalade,
heures calmes) reste le programme des lots N1→N4 de `alertes.md`.

---

## 5. Tests à ajouter (l'angle mort actuel)

Les 6 tests d'Antigravity vérifient l'**émission** (`capturedCreated`, `capturedUrgent`), jamais
l'**affichage**. Il manque exactement les tests de bout-en-bout qui auraient révélé la coupure :

| Test | Assertion |
|---|---|
| `notification-center-hydration.test.tsx` | Un `notification.created` émis → apparaît dans le panneau ; compteur exact |
| `notification-actions.test.tsx` | `markAsRead`/`clearAll` modifient l'état ; aucune souche `logger.debug` |
| `push-role-canonical.test.ts` | `sendToRole` reçoit un rôle canonique ; `['ADMIN']` est normalisé ou rejeté explicitement |
| `push-dispatch-server-side.test.ts` | Un `serveur` déclenche `stock.negative_alert` → le manager reçoit la livraison |
| `notification-dedup.test.ts` | Deux `stock.negative_alert` sur le même article → 1 notification, `occurrences === 2` |

---

## 6. Mesure permanente qui aurait attrapé ça

À ajouter à `scripts/measure/measures.mjs` — elle transforme « atome sans écrivain » en dette visible :

| Mesure | Définition | Cible |
|---|---|---|
| `m-atom-without-writer` | Atomes d'état exportés lus par un provider mais jamais écrits (hors `atomWith*Storage`) | 0 |
| `m-collection-write-no-read` | Collections Nexus écrites par un handler et jamais lues (query/subscribe/get) | 0 |

`m-collection-write-no-read` aurait signalé `tenants/{id}/notifications` : écrit par
`NotificationCreatedHandler`, relu par personne. C'est la mesure qui rend structurellement impossible
de « livrer » un centre de notifications vide.

---

*Vérifié le 2026-09-03 sur HEAD `0d1e25b1a`. Les 8 commits de flexibilité d'Antigravity
(`0762ac5c7`→`0d1e25b1a`) sont postérieurs au snapshot d'audit initial de `flexibilité.md` et
`alertes.md` : ces deux plans décrivent la cible ; ce document décrit l'écart restant.*
