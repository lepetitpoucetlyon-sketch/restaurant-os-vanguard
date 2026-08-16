# 📋 Roadmap & Spécifications — Profils UX & Modes Métier

Ce document recense les spécifications des 4 modes d'expérience utilisateur (UX Profiles) à construire pour adapter **RESTAURANT-OS-CORE** aux spécificités de chaque type d'établissement.

---

## 🍔 1. Mode Fast-Food / Vente à Emporter (Takeaway & Fast-Casual)

### Objectif UX
Maximiser la vitesse de prise de commande et d'encaissement sur les flux à fort volume.

### Fonctionnalités à Construire
- [ ] **Encaissement Ultra-Rapide (1-Click Checkout)** : Boutons de paiement direct (Espèces exactes, CB Sans Contact, Ticket Resto) sans passer par l'écran intermédiaire de rendu de monnaie.
- [ ] **Masquage Automatique du Plan de Salle** : Redirection directe sur le catalogue POS dès l'ouverture d'une nouvelle session.
- [ ] **Écran de Retrait Client (Customer Order Display)** : Interface de file d'attente pour écran externe (Commandes en préparation vs Commandes prêtes).
- [ ] **Propositions de Vente Incitative (Upselling Auto)** : Pop-up ou suggestion automatique de menus, boissons et desserts lors de la sélection des plats principaux.

---

## 🍷 2. Mode Gastronomique / Service à Table (Fine Dining)

### Objectif UX
Offrir une gestion fluide du service en salle, du suivi de table et de la personnalisation client.

### Fonctionnalités à Construire
- [ ] **Plan de Salle 3D / 2D Interactif** : Visualisation en temps réel de l'état des tables (Libre, Occupée, En attente addition, À nettoyer).
- [ ] **Gestion des Suites de Plats (Order Pacing)** : Envoi différencié en cuisine (Réclame Entrées, Plats, Desserts) déclenchable depuis le POS mobile du serveur.
- [ ] **Fiche Client & Préférences (CRM Table)** : Historique des visites, régimes alimentaires, allergies et préférences de vin intégrés directement sur la fiche table.
- [ ] **Partage & Division d'Addition Complexe** : Séparation de la note par convive, par produit ou division égale en $N$ personnes.

---

## 🍸 3. Mode Bar / Nightclub (High-Volume Nightlife)

### Objectif UX
Garantir un service ultra-rapide dans un environnement sombre à forte intensité.

### Fonctionnalités à Construire
- [ ] **Gestion des Onglets / Ardoises Client (Bar Tabs)** : Ouverture d'une ardoise par empreinte CB ou nom de client avec encaissement différé en fin de nuit.
- [ ] **Raccourcis Boissons Géants (Quick Grid)** : Grille tactile grand format pour les alcools, cocktails et pressions les plus vendus.
- [ ] **Theme Dark Contrast UI** : Interface à fort contraste visuel (Néon & Noir profond) optimisée pour la pénombre des établissements de nuit.
- [ ] **Mode Happy Hour Automatique** : Basculement automatique des tarifs selon des plages horaires paramétrables.

---

## 🛵 4. Mode Dark Kitchen (Delivery & Multi-Brand)

### Objectif UX
Centraliser la production culinaire et rationaliser l'expédition des livreurs.

### Fonctionnalités à Construire
- [ ] **Focus 100% KDS (Kitchen Display System)** : Interface d'écran de cuisine plein écran optimisée par poste de cuisson (Chaud, Froid, Emballage).
- [ ] **Agrégation Multi-Plateformes (Deliveroo, UberEats, JustEat)** : Centralisation de tous les flux de commandes externes sur un seul écran sans multiplier les tablettes.
- [ ] **Gestion des Marques Virtuelles (Multi-Branding)** : Distinction visuelle claire de la marque virtuelle associée à chaque commande pour l'emballage.
- [ ] **Gestion du Dispatch Livreurs** : Notification sonore et visuelle dès l'arrivée du livreur pour remise en main propre immédiate.

---

## 🦾 5. Nexus Sovereign Desktop Sidecar & Local OS Bridge (L'Agent Compagnon Local)

### 🎯 Vision & Proposition de Valeur
Permettre au patron de connecter son application Web/Desktop directement au système d'exploitation de son ordinateur (Mac / Windows / Linux) via un **Démon Local Souverain** (inspiré de *Claude Code / OpenCode / MCP Local*). 

Le Copilote IA (`UniversalAssistantFrame`) ne se contente plus de répondre à des questions : **il agit directement sur les fichiers, dossiers, scans, imprimantes et périphériques locaux du patron** en toute sécurité, éliminant 100% des tâches administratives manuelles répétitives.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🖥️ ORDINATEUR DU PATRON (Mac / Windows)                                      │
│                                                                             │
│  [~/Téléchargements]   [~/Documents/Factures]   [Scans RH]   [Clé USB Backup]│
│          ▲                     ▲                     ▲              ▲       │
│          └─────────────────────┼─────────────────────┴──────────────┘       │
│                                ▼                                            │
│                 [ 🦾 NEXUS DESKTOP SOVEREIGN SIDECAR ]                      │
│                   (Démon local Node.js / Rust sur localhost)                │
│                                ▲                                            │
│                      (WebSocket Local Sécurisé / MCP)                       │
│                                ▼                                            │
│  🌐 RESTAURANT OS / UNIVERSAL COMMERCE OS (Navigateur / App Desktop)        │
│     💬 Copilote IA (UniversalAssistantFrame & AssistantActionDispatcher)   │
│        "3 factures Metro et 1 relevé bancaire détectés sur votre Mac.       │
│         Voulez-vous que j'injecte les stocks et réconcilie la compta ?"     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 🧱 Architecture Technique & Protocole de Communication

1. **Le Démon Local (`nexus-sidecar-daemon`)** :
   * Démon léger (binaire autonome Rust ou script Node.js/Electron) exécuté en arrière-plan sur `localhost:9625`.
   * **Handshake de Sécurité Zéro-Trust** : Clé API locale générée lors du premier jumelage (`~/.nexus/local-auth-token`) avec chiffrement TLS local.
   * **Protocole MCP (Model Context Protocol)** : Exposition des outils locaux sous forme de serveur MCP standardisé (`read_file`, `list_directory`, `move_file`, `scan_lan_printers`, `mount_cold_vault`).

2. **Le Pont Frontend / Copilote IA** :
   * Hook React `useLocalDesktopBridge()` interrogeant automatiquement `localhost:9625/status`.
   * Pastille verte *"🖥️ Démon Local Connecté (MacBook Pro)"* dans l'interface de l'assistant.
   * Dispatch des intentions de l'utilisateur vers le démon local via `AssistantActionDispatcher`.

---

### ⚙️ Les 6 Moteurs Autonomes du Compagnon Local

#### 1. 📂 Moteur 1 : Moissonneur & OCR de Factures / BL (`LocalInvoiceHarvester`)
* **Détection Continue** : Surveille le dossier `~/Downloads`, `~/Documents/Factures` ou un dossier surveillé paramétrable.
* **Extraction Intelligente** :
  * Détection automatique des formats (PDF, scan PNG/JPEG).
  * OCR & Extraction structurée par Gemini Vision / LLM local (Fournisseur, SIRET, N° Facture, Date, Échéance, Taux TVA 5.5/10/20%, Lignes de produits, Prix unitaires HT/TTC).
* **Injection Automatique** :
  * Création du Bon de Réception dans le Pilier `LOGISTICS` (`receptionLogsNodeAtom`).
  * Décrémentation/Incrémentation des stocks et mise à jour du PRMP (Prix de Revient Moyen Pondéré).
  * Génération de l'écriture d'achat dans le Grand Livre `FINANCE` (`JournalEntry`).
  * Déplacement et renommage automatique du fichier traité (`~/Documents/Archives_Compta/2026/08/METRO_20260815_FAC-4921.pdf`).

#### 2. 🏦 Moteur 2 : Rapprochement Bancaire & Relevés (`LocalBankReconciler`)
* **Détection des Relevés** : Détecte les exports bancaires téléchargés depuis les banques pro (Qonto, Shine, BNP, SG, Crédit Agricole) aux formats `.csv`, `.ofx`, `.qif`.
* **Matching Écritures vs Encaissements** :
  * Rapprochement automatique des encaissements CB/TPE et espèces avec les clôtures de caisse (Tickets Z NF525).
  * Pointage des virements fournisseurs avec les factures d'achat enregistrées.
  * Détection d'anomalies : frais bancaires imprévus, doubles prélèvements, rejets de paiement.
  * Marquage des factures en statut `PAID` et alerte de trésorerie en temps réel.

#### 3. 🧑‍💼 Moteur 3 : Scanner & Dématérialisation RH (`LocalHRVault`)
* **Traitement des Pièces Justificatives** :
  * Le patron dépose un scan de CNI, Titre de séjour, RIB, Carte Vitale ou Arrêt Maladie sur son bureau.
  * L'agent local analyse le document, applique le masquage PII (`redactPII`) sur les éléments sensibles conformément au RGPD, et l'associe directement à la fiche du salarié dans le Pilier `HUMAN`.
* **Génération & Signature Locale de Contrats** :
  * Génération des DPAE et des contrats de travail pré-remplis au format PDF sur l'ordinateur, prêts pour signature électronique locale ou eIDAS.

#### 4. 🖨️ Moteur 4 : Découverte & Configuration Réseau Hardware (`LocalNetworkHardwareProbe`)
* **Auto-Discovery sur le LAN / WiFi** :
  * Scan ARP/mDNS du réseau local du restaurant/commerce.
  * Détection automatique des imprimantes thermiques ESC/POS (port 9100), imprimantes étiquettes, terminaux TPE IP (Pax, Ingenico, Stripe Terminal) et passerelles IoT (sondes de température BLE Testo).
* **Zero-Config Deployment** :
  * Injection automatique des adresses IP dans la configuration de l'OS (`HardwareProvisioningService`), éliminant tout besoin d'intervention technique manuelle.

#### 5. 📑 Moteur 5 : Passerelle Logiciels Comptables Historiques (`LocalAccountingBridge`)
* **Export Silencieux vers les Logiciels d'Expertise** :
  * Génération mensuelle des exports conformes aux formats des logiciels des comptables : **Sage, Cegid, EBP, Quadra, ACD, Agiris**.
  * Dépôt automatique des fichiers FEC (Fichier des Écritures Comptables) et des journaux de vente dans les dossiers synchronisés locaux (Dropbox, Google Drive, OneDrive).

#### 6. 🔐 Moteur 6 : Coffre-Fort Physique & Sauvegarde Hors-Ligne (`ColdVaultBackupEngine`)
* **Scellement Cryptographique Hors-Ligne** :
  * Détection des supports de stockage physiques connectés (Clé USB, Disque dur externe).
  * Export quotidien à la clôture Z de l'archive chiffrée (AES-256-GCM + signature SHA-256) contenant le grand livre fiscal NF525, les tickets scellés et les fiches stocks.
  * Garantie de reprise d'activité immédiate même en cas de coupure Internet totale de plusieurs jours.

---

### 🛡️ Matrice de Sécurité & Garde-Fous (Zero-Trust Local)

1. **Sandboxing Strict (Allowlist de Dossiers)** :
   * L'agent local n'a accès qu'aux répertoires explicitement autorisés par le patron lors de la configuration (ex: `~/Downloads`, `~/Documents/RestaurantOS`). Interdiction absolue d'accès aux dossiers système ou données personnelles tierces.
2. **Porte d'Autorisation Humaine (Human-in-the-Loop Gate)** :
   * Toute action modifiant la comptabilité, le stock ou déplaçant des fichiers nécessite une validation en 1 clic sur l'interface du Copilote IA (`ActionProposalCard`).
3. **Audit Trail Local Inaltérable** :
   * Chaque action de lecture, copie ou injection est horodatée et loguée localement dans `~/.nexus/audit.log` pour une traçabilité totale.

---

### 💬 Exemples d'Interactions Patron ➔ Copilote IA

* **Scénario 1 : Facturation & Stocks** :
  > 👤 **Patron** : *"Nexus, regarde si j'ai reçu la facture Metro d'aujourd'hui sur mon Mac."*  
  > 🤖 **Nexus** : *"J'ai trouvé 'Facture_Metro_15082026.pdf' (1 240,50 € TTC) dans vos Téléchargements. Elle contient 18 références dont 25kg de viande bovine et 12 bouteilles d'huile. Voulez-vous que je mette à jour les stocks et crée l'écriture comptable ?"*  
  > ➔ **[Bouton : Valider et Importer]**

* **Scénario 2 : Rapprochement Bancaire** :
  > 👤 **Patron** : *"J'ai téléchargé mon relevé bancaire de la semaine."*  
  > 🤖 **Nexus** : *"Fichier 'releve_bnp_semaine33.csv' détecté. 42 transactions analysées : 41 écritures correspondent parfaitement aux clôtures Z et aux règlements fournisseurs. 1 prélèvement inconnu de 49,90 € (Engie) a été mis en attente. Souhaitez-vous le valider ?"*

* **Scénario 3 : Diagnostic Matériel** :
  > 👤 **Patron** : *"L'imprimante cuisine ne répond plus."*  
  > 🤖 **Nexus** : *"Scan réseau local effectué : L'imprimante Epson TM-T88VI en 192.168.1.45 est joignable mais signale 'Capot ouvert / Hors papier'. Aucun problème réseau détecté."*

---

### 📋 Checklist d'Implémentation Technique

- [ ] **Phase 1 : Démon Local & Protocole MCP**
  - [ ] Développer le mini démon local `nexus-sidecar-daemon` (CLI Node.js/Rust).
  - [ ] Implémenter le serveur WebSocket/HTTP sécurisé sur `localhost:9625` avec token d'appairage.
  - [ ] Écrire le hook client `useLocalDesktopBridge` pour la détection automatique du démon dans l'interface web.
- [ ] **Phase 2 : Moteur OCR & Moissonneur de Factures**
  - [ ] Surveillance de répertoires avec `chokidar`.
  - [ ] Pipeline OCR / Parser PDF via Gemini Vision API avec extraction normalisée des lignes de facturation.
  - [ ] Câblage direct avec `StockReceptionModal` et `fiscalLedgerNodeAtom`.
- [ ] **Phase 3 : Relevés Bancaires & Exports Logiciels**
  - [ ] Parsers de formats bancaires (CSV Qonto/Shine/BNP, OFX).
  - [ ] Algorithme de réconciliation automatique contre les transactions NF525.
  - [ ] Générateurs d'exports comptables FEC / Factur-X / Sage / EBP.
- [ ] **Phase 4 : Sonde Réseau & Intégration Hardware**
  - [ ] Scanner réseau local pour imprimantes ESC/POS et TPE.
  - [ ] Module de sauvegarde chiffrée sur support USB amovible.

---

## 🥊 6. Les 12 Pépites Métier & Verrous Concurrentiels (Gap Analysis)

Ce volet compile les 12 fonctionnalités pointues identifiées lors de l'audit comparatif face aux leaders spécialisés du marché (Lightspeed, Zenchef, Skello, Octopus HACCP, Inpulse, Deliverect, Hey Pongo, Pennylane).

---

### 💳 OPS & POS (Face à Lightspeed, Zelty, Tactill)
- [ ] **1. Flux CONECS & Titres-Restaurant Dématérialisés** :
  - Détection automatique des cartes éligibles CONECS (Edenred, Swile, Pluxee, Bimpli, Up).
  - Plafond légal journalier bloquant (25,00 € max / jour) et ventilation automatique du solde restant sur CB/Espèces.
  - Verrou d'éligibilité : Exclusion stricte des articles alcoolisés de l'assiette de calcul CONECS.
- [ ] **2. Clôture de Caisse à l'Aveugle (Blind Cash Close)** :
  - Le serveur / caissier compte les espèces physiques sans connaître le montant théorique calculé par le système.
  - Génération d'un rapport d'écart instantané scellé pour le gérant (Anti-vol de pourboire / coulage de monnaie).

---

### 📅 COMMERCE & RELATION (Face à Zenchef, TheFork, Hey Pongo)
- [ ] **3. Pacing de Réservation & Algorithme de Tetris de Salle** :
  - Quota dynamique par tranche de 15 minutes (ex: max 12 couverts / quart d'heure) pour lisser l'afflux en cuisine.
  - Optimisation automatique de l'assignation des tables pour maximiser le taux de rotation (2nd service à 21h30).
- [ ] **4. Couplage Téléphonie CTI (ZenCall / Ringover / Aircall)** :
  - Détection de l'appel entrant sur la tablette/POS avec affichage instantané de la fiche client (Nom, statut VIP, allergies, historique des no-shows).
- [ ] **5. Moteur de Protection d'E-Réputation (Smart Review Filter)** :
  - Envoi d'un SMS de feedback post-repas :
    - Note 4-5 étoiles ➔ Redirection automatique vers la fiche Google My Business.
    - Note 1-3 étoiles ➔ Alerte privée immédiate au directeur avec coupon d'excuse pour désamorcer l'avis négatif public.

---

### ⏱️ HUMAN & RH (Face à Skello, Combo / Snapshift)
- [ ] **6. Verrous Légaux Convention Collective HCR** :
  - Contrôle en temps réel lors de l'édition du planning : Alerte bloquante si repos journalier < 11h, si temps de travail hebdomadaire > 48h, ou sur le travail de nuit post-22h.

---

### 🧪 COMPLIANCE & QUALITÉ (Face à Octopus HACCP, Traqfood)
- [ ] **8. Chrono & Courbe de Refroidissement Rapide** :
  - Minuteur réglementaire avec alertes sonores : Passage obligatoire de +63°C à +10°C en moins de 120 minutes.
  - Export PDF certifié scellé conforme aux exigences des inspecteurs DDPP / DGAL.
- [ ] **9. Suivi des Huiles de Friture (Testeur TPM)** :
  - Saisie du taux de composés polaires (norme < 25%). Blocage et alerte vidange automatique avec traçabilité du fût d'huile usagée et filière de collecte.

---

### 📦 LOGISTICS & FOOD COST (Face à Inpulse, Koust, MarketMan)
- [ ] **10. Matrice de Menu Engineering Dynamique (Boston Consulting Group)** :
  - Classification automatique des plats du menu en 4 quadrants selon Volume des Ventes vs Marge Brute :
    - ⭐ **Stars** (Haute marge, Fort volume) ➔ Mettre en valeur en haut de carte.
    - 🐎 **Plowhorses** (Basse marge, Fort volume) ➔ Réduire le grammage ou augmenter le prix de 0.50€.
    - 🧩 **Puzzles** (Haute marge, Faible volume) ➔ Repositionner visuellement / Former le service.
    - 🐕 **Dogs** (Basse marge, Faible volume) ➔ Supprimer de la carte.
- [ ] **11. Détecteur de Dérive Tarifaire Mercuriale Fournisseur** :
  - Comparaison automatique lors du scan OCR de chaque facture contre le dernier prix d'achat enregistré.
  - Alerte rouge instantanée si un ingrédient clé augmente de plus de 5% (ex: Saumon +12%, Beurre +8%) avec recalcul de la marge du plat impacté.

---

### 🧾 FINANCE & COMPTABILITÉ (Face à Pennylane, Dext, Tiime)
- [ ] **12. Ventilation Ligne par Ligne Multi-TVA sur Factures d'Achat** :
  - Découpage comptable automatique d'une facture complexe (ex: Metro) en comptes de charges distincts :
    - 601000 (Alimentation - TVA 5.5% / 10%)
    - 607000 (Boissons alcoolisées - TVA 20%)
    - 606300 (Produits d'entretien - TVA 20%)
    - 606800 (Emballages vente à emporter - TVA 20%)
  - Rapprochement automatique de la télécollecte TPE du soir avec le virement bancaire brut et déduction des commissions acquéreur CB.


