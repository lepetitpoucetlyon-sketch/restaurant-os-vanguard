# Alertes & Notifications — Audit & Plan d'ingénierie

> **Document complémentaire de [`flexibilité.md`](./flexibilité.md).**
> Ce plan-là installe la capacité du système à **encaisser le retard** ; celui-ci installe sa
> capacité à **le signaler à la bonne personne, au bon moment, sur le bon canal, une seule fois.**
> Les deux se rejoignent au § 6 : sans système d'alerte, le Centre de régularisation reste un écran
> que personne n'ouvre.
>
> **Date** — 2026-09-03 · **Session** — `claude-audit-plan-flexibilite` (lot 2)
> **Portée** — bus de notifications, canaux (push / e-mail / SMS / webhook ops / in-app), routage,
> ciblage par rôle, déduplication, escalade, heures calmes, digests, accusés de réception, UI.

---

## 0. Réponse directe à la question posée

**Non — `flexibilité.md` ne contient pas de système d'alerte.** Il contient sept points de contact
épars, tous supposant qu'un tel système existe :

| Où | Ce qui est supposé | Ce qui existe réellement |
|---|---|---|
| § 9.2 `PendingRegularizationBadge` | un compteur permanent, trois tonalités | un badge lisant un atome **jamais alimenté** |
| § 10.1 `NotificationThresholdHandler` | un handler de seuil | **n'existe pas** |
| § 10.1 `NotificationUrgentDispatchHandler` | consommateur de `hr.timeclock_gap_detected` | existe, mais dispatche vers une route qui **refuse 8 rôles sur 11** |
| § 11.2 « Seuil d'alerte Z manquant : 2 journées » | une politique de seuils | aucune notion de seuil nulle part |
| § 9.9 `OfflineBurstMonitor` | un `Toast` persistant | les toasts durent **3 secondes**, en dur |
| § 16.3 Q6 « Alerte à J+7 » | une escalade temporelle | aucun mécanisme d'escalade côté tenant |
| § 8.1 `notification.urgent` | un canal fiable | fonctionne **si et seulement si** l'auteur de l'événement est admin/directeur/manager |

Ce document est ce plan séparé. Il s'intègre au précédent : ses lots N0→N4 s'insèrent dans la
séquence des lots 0→7 de `flexibilité.md` (§ 12.3).

### Le verdict en une phrase

**Le système émet 80 notifications et en affiche zéro.**

```bash
# 80 appels d'émission
grep -rnE "emitDurable\('notification\.|emit\('notification\." src --include='*.ts' --include='*.tsx' | grep -v __tests__ | wc -l
# → 80

# l'atome qui alimente le centre de notifications
grep -n "const notifications = atom" src/shared/nexus/state/SovereignGenome.ts
# → 11:const notifications = atom<AppNotification[]>([]);

# qui écrit dedans ?
grep -rn "notificationsAtom" src --include='*.ts' --include='*.tsx' | grep -v __tests__
# → 4 résultats, TOUS des lectures ou des ré-exports. Aucun writer.
```

`NotificationCreatedHandler` persiste consciencieusement chaque notification dans
`tenants/{id}/notifications/{id}`. **Aucun code ne relit jamais cette collection.**
`NotificationPanel` lit `notificationsAtom`, qui est un `atom([])` sans écrivain.
La cloche affiche donc `0` en permanence, et le panneau est vide, quel que soit l'état du restaurant.

Les quatre actions du panneau sont des souches :

```tsx
// src/shared/providers/NotificationProvider.tsx:29-32
markAsRead:         (id) => logger.debug('Mark as read', id),
markAllAsRead:      ()   => logger.debug('Mark all read'),
removeNotification: (id) => logger.debug('Remove notification', id),
clearAll:           ()   => logger.debug('Clear all notifications')
```

Et `addNotification` n'ajoute pas de notification — il déclenche un **toast de 3 secondes** :

```tsx
// src/shared/providers/NotificationProvider.tsx:22-28
addNotification: (n) => addToast({ ...n, duration: 3000 })
```

---

## 1. Méthode et preuves

Même règle que `flexibilité.md` : Loi 7, chaque chiffre mesuré dans la session avec sa commande.

| Mesure | Valeur | Commande |
|---|---|---|
| Appels d'émission `notification.*` | **80** | `grep -rnE "emitDurable\('notification\.\|emit\('notification\." src --include='*.ts' --include='*.tsx' \| grep -v __tests__ \| wc -l` |
| Fichiers émettant `notification.created` | **33** | `grep -rl "notification.created" src --include='*.ts' \| grep -v __tests__ \| wc -l` |
| Fichiers émettant `notification.urgent` | **38** | `grep -rl "notification.urgent" src --include='*.ts' \| grep -v __tests__ \| wc -l` |
| Fichiers appelant un canal **directement** (hors bus) | **28** | `grep -rlE "browserPush\|NotificationGateway\|OpsAlertGateway" src --include='*.ts' --include='*.tsx' \| grep -v __tests__ \| wc -l` |
| Tableaux `roles: [...]` codés en dur | **84** | `grep -rhoE "roles: \[[^]]*\]" src --include='*.ts' --include='*.tsx' \| grep -v __tests__ \| wc -l` |
| Combinaisons de rôles distinctes | **38** | idem `\| sort -u \| wc -l` |
| Écrivains de `notificationsAtom` | **0** | § 0 |
| Lecteurs de `doNotDisturb` / `globalSound` | **0** | `grep -rnE "doNotDisturb\|globalSound" src --include='*.ts' --include='*.tsx' \| grep -vE "settings-schemas\|defaults\|contracts"` → vide |
| Consommateurs de `AlertRouting` | **0** | `grep -rn "AlertRouting" src \| grep -v "settings/notifications.ts"` → 3 résultats, tous des déclarations de type |

> **Angle mort de mesure.** `npm run measure` annonce « Réglages déclarés non lus : 0 ».
> `doNotDisturb`, `dndStartTime`, `dndEndTime` et `globalSound` sont pourtant déclarés dans
> `settings-schemas.ts`, exposés comme interrupteurs dans l'écran Réglages, **et lus par personne**.
> La sonde les considère comme lus parce que leur clé apparaît dans `defaults.ts`. Correctif de
> mesure proposé au § 13 (`m-settings-read-at-runtime`) : ne compter comme lecture qu'un accès
> **hors fichier de déclaration et hors fichier de valeurs par défaut**.

---

## 2. Cartographie critique de l'existant

### 2.1 Quatre systèmes de notification parallèles, aucun complet

| # | Chemin | Support | Persistance | Affiché ? | Écrivains | Lecteurs |
|---|---|---|---|---|---|---|
| **A** | `notification.created` → `NotificationCreatedHandler` | Nexus `tenants/{id}/notifications` | oui | **non** | 33 fichiers | **0** |
| **B** | `notification.urgent` → `NotificationUrgentDispatchHandler` → `browserPush` → `/api/push/internal` → `WebPushService` | WebPush navigateur | non | notification OS | 38 fichiers | — |
| **C** | `AlertSync.tsx` → `addNotification()` → `addToastAtom` | mémoire | non | toast **3 s** | 1 composant | — |
| **D** | Appels directs `NotificationGateway` (e-mail/SMS) / `OpsAlertGateway` (Slack/Discord) | externe | file de repli | non | 28 fichiers | — |

Aucun des quatre ne parle aux autres. Un même incident (rupture de stock) emprunte A **et** C avec
des libellés différents, et n'apparaît nulle part durablement.

### 2.2 Le chemin B ne fonctionne que pour trois rôles sur onze

`NotificationUrgentDispatchHandler` tourne **dans le navigateur de l'utilisateur qui a déclenché
l'événement**. Il appelle `browserPush.sendToRole(...)`, qui fait un `fetch('/api/push/internal')`
avec le **cookie de session de cet utilisateur**. Or la route est gardée par :

```ts
// src/app/api/push/internal/route.ts:27
const caller = await requireTenantAdmin(req);
```

et `requireTenantAdmin` n'accepte que `TENANT_ADMIN_ROLES`, soit les rôles de niveau ≥ 70 :
**`admin` (100), `directeur` (90), `manager` (70)**.

Conséquence, dérivée de la structure du code :

> Un `serveur` (40) qui encaisse et déclenche une rupture de stock, un `chef_cuisinier` (45) qui
> valide une réception, un `barman` (35) qui décrète un 86 : leur appel reçoit un refus, et
> `browserPush` l'avale silencieusement (`catch { /* Push non-critique */ }`).
> **L'alerte n'atteint le manager que si le manager l'a lui-même provoquée.**

C'est le défaut le plus coûteux du lot : le canal existe, il est testé (`webPushService.test.ts`),
les clés VAPID sont gérées — et il est inopérant dans 8 cas sur 11.

### 2.3 Le ciblage des destinataires est codé en dur, 84 fois

84 tableaux `roles: [...]`, 38 combinaisons distinctes. Extrait des plus fréquentes :

```
17× roles: ["admin", "directeur"]
 9× roles: ["admin", "directeur", "chef_cuisinier"]
 6× roles: ['manager', 'directeur', 'admin']       ← même intention que ↓
 6× roles: ["admin", "directeur", "manager"]       ← ordre différent, guillemets différents
 2× roles: []                                       ← notification adressée à PERSONNE
 1× roles: ['manager', 'kitchen_chef']              ← 'kitchen_chef' n'est pas un rôle canonique
```

Trois problèmes distincts :

1. **Deux émissions vers `roles: []`** — envoyées à personne, sans erreur ni avertissement.
2. **Des rôles non canoniques** : `kitchen_chef` (l'alias legacy de `chef_cuisinier`), et des
   variantes en majuscules (`ADMIN`, `MANAGER`, `STAFF`, `CHEF_CUISINIER`). `normalizeRbacRole`
   existe dans `src/kernel/contracts/rbac.ts` — **le dispatcher ne l'appelle pas**.
3. **Aucune table de routage.** Le contrat `AlertRouting` (`eventType`, `recipients`, `channels`,
   `enabled`) existe, est référencé dans `settings.ts` comme `alerts: AlertRouting[]` et
   `notificationRoutings?: AlertRouting[]` — et **n'est lu nulle part**. La configuration promise au
   restaurateur (« qui reçoit quoi, sur quel canal ») est déclarée et morte.

#### Le cas démonstratif : l'alerte frigo n'atteint pas le chef

`WebPushService.sendToRole` filtre les utilisateurs par **égalité stricte** sur le champ `role` :

```ts
// src/lib/push/webPushService.ts:91-97
const users = await Nexus.adapter.query(`tenants/${tenantId}/users`,
  { where: [{ field: 'role', operator: '==', value: role }] });
if (!users.length) {
  logger.warn(`[WebPushService] No users found with role "${role}" in tenant ${tenantId}`);
  return;   // ← sortie silencieuse
}
```

Or `FridgeTempAlertHandler` cible :

```ts
// src/shared/eventBus/handlers/FridgeTempAlertHandler.ts:58
roles: ['admin', 'manager', 'kitchen_chef'],
```

`kitchen_chef` est l'**alias legacy** de `chef_cuisinier` : il figure dans `LEGACY_ROLE_ALIASES`,
pas dans `RBAC_ROLES`. Aucun utilisateur ne porte cette valeur. La requête retourne zéro résultat,
un `logger.warn` est écrit, et la fonction retourne.

> **Conséquence : sur une alerte de rupture de chaîne du froid — le signal le plus critique du
> système au regard du HACCP — le chef de cuisine n'est jamais prévenu.**
> Seuls `admin` et `manager` le sont, et uniquement si l'auteur de l'événement est lui-même
> admin/directeur/manager (N3).

Le handler utilise par ailleurs `emit` et non `emitDurable` (`:54`) : l'alerte sanitaire n'a
aucune garantie de rejeu si le handler échoue.

Ce cas unique concentre quatre des défauts listés : N3 (garde de la route), N6 (rôle non canonique),
N10 (aucun accusé), et l'absence de durabilité. Il justifie à lui seul le lot N0.

### 2.4 Les réglages de confort sont des interrupteurs débranchés

`NotificationsConfig` déclare `globalSound`, `doNotDisturb`, `dndStartTime`, `dndEndTime`.
Valeurs par défaut définies, interrupteur « Mode Silencieux » présent dans l'écran Réglages,
**zéro lecteur au moment de l'envoi**. Un restaurateur qui active le mode silencieux continue de
recevoir des push à 2 h du matin.

### 2.5 Aucune notion de sévérité côté tenant

`notification.urgent` porte `priority?: 'CRITICAL' | 'HIGH'` — deux valeurs, non utilisées pour
router quoi que ce soit : le handler dispatche identiquement dans les deux cas. Résultat mesurable :

```ts
// DailyDigestHandler.ts — un rapport quotidien de routine, en CRITICAL, par WebPush
await NexusEventBus.emitDurable('notification.urgent', {
  message: `Rapport quotidien d'exploitation du ${date} généré et disponible.`,
  roles: ['directeur', 'admin'], priority: 'HIGH',
});
```

Le même canal, le même traitement et la même urgence perçue servent à « votre rapport est prêt » et
à « la chambre froide est à +8 °C ». C'est la définition de la fatigue d'alerte.

`GlobalAlertEscalationMatrixService` implémente bien une échelle P1→P4 — mais côté **flotte MCC**
uniquement (`fleet.alert_escalated`). Rien d'équivalent côté tenant.

### 2.6 Aucune déduplication, aucun accusé de réception, aucune escalade

- **Déduplication** : le seul mécanisme est le `useRef<Set<string>>` d'`AlertSync`, en mémoire, vidé
  à chaque démontage du composant. Une navigation suffit à re-notifier les mêmes ruptures de stock.
- **Accusé de réception** : aucune trace de livraison. On ne sait pas si un push est parti, arrivé,
  ni s'il a été vu. `WebPushService.sendToUser` journalise et retourne `void`.
- **Escalade** : rien. Une alerte critique non traitée reste non traitée, silencieusement.
- **Réémission** : `emitDurable` déduplique sur `eventId`, donc une alerte récurrente légitime
  (« stock toujours à zéro le lendemain ») portant le même identifiant métier est **supprimée**,
  tandis qu'une alerte identique portant un `eventId` aléatoire est **répétée à l'infini**.
  Les deux comportements sont faux et cohabitent.

### 2.7 Synthèse — défauts

| Id | Défaut | Gravité | Fichier |
|---|---|---|---|
| **N1** | `notificationsAtom` sans écrivain → centre de notifications structurellement vide | **Critique** | `SovereignGenome.ts:11` |
| **N2** | `tenants/{id}/notifications` écrit, jamais relu | **Critique** | `NotificationCreatedHandler.ts` |
| **N3** | `/api/push/internal` gardée `requireTenantAdmin` → push inopérant pour 8 rôles sur 11 | **Critique** | `route.ts:27` |
| **N4** | `markAsRead` / `markAllAsRead` / `removeNotification` / `clearAll` : souches `logger.debug` | **Critique** | `NotificationProvider.tsx:29-32` |
| **N5** | `addNotification` déclenche un toast de 3 s au lieu de créer une notification | **Haute** | `NotificationProvider.tsx:28` |
| **N6** | 84 ciblages de rôles en dur, 38 combinaisons, dont 2 vides et des alias non canoniques (`kitchen_chef`) que `sendToRole` ne résout pas → **l'alerte frigo n'atteint pas le chef** | **Critique** | `FridgeTempAlertHandler.ts:58`, `webPushService.ts:96` |
| **N7** | `AlertRouting` déclaré, jamais lu — pas de table de routage | **Haute** | `settings/notifications.ts:3` |
| **N8** | `doNotDisturb` / `dndStartTime` / `dndEndTime` / `globalSound` : 0 lecteur | **Haute** | `settings/notifications.ts:10` |
| **N9** | Aucune déduplication persistante des alertes | **Haute** | `AlertSync.tsx:19` |
| **N10** | Aucun accusé de livraison ni de lecture | **Haute** | `webPushService.ts` |
| **N11** | Aucune escalade côté tenant | **Haute** | — |
| **N12** | Sévérité inutilisée : digest de routine et panne frigo sur le même canal | Moyenne | `DailyDigestHandler.ts:28` |
| **N13** | 28 fichiers appellent un canal directement, hors bus — non traçable, non routable | Moyenne | 28 fichiers |
| **N14** | Quatre systèmes parallèles sans passerelle | Moyenne | § 2.1 |
| **N15** | `NotificationGateway` en mode dégradé écrit dans `crm/pendingNotifications` — file **jamais drainée** | Moyenne | `NotificationGateway.ts:56` |
| **N16** | `notification.created` sans `occurredAt` ni identifiant de source métier | Moyenne | `system.events.ts:168` |

---

## 3. Doctrine cible — sept principes

### P1 — Un signal, pas une notification

Un handler métier **n'envoie jamais** de notification. Il **émet un signal** décrivant un fait :
`{ signal, severity, subject, occurredAt, context }`. C'est le moteur d'alerte, et lui seul, qui
décide **si**, **à qui**, **par quel canal**, **quand** et **combien de fois**.

C'est le renversement central. Aujourd'hui 28 fichiers appellent un canal directement et 84
décident eux-mêmes de leurs destinataires : la politique d'alerte est diluée dans le code métier,
donc ni configurable, ni testable, ni observable.

### P2 — Toute alerte est persistée avant d'être transmise

L'ordre est : **écrire, puis envoyer**. Une alerte existe dans `alerts/` avant qu'un canal soit
sollicité. Un push perdu, un e-mail refusé, un téléphone éteint ne font pas disparaître l'alerte —
elle reste dans le centre, non lue. C'est ce qui manque aujourd'hui (chemins B, C et D : aucune
persistance).

### P3 — La sévérité détermine le canal, pas l'émetteur

Quatre niveaux, une correspondance stricte, **une seule règle à retenir** :

| Sévérité | Sens | Canal | Interrompt-il ? |
|---|---|---|---|
| `INFO` | à savoir | centre in-app uniquement | non |
| `ATTENTION` | à traiter dans la journée | centre + digest quotidien | non |
| `URGENT` | à traiter maintenant | centre + push + bandeau in-app | oui, mais respecte les heures calmes |
| `CRITIQUE` | sécurité sanitaire, fiscale ou légale | centre + push + SMS + webhook ops | oui, **ignore les heures calmes** |

Le rapport quotidien devient `INFO`. La chambre froide à +8 °C devient `CRITIQUE`. Aujourd'hui les
deux passent par `notification.urgent`.

### P4 — Le destinataire est une responsabilité, pas un rôle codé en dur

On ne cible pas `['admin', 'directeur', 'manager']`. On cible une **responsabilité** :
`RESP_STOCK`, `RESP_FISCAL`, `RESP_RH`, `RESP_HYGIENE`, `RESP_SERVICE`, `RESP_TECHNIQUE`.
La table `AlertRouting` — **enfin lue** — associe chaque responsabilité à des rôles et à des
personnes nommées, par tenant, et la verticale peut la surcharger (le `RESP_HYGIENE` d'un salon de
coiffure n'est pas celui d'un restaurant).

Cela résout d'un coup les 38 combinaisons divergentes, les deux `roles: []`, et les alias non
canoniques.

### P5 — Une alerte, une fois

Clé de déduplication déterministe `alertKey = signal + subject + fenêtre`. Deux occurrences dans la
même fenêtre incrémentent un compteur sur **la même** alerte au lieu d'en créer une seconde.
Une alerte non lue et toujours vraie **ne se répète pas** : elle vieillit et escalade.

### P6 — Une alerte non traitée escalade, elle ne s'évapore pas

Trois échelons, configurables par sévérité : destinataire direct → responsable → direction.
Sans accusé de lecture ni résolution dans le délai imparti, l'échelon suivant est notifié —
et l'alerte le mentionne explicitement (« non traitée depuis 45 min, escaladée »).

### P7 — Le silence est un réglage, pas un accident

Heures calmes (`quietHours`), mode silencieux, préférences par canal et par personne : lus **au
moment de l'envoi**, jamais contournés — sauf par `CRITIQUE`, qui les ignore par conception et le
signale dans le message.

---

## 4. Architecture cible

### 4.1 Le pipeline, en un schéma

```
  handler métier
       │  AlertBus.raise({ signal, severity, subject, occurredAt, context })
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. NORMALISER   AlertSignalRegistry — le signal existe-t-il ?        │
│                 sévérité par défaut, libellé i18n, action associée   │
├─────────────────────────────────────────────────────────────────────┤
│ 2. DÉDUPLIQUER  AlertDeduplicator — alertKey + fenêtre               │
│                 existe déjà & non lue → occurrences++ , STOP         │
├─────────────────────────────────────────────────────────────────────┤
│ 3. PERSISTER    alerts/{alertId}  ← AVANT tout envoi (P2)            │
├─────────────────────────────────────────────────────────────────────┤
│ 4. ROUTER       AlertRouter — responsabilité → rôles → utilisateurs  │
│                 lit AlertRouting du tenant, surcharge verticale      │
├─────────────────────────────────────────────────────────────────────┤
│ 5. FILTRER      QuietHoursPolicy + préférences par personne          │
│                 CRITIQUE traverse tout, le reste est différé         │
├─────────────────────────────────────────────────────────────────────┤
│ 6. LIVRER       ChannelDispatcher — in-app · push · e-mail · SMS ·   │
│                 webhook ops.  Chaque tentative → deliveryLedger      │
├─────────────────────────────────────────────────────────────────────┤
│ 7. SUIVRE       EscalationLadder (cron) — non lue après N min ?      │
│                 échelon suivant. Résolue ? clôture + trace.          │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 `AlertBus` — la seule porte d'entrée

`src/kernel/alerts/AlertBus.ts`

```ts
export type AlertSeverity = 'INFO' | 'ATTENTION' | 'URGENT' | 'CRITIQUE';

export interface AlertInput {
  signal: AlertSignal;            // clé du catalogue (§ 5) — jamais une chaîne libre
  subject: { type: string; id: string; label: string };  // ex. { type:'stockItem', id:'sku_42', label:'Cèpes séchés' }
  occurredAt: string;             // BusinessClock — cf. flexibilité.md § 5.1
  severityOverride?: AlertSeverity;   // rare, motivé
  context?: Record<string, unknown>;  // chiffres affichés dans l'alerte
  actionHref?: string;            // où aller pour traiter
  tenantId: string;
}

export const AlertBus = {
  raise(input: AlertInput): Promise<{ alertId: string; status: 'created' | 'deduplicated' | 'suppressed' }>,
  acknowledge(alertId: string, userId: string): Promise<void>,   // « j'ai vu »
  resolve(alertId: string, userId: string, note?: string): Promise<void>,  // « c'est traité »
  snooze(alertId: string, userId: string, untilIso: string): Promise<void>,
};
```

**Règle d'architecture** : aucun module métier n'importe `browserPush`, `NotificationGateway` ou
`OpsAlertGateway`. Ces trois modules deviennent **internes au `ChannelDispatcher`**, protégés par
une règle ESLint / `sentrux` (§ 13). Les 28 appels directs actuels sont migrés.

### 4.3 Modèle de données

```ts
// tenants/{id}/alerts/{alertId}
interface Alert {
  id: string;                       // = alertKey (déterministe)
  signal: AlertSignal;
  severity: AlertSeverity;
  subject: { type: string; id: string; label: string };
  titleKey: string; bodyKey: string; params: Record<string, unknown>;   // i18n : jamais de texte figé
  actionHref?: string;
  occurredAt: string; businessDay: string; firstSeenAt: string; lastSeenAt: string;
  occurrences: number;              // P5 — incrémenté, jamais dupliqué
  status: 'open' | 'acknowledged' | 'snoozed' | 'resolved' | 'expired';
  acknowledgedBy?: string; acknowledgedAt?: string;
  resolvedBy?: string; resolvedAt?: string; resolutionNote?: string;
  snoozedUntil?: string;
  escalationLevel: 0 | 1 | 2;
  escalatedAt?: string;
  recipients: { userId: string; role: string; responsibility: string }[];
  tenantId: string;
}

// tenants/{id}/alertDeliveries/{deliveryId}   ← append-only (N10)
interface AlertDelivery {
  id: string; alertId: string; userId: string;
  channel: 'inapp' | 'push' | 'email' | 'sms' | 'ops_webhook';
  attemptedAt: string;
  outcome: 'sent' | 'failed' | 'skipped_quiet_hours' | 'skipped_preference' | 'no_subscription';
  error?: string;
  seenAt?: string;                  // accusé de lecture, quand le canal le permet
}
```

`alerts` rejoint `SIGNED_WRITE_COLLECTIONS` ; `alertDeliveries` rejoint `IMMUTABLE_COLLECTIONS`
(c'est la preuve « le système a bien prévenu », opposable en cas de litige sanitaire ou prud'homal).

### 4.4 `AlertRouter` — la table de routage enfin lue

On **conserve** le contrat `AlertRouting` existant en l'étendant (pas de rupture) :

```ts
export type Responsibility =
  | 'RESP_SERVICE' | 'RESP_STOCK' | 'RESP_HYGIENE' | 'RESP_FISCAL'
  | 'RESP_RH' | 'RESP_TECHNIQUE' | 'RESP_DIRECTION';

export interface AlertRouting {
  eventType: string;                    // ← conservé (compat)
  responsibility: Responsibility;       // ← ajouté
  recipients: string[];                 // userIds nommés (prioritaires)
  roles: RbacRole[];                    // ← ajouté : repli si aucun destinataire nommé
  channels: NotificationChannel[];      // ← conservé
  enabled: boolean;                     // ← conservé
  escalateAfterMinutes?: number;        // ← ajouté
  escalateTo?: Responsibility;          // ← ajouté
}
```

Résolution, dans cet ordre :

1. destinataires **nommés** pour cette responsabilité ;
2. sinon, tous les utilisateurs portant l'un des `roles` (normalisés par `normalizeRbacRole` — N6) ;
3. sinon, repli sur `RESP_DIRECTION` **et** création d'une alerte de configuration
   (`alert.routing_missing`) pour que le trou soit visible plutôt que silencieux.

L'étape 3 est ce qui remplace les deux `roles: []` actuels : une alerte adressée à personne devient
une alerte de configuration adressée à la direction.

**Défauts par verticale.** `DEFAULT_ALERT_ROUTING` est fourni par le blueprint de verticale
(`src/verticals/`), comme `RbacDeriver` fournit déjà les rôles : `RESP_HYGIENE` = `chef_cuisinier`
en restaurant, `praticien` en clinique, `manager` en coworking.

### 4.5 `QuietHoursPolicy` — brancher les interrupteurs morts

```ts
QuietHoursPolicy.evaluate({
  severity, tenantConfig: { doNotDisturb, dndStartTime, dndEndTime, globalSound },
  userPrefs, now, timezone,   // fuseau du tenant — cf. flexibilité.md § 5.1
}): 'DELIVER' | 'DEFER_TO_DIGEST' | 'DEFER_UNTIL' | 'SUPPRESS'
```

- `CRITIQUE` → toujours `DELIVER`, et le message porte la mention « envoyé malgré le mode silencieux ».
- `URGENT` en heures calmes → `DEFER_UNTIL` la fin des heures calmes (l'alerte reste `open` et
  visible dans le centre pendant ce temps).
- `ATTENTION` → `DEFER_TO_DIGEST`.
- `INFO` → jamais de push, quoi qu'il arrive.

C'est le point de câblage de **N8** : `doNotDisturb`, `dndStartTime`, `dndEndTime` et `globalSound`
acquièrent enfin un lecteur.

### 4.6 `EscalationLadder` — l'alerte qui ne s'évapore pas

Job cron (`AlertEscalationJob`, enregistré dans `CronScheduler` — cf. `flexibilité.md` § 6.6) :

```
toutes les 5 min :
  pour chaque alerte status='open' && severity in (URGENT, CRITIQUE) :
    âge = now − firstSeenAt
    si âge > escalateAfterMinutes(severity) && escalationLevel < 2 :
       escalationLevel++
       destinataires = router.resolve(escalateTo ?? RESP_DIRECTION)
       livrer, en préfixant « Non traitée depuis {âge} — escaladée »
       tracer dans alertDeliveries
```

Délais par défaut : `CRITIQUE` → 15 min puis 30 min ; `URGENT` → 60 min puis 180 min.
Réglables par tenant, **bornés** (jamais > 24 h) pour éviter de désarmer l'escalade en la
repoussant à l'infini.

### 4.7 `DigestBuilder` — le canal qui absorbe le bruit

Un digest quotidien (heure paramétrable, par défaut 09h00 heure du tenant) regroupe tout ce qui est
`INFO` + `ATTENTION` + les `URGENT` résolus depuis la veille, **par responsabilité**, en un seul
envoi par personne. C'est ce qui permet de baisser la sévérité de la majorité des 80 émissions
actuelles sans rien perdre.

`DailyDigestHandler` existe déjà et persiste un `dailyDigests/{date}` — il devient le consommateur
de `DigestBuilder` au lieu d'émettre un `notification.urgent` (N12).

### 4.8 Réunification des quatre systèmes

| Système actuel | Devenir |
|---|---|
| **A** `notification.created` → Nexus | Conservé comme **socle de persistance**, renommé `alerts`, et **enfin lu** par le centre |
| **B** `notification.urgent` → WebPush | Devient un **canal** du `ChannelDispatcher`, plus un point d'entrée |
| **C** `AlertSync` (toasts 3 s) | **Supprimé.** Ses deux sources (stock bas, HACCP critique) émettent des signaux au lieu de fabriquer des toasts |
| **D** appels directs (28 fichiers) | Migrés vers `AlertBus.raise` ; les gateways deviennent internes au dispatcher |

Les toasts ne disparaissent pas : ils restent le **retour d'action immédiat** (« Fiche enregistrée »),
ce pour quoi ils sont faits. Ils cessent d'être un canal d'alerte.

---

## 5. Catalogue des signaux

Le catalogue est la contrepartie du § 7 de `flexibilité.md` : chaque anomalie y trouve son signal.
`AlertSignalRegistry` le déclare une fois, typé, avec sa sévérité, sa responsabilité et sa clé i18n.

### 5.1 Signaux issus du plan de flexibilité

| Signal | Sévérité | Responsabilité | Déclencheur | Fenêtre de dédup | Escalade |
|---|---|---|---|---|---|
| `flex.suspense_threshold_reached` | ATTENTION | RESP_STOCK | > 20 suspens ouverts, ou un suspens > 7 j | 24 h | — |
| `flex.suspense_aging_critical` | URGENT | RESP_DIRECTION | un suspens > 30 j | 7 j | 180 min |
| `flex.z_missing` | URGENT | RESP_FISCAL | journée de service sans clôture Z depuis > 2 j | par journée | 60 min |
| `flex.z_missing_critical` | CRITIQUE | RESP_DIRECTION | > 7 journées sans Z | 24 h | 15 min |
| `flex.offline_seal_pending` | CRITIQUE | RESP_FISCAL | tickets `PENDING_OFFLINE_SEAL` > 24 h | par appareil | 15 min |
| `flex.offline_device_silent` | URGENT | RESP_TECHNIQUE | appareil hors-ligne > 7 j avec file non vide | par appareil | 180 min |
| `flex.burst_completed` | INFO | RESP_DIRECTION | fin de rejeu massif | par session | — |
| `flex.burst_failed` | URGENT | RESP_TECHNIQUE | disjoncteur déclenché | par session | 60 min |
| `flex.dlq_quarantine` | URGENT | RESP_TECHNIQUE | event en quarantaine | par `eventName+handlerId` | 60 min |
| `flex.dlq_quarantine_fiscal` | CRITIQUE | RESP_FISCAL | quarantaine sur un event de `FISCAL_CRITICAL_EVENTS` | idem | 15 min |
| `flex.period_lock_blocked` | ATTENTION | RESP_FISCAL | écriture refusée sur période verrouillée | 24 h | — |
| `flex.timeclock_gaps` | ATTENTION | RESP_RH | pointages incomplets détectés à la clôture Z | par journée | — |
| `flex.timeclock_gaps_payroll` | URGENT | RESP_RH | pointages incomplets à J−3 de la clôture de paie | 24 h | 180 min |
| `flex.invoice_awaiting` | ATTENTION | RESP_STOCK | réception sans facture > 30 j | 7 j | — |
| `flex.cost_variance` | ATTENTION | RESP_DIRECTION | écart de coût confirmé > seuil | par facture | — |
| `flex.backfill_applied` | INFO | RESP_DIRECTION | rattrapage appliqué | par plan | — |
| `flex.negative_stock_after_backfill` | ATTENTION | RESP_STOCK | stock négatif produit par un rattrapage | par article | — |

### 5.2 Signaux d'exploitation courante (reprise de l'existant)

| Signal | Sévérité | Responsabilité | Remplace |
|---|---|---|---|
| `stock.low` | ATTENTION | RESP_STOCK | `AlertSync` + `StockAlertHandler` |
| `stock.zero` | URGENT | RESP_STOCK | `StockZeroBlockerHandler` |
| `haccp.temperature_breach` | **CRITIQUE** | RESP_HYGIENE | `FridgeTempAlertHandler` |
| `haccp.nonconformity` | URGENT | RESP_HYGIENE | `HaccpCorrectiveActionHandler` |
| `compliance.recall` | **CRITIQUE** | RESP_HYGIENE | `RecallPOSBlockerHandler` |
| `finance.cash_discrepancy` | URGENT | RESP_FISCAL | `CashCountReconciliationHandler` |
| `finance.tax_mismatch` | URGENT | RESP_FISCAL | `TaxMismatchAlertHandler` |
| `hr.overtime_threshold` | ATTENTION | RESP_RH | `OvertimeAlertHandler` |
| `hr.rest_period_violation` | URGENT | RESP_RH | `HRBreakCheckHandler` |
| `hr.certification_expired` | URGENT | RESP_RH | `CertExpiryHandler`, `MedicalVisitAlertHandler` |
| `ops.equipment_fault` | URGENT | RESP_TECHNIQUE | `EquipmentFaultHandler`, `HardwareFaultHandler` |
| `ops.printer_failed` | URGENT | RESP_SERVICE | `PrinterMappingHandler` |
| `commerce.negative_review` | ATTENTION | RESP_DIRECTION | `NegativeReviewHandler` |
| `report.daily_digest` | **INFO** | RESP_DIRECTION | `DailyDigestHandler` — **rétrogradé depuis URGENT** (N12) |

> Le seul reclassement à impact fort : **`report.daily_digest` passe de `URGENT` à `INFO`**.
> C'est l'exemple type de la fatigue d'alerte — un rapport de routine qui déclenche une notification
> système. Trois signaux seulement restent `CRITIQUE` : température, rappel produit, chaîne fiscale.

### 5.3 Signaux de configuration

| Signal | Sévérité | Sens |
|---|---|---|
| `alert.routing_missing` | ATTENTION | Un signal n'a trouvé aucun destinataire → repli direction (§ 4.4) |
| `alert.channel_unavailable` | ATTENTION | Clés VAPID / Resend / Twilio absentes alors qu'un canal les exige |
| `alert.delivery_failed_repeatedly` | URGENT | 3 échecs consécutifs de livraison pour une même personne |

Ces trois-là sont ce qui évite le pire scénario d'un système d'alerte : **échouer en silence.**

---

## 6. Intégration avec `flexibilité.md`

C'est le point de jonction des deux plans. Sans lui, le Centre de régularisation est un écran que
personne n'ouvre.

### 6.1 Les trois profils temporels, revus côté alerte

| Profil (`flexibilité.md` § 4) | Ce que l'alerte doit faire | Ce qu'elle ne doit **jamais** faire |
|---|---|---|
| **A — Nouveau restaurateur** | Rester **silencieuse** les 7 premiers jours sur les suspens de stock : l'absence de recettes est l'état normal d'une ouverture. Un seul récapitulatif à J+7 : « voici ce qui vous attend quand vous serez prêt » | Bombarder d'alertes de rupture pendant la semaine d'ouverture — c'est le meilleur moyen de faire désactiver les notifications définitivement |
| **B — Client qui migre** | Alerter sur les **écarts de reprise** (lignes rejetées par l'Airlock, écriture d'ouverture non scellée), pas sur le volume normal de l'import | Traiter 50 000 lignes importées comme 50 000 faits à signaler |
| **C — Exploitation courante** | Signaler **le retard qui s'aggrave**, pas le retard qui existe. L'escalade est temporelle, pas volumétrique | Répéter la même alerte chaque jour : elle vieillit et escalade, elle ne se répète pas (P5) |

**Mécanisme du profil A — la période de grâce.** `TenantConfig.alertGracePeriodDays` (défaut 7,
lu par `AlertBus`) : pendant `genesisDate + grace`, les signaux `flex.*` de sévérité ≤ ATTENTION
sont **persistés mais non livrés**. Ils apparaissent dans le centre, jamais en push.
`CRITIQUE` traverse toujours — une chambre froide en panne le jour de l'ouverture reste une urgence.

### 6.2 Le badge du Centre de régularisation, enfin alimenté

`flexibilité.md` § 9.2 spécifie `PendingRegularizationBadge` avec trois tonalités. Sa source de
vérité devient une projection d'alertes, pas un comptage à la volée :

```
suspenseGroups ──► AlertBus.raise('flex.suspense_threshold_reached') ──► alerts/
                                                                          │
                                          pendingAlertCountAtom ◄─────────┘
                                                    │
                              ┌─────────────────────┴─────────────────────┐
                              ▼                                           ▼
                  PendingRegularizationBadge                    NotificationCenter
                  (compteur + tonalité)                         (liste actionnable)
```

Les deux composants lisent **le même atome**, alimenté par **un seul** abonnement Nexus.
C'est ce qui corrige N1 : l'atome acquiert un écrivain.

### 6.3 Correspondance signal ↔ écran de régularisation

Chaque alerte `flex.*` porte un `actionHref` qui ouvre **l'onglet exact** du Centre de
régularisation, pré-filtré sur le sujet :

| Signal | `actionHref` |
|---|---|
| `flex.suspense_threshold_reached` | `/regularisation?tab=stocks` |
| `flex.z_missing` | `/regularisation?tab=caisse&day=2026-09-01` |
| `flex.offline_seal_pending` | `/regularisation?tab=caisse&device=terrasse-01` |
| `flex.timeclock_gaps` | `/regularisation?tab=personnel&week=2026-W36` |
| `flex.invoice_awaiting` | `/regularisation?tab=achats` |
| `flex.dlq_quarantine_fiscal` | `/regularisation?tab=caisse&view=dlq` |

Une alerte sans `actionHref` est une alerte qu'on ne peut pas traiter. **Règle : tout signal de
sévérité ≥ ATTENTION doit en porter un**, vérifié par un test (§ 12).

### 6.4 Fermeture automatique de la boucle

Quand un suspens est résolu (`suspense.resolved`) ou une journée clôturée (`finance.z_closed`),
l'alerte correspondante passe en `resolved` **sans intervention** : `AlertResolutionHandler` écoute
les événements de résolution et appelle `AlertBus.resolve(alertKey, actorId)`.

Sans cela, le restaurateur traite le problème et l'alerte reste allumée — la façon la plus sûre de
faire perdre toute crédibilité au système.

---

## 7. Câblage bout-en-bout (Loi 8)

| Brique | Événements | Service / Handler | Collections | Route API | Écran | i18n | RBAC | Test |
|---|---|---|---|---|---|---|---|---|
| `AlertBus` | `alert.raised`, `alert.deduplicated` | `AlertBus` + `AlertPersistHandler` | `alerts` | — | — | `alerts.signal.*` | — | `alert-bus.test.ts` |
| `AlertSignalRegistry` | — | `kernel/alerts` | — | — | — | catalogue | — | `alert-catalog.test.ts` |
| `AlertDeduplicator` | — | `AlertBus` interne | `alerts` | — | — | — | — | `alert-dedup.test.ts` |
| `AlertRouter` | `alert.routing_missing` | `AlertRouter` | `settings.notificationRoutings` | `GET/PUT /api/tenant/alerts/routing` | Réglages → Alertes | `settings.alerts.*` | `manager` (lecture), `directeur` (écriture) | `alert-router.test.ts` |
| `QuietHoursPolicy` | — | `AlertBus` interne | `settings.notifications` | — | Réglages → Alertes | `settings.quiet.*` | — | `quiet-hours.test.ts` |
| `ChannelDispatcher` | `alert.delivered`, `alert.delivery_failed` | `ChannelDispatcher` | `alertDeliveries` | — | Journal de livraison | `alerts.delivery.*` | `directeur` | `channel-dispatcher.test.ts` |
| `EscalationLadder` | `alert.escalated` | `AlertEscalationJob` (cron 5 min) | `alerts` | — | badge + centre | `alerts.escalated.*` | — | `escalation-ladder.test.ts` |
| `DigestBuilder` | `alert.digest_sent` | `DigestBuilder` + `DailyDigestHandler` | `dailyDigests` | — | e-mail + `/analytics` | `alerts.digest.*` | — | `digest-builder.test.ts` |
| `NotificationCenter` | — | UI | `alerts` | `POST /api/tenant/alerts/{ack,resolve,snooze}` | cloche + panneau | `alerts.center.*` | tout rôle, **filtré** (§ 9) | `notification-center.test.tsx` |
| `AlertResolutionHandler` | consomme `suspense.resolved`, `finance.z_closed`, … | handler | `alerts` | — | — | — | — | `alert-auto-resolve.test.ts` |

### 7.1 Régime des collections

| Collection | `SIGNED_WRITE` | `IMMUTABLE` | Purge |
|---|---|---|---|
| `alerts` | oui | non (statut mutable) | archivage 24 mois |
| `alertDeliveries` | oui | **oui** — preuve de notification | jamais |
| `settings.notificationRoutings` | oui | non | — |

---

## 8. Composants UI

### 8.1 `NotificationCenter` — reconstruction du panneau

`NotificationPanel.tsx` existe et est correctement structuré (groupement par module, actions,
navigation). Il lit simplement une source vide. La refonte porte sur **la source et les actions**,
pas sur la mise en page.

```
┌──────────────────────────────────────────────────────────────┐
│ 🔔 Alertes                                    3 non lues [×] │
│ [ Tout ] [ À traiter 3 ] [ Escaladées 1 ] [ Résolues ]       │
├──────────────────────────────────────────────────────────────┤
│ 🚨 CRITIQUE · Hygiène                          il y a 12 min │
│    Chambre froide 2 — +8,4 °C depuis 12 min                  │
│    Escaladée au directeur (non traitée depuis 15 min)        │
│                          [ J'ai vu ]  [ Traiter → ]          │
├──────────────────────────────────────────────────────────────┤
│ ⚠ URGENT · Caisse                                   hier     │
│    3 journées ne sont pas clôturées (31/08 → 02/09)          │
│                    [ Reporter 1 h ]  [ Clôturer → ]          │
├──────────────────────────────────────────────────────────────┤
│ ● ATTENTION · Stocks                     depuis 4 j · ×12    │
│    47 ventes non déduites du stock                           │
│                                        [ Régulariser → ]     │
└──────────────────────────────────────────────────────────────┘
```

**Décisions.**

- **`×12`** = le compteur d'occurrences (P5). Une alerte vue douze fois reste **une** ligne.
  C'est visuellement ce qui distingue ce système de l'actuel.
- **Trois actions, jamais plus** : *J'ai vu* (accusé, arrête l'escalade), *Reporter* (snooze borné,
  jamais indéfini), *Traiter* (navigation vers `actionHref`). **Pas de bouton « Supprimer »** :
  une alerte se résout, elle ne s'efface pas — sinon l'escalade devient contournable d'un clic.
- **L'âge est affiché, pas la date** — cohérent avec le Centre de régularisation.
- La mention d'escalade est **dans la ligne**, pas dans un détail replié.
- Le filtre par défaut est **« À traiter »**, pas « Tout » : on ouvre la cloche pour agir.

**Primitives** : `NotificationPanel` (existant, à recâbler), `ToolbarTabs`, `StatusBadge`,
`Chip`, `EmptyState`, `SkeletonList`, `BottomSheet` sur mobile.

**États** : vide → `EmptyState` « Aucune alerte. Tout va bien. » ; chargement → `SkeletonList` ;
erreur → `Feedback` critique + Réessayer, jamais de panneau blanc.

### 8.2 `AlertBell` — la cloche qui compte enfin

- Pastille : nombre d'alertes `open` **filtrées par la responsabilité de l'utilisateur** (§ 9).
- Tonalité : rouge si une `CRITIQUE` ouverte, ambre si une `URGENT`, neutre sinon.
- Animation de pulsation **uniquement** pour `CRITIQUE`, `motion-safe` obligatoire.
- Sur `/pos`, `/kds`, `/bar` : seules les `CRITIQUE` et `URGENT` de la responsabilité en cours de
  service s'affichent. Le reste attend la fin du service — même règle que
  `PendingRegularizationBadge` (`flexibilité.md` § 9.2).

### 8.3 `CriticalAlertBanner` — l'interruption assumée

Le seul composant autorisé à interrompre. Bandeau plein écran haut, non fermable sans action, réservé
aux trois signaux `CRITIQUE` (température, rappel produit, chaîne fiscale rompue).

```
┌────────────────────────────────────────────────────────────────────┐
│ 🚨 Chambre froide 2 — +8,4 °C depuis 12 min                        │
│    Produits sensibles : 14 références · action requise (HACCP)     │
│              [ J'interviens ]        [ Voir la procédure ]         │
└────────────────────────────────────────────────────────────────────┘
```

- « J'interviens » = `acknowledge` + nom de l'intervenant affiché aux autres postes.
- Visible sur **tous** les écrans, y compris `/pos` et `/kds` : c'est la seule exception à la règle
  « on n'interrompt pas le service ». Une chambre froide en panne pendant un coup de feu est
  précisément le cas où il faut interrompre.

### 8.4 `AlertRoutingSettings` — la table de routage, éditable

Écran Réglages → onglet Alertes. C'est ce qui rend `AlertRouting` vivant.

```
┌───────────────────────────────────────────────────────────────────────┐
│ Qui reçoit quoi                                                       │
├───────────────────────────────────────────────────────────────────────┤
│ Responsabilité   Personnes            Rôles (repli)    Canaux         │
│ Hygiène          Marc D., Sarah K.    chef_cuisinier   ☑app ☑push ☐sms│
│ Caisse & fiscal  Claire T.            comptable        ☑app ☑push ☑sms│
│ Stocks           —  ⚠ aucun            chef_cuisinier   ☑app ☐push    │
│ Personnel        Marc D.              manager          ☑app ☑push     │
│ Technique        —  ⚠ aucun            manager          ☑app ☑push    │
│ Direction        Julie R.             directeur, admin ☑app ☑push ☑sms│
├───────────────────────────────────────────────────────────────────────┤
│ Heures calmes  ☑ activées   de [22:00] à [07:00]                      │
│ ⓘ Les alertes critiques (température, rappel produit, chaîne fiscale) │
│   sont toujours transmises, même en heures calmes.                    │
│                                                    [ Enregistrer ]    │
└───────────────────────────────────────────────────────────────────────┘
```

- L'avertissement **⚠ aucun** est affiché dès qu'une responsabilité n'a aucun destinataire nommé :
  le trou de configuration est visible avant l'incident, pas après.
- La phrase sur les alertes critiques est une **obligation d'affichage** : le restaurateur doit
  savoir que le mode silencieux a des exceptions, sinon il croit être protégé et ne l'est pas.
- Un bouton « Tester » par ligne envoie une alerte factice `INFO` sur les canaux cochés — le seul
  moyen de vérifier qu'une clé VAPID ou Twilio fonctionne avant d'en avoir besoin.

### 8.5 `AlertDeliveryJournal` — la preuve

Lecture seule, `directeur` uniquement. Une ligne par tentative de livraison : alerte, destinataire,
canal, horodatage, résultat (`sent` / `failed` / `skipped_quiet_hours` / `no_subscription`), et
accusé de lecture le cas échéant. Exportable.

C'est la réponse à « le système a-t-il prévenu ? » — question qui se pose en contrôle sanitaire, en
litige prud'homal et en contentieux assurance. `alertDeliveries` étant immuable, la réponse est
opposable.

### 8.6 `AlertPreferences` — le réglage personnel

Dans `/mon-espace`. Chaque personne choisit ses canaux **dans la limite de ce que la sévérité
autorise** : on peut refuser le push pour `ATTENTION`, jamais pour `CRITIQUE`. L'interface le dit
explicitement plutôt que de griser une case sans explication.

---

## 9. RBAC, confidentialité et filtrage

Une alerte est une donnée métier : elle est soumise aux mêmes règles que l'écran qu'elle référence.

### 9.1 Règles de visibilité

1. **Filtrage par responsabilité.** On ne voit que les alertes des responsabilités qu'on porte.
   Un `plongeur` (10) ne voit rien ; un `chef_cuisinier` (45) voit `RESP_STOCK` et `RESP_HYGIENE` ;
   un `comptable` (60) voit `RESP_FISCAL` ; un `directeur` (90) voit tout.
2. **Filtrage du contenu, pas seulement de la liste.** Une alerte de `RESP_FISCAL` contient un
   chiffre d'affaires. Elle ne doit **jamais** transiter par un canal atteignant un rôle non
   habilité — y compris dans le corps d'un push, qui s'affiche sur un écran verrouillé.
   Règle : **le titre d'un push ne contient jamais de montant.** Le montant est dans l'alerte,
   consultable après authentification.
3. **`actionHref` respecte `withPageGuard`.** Une alerte ne doit pas conduire à un 403 : si le
   destinataire n'a pas accès à l'écran de traitement, il n'est pas destinataire de l'alerte.
   Test dédié (§ 12).
4. **Le MCC ne reçoit jamais d'alerte métier tenant.** Seuls `flex.dlq_*`, `alert.channel_*` et les
   incidents d'infrastructure remontent au `OpsAlertGateway`. Un `flex.z_missing` est une affaire du
   restaurateur, pas de l'éditeur — conformément à la règle « le MCC ne consomme pas les événements
   métier tenant ».

### 9.2 Correction de `/api/push/internal` (N3)

Trois options ont été pesées :

| Option | Verdict |
|---|---|
| Élargir `requireTenantAdmin` à tous les rôles | **Non** — n'importe quel compte pourrait pousser une notification arbitraire à tout le monde |
| Signer les appels avec un secret partagé côté client | **Non** — un secret dans le bundle n'est pas un secret |
| **Déplacer le dispatch côté serveur** | **Retenu** |

Le `ChannelDispatcher` ne tourne plus dans le navigateur de l'auteur de l'événement. `AlertBus.raise`
écrit l'alerte (chemin authentifié standard, tout rôle) ; un **handler serveur** (`ServerEventBus`,
déjà présent) consomme `alert.raised` et effectue la livraison avec l'identité du système, pas celle
de l'utilisateur.

Effet : le `serveur` (40) qui provoque une rupture de stock déclenche bien la notification du
`chef_cuisinier`, sans jamais avoir le droit d'envoyer un push lui-même. `/api/push/internal`
conserve sa garde stricte et devient un point d'entrée **interne**.

---

## 10. Lutte contre la fatigue d'alerte

C'est le risque n°1 du chantier : un système qui notifie trop est désactivé, et l'on se retrouve
moins bien loti qu'avec un système qui ne notifie pas.

| Mécanisme | Effet |
|---|---|
| **Reclassement de sévérité** | La majorité des 80 émissions actuelles descend en `INFO`/`ATTENTION` → digest, plus de push. Seuls 3 signaux restent `CRITIQUE` |
| **Déduplication par `alertKey`** | Une alerte, une ligne, un compteur — jamais N notifications |
| **Période de grâce à l'ouverture** | 7 jours de silence sur les `flex.*` non critiques (§ 6.1) |
| **Heures calmes** | `URGENT` différé, `INFO`/`ATTENTION` en digest |
| **Escalade au lieu de répétition** | Le rappel est adressé à quelqu'un d'autre, pas répété à la même personne |
| **Résolution automatique** | L'alerte s'éteint quand le problème est traité (§ 6.4) |
| **Snooze borné** | Reporter est possible, indéfiniment non |
| **Budget d'alerte** | **Plafond dur : 5 push par personne et par service.** Au-delà, tout bascule en digest et un `alert.budget_exceeded` (`ATTENTION`, RESP_DIRECTION) signale que la configuration est trop bavarde |

Le budget d'alerte est le garde-fou structurel : il rend impossible la régression silencieuse vers
l'état actuel, et il transforme un excès de notifications en **signal de configuration** plutôt
qu'en nuisance subie.

---

## 11. Plan d'implémentation

Cinq lots, insérés dans la séquence de `flexibilité.md`.

### Lot N0 — Rendre le centre visible *(prérequis, ~2 j)*

Livrable autonome, à valeur immédiate même sans le reste : **la cloche affiche enfin quelque chose.**

| # | Tâche | Corrige |
|---|---|---|
| N0.1 | Alimenter `notificationsAtom` depuis un abonnement Nexus sur `tenants/{id}/notifications` | N1, N2 |
| N0.2 | Implémenter réellement `markAsRead`, `markAllAsRead`, `removeNotification`, `clearAll` | N4 |
| N0.3 | `addNotification` crée une notification persistée **et** un toast, au lieu d'un toast seul | N5 |
| N0.4 | Déplacer le dispatch push côté serveur ; `/api/push/internal` devient interne | **N3** |
| N0.5 | Normaliser les rôles à la volée dans le dispatcher (`normalizeRbacRole`) ; rejeter `roles: []` avec un avertissement | N6 (mitigation) |

**Sortie** : `notification-center-hydration.test.tsx` — une notification émise apparaît dans le
panneau. `push-dispatch-server-side.test.ts` — un `serveur` déclenche une alerte reçue par le manager.

### Lot N1 — Le moteur *(~3 j)*

`AlertBus`, `AlertSignalRegistry`, `AlertDeduplicator`, collections `alerts` + `alertDeliveries`,
`AlertPersistHandler`. Migration des 3 signaux `CRITIQUE` en premier (température, rappel, fiscal).
**Corrige N9, N10, N16.**

### Lot N2 — Routage, silence, escalade *(~3 j)*

`AlertRouter` (extension d'`AlertRouting`, défauts par verticale), `QuietHoursPolicy`,
`EscalationLadder` + `AlertEscalationJob`, `ChannelDispatcher` unifié.
Migration des 84 ciblages en dur vers les responsabilités.
**Corrige N6, N7, N8, N11, N13.**

### Lot N3 — Intégration flexibilité *(~2 j)*

Les 17 signaux `flex.*` (§ 5.1), `AlertResolutionHandler`, période de grâce,
`pendingAlertCountAtom` partagé avec `PendingRegularizationBadge`, `actionHref` vers les onglets du
Centre de régularisation.
**Dépend de** `flexibilité.md` lots 3 (SuspenseRegistry) et 5 (fiscal).

### Lot N4 — Interfaces et confort *(~3 j)*

`NotificationCenter` recâblé, `AlertBell`, `CriticalAlertBanner`, `AlertRoutingSettings`,
`AlertDeliveryJournal`, `AlertPreferences`, `DigestBuilder`, budget d'alerte.
Suppression d'`AlertSync`. Drainage de `crm/pendingNotifications` (**N15**).
**Corrige N12, N14, N15.**

### Séquencement conjoint

```
flexibilité :  Lot 0 ──► Lot 1 ──┬─► Lot 2 ──┬─► Lot 5 ──────────────┐
                                 └─► Lot 3 ──┴─► Lot 4 ─► Lot 6 ─► Lot 7
                                        │            │
alertes :      Lot N0 ─► Lot N1 ─► Lot N2 ──────────►Lot N3 ─► Lot N4
               ▲
               └─ indépendant : livrable dès maintenant, sans attendre flexibilité.md
```

**Lot N0 n'a aucune dépendance.** C'est le meilleur premier pas des deux plans réunis : deux jours
pour qu'un système qui émet 80 notifications cesse d'en afficher zéro.

---

## 12. Spécification des tests

`src/__tests__/alertes/`.

| Test | Assertion |
|---|---|
| `notification-center-hydration.test.tsx` | Une notification persistée apparaît dans le panneau ; le compteur est exact |
| `notification-actions.test.tsx` | `markAsRead` / `clearAll` modifient réellement l'état ; aucune souche `logger.debug` ne subsiste |
| `push-dispatch-server-side.test.ts` | Un `serveur` (40) déclenche un signal ; le `chef_cuisinier` reçoit la livraison. **Régression N3** |
| `alert-dedup.test.ts` | 12 occurrences du même signal dans la fenêtre → 1 alerte, `occurrences === 12` |
| `alert-dedup-window.test.ts` | La même alerte hors fenêtre crée une **nouvelle** alerte |
| `alert-router.test.ts` | Résolution nommés → rôles → repli direction + `alert.routing_missing` |
| `alert-router-normalizes-roles.test.ts` | `kitchen_chef`, `MANAGER`, `STAFF` sont normalisés ou rejetés explicitement |
| `alert-router-empty-recipients.test.ts` | `roles: []` ne produit jamais un envoi silencieux à personne |
| `quiet-hours.test.ts` | `CRITIQUE` traverse les heures calmes ; `URGENT` est différé ; `INFO` n'est jamais poussé |
| `quiet-hours-timezone.test.ts` | Les heures calmes sont évaluées dans le fuseau du tenant, pas en UTC |
| `escalation-ladder.test.ts` | Une `CRITIQUE` non acquittée escalade à 15 min puis 30 min, et pas au-delà de l'échelon 2 |
| `escalation-stops-on-ack.test.ts` | Un `acknowledge` arrête l'escalade |
| `alert-auto-resolve.test.ts` | `suspense.resolved` clôt l'alerte correspondante |
| `alert-severity-catalog.test.ts` | Tout signal du catalogue a sévérité, responsabilité, clé i18n et — si ≥ ATTENTION — un `actionHref` |
| `alert-rbac-visibility.test.ts` | Un `plongeur` ne voit aucune alerte ; un `chef_cuisinier` ne voit pas `RESP_FISCAL` |
| `alert-href-no-403.test.ts` | Tout `actionHref` d'une alerte est accessible aux rôles destinataires (croisé avec `DEFAULT_PAGE_ACCESS`) |
| `push-title-no-amount.test.ts` | Aucun titre de push ne contient de montant |
| `alert-budget.test.ts` | Au-delà de 5 push/personne/service, bascule en digest + `alert.budget_exceeded` |
| `grace-period.test.ts` | Pendant la période de grâce, les `flex.*` ≤ ATTENTION sont persistés sans être livrés ; les `CRITIQUE` passent |
| `delivery-ledger-immutable.test.ts` | `alertDeliveries` refuse `update` et `delete` |
| `no-direct-channel-import.test.ts` | Aucun module hors `ChannelDispatcher` n'importe `browserPush`, `NotificationGateway` ou `OpsAlertGateway` |
| `digest-builder.test.ts` | Le digest regroupe par responsabilité, un envoi par personne |
| `mcc-no-business-alerts.test.ts` | Aucun signal métier tenant n'atteint `OpsAlertGateway` |

---

## 13. Mesures permanentes

À ajouter à `scripts/measure/measures.mjs`, en complément des huit du plan de flexibilité.

| Mesure | Définition | Cible | Cliquet |
|---|---|---|---|
| `m-direct-channel-calls` | Fichiers important `browserPush` / `NotificationGateway` / `OpsAlertGateway` hors `kernel/alerts/` | 0 (28 aujourd'hui) | oui |
| `m-hardcoded-alert-roles` | Occurrences de `roles: [...]` en dur hors table de routage | 0 (84 aujourd'hui) | oui |
| `m-signals-without-href` | Signaux ≥ ATTENTION sans `actionHref` | 0 | oui |
| `m-signals-undeclared` | `AlertBus.raise` avec un signal absent du catalogue | 0 | oui |
| `m-alert-unread-p95` | Âge du 95ᵉ centile des alertes `open` (runtime) | < 24 h | non |
| `m-push-per-person-per-service` | Volume de push par personne et par service (runtime) | ≤ 5 | oui |
| **`m-settings-read-at-runtime`** | Réglages déclarés dont la clé n'apparaît **hors** fichier de déclaration **et hors** fichier de valeurs par défaut | 0 | oui |

> `m-settings-read-at-runtime` corrige l'angle mort du § 1 : la sonde actuelle compte `doNotDisturb`
> comme « lu » parce qu'il figure dans `defaults.ts`. Avec cette définition, les quatre réglages de
> notification remontent comme non lus — ce qu'ils sont.

---

## 14. Risques et questions ouvertes

### 14.1 Risques

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Le lot N0 rend visibles 80 émissions qui n'apparaissaient nulle part → déluge le premier jour | **forte** | fort | Livrer N0 **avec** le reclassement de sévérité du § 5.2 ; par défaut, seuls `URGENT` et `CRITIQUE` remontent dans le panneau tant que N1 n'est pas livré |
| Migration des 84 ciblages : régression sur un destinataire | moyenne | moyen | Migration par domaine, avec `alert-router.test.ts` en cliquet et un mode « double routage » journalisant l'ancien et le nouveau destinataire sans envoyer deux fois |
| Escalade trop agressive → réveils nocturnes | moyenne | fort | Délais par défaut prudents (15/30 min sur `CRITIQUE` seulement), heures calmes actives par défaut, budget d'alerte |
| Clés VAPID / Twilio absentes en production → canal muet | **forte** | fort | `alert.channel_unavailable` au démarrage + bouton « Tester » par ligne de routage (§ 8.4) |
| `alertDeliveries` grossit vite | certaine | faible | ~1 ligne par alerte × destinataire × canal ; archivage annuel, jamais de purge |

### 14.2 Questions ouvertes — décisions produit

| # | Question | Options | Recommandation |
|---|---|---|---|
| A1 | **Le SMS est-il activé par défaut ?** | oui / non / `CRITIQUE` seulement | **`CRITIQUE` seulement.** Le SMS a un coût unitaire et une forte perception d'urgence |
| A2 | **Qui reçoit `flex.z_missing` : le manager ou le comptable ?** | manager / comptable / les deux | **Manager.** L'action (`seal_zday`) lui appartient déjà dans la matrice RBAC. Le comptable est destinataire d'escalade |
| A3 | **Période de grâce à l'ouverture : 7 jours ?** | 3 / 7 / 14 | **7 jours**, réglable. Couvre la première semaine sans masquer un problème durable |
| A4 | **Le `CriticalAlertBanner` peut-il interrompre `/pos` en plein service ?** | oui / non / avec délai | **Oui**, pour les 3 signaux `CRITIQUE` seulement. Une chambre froide en panne pendant un coup de feu est exactement le cas où il faut interrompre |
| A5 | **Budget de 5 push par personne et par service** | 3 / 5 / 10 / illimité | **5.** Au-delà, le message n'est plus lu ; en deçà, une soirée réellement difficile est sous-signalée |
| A6 | **Faut-il un canal WhatsApp ?** | oui / non / plus tard | **Plus tard.** `NotificationChannel` le déclare déjà ; l'implémenter suppose un compte Business API par tenant — chantier commercial autant que technique |
| A7 | **Le personnel de salle reçoit-il des alertes sur son téléphone personnel ?** | oui / non / opt-in | **Opt-in explicite**, avec mention RGPD. Imposer un push sur un appareil personnel est un sujet de droit du travail, pas de configuration |

### 14.3 Hors périmètre

- **Alertes prédictives** (« vous allez être en rupture demain ») : `useStockPrediction` existe,
  mais une alerte prédictive fausse détruit la confiance plus vite que dix alertes tardives.
  À traiter après stabilisation du socle réactif.
- **Notifications client final** (confirmation de réservation, ticket dématérialisé) : chemin
  distinct, destinataires externes, contraintes RGPD propres. `ReservationNotifierHandler` et
  `DigitalReceiptHandler` restent où ils sont.
- **Alertes flotte MCC** : `GlobalAlertEscalationMatrixService` couvre déjà l'échelle P1→P4 côté
  éditeur. Les deux systèmes ne se rejoignent que sur `flex.dlq_*` et `alert.channel_unavailable`.

---

## 15. Le test de vérité

Trois situations, à comparer avec l'état actuel.

**La chambre froide.** « Il est 23 h, la chambre froide monte à +8 °C. Marc reçoit un push malgré le
mode silencieux, avec la mention que c'est une alerte critique. Il n'a pas répondu en 15 minutes :
Julie, la directrice, est prévenue à son tour. Marc intervient, clique sur *J'interviens*, et
l'alerte s'éteint pour tout le monde. »
*Aujourd'hui : `FridgeTempAlertHandler` émet un `notification.urgent` ciblant `kitchen_chef` — un rôle
que personne ne porte, donc Marc n'est jamais prévenu. Si l'événement vient d'un compte non-admin,
le push des deux autres destinataires est refusé et avalé. Et rien n'apparaît nulle part, puisque le
centre de notifications est vide par construction.*

**Le service.** « Vendredi soir, 47 ventes n'ont pas été déduites du stock. Aucune notification
pendant le service. Samedi matin, le digest de 9 h le mentionne en deux lignes, avec le lien vers le
Centre de régularisation. »
*Aujourd'hui : `AlertSync` produit un toast de 3 secondes par article, en plein coup de feu, sans
persistance — et le retrouve à chaque navigation puisque la déduplication est en mémoire.*

**L'ouverture.** « J'ai ouvert lundi sans stock ni recettes. Le logiciel ne m'a rien reproché de la
semaine. Lundi suivant, une seule notification : *voici les 47 régularisations qui vous attendent
quand vous serez prêt*. »
*Aujourd'hui : rien ne serait signalé — mais rien ne serait enregistré non plus.*

---

*Fin du document. Mesures relevées le 2026-09-03 sur `main` — toute reprise ultérieure doit rejouer
les commandes du § 1 avant de citer un chiffre (Loi 7).*
