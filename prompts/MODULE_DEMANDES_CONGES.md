# 🏖️ MODULE DEMANDES DE CONGÉS — SPÉCIFICATION TECHNIQUE

> **Version 1.0** | Extension Restaurant OS  
> Respect du Master Prompt UI • Conformité Code du Travail

---

## 1. CONTEXTE ET OBJECTIFS

```yaml
Objectif_Principal: |
  Permettre aux employés de soumettre des demandes de congés et absences,
  avec workflow d'approbation, vérification des conflits planning,
  suivi des soldes et conformité légale.

Valeur_Métier:
  - Digitalisation des demandes (plus de papier)
  - Visibilité planning équipe
  - Validation rapide par managers
  - Conformité légale automatisée
  - Historique et traçabilité

Conformité_Légale:
  Code_du_Travail:
    - 25 jours CP / an (2.08 jours/mois)
    - Délai prévenance employeur
    - Période de référence (1er juin - 31 mai)
    - Congés payés avant RTT
    - Report limité

Métriques_Succès:
  - Délai moyen approbation: < 48h
  - 100% des demandes tracées
  - 0 conflit planning non détecté
  - Soldes toujours à jour
```

---

## 2. ARCHITECTURE DE DONNÉES

### 2.1 Soldes de Congés

```yaml
LeaveBalance:
  id: UUID
  employee_id: UUID
  establishment_id: UUID
  
  # Période de référence
  period:
    type: enum [legal_year, calendar_year, custom]
    start_date: date
    end_date: date
    # Ex: 01/06/2025 - 31/05/2026 (légal FR)
    
  # ═══════════════════════════════════════════════════════════════
  # SOLDES PAR TYPE
  # ═══════════════════════════════════════════════════════════════
  
  balances:
    type: array
    items:
      type: enum [
        paid_leave,       # Congés payés
        rtt,              # RTT
        recovery,         # Récupération
        seniority,        # Ancienneté
        fractioning,      # Fractionnement
        exceptional,      # Conventionnel
        unpaid            # Sans solde (illimité mais suivi)
      ]
      
      # Droits
      entitled: decimal
      # Jours acquis sur la période
      
      acquired: decimal
      # Jours acquis à date (prorata temporis)
      
      # Consommation
      taken: decimal
      # Jours déjà pris
      
      pending: decimal
      # Jours en attente de validation
      
      planned: decimal
      # Jours validés mais futurs
      
      # Solde
      remaining: decimal
      # = acquired - taken - pending - planned
      
      available: decimal
      # = remaining - planned (vraiment disponible)
      
      # Report
      carried_over: decimal
      # Report de la période précédente
      
      carry_over_expiry: date | null
      # Date limite utilisation report

  # ═══════════════════════════════════════════════════════════════
  # ACQUISITION
  # ═══════════════════════════════════════════════════════════════
  
  acquisition:
    method: enum [monthly, daily, custom]
    
    # Si mensuel
    monthly_rate: decimal
    # Ex: 2.08 jours/mois pour CP
    
    # Calcul prorata
    prorata:
      start_date: date
      # Date début calcul (embauche ou début période)
      
      end_date: date | null
      # Date fin si départ en cours
      
  # ═══════════════════════════════════════════════════════════════
  # MÉTADONNÉES
  # ═══════════════════════════════════════════════════════════════
  
  metadata:
    last_calculated_at: timestamp
    created_at: timestamp
    updated_at: timestamp
```

### 2.2 Demande de Congé

```yaml
LeaveRequest:
  id: UUID
  establishment_id: UUID
  employee_id: UUID
  
  # ═══════════════════════════════════════════════════════════════
  # IDENTIFICATION
  # ═══════════════════════════════════════════════════════════════
  
  request_number:
    format: "ABS-{YYYY}-{XXXXX}"
    example: "ABS-2026-00142"
    
  # ═══════════════════════════════════════════════════════════════
  # TYPE D'ABSENCE
  # ═══════════════════════════════════════════════════════════════
  
  type: enum [
    # Congés planifiés
    paid_leave,         # Congés payés
    rtt,               # RTT
    unpaid_leave,      # Sans solde
    recovery,          # Récupération (heures sup)
    
    # Absences médicales
    sick_leave,        # Maladie
    work_accident,     # Accident du travail
    maternity,         # Maternité
    paternity,         # Paternité
    child_sick,        # Enfant malade
    
    # Congés exceptionnels (légaux)
    exceptional_wedding_self,      # Mariage/PACS (4 jours)
    exceptional_wedding_child,     # Mariage enfant (1 jour)
    exceptional_birth,             # Naissance (3 jours)
    exceptional_death_spouse,      # Décès conjoint (3 jours)
    exceptional_death_parent,      # Décès parent (3 jours)
    exceptional_death_sibling,     # Décès frère/sœur (3 jours)
    exceptional_death_grandparent, # Décès grand-parent (1 jour)
    exceptional_death_in_law,      # Décès beau-parent (3 jours)
    exceptional_moving,            # Déménagement (1 jour/an)
    exceptional_child_handicap,    # Annonce handicap (2 jours)
    
    # Autres
    training,          # Formation
    union,             # Activité syndicale
    other              # Autre (préciser)
  ]
  
  type_label: string
  # Libellé personnalisé si "other"
  
  # ═══════════════════════════════════════════════════════════════
  # PÉRIODE
  # ═══════════════════════════════════════════════════════════════
  
  period:
    start_date: date
    end_date: date
    
    # Demi-journées
    start_period: enum [full_day, morning, afternoon]
    end_period: enum [full_day, morning, afternoon]
    
    # Calcul automatique
    working_days: decimal
    # Jours ouvrés (excluant weekends et fériés)
    
    calendar_days: integer
    # Jours calendaires
    
  # ═══════════════════════════════════════════════════════════════
  # JUSTIFICATIFS
  # ═══════════════════════════════════════════════════════════════
  
  justification:
    reason: string | null
    # Motif (optionnel pour CP, obligatoire pour certains)
    
    attachments:
      type: array
      items:
        id: UUID
        type: enum [
          medical_certificate,  # Arrêt maladie
          birth_certificate,    # Acte naissance
          death_certificate,    # Acte décès
          wedding_invitation,   # Faire-part mariage
          other
        ]
        file_url: URL
        file_name: string
        uploaded_at: timestamp
        
    required_attachments: string[]
    # Types requis selon le type d'absence
    
    attachments_complete: boolean
    
  # ═══════════════════════════════════════════════════════════════
  # ÉTAT ET WORKFLOW
  # ═══════════════════════════════════════════════════════════════
  
  status: enum [
    draft,            # Brouillon
    submitted,        # Soumise
    pending_approval, # En attente validation
    approved,         # Approuvée
    rejected,         # Refusée
    cancelled,        # Annulée (par employé)
    cancelled_mgmt,   # Annulée (par management)
    in_progress,      # En cours (date atteinte)
    completed         # Terminée
  ]
  
  # ═══════════════════════════════════════════════════════════════
  # WORKFLOW APPROBATION
  # ═══════════════════════════════════════════════════════════════
  
  workflow:
    submitted_at: timestamp | null
    submitted_to: UUID
    # Manager direct
    
    approval_chain:
      type: array
      items:
        level: integer
        approver_id: UUID
        approver_name: string
        role: string
        
        status: enum [pending, approved, rejected, skipped]
        decided_at: timestamp | null
        
        comments: string | null
        
    current_level: integer
    
    # Décision finale
    final_decision: enum [approved, rejected] | null
    final_decision_at: timestamp | null
    final_decision_by: UUID | null
    
    # Motif refus
    rejection_reason: string | null
    rejection_category: enum [
      team_coverage,      # Couverture équipe insuffisante
      blackout_period,    # Période bloquée
      insufficient_notice, # Délai trop court
      balance_insufficient, # Solde insuffisant
      documentation,       # Justificatif manquant
      business_needs,      # Contraintes activité
      other
    ] | null
    
  # ═══════════════════════════════════════════════════════════════
  # IMPACT PLANNING
  # ═══════════════════════════════════════════════════════════════
  
  planning_impact:
    conflicts_detected: boolean
    
    conflicting_shifts:
      type: array
      items:
        shift_id: UUID
        date: date
        time: string
        
    team_coverage:
      date_range: [date, date]
      coverage_percent: decimal
      # % de l'équipe présente
      
      minimum_required: integer
      # Effectif minimum requis
      
      compliant: boolean
      
    replacement:
      required: boolean
      found: boolean
      replacement_employee_id: UUID | null
      replacement_confirmed: boolean
      
  # ═══════════════════════════════════════════════════════════════
  # COMPTEURS IMPACTÉS
  # ═══════════════════════════════════════════════════════════════
  
  balance_impact:
    leave_type: string
    days_deducted: decimal
    balance_before: decimal
    balance_after: decimal
    
  # ═══════════════════════════════════════════════════════════════
  # MÉTADONNÉES
  # ═══════════════════════════════════════════════════════════════
  
  metadata:
    created_at: timestamp
    created_by: UUID
    updated_at: timestamp
    
    source: enum [employee_app, manager_entry, hr_import]
    
    notes_employee: string | null
    notes_manager: string | null
```

### 2.3 Politique de Congés

```yaml
LeavePolicy:
  id: UUID
  establishment_id: UUID
  
  # ═══════════════════════════════════════════════════════════════
  # RÈGLES GÉNÉRALES
  # ═══════════════════════════════════════════════════════════════
  
  general_rules:
    # Délai de prévenance
    minimum_notice_days:
      default: 14
      exceptions:
        - type: sick_leave
          days: 0
        - type: exceptional_*
          days: 0
          
    # Durée maximale consécutive
    maximum_consecutive_days: 24
    # Légal: max 24 jours ouvrables d'affilée
    
    # Fractionnement
    fractioning:
      main_vacation_min_days: 12
      main_vacation_period: ["2026-05-01", "2026-10-31"]
      bonus_days_outside: 2
      # 2 jours si prise hors période principale
      
  # ═══════════════════════════════════════════════════════════════
  # PÉRIODES BLOQUÉES
  # ═══════════════════════════════════════════════════════════════
  
  blackout_periods:
    type: array
    items:
      id: UUID
      name: string
      # Ex: "Saint-Sylvestre", "Fête des Mères"
      
      start_date: date
      end_date: date
      
      recurring: boolean
      recurrence_type: enum [yearly, none]
      
      block_level: enum [
        blocked,      # Aucun congé possible
        restricted,   # Validation owner requise
        limited       # Max X personnes
      ]
      
      max_employees: integer | null
      # Si limited: nombre max
      
      applies_to: enum [all, roles, employees]
      roles: string[]
      employee_ids: UUID[]
      
      reason: string | null
      
  # ═══════════════════════════════════════════════════════════════
  # COUVERTURE ÉQUIPE
  # ═══════════════════════════════════════════════════════════════
  
  coverage_rules:
    # Par rôle
    by_role:
      type: array
      items:
        role: string
        minimum_present: integer
        # Ex: minimum 2 serveurs
        
    # Global
    minimum_coverage_percent: decimal
    # Ex: 60% de l'équipe minimum
    
    # Par service
    by_service:
      lunch:
        minimum: integer
      dinner:
        minimum: integer
        
  # ═══════════════════════════════════════════════════════════════
  # WORKFLOW APPROBATION
  # ═══════════════════════════════════════════════════════════════
  
  approval_workflow:
    levels:
      - level: 1
        role: "manager"
        auto_approve_up_to_days: 3
        # Auto-approuvé si < 3 jours
        
      - level: 2
        role: "owner"
        required_if_days_greater_than: 5
        required_if_blackout: true
        
    escalation:
      timeout_hours: 48
      escalate_to: "owner"
      
    auto_approve:
      enabled: false
      conditions:
        - type: sick_leave
          with_certificate: true
          
  # ═══════════════════════════════════════════════════════════════
  # REPORT
  # ═══════════════════════════════════════════════════════════════
  
  carry_over:
    paid_leave:
      allowed: true
      max_days: 5
      expiry_months: 6
      # Report max 5 jours, à utiliser dans les 6 mois
      
    rtt:
      allowed: true
      max_days: 3
      expiry_months: 3
      
  # ═══════════════════════════════════════════════════════════════
  # ACQUISITION
  # ═══════════════════════════════════════════════════════════════
  
  accrual:
    paid_leave:
      days_per_month: 2.08
      # 25 jours / 12 mois
      
      start_date: "hire_date"
      # Ou date spécifique
      
    rtt:
      days_per_year: 11
      method: "prorata_monthly"
```

---

## 3. INTERFACE UTILISATEUR

### 3.1 Vue Employé

```yaml
Page_Mes_Conges: # /leaves (employé)
  Layout:
    ┌─────────────────────────────────────────────────────────────┐
    │ HEADER                                                       │
    │ Mes Congés                          [+ Nouvelle demande]    │
    ├─────────────────────────────────────────────────────────────┤
    │ SOLDES CARDS                                                 │
    │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
    │ │ CP           │ │ RTT          │ │ Récupération │          │
    │ │              │ │              │ │              │          │
    │ │   18.5 j     │ │    4 j       │ │    2 j       │          │
    │ │   ────────── │ │   ────────── │ │   ────────── │          │
    │ │   sur 25     │ │   sur 11     │ │              │          │
    │ │ [▓▓▓▓▓▓░░░]  │ │ [▓▓▓░░░░░░]  │ │ [▓▓░░░░░░░]  │          │
    │ │              │ │              │ │              │          │
    │ │ 2 en attente │ │              │ │              │          │
    │ └──────────────┘ └──────────────┘ └──────────────┘          │
    ├─────────────────────────────────────────────────────────────┤
    │ TABS                                                         │
    │ [Mes demandes] [Calendrier équipe]                          │
    ├─────────────────────────────────────────────────────────────┤
    │ MES DEMANDES                                                 │
    │ ┌─────────────────────────────────────────────────────────┐ │
    │ │ À VENIR                                                  │ │
    │ │ ┌─────────────────────────────────────────────────────┐ │ │
    │ │ │ 🏖️ Congés payés        15-22 mars 2026              │ │ │
    │ │ │    6 jours             [Approuvé ✓]                 │ │ │
    │ │ └─────────────────────────────────────────────────────┘ │ │
    │ │                                                          │ │
    │ │ EN ATTENTE                                               │ │
    │ │ ┌─────────────────────────────────────────────────────┐ │ │
    │ │ │ 🏖️ Congés payés        10-11 avril 2026             │ │ │
    │ │ │    2 jours             [En attente ⏳]               │ │ │
    │ │ │    Soumis il y a 2 jours                            │ │ │
    │ │ └─────────────────────────────────────────────────────┘ │ │
    │ │                                                          │ │
    │ │ PASSÉES                                                  │ │
    │ │ [Voir historique →]                                      │ │
    │ └─────────────────────────────────────────────────────────┘ │
    └─────────────────────────────────────────────────────────────┘

Page_Nouvelle_Demande: # /leaves/new
  Layout:
    ┌─────────────────────────────────────────────────────────────┐
    │ HEADER                                                       │
    │ [← Retour] Nouvelle demande                                 │
    ├─────────────────────────────────────────────────────────────┤
    │ TYPE                                                         │
    │ ┌─────────────────────────────────────────────────────────┐ │
    │ │ [Congés payés ▼]                                        │ │
    │ │                                                          │ │
    │ │ Solde disponible: 18.5 jours                            │ │
    │ └─────────────────────────────────────────────────────────┘ │
    ├─────────────────────────────────────────────────────────────┤
    │ PÉRIODE                                                      │
    │ ┌─────────────────────────────────────────────────────────┐ │
    │ │     ◀ Février 2026 ▶                                    │ │
    │ │ Lu  Ma  Me  Je  Ve  Sa  Di                              │ │
    │ │                         1   2                           │ │
    │ │  3   4   5   6   7   8   9                              │ │
    │ │ 10  11 [12][13][14] 15  16    ← Sélection               │ │
    │ │ 17  18  19  20  21  22  23                              │ │
    │ │ 24  25  26  27  28                                      │ │
    │ │                                                          │ │
    │ │ Du: 12/02 (journée) ▼  Au: 14/02 (journée) ▼           │ │
    │ │                                                          │ │
    │ │ = 3 jours ouvrés                                        │ │
    │ └─────────────────────────────────────────────────────────┘ │
    ├─────────────────────────────────────────────────────────────┤
    │ VÉRIFICATIONS                                                │
    │ ┌─────────────────────────────────────────────────────────┐ │
    │ │ ✓ Solde suffisant (18.5 → 15.5 jours)                  │ │
    │ │ ✓ Délai de prévenance respecté                         │ │
    │ │ ⚠ Période chargée (2 collègues déjà absents)           │ │
    │ │ ✓ Pas de période bloquée                               │ │
    │ └─────────────────────────────────────────────────────────┘ │
    ├─────────────────────────────────────────────────────────────┤
    │ COMMENTAIRE (optionnel)                                      │
    │ [________________________________________________]          │
    ├─────────────────────────────────────────────────────────────┤
    │ FOOTER                                                       │
    │ Approbateur: Marie D. (Manager)                             │
    │                                                              │
    │ [Enregistrer brouillon]              [Soumettre la demande] │
    └─────────────────────────────────────────────────────────────┘
```

### 3.2 Vue Manager

```yaml
Page_Gestion_Conges: # /leaves/manage
  Layout:
    ┌─────────────────────────────────────────────────────────────┐
    │ HEADER                                                       │
    │ Gestion des Congés                  [+ Saisir absence]      │
    ├─────────────────────────────────────────────────────────────┤
    │ ALERTS BANNER                                                │
    │ 🔔 3 demandes en attente de validation                      │
    ├─────────────────────────────────────────────────────────────┤
    │ TABS                                                         │
    │ [À valider (3)] [Calendrier] [Soldes équipe] [Historique]   │
    ├─────────────────────────────────────────────────────────────┤
    │ DEMANDES À VALIDER                                           │
    │ ┌─────────────────────────────────────────────────────────┐ │
    │ │ ┌───────────────────────────────────────────────────┐   │ │
    │ │ │ 👤 Jean D.         CP    12-14 fév (3j)           │   │ │
    │ │ │                                                    │   │ │
    │ │ │ Équipe ce jour: 4/6      ⚠ Limite couverture      │   │ │
    │ │ │                                                    │   │ │
    │ │ │ [Voir planning]   [❌ Refuser]   [✓ Approuver]    │   │ │
    │ │ └───────────────────────────────────────────────────┘   │ │
    │ │                                                          │ │
    │ │ ┌───────────────────────────────────────────────────┐   │ │
    │ │ │ 👤 Sophie M.       CP    1-5 mars (5j)            │   │ │
    │ │ │                                                    │   │ │
    │ │ │ Équipe ce jour: 5/6      ✓ OK                     │   │ │
    │ │ │                                                    │   │ │
    │ │ │ [Voir planning]   [❌ Refuser]   [✓ Approuver]    │   │ │
    │ │ └───────────────────────────────────────────────────┘   │ │
    │ └─────────────────────────────────────────────────────────┘ │
    └─────────────────────────────────────────────────────────────┘

Page_Calendrier_Equipe: # /leaves/calendar
  Layout:
    ┌─────────────────────────────────────────────────────────────┐
    │ HEADER                                                       │
    │ Calendrier Équipe                   [◀ Fév 2026 ▶]         │
    ├─────────────────────────────────────────────────────────────┤
    │ FILTERS                                                      │
    │ [Tous ▼] [Rôle ▼] [Type absence ▼]                         │
    ├─────────────────────────────────────────────────────────────┤
    │ CALENDAR GRID                                                │
    │ ┌─────────────────────────────────────────────────────────┐ │
    │ │          │ Lu1 │ Ma2 │ Me3 │ Je4 │ Ve5 │ ...           │ │
    │ │ ─────────┼─────┼─────┼─────┼─────┼─────┼               │ │
    │ │ Jean D.  │     │     │ ▓▓▓ │ ▓▓▓ │ ▓▓▓ │ CP            │ │
    │ │ Sophie M.│ ░░░ │ ░░░ │     │     │     │ Maladie       │ │
    │ │ Marc L.  │     │     │     │     │     │               │ │
    │ │ Anne T.  │     │ ▒▒▒ │     │     │     │ RTT           │ │
    │ │ ─────────┼─────┼─────┼─────┼─────┼─────┼               │ │
    │ │ PRÉSENTS │  4  │  3  │  3  │  3  │  3  │               │ │
    │ │ MINIMUM  │  3  │  3  │  3  │  3  │  3  │               │ │
    │ │ STATUT   │ ✓   │ ✓   │ ✓   │ ✓   │ ✓   │               │ │
    │ └─────────────────────────────────────────────────────────┘ │
    │                                                              │
    │ LÉGENDE:                                                     │
    │ ▓ CP Validé   ▒ RTT   ░ Maladie   ▪ En attente             │
    └─────────────────────────────────────────────────────────────┘
```

### 3.3 Composants UI

```yaml
Components:

  LeaveBalanceCard:
    usage: "Affichage solde par type"
    display:
      - Type de congé (icône + nom)
      - Solde actuel (grand chiffre)
      - Total acquis
      - Barre de progression
      - En attente (si applicable)
    variants:
      compact: "Juste chiffre et icône"
      detailed: "Avec breakdown"
      
  LeaveRequestCard:
    usage: "Carte demande"
    display:
      - Photo/initiales employé
      - Type d'absence (icône couleur)
      - Dates + durée
      - Statut (pill)
      - Impact équipe (indicator)
      - Actions
    states:
      pending: border-orange
      approved: border-green
      rejected: border-red
      
  TeamCalendarView:
    usage: "Calendrier équipe"
    display:
      - Lignes: employés
      - Colonnes: jours
      - Cellules: absences (couleur par type)
      - Footer: compteur présents
    interactions:
      - Click cellule: détail
      - Hover: tooltip infos
      - Scroll horizontal
      
  DateRangePicker:
    usage: "Sélection période"
    display:
      - Calendrier mensuel
      - Sélection range
      - Jours fériés marqués
      - Absences collègues (overlay)
    features:
      - Demi-journées
      - Calcul jours ouvrés auto
      
  ApprovalActionBar:
    usage: "Barre validation manager"
    display:
      - Bouton Refuser
      - Bouton Approuver
      - Champ commentaire (optionnel)
    confirmation:
      - Modal pour refus (motif obligatoire)
      
  CoverageIndicator:
    usage: "Indicateur couverture équipe"
    display:
      - Ratio présents/total
      - Comparaison vs minimum
      - Couleur (vert/orange/rouge)
    animation:
      - Pulse si critique
```

---

## 4. WORKFLOWS

### 4.1 Soumission Demande

```yaml
Flow_Soumission:

  Étape_1_Selection_Type:
    display: "Dropdown types d'absence"
    validation:
      - Si sick_leave: pas de solde vérifié
      - Si paid_leave: vérifier solde
      - Si exceptional: vérifier éligibilité
      
  Étape_2_Selection_Dates:
    display: "Calendrier avec sélection range"
    features:
      - Jours fériés grisés
      - Absences équipe en filigrane
      - Périodes bloquées barrées
    validation:
      - Dates futures (sauf maladie)
      - Délai de prévenance
      - Durée maximale
      
  Étape_3_Verification_Auto:
    checks:
      solde:
        pass: "Solde suffisant"
        fail: "Solde insuffisant (manque X jours)"
        action: block ou warning
        
      delai:
        pass: "Délai respecté (> X jours)"
        fail: "Délai trop court"
        action: warning
        
      coverage:
        pass: "Couverture équipe OK"
        warning: "Couverture limite"
        fail: "Équipe sous-staffée"
        action: warning
        
      blackout:
        pass: "Pas de période bloquée"
        fail: "Période bloquée"
        action: block ou escalade
        
      conflicts:
        info: "X collègues absents"
        
  Étape_4_Justificatif:
    conditional: selon type
    types_requiring:
      - sick_leave: medical_certificate
      - exceptional_*: document preuve
    upload: "Drag & drop ou caméra"
    
  Étape_5_Soumission:
    actions:
      - Création demande status=submitted
      - Identification approbateur(s)
      - Notification push + email manager
      - Email confirmation employé
      - Blocage provisoire solde
```

### 4.2 Approbation

```yaml
Flow_Approbation:

  Notification_Manager:
    channels: [push, email, in_app]
    content:
      - Nom employé
      - Type + dates
      - Durée
      - Impact équipe
      - CTA: "Voir la demande"
      
  Examen_Demande:
    display:
      - Détails demande
      - Calendrier équipe période
      - Historique absences employé
      - Soldes employé
      - Actions correctives si conflit
      
  Decision:
    approuver:
      - Commentaire optionnel
      - Mise à jour statut → approved
      - Notification employé
      - Mise à jour planning
      - Confirmation solde déduit
      
    refuser:
      - Motif obligatoire (dropdown + texte)
      - Mise à jour statut → rejected
      - Notification employé avec motif
      - Libération solde bloqué
      - Suggestion dates alternatives (optionnel)
      
    escalader:
      - Si niveau 2 requis
      - Notification owner
      
  Timeout:
    delai: 48h
    action:
      - Relance automatique
      - Escalade si configuré
```

### 4.3 Cas Spéciaux

```yaml
Arret_Maladie:
  flow:
    1. Déclaration rapide (employé ou manager)
       - Date début
       - "Justificatif à fournir"
    2. Statut: pending_documents
    3. Retrait immédiat du planning
    4. Upload arrêt de travail (48h)
    5. Validation dates
    6. Clôture automatique à date fin
    
  extension:
    - Prolongation possible
    - Nouveau justificatif requis
    
Annulation:
  par_employe:
    conditions:
      - Avant date début
      - Statut approved ou pending
    actions:
      - Demande annulation
      - Validation manager (optionnel)
      - Restitution solde
      - Mise à jour planning
      
  par_manager:
    conditions:
      - Raison impérieuse
    actions:
      - Notification employé
      - Discussion obligatoire
      - Compensation possible
```

---

## 5. INTÉGRATIONS

```yaml
Dépendances:

  Module_RH:
    read: "Fiches employés, contrats"
    write: "Historique absences"
    
  Module_Planning:
    check: "Conflits shifts"
    update: "Retrait planning si approuvé"
    coverage: "Calcul couverture"
    suggest: "Propositions remplacement"
    
  Module_Comptabilite:
    provisions: "Provisions CP"
    export: "Données DSN"
    reporting: "Absentéisme"
    
  Module_Notifications:
    employee: "Confirmation, décision"
    manager: "Nouvelles demandes, rappels"
    
  Module_Analytics:
    dashboards: "Taux absentéisme"
    trends: "Tendances par période"
    comparison: "Benchmark équipes"
```

---

## 6. PERMISSIONS

```yaml
Permissions:

  leaves.request.own:
    roles: [all_employees]
    scope: "Ses propres demandes"
    
  leaves.request.team:
    roles: [owner, manager]
    scope: "Saisir pour un membre équipe"
    
  leaves.approve:
    roles: [owner, manager]
    scope: "Selon hiérarchie"
    
  leaves.cancel.any:
    roles: [owner]
    
  leaves.balance.view_own:
    roles: [all_employees]
    
  leaves.balance.view_team:
    roles: [owner, manager, accountant]
    
  leaves.balance.adjust:
    roles: [owner]
    
  leaves.policy.manage:
    roles: [owner]
    
  leaves.calendar.view:
    roles: [all_employees]
    scope: "Vue limitée équipe"
    
  leaves.calendar.view_all:
    roles: [owner, manager]
```

---

> **Conformité** : Code du Travail, Convention Collective HCR  
> **Dépendances** : RH, Planning, Comptabilité, Notifications
