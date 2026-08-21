# 🔍 Angles morts — Verticale restaurant + MCC

> Audit **concret** basé sur l'état actuel du code (2026-08-21).
> Ne pas confondre avec `docs/archive/anglemort.md` qui est un audit théorique
> systémique des 45 angles morts métier (référence conceptuelle).

Chaque item est classé par **criticité** :
- 🔴 **CRITIQUE** — bloque une vente ou casse en prod
- 🟠 **HAUT** — dégrade l'expérience ou expose à un incident
- 🟡 **MOYEN** — feature déclarée mais UI/logique partielle
- 🟢 **BAS** — dette technique, à traiter opportunistement

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
| B4 | **Contrôle allergènes : bloc UI présent mais pas de refus commande** | 🔴 CRITIQUE | Un serveur peut valider une commande "vegan" qui contient du beurre. Aucun garde-fou. Risque juridique majeur (INCO 1169/2011). |
| B5 | **Bump interception par station : pas de "rappel plat" si serveur ne prend pas dans les 3 min** | 🟢 BAS | UX HCR standard, absent. |

### Zone C — Plan de salle & Réservations

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| C1 | **Google Reserve : types définis mais webhook GRR non enregistré côté Google** | 🟠 HAUT | Types `GoogleReserveTypes` existent, mais pas de handshake OAuth Google avec le compte du tenant. Le canal de réservation "Réserver via Google" n'est pas activable en 1 clic. |
| C2 | **TheFork / Zenchef : 0 connector concret** | 🟡 MOYEN | Mentionné comme source dans `Reservation.source` mais aucun adapter d'ingestion. Les réservations TheFork doivent être saisies manuellement. |
| C3 | **Overbooking : pas d'algorithme de rotation table (turn time)** | 🟠 HAUT | Le système accepte 2 réservations sur la même table à 20h et 22h sans vérifier la durée de service. |
| C4 | **Waitlist / file d'attente : pas de composant** | 🟡 MOYEN | Le maître d'hôtel n'a pas d'écran pour gérer les clients qui attendent une table. |
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
| J1 | **Adapter `useSovereignCustomers` livré Phase 4, mais `CustomersDirectory.tsx` seul composant, pas de fiche détail** | 🟢 BAS | Impossible de voir l'historique complet d'un client (visites, dépenses, remarques). |
| J2 | **Loyalty tier auto-promotion (bronze→silver→gold selon lifetime points) : non implémenté** | 🟡 MOYEN | Manuel via `setTier`. Pas de règles automatiques. |
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
| MCC-B1 | **`TenantHealthPanel` récupère un score via `/api/…`, mais aucun scoring backend qui alimente vraiment cette route** | 🔴 CRITIQUE | Le panel affiche des scores placeholder. Cf. `docs/afaire.md` (bloqueur Observabilité). |
| MCC-B2 | **`FleetTelemetryPanel` + `EventBusHealthPanel` — dépendants d'OpenTelemetry non installé** | 🔴 CRITIQUE | Voir ADR-011 P3 SRE + `docs/afaire.md`. |
| MCC-B3 | **`HardwareHealthGrid` : pas de connecteur MDM (Jamf, Intune, TinyMDM) pour piloter les iPads en flotte** | 🟠 HAUT | Un iPad d'un client planté → impossible de forcer reboot / update depuis le MCC. |
| MCC-B4 | **`DisasterRecoveryPanel` : UI présente, mais pas de vrais restore drills mensuels planifiés** | 🟠 HAUT | Backup nocturne OK (P0), restore jamais testé automatiquement. |

### Zone MCC-C — Support IA + fiscal + audit

| # | Angle mort | Criticité | Détail |
|---|---|---|---|
| MCC-C1 | **`SupportAIPanel` + `SupportDraftsPanel` opérationnels (ADR-008)** | ✅ OK | Rien à signaler. |
| MCC-C2 | **`FiscalArchiveExportPanel` : export WORM implémenté, mais pas de rétention 6 ans enforcée par la config** | 🟠 HAUT | Article 102 LPF : conservation 6 ans obligatoire. Actuellement aucune règle backend ne bloque une purge < 6 ans. |
| MCC-C3 | **`TaxAuditPanel` : filtre date sur route mais scoring "risque fiscal par tenant" pas implémenté** | 🟡 MOYEN | Un auditeur MCC doit ouvrir chaque tenant un par un. |
| MCC-C4 | **`FiscalChainExplorer` : navigue la chaîne de sceaux mais pas de "détection anomalie hash"** | 🟠 HAUT | Si un sceau est corrompu (rupture chaîne), aucune alerte automatique. |
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
| MCC-E2 | **`MFAGate` + `TrustedDevicePanel` : composants OK, mais MFA obligatoire pas enforcée pour `mcc_super_admin`** | 🔴 CRITIQUE | Un super_admin compromis = accès à toute la flotte. |
| MCC-E3 | **Session TTL : pas de rotation forcée toutes les 12h côté MCC** | 🟠 HAUT | Un token volé reste valide 30 j (Firebase default). |
| MCC-E4 | **`AuditLogger` / `ImmunityAuditLogger` : logs présents mais pas de rétention chiffrée + export forensique** | 🟠 HAUT | En cas d'incident, l'auditeur externe ne peut pas récupérer les logs signés. |

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
