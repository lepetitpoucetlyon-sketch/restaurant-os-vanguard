# 📦 MODULE CONTRÔLE QUALITÉ MARCHANDISES — SPÉCIFICATION TECHNIQUE

> **Version 1.0** | Extension Restaurant OS  
> Respect du Master Prompt UI • Conformité HACCP

---

## 1. CONTEXTE ET OBJECTIFS

```yaml
Objectif_Principal: |
  Garantir la qualité et la traçabilité des marchandises réceptionnées,
  avec focus sur les produits frais (légumes, fruits, viandes, poissons),
  en conformité avec les normes HACCP.

Valeur_Métier:
  - Réduction des pertes (produits non conformes détectés tôt)
  - Traçabilité complète pour audits
  - Historique qualité fournisseurs
  - Alertes proactives (température, DLC)
  - Documentation automatique

Conformité:
  HACCP:
    - Contrôle température à réception
    - Traçabilité lots
    - Actions correctives documentées
    - Conservation enregistrements 3 ans

Métriques_Succès:
  - 100% des réceptions contrôlées
  - Temps moyen contrôle: < 10 min
  - Taux de non-conformité suivi
  - Score qualité fournisseur calculé
```

---

## 2. ARCHITECTURE DE DONNÉES

### 2.1 Contrôle Qualité

```yaml
QualityControl:
  id: UUID
  establishment_id: UUID
  
  # ═══════════════════════════════════════════════════════════════
  # CONTEXTE
  # ═══════════════════════════════════════════════════════════════
  
  control_number:
    format: "QC-{YYYY}{MM}{DD}-{XXX}"
    example: "QC-20260115-007"
    
  type: enum [
    reception,        # À la livraison
    storage,          # Contrôle stockage
    preparation,      # Avant préparation
    pre_service       # Avant service
  ]
  
  # Livraison associée
  delivery:
    id: UUID | null
    reference: string | null
    # Numéro bon de livraison
    
  supplier_id: UUID
  supplier_name: string
  
  # ═══════════════════════════════════════════════════════════════
  # TIMING
  # ═══════════════════════════════════════════════════════════════
  
  controlled_at: timestamp
  controlled_by: UUID
  controller_name: string
  
  duration_minutes: integer | null
  # Durée du contrôle
  
  # ═══════════════════════════════════════════════════════════════
  # CONDITIONS LIVRAISON
  # ═══════════════════════════════════════════════════════════════
  
  delivery_conditions:
    vehicle_type: enum [refrigerated, isothermal, ambient, unknown]
    
    vehicle_temperature:
      measured: decimal | null
      compliant: boolean | null
      
    vehicle_cleanliness: enum [clean, acceptable, dirty, not_checked]
    
    packaging_integrity: enum [intact, damaged, mixed]
    
    delivery_time_compliant: boolean
    # Arrivée dans le créneau prévu
    
    notes: string | null
    
  # ═══════════════════════════════════════════════════════════════
  # ITEMS CONTRÔLÉS
  # ═══════════════════════════════════════════════════════════════
  
  items:
    type: array
    items:
      id: UUID
      
      # Produit
      product_id: UUID
      product_name: string
      product_category: enum [
        vegetables,      # Légumes
        fruits,          # Fruits
        meat,            # Viandes
        poultry,         # Volailles
        fish_seafood,    # Poissons/Fruits de mer
        dairy,           # Produits laitiers
        eggs,            # Œufs
        charcuterie,     # Charcuterie
        frozen,          # Surgelés
        dry_goods,       # Épicerie sèche
        beverages,       # Boissons
        other
      ]
      
      # Traçabilité
      batch_number: string | null
      lot_number: string | null
      origin: string | null
      # Ex: "France", "Espagne - Almeria"
      
      # Dates
      production_date: date | null
      expiry_date: date | null
      # DLC ou DDM
      
      expiry_type: enum [dlc, ddm]
      # DLC = Date Limite de Consommation (stricte)
      # DDM = Date de Durabilité Minimale (indicative)
      
      days_until_expiry: integer
      # Calculé automatiquement
      
      # Quantités
      quantity_ordered: decimal
      quantity_delivered: decimal
      quantity_accepted: decimal
      quantity_rejected: decimal
      unit: string
      
      # ─────────────────────────────────────────────────────────
      # CONTRÔLES
      # ─────────────────────────────────────────────────────────
      
      checks:
      
        # Contrôle visuel
        visual:
          performed: boolean
          status: enum [pass, warning, fail, not_applicable]
          
          aspects:
            - aspect: "Couleur"
              ok: boolean
              note: string | null
            - aspect: "Texture"
              ok: boolean
              note: string | null
            - aspect: "Odeur"
              ok: boolean
              note: string | null
            - aspect: "Emballage"
              ok: boolean
              note: string | null
              
          issues: enum [
            none,
            damaged_packaging,
            broken_cold_chain_signs,
            wrong_color,
            wrong_texture,
            bad_smell,
            visible_mold,
            pest_signs,
            wrong_ripeness,
            wilted,
            bruised,
            freezer_burn,
            other
          ][]
          
          photos: URL[]
          notes: string | null
          
        # Contrôle température
        temperature:
          required: boolean
          performed: boolean
          
          target:
            min: decimal
            max: decimal
            
          measured: decimal | null
          probe_id: string | null
          # ID de la sonde utilisée
          
          status: enum [pass, warning, fail, not_measured]
          
          # Warning si proche limite
          warning_threshold: decimal
          
        # Contrôle poids
        weight:
          required: boolean
          performed: boolean
          
          expected: decimal | null
          measured: decimal | null
          unit: string
          
          variance: decimal | null
          variance_percent: decimal | null
          
          tolerance_percent: decimal
          # Ex: 5% de tolérance
          
          status: enum [pass, warning, fail, not_measured]
          
        # Fraîcheur (produits frais)
        freshness:
          required: boolean
          performed: boolean
          
          score: enum [
            excellent,    # 5 - Parfait
            good,         # 4 - Très bien
            acceptable,   # 3 - Correct
            poor,         # 2 - Limite
            rejected      # 1 - Refusé
          ]
          
          criteria:
            - criterion: string
              score: integer (1-5)
              
          notes: string | null
          
      # ─────────────────────────────────────────────────────────
      # DÉCISION
      # ─────────────────────────────────────────────────────────
      
      decision: enum [
        accepted,               # Accepté sans réserve
        accepted_reservation,   # Accepté avec réserve
        partially_accepted,     # Accepté partiellement
        rejected               # Refusé
      ]
      
      decision_reason: string | null
      
      # Actions si problème
      corrective_action: enum [
        none,
        priority_use,        # Utiliser en priorité
        return_supplier,     # Retour fournisseur
        credit_note,        # Avoir demandé
        dispose,            # Mise au rebut
        quarantine          # Mise en quarantaine
      ] | null
      
      action_notes: string | null
      
  # ═══════════════════════════════════════════════════════════════
  # RÉSUMÉ GLOBAL
  # ═══════════════════════════════════════════════════════════════
  
  summary:
    total_items: integer
    
    items_accepted: integer
    items_accepted_reservation: integer
    items_partially_accepted: integer
    items_rejected: integer
    
    temperature_issues: integer
    visual_issues: integer
    weight_issues: integer
    
    overall_status: enum [
      pass,           # Tout OK
      pass_warnings,  # OK avec alertes mineures
      partial,        # Acceptation partielle
      fail            # Problème majeur
    ]
    
  # ═══════════════════════════════════════════════════════════════
  # ACTIONS CORRECTIVES
  # ═══════════════════════════════════════════════════════════════
  
  corrective_actions:
    type: array
    items:
      id: UUID
      item_id: UUID
      
      type: enum [
        return_to_supplier,
        request_credit,
        dispose,
        priority_use,
        quarantine,
        notify_supplier,
        other
      ]
      
      description: string
      
      assigned_to: UUID | null
      assigned_to_name: string | null
      
      due_date: date | null
      
      status: enum [pending, in_progress, completed, cancelled]
      completed_at: timestamp | null
      completed_by: UUID | null
      
      outcome: string | null
      
  # ═══════════════════════════════════════════════════════════════
  # DOCUMENTS
  # ═══════════════════════════════════════════════════════════════
  
  documents:
    delivery_note_photo: URL | null
    
    signature:
      captured: boolean
      data: base64 | null
      signer_name: string | null
      
    report_pdf: URL | null
    # Généré automatiquement
    
  # ═══════════════════════════════════════════════════════════════
  # MÉTADONNÉES
  # ═══════════════════════════════════════════════════════════════
  
  metadata:
    created_at: timestamp
    updated_at: timestamp
    
    synced: boolean
    # Si contrôle fait offline
    
    device_id: string | null
```

### 2.2 Configuration Produit

```yaml
ProductQualityConfig:
  product_id: UUID
  
  # Contrôles requis
  requires_temperature_check: boolean
  requires_weight_check: boolean
  requires_visual_check: boolean
  requires_freshness_check: boolean
  
  # Température
  temperature:
    target_min: decimal
    target_max: decimal
    warning_buffer: decimal
    # Ex: si max=4°C et buffer=0.5, warning à 3.5°C
    
  # Poids
  weight:
    tolerance_percent: decimal
    
  # Critères visuels personnalisés
  visual_criteria:
    type: array
    items:
      criterion: string
      description: string
      importance: enum [critical, important, minor]
      
  # DLC
  shelf_life:
    expected_days: integer
    # Durée de vie attendue à réception
    
    minimum_remaining_days: integer
    # Refus si DLC < X jours
    
    priority_threshold_days: integer
    # Alerte "utiliser en priorité" si DLC < X jours
    
  # Score qualité
  quality_scoring:
    weight_temperature: decimal (0-1)
    weight_visual: decimal (0-1)
    weight_freshness: decimal (0-1)
```

### 2.3 Score Fournisseur

```yaml
SupplierQualityScore:
  supplier_id: UUID
  establishment_id: UUID
  
  period: string
  # Ex: "2026-01" (mensuel)
  
  metrics:
    total_deliveries: integer
    total_items: integer
    
    items_accepted: integer
    items_rejected: integer
    
    rejection_rate: decimal
    # = rejected / total × 100
    
    temperature_issues: integer
    visual_issues: integer
    weight_issues: integer
    
    average_freshness_score: decimal (1-5)
    
    on_time_delivery_rate: decimal
    
  overall_score: decimal (0-100)
  # Calculé selon pondération
  
  trend: enum [improving, stable, declining]
  
  compared_to_average: decimal
  # Écart vs moyenne fournisseurs
```

---

## 3. INTERFACE UTILISATEUR

### 3.1 Layout Pages

```yaml
Page_Dashboard_Qualite: # /quality
  Layout:
    ┌─────────────────────────────────────────────────────────────┐
    │ HEADER                                                       │
    │ [← Retour] Contrôle Qualité [+ Nouveau contrôle]            │
    ├─────────────────────────────────────────────────────────────┤
    │ ALERTS BANNER (si présent)                                   │
    │ ⚠️ 3 produits en DLC courte | 1 action corrective en attente│
    ├─────────────────────────────────────────────────────────────┤
    │ KPI CARDS                                                    │
    │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
    │ │   24     │ │  97.2%   │ │   2.8%   │ │  4.2/5   │         │
    │ │Contrôles │ │Tx Accept.│ │Tx Rejet  │ │Fraîcheur │         │
    │ │ce mois   │ │          │ │          │ │moyenne   │         │
    │ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
    ├─────────────────────────────────────────────────────────────┤
    │ TABS                                                         │
    │ [Aujourd'hui] [Historique] [Fournisseurs] [Alertes]         │
    ├─────────────────────────────────────────────────────────────┤
    │ CONTENT                                                      │
    │                                                              │
    │ Contrôles du jour:                                          │
    │ ┌─────────────────────────────────────────────────────────┐ │
    │ │ 08:15 │ Metro │ 12 produits │ ✓ Validé │ [Voir]        │ │
    │ │ 10:30 │ Pomona │ 8 produits │ ⚠ Réserves │ [Voir]      │ │
    │ │ 14:00 │ Sysco │ En attente... │ [Continuer]            │ │
    │ └─────────────────────────────────────────────────────────┘ │
    │                                                              │
    │ Produits à surveiller:                                      │
    │ ┌─────────────────────────────────────────────────────────┐ │
    │ │ 🥬 Salade mesclun │ DLC: J+2 │ [Utiliser en priorité]  │ │
    │ │ 🍅 Tomates grappe │ DLC: J+3 │ Stock: 15kg             │ │
    │ └─────────────────────────────────────────────────────────┘ │
    └─────────────────────────────────────────────────────────────┘

Page_Nouveau_Controle: # /quality/reception
  Layout:
    ┌─────────────────────────────────────────────────────────────┐
    │ HEADER                                                       │
    │ [✕ Annuler] Contrôle Réception [Brouillon ●]                │
    ├─────────────────────────────────────────────────────────────┤
    │ SUPPLIER & DELIVERY                                          │
    │ Fournisseur: [Sélectionner ▼]                               │
    │ N° BL: [________________]  📷 [Scanner]                     │
    ├─────────────────────────────────────────────────────────────┤
    │ DELIVERY CONDITIONS                                          │
    │ Véhicule: [Frigo ▼]  Temp: [__°C]  Propreté: [OK ▼]        │
    ├─────────────────────────────────────────────────────────────┤
    │ ITEMS LIST                                                   │
    │ ┌─────────────────────────────────────────────────────────┐ │
    │ │ [+ Ajouter produit]  [📷 Scanner code-barres]           │ │
    │ ├─────────────────────────────────────────────────────────┤ │
    │ │                                                          │ │
    │ │ 🥩 Entrecôte bœuf                                       │ │
    │ │ Lot: BF-2026-1234 | DLC: 18/01/2026                     │ │
    │ │ Qté: 10 kg        | Temp: 2.5°C ✓                       │ │
    │ │ [Contrôler ▼]     [✓ OK] [⚠ Réserve] [✗ Refuser]       │ │
    │ │                                                          │ │
    │ │ 🥬 Mesclun                                               │ │
    │ │ Lot: SAL-789      | DLC: 16/01/2026                     │ │
    │ │ Qté: 5 kg         | Temp: 4.2°C ⚠                       │ │
    │ │ [Contrôler ▼]                                            │ │
    │ │                                                          │ │
    │ └─────────────────────────────────────────────────────────┘ │
    ├─────────────────────────────────────────────────────────────┤
    │ FOOTER                                                       │
    │ Résumé: 8 OK | 2 Réserves | 1 Refusé                        │
    │                                        [Valider le contrôle]│
    └─────────────────────────────────────────────────────────────┘

Page_Controle_Item: # Modal ou page dédiée
  Layout:
    ┌─────────────────────────────────────────────────────────────┐
    │ HEADER                                                       │
    │ [← Retour] Contrôle: Entrecôte bœuf                         │
    ├─────────────────────────────────────────────────────────────┤
    │ PRODUCT INFO                                                 │
    │ Lot: BF-2026-1234  |  Origine: France  |  DLC: 18/01        │
    │ Commandé: 10 kg    |  Livré: 10.2 kg                        │
    ├─────────────────────────────────────────────────────────────┤
    │ TEMPERATURE CHECK                                            │
    │ ┌─────────────────────────────────────────────────────────┐ │
    │ │ Cible: 0°C - 4°C                                        │ │
    │ │                                                          │ │
    │ │ Température mesurée: [2.5] °C   [🌡 Sonde Bluetooth]     │ │
    │ │                                                          │ │
    │ │ ████████████░░░░░░░░░░  ✓ CONFORME                      │ │
    │ │ 0°C              4°C                                     │ │
    │ └─────────────────────────────────────────────────────────┘ │
    ├─────────────────────────────────────────────────────────────┤
    │ VISUAL CHECK                                                 │
    │ ┌─────────────────────────────────────────────────────────┐ │
    │ │ Couleur:    [✓] [⚠] [✗]                                 │ │
    │ │ Texture:    [✓] [⚠] [✗]                                 │ │
    │ │ Odeur:      [✓] [⚠] [✗]                                 │ │
    │ │ Emballage:  [✓] [⚠] [✗]                                 │ │
    │ │                                                          │ │
    │ │ Photos: [📷 Ajouter]  (optionnel si OK)                  │ │
    │ └─────────────────────────────────────────────────────────┘ │
    ├─────────────────────────────────────────────────────────────┤
    │ FRESHNESS SCORE                                              │
    │ ┌─────────────────────────────────────────────────────────┐ │
    │ │ ⭐⭐⭐⭐⭐  Excellent                                      │ │
    │ │ ⭐⭐⭐⭐☆  Bon                                            │ │
    │ │ ⭐⭐⭐☆☆  Acceptable                                     │ │
    │ │ ⭐⭐☆☆☆  Limite                                         │ │
    │ │ ⭐☆☆☆☆  Refusé                                         │ │
    │ └─────────────────────────────────────────────────────────┘ │
    ├─────────────────────────────────────────────────────────────┤
    │ DECISION                                                     │
    │ [✓ Accepter]  [⚠ Accepter avec réserve]  [✗ Refuser]       │
    │                                                              │
    │ Notes: [_________________________________________]          │
    └─────────────────────────────────────────────────────────────┘
```

### 3.2 Composants UI

```yaml
Components:

  TemperatureGauge:
    usage: "Affichage température"
    display:
      - Barre de progression colorée
      - Zone verte (OK), jaune (warning), rouge (hors norme)
      - Valeur mesurée
      - Icône statut
    interactions:
      - Input direct
      - Connexion sonde Bluetooth
      
  FreshnessRating:
    usage: "Notation fraîcheur"
    display:
      - 5 étoiles cliquables
      - Labels descriptifs
      - Couleur selon niveau
    animation:
      - Stars fill on click
      - Pulse feedback
      
  VisualCheckGrid:
    usage: "Grille contrôles visuels"
    display:
      - Liste critères
      - 3 boutons par critère (OK/Warning/Fail)
      - Icônes couleur
    states:
      unchecked: gris
      pass: vert
      warning: orange
      fail: rouge
      
  ProductControlCard:
    usage: "Carte produit dans liste"
    display:
      - Icône catégorie
      - Nom produit
      - Infos lot/DLC
      - Température badge
      - Statut décision
      - Actions
    states:
      pending: border-dashed
      passed: border-green
      warning: border-orange
      failed: border-red
      
  SupplierScoreCard:
    usage: "Score qualité fournisseur"
    display:
      - Note globale (0-100)
      - Trend indicator
      - Breakdown par critère
      - Historique graphique
      
  DLCAlertBadge:
    usage: "Badge DLC"
    variants:
      ok: "J+10" (vert)
      warning: "J+3" (orange)
      critical: "J+1" (rouge pulsant)
      expired: "EXPIRÉ" (rouge foncé)
```

### 3.3 Mobile-First Design

```yaml
Mobile_Optimizations:

  Quick_Actions:
    - Scan code-barres (caméra)
    - Saisie vocale notes
    - Photo rapide
    - Sonde Bluetooth auto-connect
    
  Gestures:
    - Swipe right: Accepter
    - Swipe left: Refuser
    - Long press: Détails
    
  Offline_Mode:
    - Contrôles sauvegardés localement
    - Sync automatique au retour réseau
    - Indicateur offline visible
    
  Large_Touch_Targets:
    - Boutons min 48px
    - Espacement généreux
    - Contraste élevé
```

---

## 4. WORKFLOWS

### 4.1 Contrôle Réception

```yaml
Flow_Reception:

  Étape_1_Arrivée_Livraison:
    triggers:
      - Notification livraison prévue
      - Arrivée effective
    actions:
      - Ouvrir nouveau contrôle
      - Sélectionner fournisseur
      - Scanner/photographier bon de livraison
      
  Étape_2_Conditions_Vehicule:
    checks:
      - Type véhicule (frigo, isotherme, etc.)
      - Température véhicule (si frigo)
      - Propreté
      - État emballages visible
    quick_fail:
      - Si temp véhicule > seuil → Alerte immédiate
      - Si emballages endommagés → Photo obligatoire
      
  Étape_3_Controle_Produits:
    per_item:
      1. Scan ou sélection produit
      2. Saisie lot / DLC
      3. Vérification quantité
      4. Contrôle température (si requis)
         - Connexion sonde ou saisie manuelle
         - Validation automatique vs seuils
      5. Contrôle visuel
         - Checklist critères
         - Photo si anomalie
      6. Score fraîcheur (produits frais)
      7. Décision: Accepter / Réserve / Refuser
      
    optimizations:
      - Templates par fournisseur (produits habituels)
      - Duplication rapide pour mêmes lots
      - Validation en masse si tout OK
      
  Étape_4_Actions_Correctives:
    if_issues:
      - Choix action (retour, avoir, priorité, etc.)
      - Assignment responsable
      - Notification automatique
      
  Étape_5_Validation:
    actions:
      - Résumé affiché
      - Signature (optionnel)
      - Génération rapport
      - Mise à jour stocks
      - Notification cuisine si priorités
      - Email récap fournisseur si rejets
```

### 4.2 Alertes Automatiques

```yaml
Alertes:

  Temperature_Critique:
    trigger: "Température hors norme HACCP"
    severity: critical
    actions:
      - Push notification immédiate
      - Blocage lot automatique
      - Email manager
      - Log obligatoire action
      
  DLC_Proche:
    trigger: "DLC dans X jours"
    thresholds:
      - J+3: notification standard
      - J+1: notification urgente
      - J+0: alerte critique
    actions:
      - Liste "Utiliser en priorité"
      - Affichage KDS
      - Notification équipe cuisine
      
  Fournisseur_Problematique:
    trigger: "Taux rejet > seuil sur période"
    actions:
      - Alerte manager
      - Suggestion révision fournisseur
      
  Action_Corrective_En_Retard:
    trigger: "Date butoir dépassée"
    actions:
      - Relance assigné
      - Escalade manager
```

---

## 5. INTÉGRATIONS

```yaml
Dépendances:

  Module_Stocks:
    update: "MAJ quantités après contrôle"
    block: "Blocage lots non conformes"
    priority: "Flag utilisation prioritaire"
    trace: "Traçabilité lot → stock"
    
  Module_HACCP:
    log: "Enregistrements réglementaires"
    temperature: "Historique températures"
    actions: "Documentation PMS"
    export: "Données pour audits"
    
  Module_Fournisseurs:
    score: "Mise à jour score qualité"
    history: "Historique incidents"
    alert: "Notification si problèmes"
    
  Module_Achats:
    credit: "Création avoir"
    return: "Bon de retour"
    dispute: "Litige fournisseur"
    
  Module_Kitchen_Display:
    priority: "Affichage produits DLC courte"
    block: "Masquer produits bloqués"
    
  Module_Notifications:
    alerts: "Toutes les alertes"
    
Hardware:
  
  Sondes_Temperature:
    bluetooth: "Thermomètres connectés"
    supported: ["ThermoWorks", "Testo", "Generic BLE"]
    
  Scanners:
    camera: "Scan code-barres caméra"
    external: "Lecteurs USB/Bluetooth"
    
  Balances:
    bluetooth: "Balances connectées"
    integration: "Poids automatique"
```

---

## 6. PERMISSIONS

```yaml
Permissions:

  quality.control.create:
    roles: [owner, manager, chef, receiver]
    
  quality.control.read:
    roles: [owner, manager, chef, receiver, accountant]
    
  quality.control.validate:
    roles: [owner, manager, chef]
    
  quality.actions.manage:
    roles: [owner, manager]
    
  quality.suppliers.view:
    roles: [owner, manager, accountant]
    
  quality.config.manage:
    roles: [owner, manager]
```

---

> **Conformité** : HACCP, Paquet Hygiène  
> **Dépendances** : Stocks, Fournisseurs, Achats, HACCP, KDS
