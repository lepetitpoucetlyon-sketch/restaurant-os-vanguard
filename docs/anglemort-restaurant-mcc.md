# 🔍 Angles morts — Verticale restaurant + MCC

> Audit **concret** basé sur l'état actuel du code (2026-08-21).
> Ne pas confondre avec `docs/archive/anglemort.md` qui est un audit théorique
> systémique des 45 angles morts métier (référence conceptuelle).

Chaque item est classé par **criticité** :
- 🔴 **CRITIQUE** — bloque une vente ou casse en prod
- 🟠 **HAUT** — dégrade l'expérience ou expose à un incident
- 🟡 **MOYEN** — feature déclarée mais UI/logique partielle
- 🟢 **BAS** — dette technique, à traiter opportunistement

**Icônes d'avancement** (nouveauté 2026-08-21) :
- ✅ **DONE** — implémentation complète (métier + tests + UI si applicable)
- 🟢 **DÉBLOQUÉ** — fondation prête (ADR-014), il reste à écrire l'implémentation métier
- 🌊 **OFFLINE-FIRST OK** — la collection sous-jacente est migrée via ADR-009-013 (couvre partiellement la résilience réseau)
- ⛔ **À FAIRE** — aucune fondation, tout reste à construire

---

# 📌 Statut au 2026-08-21 — Ce qui a été livré aujourd'hui

**14 commits atomiques créés aujourd'hui** (`main` = +680 sur origin/main, pas de push) :

| SHA | Message |
|---|---|
| `00d043733` | docs anglemort : section 4 (M101-M110) + section 5 (T-prefix) |
| `7fced2b9e` | ADR-014 consolidation 4 fondations (CrossScope + Outbox P2/P3 + AuditLogger hash + DLQ batch) |
| `b6018f52a` | docs anglemort : enrichissement 85 items L-prefix |
| `8c18c7ae5` | docs anglemort : audit initial 74 items (sections 1+2) |
| `79deee9d5` | docs afaire.md : Preview deploys + Observabilité |
| `81090dc53` | ADR-013 Phase 5 facility (equipmentAssets + breakdowns) |
| `e8e4267af` | ADR-012 Phase 4 commerce (customers + quotes + loyalty) |
| `9efbbef34` | ADR-011 Phase 3 logistics (stocks + supplierInvoices) |
| `5b80c04dd` | Kill-switch MCC landing + signup public |
| `4a314adaa` | ADR-010 Phase 2 ops (orders + tables + reservations) |
| `b6329beb7` | ADR-009 Phase 1 finance (expenseClaims) |
| `d89c40795` | Tests routes signup (13 + 14 = 27 tests) |
| `58a79c42a` | Routing marketing public + gitignore playwright |
| `ad80fe2a8` | ADR-008 isolation IA MCC ↔ Tenant complète (Phases A→E) |

## Items du doc désormais ✅ DONE (implémentation complète)

Aucun item d'angle mort au sens strict n'est **entièrement clos** aujourd'hui — nous avons construit les fondations et le socle offline-first, pas encore les implémentations métier des angles morts précis.

**Exception** : `L54` (Verrouillage Oracle vocal par JWT) est ✅ OK grâce à ADR-008.

## Items 🌊 OFFLINE-FIRST OK — leur résilience réseau est couverte (ADR-009-013)

Ces items ne sont pas "clos" mais leur collection sous-jacente est désormais migrée en `useSovereignCollection` (offline-first via Dexie + Outbox + Nexus) :

- **Finance** (ADR-009) : L37 (redistribution pourboires) — collection `expenseClaims` couverte
- **Ops** (ADR-010) : partie de A2/A3 (orders offline), C1-C5 (réservations offline), items KDS liés à `orders` — collections `orders/tables/reservations` couvertes
- **Logistics** (ADR-011) : L28, L29, L30, L31, H4, T57, T59 pour la partie offline — collections `stocks/supplierInvoices` couvertes
- **Commerce** (ADR-012) : J1, J2, J3 pour la partie offline — collections `customers/quotes/loyaltyAccounts` couvertes
- **Facility** (ADR-013) : items maintenance — collections `equipmentAssets/equipmentBreakdowns` couvertes

## Items 🟢 DÉBLOQUÉS — fondation ADR-014 prête, il reste à écrire l'implémentation

Voir carte "débloqué par ADR-014" en fin de doc. **13 items** :
L11 / B4 / M110 / T48 (allergène), L25 / T30 (contrôle DGFiP/DDPP), L51 (DAG), L52 / L46 (DLQ batch),
L55 / MCC-C4 (anomalie hash), L58 / L67 (HACCP prio), L60 (RappelConso fanout), L61 (biodéchets),
L82 / L83 (palace), MCC-E2 (MFA super_admin), MCC-E4 (rétention forensique).

## Bonus livrés (hors doc anglemort mais aussi 2026-08-21)

- ✅ Kill-switch MCC landing + signup public (`PublicAccessPanel` + route + Gate) — non prévu dans le doc, ajouté par demande utilisateur
- ✅ Tests routes signup (`/api/signup` 13 tests + `/api/billing/signup` 14 tests) — Plan Master P1.3
- ✅ Routing marketing public (élargissement `PUBLIC_PATH_PREFIXES` sur 4 gardes)
- ✅ `.gitignore` : `playwright-report/` + `playwright/.cache/`
- ✅ `docs/afaire.md` : bloqueurs Preview deploys + Observabilité (nécessitent décision externe)

---

## 🍽️ VERTICALE RESTAURANT

### Zone A — POS (encaissement)

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| A1 | **13 adapters TPE créés mais 0 testé en conditions réelles** | 🟠 HAUT | SumUp, Stripe Terminal, Adyen, Verifone, Worldline, Ingenico, Square, Sunday, Zettle, LyfPay, PayGreen, Conecs (TR) + Manual + Simulator. Aucun n'a été validé sur du hardware physique. Risque : contrat de TPE signé, adapter ne marche pas → client bloqué en caisse. |
| A2 | **Aucun test E2E cycle "commande → paiement → ticket → sceau NF525"** | 🔴 CRITIQUE | Le pipeline `FinancialNexusBridge → FiscalEngine.sealEntry → JournalEntry` a des tests unitaires isolés mais pas de test bout-en-bout qui prouve qu'une vente POS produit bien un sceau fiscal chaîné correctement. |
| A3 | **Split bill : hooks présents mais UI split par convive incomplète** | 🟡 MOYEN | `usePosSplit.ts` + `SplitByItemPanel.tsx` sont là, mais le split par équipart / pourcentage / montant custom n'est pas branché sur `PaymentDialog`. |
| A4 | **CashCounterModal : contrôle de caisse au coup d'œil sans réel workflow d'ouverture/clôture** | 🟠 HAUT | Pas de fond de caisse tracé jour J-1 → J. Pas de rapprochement "cash attendu vs cash compté" → écart. |
| A5 | **TR (tickets restaurants) : ConecsAdapter présent mais valeurs limites CNTR non enforcées** | 🟠 HAUT | Pas de vérif "montant TR ≤ plafond quotidien / hebdo". Pas de refus TR sur alcool/tabac (ligne interdite). |
| A6 | **Rendu de monnaie : pas de mode "monnaie exacte forcée" ni de calcul d'appoint** | 🟢 BAS | Feature UX standard fast-food, absente. |
| A7 | **Note en attente / addition partagée envoyée en salle : pas de mécanisme** | 🟡 MOYEN | Le serveur ne peut pas "envoyer l'addition sur le téléphone du client" avant que ce dernier paie. |

### Zone B — KDS / Cuisine

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| B1 | **Routing station : keyword matching en dur (french only), pas d'apprentissage** | 🟡 MOYEN | `kds-constants.ts` liste 90+ keywords français. Un plat "Aji tataki" n'est routé nulle part. Pas de fallback intelligent. |
| B2 | **Écran KDS multipost présent mais pas de heartbeat / offline recovery entre stations** | 🟠 HAUT | Si le KDS bar plante 3 min, les commandes ratées ne sont pas rejouées quand il revient. Tests existent (`kds-multipost.test.ts`) mais pas de recovery réel. |
| B3 | **Recette Master (BOM) : schemas absents pour coût-recette temps réel** | 🟠 HAUT | Pas de calcul food-cost par plat qui dérive du prix ingrédients live. Le patron ne sait pas si son burger est en marge nette. |
| B4 | **Contrôle allergènes : bloc UI présent mais pas de refus commande** 🟢 | 🔴 CRITIQUE | Un serveur peut valider une commande "vegan" qui contient du beurre. Aucun garde-fou. Risque juridique majeur (INCO 1169/2011). **🟢 Fondation ADR-014 prête : `AuditLogger.logAction('ALLERGEN_ORDER_BLOCKED')`.** |
| B5 | **Bump interception par station : pas de "rappel plat" si serveur ne prend pas dans les 3 min** | 🟢 BAS | UX HCR standard, absent. |

### Zone C — Plan de salle & Réservations

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| C1 | **Google Reserve : types définis mais webhook GRR non enregistré côté Google** | 🟠 HAUT | Types `GoogleReserveTypes` existent, mais pas de handshake OAuth Google avec le compte du tenant. Le canal de réservation "Réserver via Google" n'est pas activable en 1 clic. |
| C2 | **TheFork / Zenchef : 0 connector concret** | 🟡 MOYEN | Mentionné comme source dans `Reservation.source` mais aucun adapter d'ingestion. Les réservations TheFork doivent être saisies manuellement. |
| C3 | **Overbooking : pas d'algorithme de rotation table (turn time)** 🌊 | 🟠 HAUT | Le système accepte 2 réservations sur la même table à 20h et 22h sans vérifier la durée de service. **🌊 Collection `reservations` migrée offline-first via ADR-010.** |
| C4 | **Waitlist / file d'attente : pas de composant** 🌊 | 🟡 MOYEN | Le maître d'hôtel n'a pas d'écran pour gérer les clients qui attendent une table. **🌊 Collection `reservations` couverte offline via ADR-010.** |
| C5 | **SMS/Email rappel réservation J-1 : `MarketingCampaignRouterHandler` existe mais pas connecté au cycle reservations** | 🟠 HAUT | Cas d'usage "rappel automatique la veille" absent. Impact direct sur le no-show (typiquement 15-20 % du CA perdu). |

### Zone D — Fiscal NF525 / clôture / FEC

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| D1 | **FEC generator + exporter présents, mais pas de test qui vérifie la conformité au schéma DGFiP** | 🔴 CRITIQUE | `FECExporter.ts` produit un CSV. Aucun test ne vérifie le format exact (délimiteurs, colonnes, dates ISO). Risque : refus contrôle fiscal. |
| D2 | **Ticket Z / clôture journalière : pas de workflow forcé "impossible d'ouvrir le lendemain sans clôturer la veille"** | 🟠 HAUT | Le patron peut ouvrir son POS J+1 alors que le ticket Z J n'est pas généré. NF525 exige le contraire. |
| D3 | **Grand total périodique (mensuel/annuel) : `grandTotals` collection existe mais scheduler non branché** | 🟠 HAUT | Article 88 CGI oblige à un cumul cryptographique périodique. Le cron n'est pas actif. |
| D4 | **Exports comptables Sage/Cegid/EBP/Quadra/ACD/Agiris : mentionnés dans A_FAIRE archivé, 0 implémentation** | 🟡 MOYEN | Un comptable qui demande "vos exports Sage" reçoit un CSV brut. |
| D5 | **Multi-taux TVA (5,5 / 10 / 20) : split présent mais pas de contrôle "produit sans taux configuré → refus vente"** | 🔴 CRITIQUE | Un produit avec `taxRate: null` passe caisse silencieusement, sceau NF525 avec TVA = 0. Contrôle fiscal → redressement. |

### Zone E — HACCP / Hygiène

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| E1 | **HACCPLogService existe + tests, mais pas de fréquence forcée par vertical** | 🟠 HAUT | Un resto avec chambre froide DOIT logger la température 2×/jour. Aucun rappel/blocage si pas fait. |
| E2 | **`iotHistory` (sondes température) : collection déclarée immuable mais aucun connecteur IoT réel** | 🟡 MOYEN | Le tenant doit tout saisir manuellement. Zéro intégration Testo / Endress+Hauser / Nexus IoT bridge. |
| E3 | **Recall / rappel produit : `RecallService` + View, mais pas de propagation cross-tenant côté MCC** | 🟠 HAUT | Un rappel produit émis par un fournisseur ne notifie pas automatiquement tous les tenants qui ont ce produit en stock. |
| E4 | **Loi Garot (dons alimentaires > 400 m²) : `FoodDonationService` présent mais pas de reporting mensuel obligatoire** | 🟡 MOYEN | Amende jusqu'à 3750 € en cas de non-déclaration. |
| E5 | **Attestation TIAC (toxi-infection alimentaire collective) : aucun workflow d'urgence** | 🟠 HAUT | Si un client déclare une TIAC, aucun écran d'ouverture d'un incident sanitaire, aucun envoi automatique à l'ARS. |

### Zone F — Livraison / agrégateurs

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| F1 | **Webhook générique `/api/connectors/delivery/webhook/[provider]` existe mais 0 adapter concret** | 🟠 HAUT | `DeliveryProviderFactory` renvoie sur des adapters non implémentés (Uber Eats, Deliveroo, Just Eat). Le webhook réceptionne un payload et ne sait pas quoi en faire. |
| F2 | **Commissions livraison : pas de calcul (30 % Uber Eats, etc.) qui remonte au P&L** | 🟠 HAUT | Le patron ne sait pas combien lui coûte réellement Uber Eats sur son résultat. |
| F3 | **Pause livraison automatique (rush, RH sous-effectif) : pas de mécanisme "close store"** | 🟡 MOYEN | Impossible de fermer temporairement Uber Eats sans se logger dans leur app. |

### Zone G — RH / paye / planning

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| G1 | **Conventions HCR / auto / clinic / retail / salon présentes, mais `NexusPayrollEngine.ts` = squelette** | 🟠 HAUT | Le calcul de paye réel (majoration heures sup, dimanche, nuit, jours fériés) n'est pas implémenté. Impossible de sortir un bulletin. |
| G2 | **Planning drag-and-drop : pas de composant** | 🟡 MOYEN | Le manager doit saisir chaque shift manuellement. |
| G3 | **Pointeuse : `resource-booking` existe mais pas de flow "badge à l'arrivée"** | 🟠 HAUT | Cas d'usage HCR de base. Sans pointage propre, le calcul heures sup est falsifiable. |
| G4 | **Congés / absences : pas d'écran demande / validation** | 🟡 MOYEN | Un salarié doit passer par email/papier. |
| G5 | **URSSAF DPAE (Déclaration Préalable À l'Embauche) : aucun connecteur** | 🟠 HAUT | Obligation légale. Embauche via le système ne déclenche pas la DPAE → risque URSSAF. |

### Zone H — Stocks / approvisionnement

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| H1 | **Mercuriales : `MultiSupplierPriceComparatorService` implémenté + testé (ok) mais pas branché UI** | 🟢 BAS | Le patron ne voit pas "Metro à 5,20 €/kg vs Transgourmet à 4,90 €/kg" côté écran. |
| H2 | **RfaContractService (Remise Fin d'Année fournisseur) : implémenté + testé mais pas d'onglet MCC** | 🟢 BAS | Feature admin de puissance rarement exposée. |
| H3 | **DeliveryDisputeService (litige réception) : présent mais workflow email/photo au fournisseur pas branché** | 🟡 MOYEN | Le patron ne peut pas envoyer une réclamation à Metro en 3 clics. |
| H4 | **DLC (dates limites de conso) : `expiryTimestamp` présent dans schema mais pas de job "alerte DLC J-3"** | 🟠 HAUT | Perte alimentaire évitable + risque hygiène. |
| H5 | **Inventaire tournant / audit annuel : pas de workflow guidé** | 🟡 MOYEN | Le comptable fait l'inventaire annuel à la main. |

### Zone I — Hardware POS

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| I1 | **BluetoothPrinterAdapter présent, autres adapters (USB, Star, Epson) manquants** | 🟠 HAUT | Un client avec une Epson TM-T88 USB (le plus vendu) ne peut pas imprimer. |
| I2 | **Tiroir-caisse : ouverture pilotée par impression ticket ? Non branché** | 🟡 MOYEN | Le tiroir doit être ouvert manuellement. |
| I3 | **Écran client (customer-facing display) : composant absent** | 🟡 MOYEN | Cas fast-food : l'écran qui affiche l'état de la commande au client. |
| I4 | **Douchette / scanner code-barres : pas d'input handler dans POS** | 🟡 MOYEN | Impossible de scanner un produit → saisie manuelle uniquement. |

### Zone J — CRM / fidélité

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| J1 | **Adapter `useSovereignCustomers` livré Phase 4, mais `CustomersDirectory.tsx` seul composant, pas de fiche détail** 🌊 | 🟢 BAS | Impossible de voir l'historique complet d'un client. **🌊 Collection `customers` migrée offline (ADR-012).** |
| J2 | **Loyalty tier auto-promotion (bronze→silver→gold selon lifetime points) : non implémenté** 🌊 | 🟡 MOYEN | Manuel via `setTier`. Pas de règles automatiques. **🌊 Collection `loyaltyAccounts` migrée offline (ADR-012).** |
| J3 | **RGPD : droit à l'oubli client → route `/api/admin/fleet/rgpd-purge` existe mais pas de UX côté tenant** | 🟠 HAUT | Un client qui demande l'oubli oblige le patron à ouvrir une console MCC. Risque de non-réponse dans le délai légal (30 j). |

### Zone K — Signup / onboarding

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| K1 | **Onboarding wizard : `parsers/` (image, pdf, ocr) existent mais pas d'écran "importe ta carte en 3 min"** | 🟡 MOYEN | Le nouveau client doit tout saisir manuellement. |
| K2 | **Migration Zelty / L'Addition / Lightspeed : 0 connector concret** | 🟠 HAUT | Un prospect qui vient d'un concurrent doit tout refaire à la main. Frein #1 à la conversion. |
| K3 | **Signup Stripe → tenant provisioning : câblé via webhook mais aucun test E2E de la chaîne complète** | 🟠 HAUT | Un paiement Stripe qui échoue au provisioning laisse le tenant en état "orphelin". |

---

## 🛰️ MCC (Multi-Cloud-Control)

### Zone MCC-A — Fleet / provisioning

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| MCC-A1 | **`TenantProvisioningService` OK, mais pas de dashboard "flotte en cours de provisioning"** | 🟡 MOYEN | Si 3 signups en parallèle, aucune visibilité live. |
| MCC-A2 | **Clone depuis `_ref_<variant>` : mécanisme présent, mais pas de UI "duplique la ref bakery → nouveau client"** | 🟢 BAS | Workflow admin de puissance. |
| MCC-A3 | **Décommissioning : `/api/admin/fleet/rgpd-purge` présent, mais pas de workflow "retrait progressif J-30/J-14/J-0"** | 🟠 HAUT | Suppression instantanée = risque légal si le client conteste. |

### Zone MCC-B — Santé flotte / observabilité

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| MCC-B1 | **`TenantHealthPanel` récupère un score via `/api/…`, mais aucun scoring backend qui alimente vraiment cette route** | 🔴 CRITIQUE | Le panel affiche des scores placeholder. Cf. `docs/afaire.md` (bloqueur Observabilité — nécessite décision infra). |
| MCC-B2 | **`FleetTelemetryPanel` + `EventBusHealthPanel` — dépendants d'OpenTelemetry non installé** | 🔴 CRITIQUE | Voir ADR-011 P3 SRE + `docs/afaire.md`. |
| MCC-B3 | **`HardwareHealthGrid` : pas de connecteur MDM (Jamf, Intune, TinyMDM) pour piloter les iPads en flotte** | 🟠 HAUT | Un iPad d'un client planté → impossible de forcer reboot / update depuis le MCC. |
| MCC-B4 | **`DisasterRecoveryPanel` : UI présente, mais pas de vrais restore drills mensuels planifiés** | 🟠 HAUT | Backup nocturne OK (P0), restore jamais testé automatiquement. |

### Zone MCC-C — Support IA + fiscal + audit

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| MCC-C1 | **`SupportAIPanel` + `SupportDraftsPanel` opérationnels (ADR-008)** | ✅ OK | Rien à signaler. |
| MCC-C2 | **`FiscalArchiveExportPanel` : export WORM implémenté, mais pas de rétention 6 ans enforcée par la config** | 🟠 HAUT | Article 102 LPF : conservation 6 ans obligatoire. Actuellement aucune règle backend ne bloque une purge < 6 ans. |
| MCC-C3 | **`TaxAuditPanel` : filtre date sur route mais scoring "risque fiscal par tenant" pas implémenté** | 🟡 MOYEN | Un auditeur MCC doit ouvrir chaque tenant un par un. |
| MCC-C4 | **`FiscalChainExplorer` : navigue la chaîne de sceaux mais pas de "détection anomalie hash"** 🟢 | 🟠 HAUT | Si un sceau est corrompu (rupture chaîne), aucune alerte automatique. **🟢 Fondation ADR-014 prête : `AuditLogger.verifyChain(logs)` détecte falsifications et insertions.** |
| MCC-C5 | **`CertificationCenter` + `CertPreviewPanel` : UI présente, mais pas de vérif "cert NF525 encore valide" (date expiration)** | 🟡 MOYEN | La cert NF525 s'expire tous les 3 ans. |

### Zone MCC-D — Facturation SaaS + trésorerie

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| MCC-D1 | **`MCCTreasury` + `TenantBillingPanel` : UI présentes, mais webhook `checkout.session.completed` → renouvellement mensuel non testé E2E** | 🟠 HAUT | Un renouvellement Stripe qui échoue silencieusement = perte de MRR. |
| MCC-D2 | **Dunning (relance impayé) : aucun workflow "email J+3, J+7, coupure J+14"** | 🟠 HAUT | Cas classique SaaS non couvert. |
| MCC-D3 | **`ChurnPanel` (route `/api/admin/fleet/churn` existe) : pas de UI cohorte / prédiction** | 🟡 MOYEN | Impossible de voir "12 clients en risque de churn ce mois". |
| MCC-D4 | **Facturation revendeur (`ResellerPortal`) : présent mais commission au CA/tenant non calculée** | 🟡 MOYEN | Voir mémoire `project_mcc_reseller_model.md` : revendeurs = apporteurs, commission à calculer. |

### Zone MCC-E — Auth / RBAC

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| MCC-E1 | **Custom claims Firebase (`role`, `tenantId`) : posés au signup, mais aucun refresh forcé quand un rôle change** | 🟠 HAUT | Un user promu admin doit se re-login pour que ça prenne. |
| MCC-E2 | **`MFAGate` + `TrustedDevicePanel` : composants OK, mais MFA obligatoire pas enforcée pour `mcc_super_admin`** 🟢 | 🔴 CRITIQUE | Un super_admin compromis = accès à toute la flotte. **🟢 Fondation ADR-014 prête : `AuditLogger.logAction('MFA_ENABLED')`.** |
| MCC-E3 | **Session TTL : pas de rotation forcée toutes les 12h côté MCC** | 🟠 HAUT | Un token volé reste valide 30 j (Firebase default). |
| MCC-E4 | **`AuditLogger` / `ImmunityAuditLogger` : logs présents mais pas de rétention chiffrée + export forensique** 🟢 | 🟠 HAUT | En cas d'incident, l'auditeur externe ne peut pas récupérer les logs signés. **🟢 ADR-014 : hash chain SHA-256 + `AuditLogger.exportChain(fromTs, toTs)` opposable en justice.** |

### Zone MCC-F — Panels manquants

| # | Composant | Criticité | Détail |
|---|---|---|---|
| MCC-F1 | **Aucun `IncidentPostmortemPanel`** | 🟠 HAUT | Après un incident (webhook `/api/ops/incident-webhook`), aucune UI pour rédiger + partager le postmortem. |
| MCC-F2 | **Aucun `ExperimentsPanel` (feature flags par cohorte)** | 🟡 MOYEN | Impossible de rollout progressif d'une nouvelle feature à 10 % de la flotte. |
| MCC-F3 | **Aucun `ContractsPanel` visuel** | 🟢 BAS | Route `/api/admin/fleet/contracts` existe, pas d'UI dédiée. |
| MCC-F4 | **Aucun `DnsPanel`** | 🟡 MOYEN | Route `/api/admin/fleet/dns` existe. Sans UI, impossible de piloter les sous-domaines tenant depuis le MCC. |
| MCC-F5 | **Aucun `WebhookConfigPanel` (Stripe, SMS, DDPP, DGFiP)** | 🟠 HAUT | Toute la config webhook est en env vars. Rotation d'une clé = re-deploy. |

### Zone MCC-G — Intégrations MCC vs tenant

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| MCC-G1 | **`PluginCatalogManager` + `PluginEnginePanel` : marketplace UI mais aucun plugin réel dans le catalogue** | 🟡 MOYEN | Marketplace vide = feature vitrine. |
| MCC-G2 | **`AIWorkshop` : workflow créatif AI mais pas de rate-limit ni budget par utilisateur MCC** | 🟠 HAUT | Un opérateur MCC peut consommer des milliers de tokens Claude sans limite. |
| MCC-G3 | **`StrategyOracle` : `MacroBrain.getOracleAudit` migré ADR-008, mais analyses cross-tenant sans CrossScopeToken audit** | 🟠 HAUT | Voir R10 ADR-008 : `CrossScopeAuthority` est un stub. |
| MCC-G4 | **`VerticalActivePanel` : liste actives, mais pas de UI "activer plugin bakery sur tenant restaurant"** | 🟢 BAS | Feature déjà présente mais accessible seulement via API. |

---

## 📊 Récapitulatif par criticité

| Criticité | Restaurant | MCC | Total |
|---|---|---|---|
| 🔴 CRITIQUE | 5 (A2, B4, D1, D5, MCC-B1) | 3 (MCC-B1, MCC-B2, MCC-E2) | **8** |
| 🟠 HAUT | 20 | 15 | **35** |
| 🟡 MOYEN | 15 | 8 | **23** |
| 🟢 BAS | 5 | 3 | **8** |
| **Total** | **45** | **29** | **74** |

## 🎯 Top 10 à prioriser (ROI immédiat)

1. **D1 — Test E2E FEC conforme DGFiP** — un client audité = risque redressement direct
2. **D5 — Refus vente si `taxRate` non configuré** — même chose, protection systémique
3. **B4 — Blocage commande si allergène détecté** — risque juridique majeur (INCO)
4. **A2 — Test E2E POS → sceau NF525** — validation du cœur produit
5. **MCC-E2 — MFA obligatoire super_admin** — protection compte critique
6. **MCC-B1 — Vrai scoring backend `/api/…/health`** — le TenantHealthPanel n'affiche que du placeholder
7. **K2 — Connector migration Zelty / L'Addition** — frein #1 conversion prospects
8. **C5 — SMS/Email rappel réservation J-1** — impact direct sur no-show (15-20 % du CA)
9. **G1 — NexusPayrollEngine réel** — la vente "logiciel tout-en-un" tombe sans paye
10. **F1 — Adapters Uber Eats / Deliveroo réels** — canal de vente attendu par 100 % des restos

---

Réf. codebase : audit fait sur commit `81090dc53` (avant `79deee9d5`).
Voir aussi : `docs/afaire.md` (bloqueurs infra externes) et `docs/archive/anglemort.md` (audit théorique 45 zones).

---

# 🧬 SECTION 3 — Enrichissement issu de `docs/archive/anglemort.md`

Cross-check avec le doc théorique archivé (1392 lignes, 100+ angles morts).
Chaque item ci-dessous ajoute une catégorie **non couverte** par la section 1 (verticale restaurant) ou 2 (MCC), avec statut du code actuel.

Légende statut code : ⛔ absent · 🚧 partiel · ✅ implémenté

## 3.1 — POS / salle (compléments)

| # | Angle mort (source anglemort.md) | Statut code | Criticité |
|---|---|---|---|
| L1 | **Transfert de table en cours de repas** (T4 → T34 terrasse, KDS orphelin) | ⛔ Pas de `transferTable(fromId, toId)` atomique | 🟠 HAUT |
| L2 | **Fusion de tables** (T4+T5 en cours de service) | ⛔ Absent | 🟠 HAUT |
| L3 | **Add-on ticket après scellement NF525** (café après addition scellée) | ⛔ Pas de sous-session chaînée cryptographiquement | 🔴 CRITIQUE (Art. 286-I-3° bis CGI) |
| L4 | **Geste commercial "offert directeur"** (4 génépis offerts sans ligne à 0 € + traçabilité alcool) | ⛔ Suppression brute possible = coulage invisible | 🟠 HAUT |
| L5 | **Idempotence POS "double-tap 30 s"** (serveur qui mitraille "Envoyer cuisine") | ⛔ Pas de clé `IDEMP-POS-${tableId}-${window10s}` | 🔴 CRITIQUE (commande × 3 en cuisine) |
| L6 | **Note provisoire → annulation frauduleuse** (impression addition → serveur encaisse cash → annule) | ⛔ Pas de scellé provisoire dans le JET dès impression | 🔴 CRITIQUE (vol interne indétectable) |
| L7 | **Rendu de monnaie laissé en pourboire** (bouton explicite "gardez la monnaie" avec ventilation compte 426) | ⛔ Pas de bouton dédié | 🟠 HAUT (risque redressement fiscal pourboires CB) |
| L8 | **Carafe d'eau AGEC** (article à 0 € auto-attaché au nb couverts) | ⛔ Absent | 🟡 MOYEN (amende DDPP 1 500 €) |

## 3.2 — KDS / cuisine (compléments)

| # | Angle mort | Statut code | Criticité |
|---|---|---|---|
| L9 | **86 brutal ingrédient cascade** (mise en 86 au niveau ingrédient → toutes recettes bloquées) | ⛔ Absent (chef doit désactiver 6 plats à la main) | 🟠 HAUT |
| L10 | **Delta d'instruction partiel `KDS_ITEM_MODIFIED`** (surligne rouge la modif au lieu de réimprimer full ticket) | ⛔ Pas d'événement delta | 🟠 HAUT (double cuisson potentielle) |
| L11 | **Matrice INCO par lot de réception matinal** (fiche allergène liée au fournisseur du jour) 🟢 | ⛔ Fiche INCO statique — 🟢 ADR-014 débloque via `AuditLogger.logAction('ALLERGEN_ORDER_BLOCKED')` | 🔴 CRITIQUE (choc anaphylactique) |
| L12 | **Micro-séquençage 2 temps (soufflé + glace)** (dresser glace = `T0+7min30`) | ⛔ Absent | 🟡 MOYEN |
| L13 | **Compteur "Minute 14" psycho-visuel** (clignotant orange 11 min, rouge 13 min + amuse-bouche auto) | ⛔ Absent | 🟠 HAUT (–50 % pourboire à la 15e min) |
| L14 | **Nettoyage dynamique par rupture de séquence** (trancheuse jambon cru → rôti cuit sans désinfection = bloque KDS) | ⛔ Pas de PMS dynamique | 🔴 CRITIQUE (Listeria) |

## 3.3 — Bar / sommellerie / freinte liquides

| # | Angle mort | Statut code | Criticité |
|---|---|---|---|
| L15 | **Inventaire flash quotidien alcool** (pesée bouteille au gramme près, variance vente) | ⛔ Absent (découverte uniquement à l'inventaire fin de mois) | 🟠 HAUT (coulage bar ~5-8 % marge) |
| L16 | **Bouteille bouchonnée** (workflow `BOTTLE_DEFECT_DISPUTE` → stock litige caviste) | ⛔ Suppression brute = perte fiscale | 🟡 MOYEN |
| L17 | **Freinte hydrostatique fût de bière** (coefficient 8-12 % configurable) | ⛔ Système compte 1 fût = 120 verres théoriques | 🟠 HAUT (fausse suspicion vol barman) |
| L18 | **Bec verseur connecté** (télémétrie doses réelles vs vente caisse) | ⛔ Aucun connecteur | 🟢 BAS (hardware payant) |
| L19 | **Bar moléculaire fermentation kombucha / sirop maison** (dégazage programmé + °Brix + pasteurisation) | ⛔ Absent | 🟡 MOYEN (risque explosion bouteille) |
| L20 | **Clear ice / indice dilution hydro-thermique en fiche cocktail** | ⛔ Recette mixologie sans indice | 🟢 BAS |

## 3.4 — Fiscal complémentaire (Section 1D complète)

| # | Angle mort | Statut code | Criticité |
|---|---|---|---|
| L21 | **Réforme acomptes 2023 (Art. 268 ter CGI)** → facture d'acompte avec ventilation TVA dès encaissement | ⛔ Acompte encaissé sans TVA immédiate | 🔴 CRITIQUE (infraction fiscale) |
| L22 | **Écriture d'écart de caisse au Z (compte 658)** (écart 35 € cash → écriture auto pertes exceptionnelles) | ⛔ Pas de génération auto | 🟠 HAUT |
| L23 | **Facture complémentaire nominative J+3** (client demande facture entreprise après ticket anonyme) | ⛔ Régénérer = doublon CA / rupture NF525 | 🟠 HAUT |
| L24 | **Ventilation TVA formule menu (5,5 / 10 / 20)** au prorata prix carte hors formule | 🚧 Existe côté `TaxCalculator` mais pas de test qui vérifie centime résiduel | 🟠 HAUT |
| L25 | **Bouton "Contrôle Fiscal Inopiné (Mode DGFiP)"** — génère archive légale zippée + eIDAS en <10 s 🟢 | ⛔ `FiscalArchiveExportPanel` MCC existe mais pas de bouton tenant "1 clic" — 🟢 ADR-014 débloque via `AuditLogger.exportChain()` | 🔴 CRITIQUE (amende 7 500 €/caisse pour obstruction Art. 1770 CGI) |
| L26 | **Registre Personnel Instantané (RPI)** exportable smartphone en 1 s pour contrôle URSSAF surprise | ⛔ Absent | 🟠 HAUT |
| L27 | **CONECS vs CB routing** (TR passe par CB standard = commission double) | ⛔ Pas de smart card routing | 🟡 MOYEN |

## 3.5 — Réception / stocks / mercuriale (compléments)

| # | Angle mort | Statut code | Criticité |
|---|---|---|---|
| L28 | **Denrées poids variable** (10 kg turbot → 9,42 kg livrés facturés au gramme) 🌊 | ⛔ Stock compte 8 unités, pas 8,34 kg — 🌊 collection `stocks` migrée offline (ADR-011) | 🟠 HAUT (rendement faux) |
| L29 | **OCR BL dégradés double passe** (OpenCV débruitage + Gemini Vision + seuil confiance <90 %) | 🚧 InvoiceExtractionService fait 1 passe seule | 🟡 MOYEN |
| L30 | **Substitution SKU sauvage** (beurre AOP → standard sans prévenir) → alerte variance scannette | ⛔ Absent | 🟠 HAUT (perte promesse "Fait maison AOP") |
| L31 | **Séquestre paiement fournisseur (avoir fantôme)** — retenue SEPA tant qu'avoir non crédité | 🚧 `DeliveryDisputeService` existe mais pas branché sur pipeline paiement | 🟠 HAUT |
| L32 | **Matrice compatibilité stockage volatile** (bananes → salades = éthylène → jaunissement) | ⛔ Absent | 🟡 MOYEN |
| L33 | **Flambée matière première** (beurre +40 % en 3 sem → recalcul marge live + suggestion réajustement tarif) | ⛔ Prix carte figés | 🟠 HAUT |
| L34 | **Sonde IoT température (Testo / Endress) + distinction panne radio vs vraie rupture froid** | ⛔ Pas de connecteur (déjà noté E2) | 🟠 HAUT |
| L35 | **Sonde vivier crustacés (O₂ dissous, T° eau, densité saline)** — mortalité massive nocturne | ⛔ Absent | 🟡 MOYEN (perte 900 € par vivier) |

## 3.6 — RH / conventions HCR (compléments)

| # | Angle mort | Statut code | Criticité |
|---|---|---|---|
| L36 | **Blocage planning si repos 11 h bafoué** (Art. L. 3131-1 CT) | ⛔ Aucun garde | 🟠 HAUT (faute inexcusable employeur) |
| L37 | **Redistribution pourboires CB défiscalisés** (compte 426, ventilation heures travaillées + émargement) | ⛔ Absent (déjà noté G) | 🟠 HAUT (redressement URSSAF sinon) |
| L38 | **Clôture auto badgeage au Z de caisse** (barman part sans badger à 1h → régularisation matin) | ⛔ Heures fictives générées | 🟠 HAUT |
| L39 | **DPAE express 60 s** (scan CNI + contrat eIDAS signé sur écran) | ⛔ Aucun module (voir G5) | 🔴 CRITIQUE (travail dissimulé) |
| L40 | **Mode "Flux Vaisselle Dégradé" (abandon plongeur)** — bascule menu vers assiettes jetables + notif RH | ⛔ Absent | 🟢 BAS |

## 3.7 — Hardware / résilience physique

| # | Angle mort | Statut code | Criticité |
|---|---|---|---|
| L41 | **Fallback routing imprimante** (rupture papier chaude → redirection auto vers passe-plat) | ⛔ Aucun mécanisme dans `printers/hardware/` | 🟠 HAUT |
| L42 | **Réconciliation TPE avant re-débit** (interroger journal transactionnel TPE si "En attente TPE" bloqué) | ⛔ Aucun protocole (client re-débité) | 🔴 CRITIQUE (double débit) |
| L43 | **UI tactile durcie zones 64x64 + swipe to action** (doigts mouillés en cuisine) | ⛔ Boutons standard | 🟡 MOYEN |
| L44 | **Ethernet PoE forcé pour KDS + WiFi 5/6 GHz mobile** (interférence micro-ondes 2.4 GHz) | ⛔ Pas de doc config réseau | 🟠 HAUT |
| L45 | **Redondance iPad terrasse surchauffe (>50 °C)** (bascule P2P sur téléphone collègue via QR) | ⛔ Absent | 🟡 MOYEN |
| L46 | **Blackout total mode P2P mesh** (tablettes communiquent sans box, TPE stand-in) 🌊 | 🚧 Sovereign collection = offline cache OUI (ADR-009→013), mais pas de mesh P2P entre tablettes. 🟢 DLQ replay-batch ADR-014 aide au recovery | 🟠 HAUT |

## 3.8 — Livraison / agrégateurs (compléments)

| # | Angle mort | Statut code | Criticité |
|---|---|---|---|
| L47 | **Cadençage KDS asservi GPS coursier** (allumage ticket cuisson seulement quand coursier <4 min) | ⛔ KDS traite delivery = commande statique salle | 🟠 HAUT |
| L48 | **Code PIN / QR unique pour libération sac** (protection vol par faux livreur) | ⛔ Sac posé en libre-service | 🟠 HAUT |
| L49 | **Double tarification carte livraison** (majoration auto pour absorber commission 30 % Uber) | ⛔ Prix salle = prix delivery | 🟠 HAUT (vente à perte silencieuse) |
| L50 | **Mode "Plan Pluie" 1 clic terrasse → to-go** (bascule 100 clients terrasse en emballages doggy bags) | ⛔ Absent | 🟡 MOYEN |

## 3.9 — Fraudes / criminalistique / RBAC

| # | Angle mort | Statut code | Criticité |
|---|---|---|---|
| L51 | **DAG immuable des lignes de commande** (UUID + horodatage KDS, interdiction transfert entre tables sans audit) 🟢 | 🚧 `NexusInterceptor` + `SovereignGuard` — 🟢 ADR-014 débloque via hash chain SHA-256 `previousHash + hash` | 🟠 HAUT |
| L52 | **Pesée intelligente déchets à quai** (sac poubelle >1,2 kg/L densité anormale = alerte) 🟢 | ⛔ Absent (vol par poubelle noble) — 🟢 DLQ batch replay ADR-014 aide au fix root cause post-alerte | 🟠 HAUT |
| L53 | **Détection sursaut avis Google (review bombing)** — export dossier signalement horodaté JET | ⛔ Aucune surveillance réputation | 🟠 HAUT |
| L54 | **Verrouillage Oracle vocal par JWT** (pas par contenu texte : "je suis le patron") | ✅ **DONE** — ADR-008 R5 + RBAC = tokens JWT, pas de bypass vocal | ✅ OK |
| L55 | **Détection anomalie hash chaîne fiscale** (rupture cryptographique → alerte auto) 🟢 | ⛔ Absent (noté MCC-C4) — 🟢 ADR-014 débloque via `AuditLogger.verifyChain(logs)` | 🟠 HAUT |
| L56 | **Alerte consultation en masse fiches clients** (démissionnaire exporte 5000 VIP) | ⛔ Aucun rate-limit ni signal faible | 🟠 HAUT (exfiltration RGPD) |

## 3.10 — Sanitaire / HACCP (compléments)

| # | Angle mort | Statut code | Criticité |
|---|---|---|---|
| L57 | **Plat témoin banquet >30 couverts** (100 g/plat conservé +2°C, 5 j ouvrés, QR scellé) | ⛔ Absent (obligation légale) | 🟠 HAUT (poursuite pénale si TIAC) |
| L58 | **Minuteur HACCP refroidissement rapide** (30 L blanquette >10 °C à H+1h45 = alerte critique) 🟢 | ⛔ Absent (arrêté 21/12/2009) — 🟢 ADR-014 débloque via `OutboxPriority.SANITAIRE` (drainé avant metrics) + `AuditLogger('CHILLING_NONCONFORM')` | 🔴 CRITIQUE (Clostridium perfringens) |
| L59 | **Registre test huile friture (composés polaires <25 %)** — bloque 1re commande friteuse si test non fait | ⛔ Absent (Décret 2008-184) | 🟠 HAUT (amende + fermeture DDPP) |
| L60 | **Veille sanitaire active RappelConso** (croisement auto lots huîtres en stock ↔ arrêtés préfectoraux) 🟢 | ⛔ Absent — 🟢 ADR-014 débloque via `CrossScopeAuthority.revealScope()` pour fanout multi-tenant + `AuditLogger('RECALL_BROADCAST')` | 🔴 CRITIQUE (40 TIAC vendredi soir = fermeture immédiate) |
| L61 | **Bordereau numérique biodéchets (loi 2024)** — pesée journalière + attestation valorisation annuelle 🟢 | ⛔ Absent — 🟢 ADR-014 débloque via `OutboxPriority.LEGAL` + `AuditLogger` hash chain | 🔴 CRITIQUE (jusqu'à 75 000 € amende + prison Art. L. 541-46 CE) |
| L62 | **Bordereau BSDD huiles alimentaires usagées (ISCC-EU)** | ⛔ Absent | 🟠 HAUT (amende DREAL 15 000 €) |
| L63 | **Sonde niveau bac à graisse (IoT)** — vidange auto à 80 % saturation | ⛔ Absent | 🟡 MOYEN |
| L64 | **Registre sécurité incendie ERP connecté** (test mensuel BAES scan NFC + rapport annuel Commission Sécurité) | ⛔ Absent (Art. R. 123-51 CCH) | 🟠 HAUT (fermeture administrative) |
| L65 | **Checklist ouverture avec déverrouillage optique issue de secours** (photo dégagement obligatoire avant 1re commande) | ⛔ Absent | 🟠 HAUT (drame si incendie) |
| L66 | **Détecteur ΔT/Δt hotte + coupure préventive gaz avant Ansul** (évite déclenchement inondation poudre corrosive) | ⛔ Absent | 🟠 HAUT (15 000 € perte exploitation) |
| L67 | **Protocole continuité coupure eau (bascule vaisselle jetable + eau minérale réserve)** 🟢 | ⛔ Absent (Paquet Hygiène CE 852/2004) — 🟢 ADR-014 débloque via `OutboxPriority.SANITAIRE` | 🟠 HAUT (fermeture sanitaire immédiate) |

## 3.11 — Économie / marge / réputation

| # | Angle mort | Statut code | Criticité |
|---|---|---|---|
| L68 | **RevPASH pastille couleur temps réel** (table qui descend <8 €/siège/h = pastille violette) | ⛔ Absent | 🟠 HAUT (1 850 €/mois manque à gagner) |
| L69 | **Durée prédictive par taille + menu** (table de 6 dégustation → interdit revente avant 22h15) | ⛔ Réservation rigide | 🟠 HAUT (double service chaotique) |
| L70 | **Menu engineering matrice étoiles/vaches/puzzles** + scoring par serveur | ⛔ Aucun rapport | 🟡 MOYEN (sabotage interne indétectable) |
| L71 | **Détection BIN bancaire smart card routing** (Amex Corporate US = 3,8 % au lieu de 0,4 % UE) | ⛔ Marge écrasée en silence | 🟡 MOYEN |
| L72 | **Overhead factor consommables (film étirable, alu, sacs sv)** (majoration auto 2,5-4 % coût matière) | ⛔ Coûts en frais généraux non rattachés | 🟢 BAS |
| L73 | **Recette self-healing BOM** (rupture ingrédient → Oracle propose substitution + recalcule coût portion) | ⛔ Absent | 🟡 MOYEN |
| L74 | **TrustScore anti-DDoS résa** (5 SIM prépayées annulent 6 tables à 19h58 → détection clusters IP + empreinte CB variable) | ⛔ Réservation sur simple numéro mobile | 🟠 HAUT (sabotage concurrentiel) |

## 3.12 — Événements B2B / palaces / audios

| # | Angle mort | Statut code | Criticité |
|---|---|---|---|
| L75 | **Horloge occupation salle + additif horaire auto** (séminaire dépasse 2h → ligne heures sup B2B) | ⛔ Absent | 🟡 MOYEN |
| L76 | **Smart token QR open bar forfaitaire** (chaque invité débite ses unités, journal opposable) | ⛔ Distribution plateau non traçable | 🟡 MOYEN |
| L77 | **Coffre-fort numérique objets perdus** (photo + N° série + décharge signature restitution) | ⛔ Absent (Art. 1952 C. Civ) | 🟡 MOYEN |
| L78 | **Vestiaire numérique QR + plafond responsabilité affiché** | ⛔ Absent | 🟡 MOYEN |
| L79 | **Jauge spatiale terrasse AOT** (verrouillage m² max = permis voirie mairie) | ⛔ Absent | 🟠 HAUT (amende 1 500 € + retrait AOT) |
| L80 | **Passerelle musique SACEM/SPRE certifiée** (interdit Spotify perso) | ⛔ Absent | 🟠 HAUT (redevance 1 200-3 500 €/an + PV) |
| L81 | **TPE bilingue "Service inclus / Optional gratuity"** (touristes US tip confusion) | ⛔ Absent | 🟡 MOYEN |
| L82 | **Facture apport d'affaires conciergerie palace + contrat B2B** (évite rétro-commission cash = corruption Art. 445-1 CP) 🟢 | ⛔ Absent — 🟢 ADR-014 audit trail cross-tenant via `CrossScopeAuthority` | 🟠 HAUT |
| L83 | **VIP guest link 2h avant repas** (confirmation directe préférences + allergies au client final, pas au concierge) 🟢 | ⛔ Absent — 🟢 ADR-014 débloque via `CrossScopeAuthority.revealScope()` | 🟠 HAUT (allergie mortelle transmise perdue) |
| L84 | **Détecteur profil "Inspecteur Michelin"** (solo mardi 19h45 + eau minérale + questions provenance = alerte VIP) | ⛔ Absent | 🟢 BAS |
| L85 | **Protocole "Code Ambre" client ivre** (1 clic → stop alcool + café offert + VTC facturé auto) | ⛔ Absent | 🟠 HAUT (responsabilité pénale patron Art. R. 3353-1 CSP) |

---

## 📊 Récapitulatif SECTION 3 (85 items enrichis)

| Criticité | Compte |
|---|---|
| 🔴 CRITIQUE | 11 (L3, L5, L6, L11, L14, L21, L25, L42, L58, L60, L61) |
| 🟠 HAUT | 45 |
| 🟡 MOYEN | 22 |
| 🟢 BAS | 6 |
| ✅ Déjà OK | 1 (L54) |

## 🎯 Top 15 consolidé (sections 1+2+3)

Bloqueurs légaux / fiscaux / sanitaires (les plus dangereux) :

1. **L61 — Biodéchets 2024** (jusqu'à 75 000 € + 2 ans prison)
2. **L60 — Veille RappelConso lots huîtres/coquillages** (fermeture + TIAC)
3. **L58 — Refroidissement rapide HACCP** (Clostridium mortel)
4. **L25 — Bouton contrôle DGFiP 10 s** (obstruction = 7 500 €/caisse)
5. **L21 — Facture d'acompte TVA immédiate 2023** (infraction fiscale continue)
6. **D5 — Refus vente si taxRate manquant** (Section 1)
7. **D1 — Test E2E FEC DGFiP conforme** (Section 1)
8. **B4 / L11 — Blocage allergène par lot** (choc anaphylactique)
9. **L42 — Réconciliation TPE avant re-débit** (client double débité)
10. **L14 — Rupture séquence désinfection trancheuse** (Listeria)

Bloqueurs opérationnels (perte cash récurrente) :

11. **L15 — Inventaire flash alcool** (coulage 5-8 % marge bar)
12. **L47/L49 — GPS coursier + double tarif delivery** (vente à perte cachée)
13. **L46 — Mesh P2P blackout total** (survie coupure électrique/réseau)
14. **L68 — RevPASH pastille table squatting** (1 850 €/mois × N tables)
15. **MCC-E2 — MFA obligatoire super_admin MCC** (compromission flotte)

---

**Réf. sources** : `docs/archive/anglemort.md` (théorique, 1392 lignes, 100+ items),
codebase snapshot `81090dc53` + `79deee9d5`.

---

# 🏛️ SECTION 4 — Matrice Universelle 101-110 (Partie 12 anglemort.md)

Ces 10 items sont déjà **pré-structurés** selon les 4 piliers d'ingénierie
(EventBus + DLQ + RBAC + Settings). Grâce à ADR-014, on peut les implémenter
directement avec `OutboxPriority`, `AuditLogger` et `CrossScopeAuthority`.

| # | Domaine | Event | DLQ | RBAC | Settings | Statut code | Criticité |
|---|---|---|---|---|---|---|---|
| M101 | **Arrival Flow Pacing** — cadence arrivées par tranche 15 min | `commerce.reservation_pacing_saturated` | Outbox Backoff Retry | `reservations.manage_pacing` (Manager + PIN) | `maxCoversPerPacingSlot`, `pacingSlotMinutes`, `pacingAutoThrottleOnKDSDelay` | ⛔ Absent | 🟠 HAUT |
| M102 | **Table Split No-Show partiel** — libérer demi-table 8→3 | `ops.table_split_released` | Local Outbox Fallback | `reservations.force_split` (Chef rang) | `autoPromptSplitOnPartialCheckIn`, `partialNoShowGracePeriodMinutes` | ⛔ Absent | 🟠 HAUT |
| M103 | **SMS Silent Drop international** — E.164 + fallback email | `system.sms_delivery_failed` | Auto Fallback Email DLQ | `reservations.view_pii` (Chef rang) | `smsStrictE164Validation`, `smsFallbackToEmail`, `smsInternationalAllowed` | 🚧 Webhook Twilio inbound existe, pas de fallback outbound | 🟠 HAUT |
| M104 | **CAS Google Reserve vs Widget Web** — collision 19h59m58s | `commerce.table_lock_acquired` | Auto-release lock 5 min | `reservations.resolve_conflict` (Manager) | `googleReserveHoldTimeoutMinutes`, `conflictResolutionStrategy` | ⛔ Pas de lock CAS atomique | 🔴 CRITIQUE (surbooking destructeur) |
| M105 | **SMS GSM-7 vs UCS-2 trap** — emoji multiplie facture ×4 | `system.sms_segment_warning` | GSM-7 Sanitizer Filter | `reservations.edit_templates` (Manager) | `smsForceGSM7Sanitization`, `smsMaxSegmentsAllowed` | ⛔ Absent | 🟡 MOYEN (facture ×4 silencieuse) |
| M106 | **Anti-bruteforce cancel link** — HMAC SHA-256 constant-time | `security.unauthorized_access_attempt` | IP Throttle + DLQ Audit | `reservations.regen_token` (Manager) | `selfServiceCancelWindowHours`, `requirePhoneLastDigitsOnCancel` | ⛔ Aucune signature HMAC | 🔴 CRITIQUE (annulation en masse concurrent) |
| M107 | **Anti-DST timezone touriste** — NY 15h ≠ Lyon 20h | `commerce.reservation_timezone_normalized` | UTC Absolute Guard | `system.set_timezone` (Directeur) | `tenantTimezone: 'Europe/Paris'`, `displayBookingTimezoneBadge` | ⛔ Fuseau tenant non forcé | 🟠 HAUT |
| M108 | **Turnover Collision 2e service** — table lente 21h25 vs 21h30 | `ops.turnover_delay_predicted` | KDS Stage Heuristic Ping | `reservations.reassign_tbl` (Chef rang) | `turnoverBufferMinutes`, `overstayAlertThresholdMinutes` | ⛔ Durée service = 120 min théorique fixe | 🟠 HAUT (double service chaotique) |
| M109 | **Giftcard double-spend web vs caisse** — bon 100 € réutilisé | `finance.giftcard_locked` | NF525 Seal Hold Rollback | `marketing.issue_giftcard` (Manager + PIN) | `allowPartialGiftCardRedemption`, `giftCardValidityMonths` | ⛔ Pas de verrou déterministe temps réel | 🔴 CRITIQUE (perte cash directe) |
| M110 | **Late allergen change post-envoi KDS** — allergie ajoutée 15 min avant arrivée 🟢 | `kds.critical_allergen_interception` | Flash Buzzer DLQ Alarm | `kds.override_allergen` (Chef cuisine + PIN) | `allergenLateChangeThresholdHours`, `forceKDSAudioAlertOnAllergenUpdate` | ⛔ Absent (voir aussi L11, B4) — 🟢 ADR-014 `OutboxPriority.SANITAIRE` + `AuditLogger` | 🔴 CRITIQUE (choc anaphylactique) |

---

## Matrice RBAC granulaire réservations (Section 3 Partie 12)

Extraite du doc archivé — définit qui peut faire quoi + code PIN obligatoire.
À câbler via `useActionPermission(domain, action)` (composant à créer).

| Action | Rôle min | PIN | Angle mort adressé |
|---|---|---|---|
| `reservations.view` | Hôtesse / Serveur | Non | Consultation liste |
| `reservations.create` | Hôtesse / Serveur | Non | Nouvelle réservation |
| `reservations.modify` | Hôtesse / Serveur | Non | Date/heure/couverts |
| `reservations.cancel` | Chef de rang | Non | Annulation client |
| `reservations.manage_pacing` | Manager | **Oui** | M101 |
| `reservations.force_split` | Chef de rang | Non | M102 |
| `reservations.edit_templates` | Manager | Non | M105 |
| `reservations.reconfirm_guest` | Hôtesse | Non | Rappel manuel |
| `reservations.view_pii` | Chef de rang | Non | M103 (RGPD scope) |
| `reservations.override_capacity` | Manager | **Oui** | Forçage surbooking |
| `reservations.apply_penalty` | Manager | **Oui** | Débit caution no-show |

---

# 🧩 SECTION 5 — Compléments tableau 100 (items non encore couverts)

Items du tableau périodique (Partie 10 anglemort.md) qui ne sont pas déjà
dans les sections 1-3.

## 5.1 — Salle / encaissement

| # tableau | Angle mort | Statut | Criticité |
|---|---|---|---|
| T08 | **Grivèlerie / Dine & Dash** — table de 6 part sans payer | ⛔ Aucun workflow "table walk-out" avec dépôt de plainte auto | 🟡 MOYEN |
| T10 | **Note de frais antidatée** — client demande facture 15 j plus tard avec date décalée | ⛔ Aucun garde-fou (voir L23 : facture complémentaire nominative) | 🟠 HAUT |

## 5.2 — Cuisine / production

| # | Angle mort | Statut | Criticité |
|---|---|---|---|
| T16 | **Viande non reposée post-grill** — sortie four à cœur immédiat → jus perdus | ⛔ Fiche recette sans temps repos obligatoire | 🟢 BAS |
| T17 | **Synchronisation Chaud / Froid** — entrées arrivent avant plats chauds | 🚧 Existe partiellement dans micro-séquençage KDS (voir L12) | 🟡 MOYEN |
| T26 | **Décongélation à l'eau chaude** (interdit sanitaire) | ⛔ Aucun contrôle protocole décongélation | 🟠 HAUT |

## 5.3 — Hygiène / HACCP

| # | Angle mort | Statut | Criticité |
|---|---|---|---|
| T28 | **Nuisibles / raticide** — traces rongeurs, absence traitement mensuel | ⛔ Aucun registre 3D (Dératisation/Désinsectisation/Désinfection) | 🟠 HAUT |
| T29 | **Produit d'entretien mal rincé** — résidu javel sur plan de travail | ⛔ Aucun contrôle "cycle rinçage validé" | 🟠 HAUT |
| T30 | **Contrôle vétérinaire DDPP** — inspecteur DDPP arrive inopiné 🟢 | ⛔ Pas de "mode contrôle sanitaire" 1-clic (equivalent L25 pour DGFiP) — 🟢 ADR-014 débloque via `AuditLogger.exportChain()` avec filtre HACCP | 🔴 CRITIQUE (fermeture administrative) |

## 5.4 — Fiscal / compta

| # | Angle mort | Statut | Criticité |
|---|---|---|---|
| T36 | **Requalification "geste commercial"** en pratique commerciale trompeuse | ⛔ Voir L4 (offert directeur non tracé) | 🟠 HAUT |
| T38 | **Facture cession inter-sociétés** — 2 restos même groupe, refacturation | ⛔ Aucun workflow B2B intra-groupe | 🟡 MOYEN |

## 5.5 — Livraison / dark kitchen

| # | Angle mort | Statut | Criticité |
|---|---|---|---|
| T44 | **Packaging ramollit frites** — barquettes non thermiques | ⛔ Aucun catalogue packaging + coût imputé | 🟢 BAS |
| T45 | **Suspension compte algorithmique** Uber Eats (fake reasons) | ⛔ Aucun watchdog qui alerte si taux notes <4.5 | 🟠 HAUT (canal 30 % CA coupé sans préavis) |
| T46 | **Annulation commande en route** par le client via Uber | ⛔ La cuisine continue à préparer, perte matière | 🟡 MOYEN |
| T47 | **Erreur d'adresse client** — livreur perdu | ⛔ Aucun scoring adresse | 🟢 BAS |
| T48 | **Alerte allergène delivery** — pas transmise dans la note delivery 🟢 | ⛔ Voir L11 (INCO par lot) — 🟢 ADR-014 `AuditLogger('ALLERGEN_ORDER_BLOCKED')` | 🔴 CRITIQUE |
| T49 | **Mauvais taux TVA livraison** — TVA 5,5 % à emporter vs 10 % sur place | ⛔ Ambiguïté taxRate selon `consumptionMode` | 🟠 HAUT |
| T50 | **Litige "repas froid"** — remboursement Uber prélevé sans preuve | ⛔ Aucune preuve photo horodatée à la sortie cuisine | 🟡 MOYEN |

## 5.6 — Logistique / achats

| # | Angle mort | Statut | Criticité |
|---|---|---|---|
| T55 | **Rupture cut-off dimanche 23h** — commande passée après horaire fournisseur | ⛔ Aucun calendrier cut-off par fournisseur | 🟡 MOYEN |
| T56 | **Franco de port non optimisé** — commande 189 € au lieu de 200 € = 15 € frais | ⛔ Aucune suggestion "ajouter 11 €" pour franco | 🟢 BAS |
| T57 | **DLC secondaire J+3 non étiquetée** — reste ouvert non daté | ⛔ Aucun label J+3 auto à l'ouverture emballage | 🟠 HAUT |
| T59 | **Dérive prix fournisseur > 5 %** — hausse silencieuse d'un article | ⛔ Aucun watchdog "alerte si prix +5 % vs mercuriale précédente" | 🟠 HAUT |
| T60 | **Transfert bar ➔ cuisine non tracé** — bouteille passée en cuisine pour flambage | ⛔ Aucune trace inter-postes | 🟡 MOYEN |

## 5.7 — RH / droit du travail (compléments)

| # | Angle mort | Statut | Criticité |
|---|---|---|---|
| T64 | **Amplitude shift > 13h** interdite HCR | ⛔ Voir L36 (bloc planning 11h repos) | 🟠 HAUT |
| T67 | **Majoration heures de nuit** (22h-06h HCR : +30 %) | ⛔ NexusPayrollEngine squelette (voir G1) | 🟠 HAUT |
| T68 | **Accident du travail brûlure huile** — déclaration CPAM 48h obligatoire | ⛔ Aucun workflow AT en 3 clics | 🟠 HAUT |
| T69 | **Fausse déclaration repos hebdo** — manager coche sans preuve | ⛔ Aucune preuve horodatée | 🟡 MOYEN |

## 5.8 — Matériel physique (compléments)

| # | Angle mort | Statut | Criticité |
|---|---|---|---|
| T78 | **Saut de phase électrique** four triphasé | ⛔ Aucune détection ampérage | 🟡 MOYEN |
| T79 | **Décrochage Bluetooth imprimante** en plein service | ⛔ Voir L41 (fallback routing absent) | 🟠 HAUT |

## 5.9 — Cyber / réputation (compléments)

| # | Angle mort | Statut | Criticité |
|---|---|---|---|
| T88 | **Chantage "1 étoile Google"** — client menace en salle si pas de geste co | ⛔ Aucun processus escalade + preuve JET | 🟡 MOYEN |
| T89 | **Faux corps étranger dans plat** — arnaque professionnelle | ⛔ Aucune vidéo dressage horodatée | 🟠 HAUT |
| T90 | **Fuite emails RGPD** — export CSV vers un ancien salarié | ⛔ Voir L56 (rate-limit consultation VIP absent) | 🟠 HAUT |

## 5.10 — Environnement / flux (compléments)

| # | Angle mort | Statut | Criticité |
|---|---|---|---|
| T94 | **Éthylotest de nuit absent** — obligation ERP bars > 22h | ⛔ Aucun registre contrôle | 🟠 HAUT (amende + fermeture) |
| T95 | **Asphyxie CO₂ sous-sol** — soutireuse tirage bière fuit dans cave | ⛔ Aucun capteur CO₂ | 🔴 CRITIQUE (danger mortel personnel) |
| T96 | **Maturation viande RH % déréglée** — chambre à 45 % → moisissure | ⛔ Aucune sonde RH% + alerte | 🟠 HAUT (perte stock premium) |
| T98 | **Saturation CO₂ salle > 1800 ppm** — coup de pompe clients hiver | ⛔ Aucun capteur NDIR + régulation VMC | 🟡 MOYEN (baisse ventes desserts) |

---

# 📊 GRAND TOTAL CONSOLIDÉ (audit complet)

| Origine | Items | Note |
|---|---|---|
| Section 1 — Restaurant (initial) | 45 | audit code direct |
| Section 2 — MCC (initial) | 29 | audit code direct |
| Section 3 — Enrichissement `anglemort.md` L1-L85 | 85 | cross-check théorique |
| Section 4 — Matrice 101-110 (M101-M110) | 10 | déjà structuré EventBus/DLQ/RBAC/Settings |
| Section 4 bis — RBAC granulaire réservations | 11 actions | matrice permissions |
| Section 5 — Compléments tableau 100 (T-prefix) | 34 | items restants du tableau 100 |
| **TOTAL** | **203 angles morts + 11 permissions** | |

## 🎯 Top 20 consolidé après enrichissement complet

**Bloqueurs légaux / fiscaux / sanitaires (11)** :
1. **L61** biodéchets 2024 (75 k€ + 2 ans prison)
2. **L60 + T30** RappelConso + contrôle DDPP inopiné
3. **L58** refroidissement HACCP (Clostridium mortel)
4. **L25** bouton contrôle DGFiP 10 s
5. **L21** facture d'acompte TVA 2023 (Art. 268 ter CGI)
6. **D5 + T49** refus vente si taxRate manquant + TVA livraison 5,5/10 %
7. **D1** test E2E FEC DGFiP conforme
8. **B4 + L11 + M110 + T48** allergène mortel bloqué (POS + KDS + delivery + late change)
9. **L42** réconciliation TPE avant re-débit (client double débité)
10. **L14** rupture séquence désinfection trancheuse (Listeria)
11. **T95** capteur CO₂ sous-sol soutireuse (danger mortel)

**Bloqueurs opérationnels majeurs (5)** :
12. **M104** collision CAS Google Reserve vs Widget Web
13. **M106** anti-bruteforce cancel link (HMAC)
14. **M109** giftcard double-spend web vs caisse
15. **L15** inventaire flash alcool (coulage 5-8 % marge bar)
16. **T45** watchdog suspension Uber Eats (canal 30 % CA)

**Protection compte critique (4)** :
17. **MCC-E2** MFA obligatoire super_admin MCC
18. **L46** mesh P2P blackout total
19. **T88 + T89** chantage 1 étoile + faux corps étranger (preuve horodatée)
20. **L68** RevPASH pastille table squatting (1 850 €/mois × N tables)

## 🧭 Ce qui est débloqué par ADR-014 (fondations livrées 2026-08-21)

Les items suivants peuvent maintenant être implémentés SANS shortcut :

| Item | Fondation ADR-014 utilisée |
|---|---|
| L11 / B4 / M110 / T48 | `AuditLogger.logAction('ALLERGEN_ORDER_BLOCKED')` |
| L25 / T30 | `AuditLogger.exportChain()` — bouton "génère archive 10 s" |
| L51 | Hash chain SHA-256 `previousHash + hash` |
| L52 / L46 | `POST /api/admin/dlq/replay-batch` (post fix root cause) |
| L55 | `AuditLogger.verifyChain()` — détection anomalie |
| L58 | `OutboxPriority.SANITAIRE` — drainé avant metrics |
| L60 / T48 | `CrossScopeAuthority.revealScope()` — fanout tenants |
| L61 | `OutboxPriority.LEGAL` + `AuditLogger` biodéchets |
| L67 | `OutboxPriority.SANITAIRE` — coupure eau protocole |
| L82 / L83 | `CrossScopeAuthority` audit trail conciergerie |
| MCC-E2 | `AuditLogger.logAction('MFA_ENABLED')` |
| MCC-E4 | `AuditLogger.exportChain()` forensique |
| MCC-C4 | `AuditLogger.verifyChain()` chaîne fiscale |
| M110 | Event `kds.critical_allergen_interception` + `OutboxPriority.SANITAIRE` |

---

**Réf. sources finales** : `docs/archive/anglemort.md` (1392 lignes, 100+ items théoriques),
`docs/adrs/ADR-014-consolidation-fondations-anglemorts.md` (fondations débloquées),
codebase snapshot `7fced2b9e`.
