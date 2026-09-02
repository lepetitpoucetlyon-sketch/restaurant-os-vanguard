# 🎉 MODULE GROUPES & PRIVATISATION — SPÉCIFICATION TECHNIQUE

> **Version 1.0** | Extension Restaurant OS  
> Respect du Master Prompt UI • Précision maximale

---

## 1. CONTEXTE ET OBJECTIFS

```yaml
Objectif_Principal: |
  Gérer l'intégralité du cycle de vie des événements privés : de la demande 
  initiale jusqu'à la clôture post-événement, en passant par le devis, 
  la confirmation, la préparation opérationnelle et la facturation.

Valeur_Métier:
  - Professionnalisation de l'offre événementielle
  - Optimisation du remplissage (yield management)
  - Réduction du temps administratif (automatisation)
  - Amélioration de l'expérience client B2B
  - Suivi opérationnel structuré

Types_Evenements:
  privatisation_totale:
    description: "Restaurant entier réservé"
    min_guests: 50
    requires: minimum_spend
    
  privatisation_partielle:
    description: "Salon, terrasse, zone spécifique"
    min_guests: 10
    requires: space_selection
    
  groupe_sans_privatisation:
    description: "Grande table ou tables groupées"
    min_guests: 8
    max_guests: 25
    requires: table_assignment
    
  evenement_recurent:
    description: "Déjeuner d'affaires hebdomadaire"
    frequency: weekly|monthly
    requires: contract

Métriques_Succès:
  - Taux de conversion demande → confirmation: > 50%
  - Délai moyen réponse demande: < 24h
  - NPS événements: > 70
  - CA événementiel vs total: suivi mensuel
```

---

## 2. ARCHITECTURE DE DONNÉES

### 2.1 Espaces Privatisables

```yaml
PrivatizableSpace:
  id: UUID
  establishment_id: UUID
  
  # ═══════════════════════════════════════════════════════════════
  # IDENTIFICATION
  # ═══════════════════════════════════════════════════════════════
  
  name: string (max 50)
  # Ex: "Salon Napoléon", "La Terrasse", "Cave Voûtée"
  
  slug: string
  # URL-friendly pour portail client
  
  type:
    type: enum
    values:
      full_venue: "Restaurant complet"
      private_room: "Salon privé"
      semi_private: "Espace semi-privatif"
      terrace: "Terrasse"
      bar_area: "Espace bar"
      wine_cellar: "Cave"
      rooftop: "Rooftop"
      garden: "Jardin"
      
  description: text (1000 chars)
  description_short: string (200 chars)
  
  # ═══════════════════════════════════════════════════════════════
  # CAPACITÉS
  # ═══════════════════════════════════════════════════════════════
  
  capacity:
    configurations:
      type: array
      items:
        id: UUID
        name: string
        # Ex: "Banquet", "Cocktail", "Théâtre", "U-Shape"
        
        layout_type: enum [
          banquet,        # Tables rondes
          cocktail,       # Debout avec mange-debout
          theatre,        # Chaises alignées
          classroom,      # Tables + chaises face tableau
          u_shape,        # Tables en U
          boardroom,      # Grande table unique
          cabaret,        # Demi-tables vers scène
          custom
        ]
        
        capacity_seated: integer
        capacity_standing: integer | null
        
        # Plan visuel
        layout_image: URL
        layout_svg: URL | null (pour interactif)
        
        # Tables associées
        table_ids: UUID[]
        
        is_default: boolean
        
    # Récapitulatif
    min_guests: integer
    max_guests_seated: integer
    max_guests_standing: integer
    
  # ═══════════════════════════════════════════════════════════════
  # ÉQUIPEMENTS
  # ═══════════════════════════════════════════════════════════════
  
  amenities:
    included:
      type: array
      items:
        id: UUID
        name: string
        icon: string
        quantity: integer | null
        # Ex: "Vidéoprojecteur", "WiFi", "Sono", "Écran"
        
    optional:
      type: array
      items:
        id: UUID
        name: string
        icon: string
        rental_price_ht: decimal
        # Ex: "Micro HF (+30€)", "Paperboard (+15€)"
        
  features:
    has_natural_light: boolean
    has_air_conditioning: boolean
    has_heating: boolean
    has_private_entrance: boolean
    has_private_toilets: boolean
    has_wheelchair_access: boolean
    has_stage: boolean
    has_dance_floor: boolean
    has_outdoor_access: boolean
    noise_level: enum [quiet, moderate, lively]
    
  # ═══════════════════════════════════════════════════════════════
  # TARIFICATION
  # ═══════════════════════════════════════════════════════════════
  
  pricing:
    model: enum [
      minimum_spend,      # Dépense minimum obligatoire
      rental_fee,         # Location fixe
      hybrid,             # Location + minimum consommation
      per_person,         # Prix par personne
      by_quote            # Sur devis uniquement
    ]
    
    minimum_spend:
      lunch_weekday: decimal | null
      dinner_weekday: decimal | null
      lunch_weekend: decimal | null
      dinner_weekend: decimal | null
      full_day: decimal | null
      
    rental_fee:
      per_hour: decimal | null
      half_day: decimal | null (4h)
      full_day: decimal | null (8h)
      evening: decimal | null (19h-02h)
      
    per_person:
      min_price: decimal | null
      
    tax_rate: decimal (default: 20.0)
    
    deposit:
      required: boolean
      percent: decimal (default: 30)
      
    # Suppléments
    surcharges:
      - condition: "holidays"
        amount: decimal
        type: percent | fixed
      - condition: "last_minute" # < 7 jours
        amount: decimal
        
  # ═══════════════════════════════════════════════════════════════
  # DISPONIBILITÉ
  # ═══════════════════════════════════════════════════════════════
  
  availability:
    is_active: boolean
    
    # Horaires standards
    default_hours:
      - days: [1, 2, 3, 4, 5] # Lun-Ven
        slots:
          - name: "Déjeuner"
            start: "12:00"
            end: "15:00"
          - name: "Dîner"
            start: "19:00"
            end: "23:30"
      - days: [6, 7] # Sam-Dim
        slots:
          - name: "Journée"
            start: "10:00"
            end: "02:00"
            
    # Périodes de fermeture
    blocked_periods:
      type: array
      items:
        start_date: date
        end_date: date
        reason: string
        # Ex: "Fermeture annuelle", "Travaux"
        
    # Réservation minimum avant
    advance_booking:
      min_days: integer (default: 3)
      max_days: integer (default: 365)
      
  # ═══════════════════════════════════════════════════════════════
  # MÉDIAS
  # ═══════════════════════════════════════════════════════════════
  
  media:
    cover_image: URL
    gallery: URL[]
    video_tour: URL | null
    virtual_tour_url: URL | null (360°)
    floor_plan: URL | null
    downloadable_brochure: URL | null
    
  # ═══════════════════════════════════════════════════════════════
  # MÉTADONNÉES
  # ═══════════════════════════════════════════════════════════════
  
  metadata:
    display_order: integer
    is_featured: boolean
    tags: string[]
    seo_title: string | null
    seo_description: string | null
    
    created_at: timestamp
    updated_at: timestamp
```

### 2.2 Événement Groupe

```yaml
GroupEvent:
  id: UUID
  establishment_id: UUID
  
  # ═══════════════════════════════════════════════════════════════
  # IDENTIFICATION
  # ═══════════════════════════════════════════════════════════════
  
  event_number:
    format: "EVT-{YYYY}-{XXXXX}"
    example: "EVT-2026-00127"
    
  type: enum [
    privatisation_full,
    privatisation_partial,
    group_booking,
    recurring,
    external_catering
  ]
  
  name: string (max 100)
  # Ex: "Mariage Martin-Dubois", "Séminaire TechCorp"
  
  category: enum [
    wedding,           # Mariage
    corporate,         # Entreprise (séminaire, team building)
    birthday,          # Anniversaire
    baptism,           # Baptême
    communion,         # Communion
    funeral,           # Repas funéraire
    association,       # Association / Club
    family_reunion,    # Réunion de famille
    graduation,        # Diplôme / Remise de prix
    holiday,           # Fête (Noël, St Sylvestre)
    other
  ]
  
  # ═══════════════════════════════════════════════════════════════
  # ESPACE ET TABLES
  # ═══════════════════════════════════════════════════════════════
  
  location:
    type: enum [space, tables]
    
    # Si privatisation
    space_id: UUID | null
    space_configuration_id: UUID | null
    
    # Si groupe sans privatisation
    table_ids: UUID[]
    
  # ═══════════════════════════════════════════════════════════════
  # ORGANISATEUR
  # ═══════════════════════════════════════════════════════════════
  
  organizer:
    type: enum [individual, company, agency]
    
    # Lien CRM
    customer_id: UUID | null
    company_id: UUID | null
    
    # Contact principal
    primary_contact:
      civility: enum [mr, mrs, ms]
      first_name: string
      last_name: string
      email: string
      phone: string
      role: string | null
      # Ex: "Wedding Planner", "Assistante direction"
      
    # Contact jour J (si différent)
    day_of_contact:
      name: string | null
      phone: string | null
      
    # Entreprise (si corporate)
    company:
      name: string | null
      billing_email: string | null
      purchase_order: string | null
      
  # ═══════════════════════════════════════════════════════════════
  # DATE ET HORAIRES
  # ═══════════════════════════════════════════════════════════════
  
  schedule:
    date: date
    date_end: date | null (si multi-jours)
    
    # Horaires détaillés
    times:
      setup_access: time | null
      # Accès pour décoration/installation
      
      guest_arrival: time
      # Arrivée des invités
      
      event_start: time
      # Début officiel (discours, etc.)
      
      meal_start: time | null
      # Service du repas
      
      event_end: time
      # Fin prévue
      
      venue_clear: time
      # Libération des lieux
      
    # Durée calculée
    duration_hours: decimal
    
  # ═══════════════════════════════════════════════════════════════
  # CONVIVES
  # ═══════════════════════════════════════════════════════════════
  
  guests:
    # Évolution des confirmations
    initial_estimate: integer
    confirmed_count: integer
    # Mis à jour au fur et à mesure
    
    final_count: integer | null
    # Nombre définitif (J-3 généralement)
    
    final_count_deadline: date
    # Date limite confirmation
    
    actual_attendance: integer | null
    # Présence réelle (post-event)
    
    # Facturation
    billable_count: integer
    # = max(final_count, minimum garanti)
    
    # Breakdown
    breakdown:
      adults: integer
      children: integer | null
      babies: integer | null
      vegetarian: integer | null
      vegan: integer | null
      special_diets: string | null
      
  # ═══════════════════════════════════════════════════════════════
  # MENU ET PRESTATIONS
  # ═══════════════════════════════════════════════════════════════
  
  menu:
    type: enum [
      preset_menu,       # Menu fixe prédéfini
      custom_menu,       # Menu sur-mesure
      buffet,           # Buffet
      cocktail,         # Cocktail dinatoire
      brunch,           # Brunch
      per_order         # À la carte
    ]
    
    # Si menu prédéfini
    package_id: UUID | null
    package_name: string | null
    
    # Détail du menu
    courses:
      type: array
      items:
        course_type: enum [
          welcome_drink,
          appetizer,
          starter,
          main,
          cheese,
          dessert,
          coffee,
          digestif,
          open_bar,
          other
        ]
        name: string
        description: string | null
        items: string[]
        # Ex: ["Foie gras mi-cuit", "Chutney de figues"]
        
    # Boissons
    beverages:
      package: enum [
        no_drinks,
        house_selection,
        premium_selection,
        per_consumption,
        open_bar
      ]
      details: string | null
      wine_selection: string | null
      
    # Prix
    price_per_person_ht: decimal
    
  # Prestations additionnelles
  additional_services:
    type: array
    items:
      id: UUID
      name: string
      description: string | null
      quantity: integer
      unit_price_ht: decimal
      total_ht: decimal
      # Ex: "Pièce montée", "DJ", "Fleurs"
      
  # ═══════════════════════════════════════════════════════════════
  # BESOINS SPÉCIAUX
  # ═══════════════════════════════════════════════════════════════
  
  requirements:
    dietary:
      allergies: string[]
      intolerances: string[]
      special_requests: string | null
      
    logistics:
      parking_cars: integer | null
      parking_buses: integer | null
      cloakroom: boolean
      accessibility_needs: string | null
      
    technical:
      microphone: boolean
      projector: boolean
      screen: boolean
      laptop: boolean
      sound_system: boolean
      special_lighting: boolean
      stage: boolean
      dance_floor: boolean
      other: string | null
      
    external_vendors:
      photographer: { name: string, arrival: time } | null
      videographer: { name: string, arrival: time } | null
      dj_band: { name: string, arrival: time, end: time } | null
      florist: { name: string, access: time } | null
      decorator: { name: string, access: time } | null
      cake_maker: { name: string, delivery: time } | null
      other: [{ type: string, name: string, details: string }]
      
    decorations:
      theme: string | null
      color_scheme: string | null
      table_decorations: string | null
      provided_by_client: string | null
      
  # ═══════════════════════════════════════════════════════════════
  # DEVIS ET FINANCIER
  # ═══════════════════════════════════════════════════════════════
  
  financial:
    quote_id: UUID | null
    quote_status: enum [none, pending, sent, accepted, rejected]
    quote_amount_ttc: decimal | null
    
    # Acomptes
    deposits:
      type: array
      items:
        amount: decimal
        due_date: date
        status: enum [pending, paid, overdue]
        payment_id: UUID | null
        invoice_id: UUID | null
        
    # Extras (consommations hors forfait)
    extras:
      type: array
      items:
        description: string
        quantity: decimal
        unit_price: decimal
        total: decimal
        added_by: UUID
        added_at: timestamp
        
    # Facture finale
    final_invoice_id: UUID | null
    final_amount_ttc: decimal | null
    paid: boolean
    
  # ═══════════════════════════════════════════════════════════════
  # STATUT ET WORKFLOW
  # ═══════════════════════════════════════════════════════════════
  
  status:
    type: enum
    values:
      inquiry:
        label: "Demande"
        color: "#F59E0B"
        description: "Demande reçue, en attente de traitement"
        
      quoted:
        label: "Devis envoyé"
        color: "#3B82F6"
        description: "Devis transmis, en attente réponse"
        
      confirmed:
        label: "Confirmé"
        color: "#22C55E"
        description: "Événement confirmé, acompte reçu"
        
      deposit_pending:
        label: "Attente acompte"
        color: "#F97316"
        description: "Confirmé mais acompte non reçu"
        
      in_preparation:
        label: "En préparation"
        color: "#8B5CF6"
        description: "J-7 : briefings en cours"
        
      ready:
        label: "Prêt"
        color: "#10B981"
        description: "J-1 : tout est en place"
        
      in_progress:
        label: "En cours"
        color: "#EF4444"
        description: "Événement en cours"
        
      completed:
        label: "Terminé"
        color: "#6B7280"
        description: "Événement terminé"
        
      invoiced:
        label: "Facturé"
        color: "#0EA5E9"
        description: "Facture finale envoyée"
        
      closed:
        label: "Clôturé"
        color: "#1F2937"
        description: "Paiement reçu, dossier clos"
        
      cancelled:
        label: "Annulé"
        color: "#DC2626"
        description: "Événement annulé"
        
  # ═══════════════════════════════════════════════════════════════
  # OPÉRATIONNEL
  # ═══════════════════════════════════════════════════════════════
  
  operations:
    # Équipe assignée
    staff:
      manager_id: UUID | null
      # Responsable événement
      
      servers: UUID[]
      bartenders: UUID[]
      kitchen: UUID[]
      
    # Briefings
    briefings:
      team_briefing:
        scheduled_at: timestamp | null
        completed: boolean
        notes: text | null
        
      kitchen_briefing:
        scheduled_at: timestamp | null
        completed: boolean
        notes: text | null
        
    # Checklists
    checklists:
      pre_event:
        items: [{task: string, done: boolean, assigned_to: UUID}]
        
      setup:
        items: [{task: string, done: boolean, assigned_to: UUID}]
        
      during:
        items: [{task: string, done: boolean, notes: string}]
        
      post_event:
        items: [{task: string, done: boolean, assigned_to: UUID}]
        
    # Notes équipe
    notes:
      kitchen: text | null
      service: text | null
      bar: text | null
      general: text | null
      
  # ═══════════════════════════════════════════════════════════════
  # POST-ÉVÉNEMENT
  # ═══════════════════════════════════════════════════════════════
  
  post_event:
    # Feedback
    feedback_requested: boolean
    feedback_received: boolean
    
    rating: integer | null (1-5)
    review: text | null
    testimonial_approved: boolean
    
    # Photos
    photos:
      internal: URL[]
      client_shared: URL[]
      
    # Notes internes
    lessons_learned: text | null
    issues_encountered: text | null
    
    # Fidélisation
    thank_you_sent: boolean
    anniversary_reminder: boolean
    # Pour relance anniversaire prochain
    
  # ═══════════════════════════════════════════════════════════════
  # MÉTADONNÉES
  # ═══════════════════════════════════════════════════════════════
  
  metadata:
    source: enum [website, phone, email, walk_in, referral, repeat]
    source_details: string | null
    
    created_at: timestamp
    created_by: UUID
    updated_at: timestamp
    updated_by: UUID
    
    tags: string[]
    internal_notes: text
```

---

## 3. INTERFACE UTILISATEUR

### 3.1 Layout Pages

```yaml
Page_Liste_Evenements: # /events
  Layout:
    ┌─────────────────────────────────────────────────────────────┐
    │ HEADER                                                       │
    │ [← Retour] Événements [+ Nouvel événement]                  │
    ├─────────────────────────────────────────────────────────────┤
    │ VIEW TOGGLE                                                  │
    │ [📅 Calendrier] [📋 Liste] [📊 Timeline]                    │
    ├─────────────────────────────────────────────────────────────┤
    │ FILTERS                                                      │
    │ [Période ▼] [Statut ▼] [Type ▼] [Espace ▼] [Recherche...]  │
    ├─────────────────────────────────────────────────────────────┤
    │ KPI ROW                                                      │
    │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
    │ │   5    │ │   3    │ │   8    │ │ 125K€  │ │  89%   │      │
    │ │Demandes│ │À venir │ │Ce mois │ │CA conf.│ │Taux cv │      │
    │ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘      │
    ├─────────────────────────────────────────────────────────────┤
    │ CONTENT (selon vue sélectionnée)                            │
    │                                                              │
    │ [Calendrier / Liste / Timeline]                             │
    │                                                              │
    └─────────────────────────────────────────────────────────────┘

Page_Calendrier: # /events?view=calendar
  Layout:
    ┌─────────────────────────────────────────────────────────────┐
    │ CALENDAR CONTROLS                                            │
    │ [← Mois préc.] Janvier 2026 [Mois suiv. →] [Aujourd'hui]   │
    ├─────────────────────────────────────────────────────────────┤
    │ CALENDAR GRID                                                │
    │ ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐                 │
    │ │ Lun │ Mar │ Mer │ Jeu │ Ven │ Sam │ Dim │                 │
    │ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                 │
    │ │     │     │  1  │  2  │  3  │  4  │  5  │                 │
    │ │     │     │     │     │     │▓▓▓▓▓│▓▓▓▓▓│ ← Événement    │
    │ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                 │
    │ │  6  │  7  │  8  │  9  │ 10  │ 11  │ 12  │                 │
    │ │     │░░░░░│     │     │     │▓▓▓▓▓│     │                 │
    │ │     │Sémin│     │     │     │Maria│     │                 │
    │ └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                 │
    │                                                              │
    │ LÉGENDE: ▓ Confirmé  ░ En attente  ▒ Demande               │
    └─────────────────────────────────────────────────────────────┘

Page_Detail_Evenement: # /events/[id]
  Layout:
    ┌─────────────────────────────────────────────────────────────┐
    │ HEADER                                                       │
    │ [← Retour] Mariage Martin-Dubois [Confirmé ●]               │
    │            EVT-2026-00127                                    │
    │ [Modifier] [Devis] [Checklist] [Communiquer] [···]          │
    ├─────────────────────────────────────────────────────────────┤
    │ TABS                                                         │
    │ [Résumé] [Menu] [Organisation] [Documents] [Historique]     │
    ├──────────────────────────────┬──────────────────────────────┤
    │ MAIN CONTENT (70%)           │ SIDEBAR (30%)                │
    │                              │                              │
    │ ┌──────────────────────────┐ │ ┌──────────────────────────┐ │
    │ │ COUNTDOWN                │ │ │ QUICK INFO              │ │
    │ │ J-15 avant l'événement   │ │ │ 📅 15 juin 2026         │ │
    │ │ [=======----] 50%       │ │ │ ⏰ 19h00 - 02h00        │ │
    │ └──────────────────────────┘ │ │ 👥 120 personnes        │ │
    │                              │ │ 📍 Salon Napoléon       │ │
    │ ┌──────────────────────────┐ │ │ 💰 25,000€ TTC         │ │
    │ │ ORGANISATEUR             │ │ └──────────────────────────┘ │
    │ │ M. Pierre Martin         │ │                              │
    │ │ 📧 pierre@email.com     │ │ ┌──────────────────────────┐ │
    │ │ 📱 +33 6 12 34 56 78    │ │ │ PROCHAINES ACTIONS      │ │
    │ │ [Appeler] [Email]        │ │ │ ⚠ Confirmer nb final   │ │
    │ └──────────────────────────┘ │ │   → J-3 (12 juin)       │ │
    │                              │ │ ○ Briefing équipe       │ │
    │ ┌──────────────────────────┐ │ │   → J-1 (14 juin)       │ │
    │ │ MENU                     │ │ │ ○ Mise en place         │ │
    │ │ Formule Prestige         │ │ │   → Jour J 14h00        │ │
    │ │ 85€/pers × 120 = 10,200€│ │ └──────────────────────────┘ │
    │ │                          │ │                              │
    │ │ • Cocktail (1h)          │ │ ┌──────────────────────────┐ │
    │ │ • Entrée: Foie gras      │ │ │ PAIEMENTS               │ │
    │ │ • Plat: Filet de bœuf    │ │ │ ✓ Acompte 7,500€       │ │
    │ │ • Fromages               │ │ │ ○ Solde 17,500€        │ │
    │ │ • Dessert: Pièce montée  │ │ │   → Échéance 08/06      │ │
    │ │ • Vins: Sélection premium│ │ └──────────────────────────┘ │
    │ │ [Voir détail ↗]         │ │                              │
    │ └──────────────────────────┘ │                              │
    └──────────────────────────────┴──────────────────────────────┘
```

### 3.2 Composants UI

```yaml
Components:

  EventCard:
    usage: "Liste/calendrier événements"
    variants:
      compact: # Vue calendrier
        height: 32px
        display: [name, time]
        
      standard: # Vue liste
        display:
          - Date badge (jour/mois)
          - Nom événement
          - Type + Nb convives
          - Espace
          - Statut pill
          - Actions menu
          
      detailed: # Vue timeline
        display:
          - Toutes infos
          - Progress bar préparation
          - Alertes
          
  SpaceCard:
    usage: "Sélection espace"
    display:
      - Image cover (16:9)
      - Nom espace
      - Capacité range
      - Prix indicatif
      - Tags (terrasse, vue, etc.)
    states:
      default: border-muted
      hover: scale(1.02), shadow
      selected: border-primary, bg-primary/5
      unavailable: opacity-50, badge "Indisponible"
      
  GuestCountTracker:
    usage: "Suivi évolution convives"
    display:
      - Timeline graphique
      - Points: initial → confirmé → final → réel
      - Tendance (hausse/baisse)
    interactions:
      - Click pour ajouter mise à jour
      - Hover pour détails
      
  EventTimeline:
    usage: "Timeline verticale événement"
    display:
      - Jalons avec dates
      - Statut (fait/à faire)
      - Assigné à
    markers:
      - Demande reçue
      - Devis envoyé
      - Devis accepté
      - Acompte reçu
      - Nombre final confirmé
      - Briefing équipe
      - Événement
      - Facture envoyée
      - Paiement reçu
      
  ChecklistBlock:
    usage: "Checklist opérationnelle"
    sections:
      - Pré-événement (J-7 à J-1)
      - Installation (Jour J matin)
      - Pendant l'événement
      - Clôture
    item:
      - Checkbox
      - Tâche
      - Assigné
      - Date butoir
      - Priorité
      
  SpaceAvailabilityCalendar:
    usage: "Calendrier dispo espace"
    display:
      - Vue mois
      - Créneaux par jour
      - Code couleur (libre/occupé/bloqué)
    interactions:
      - Click jour → détail
      - Drag pour sélection période
```

### 3.3 États et Animations

```yaml
States:

  Event_Status_Transition:
    trigger: changement de statut
    animation:
      - Pill pulse
      - Toast notification
      - Update timeline
      
  Countdown_Critical:
    trigger: J-3 et moins
    display:
      - Countdown rouge
      - Badge warning
      - Pulse animation
      
  Checklist_Complete:
    trigger: Dernière tâche cochée
    animation:
      - Confetti
      - Section collapse
      - Badge "Prêt ✓"

Animations:

  Calendar_Load:
    type: stagger
    delay: 30ms per day
    animation: fadeIn + scaleUp
    
  Event_Card_Hover:
    transform: translateY(-2px)
    shadow: elevation-3
    duration: 150ms
    
  Tab_Switch:
    type: slide
    direction: based on tab index
    duration: 200ms
    
  Timeline_Progress:
    type: draw
    animation: line grows to current point
    duration: 800ms
    easing: ease-out
```

---

## 4. WORKFLOWS DÉTAILLÉS

### 4.1 De la Demande à la Confirmation

```yaml
Flow_Demande_Confirmation:

  Étape_1_Réception_Demande:
    source: [website_form, phone, email, walk_in]
    
    website_form:
      fields:
        - Type d'événement
        - Date souhaitée
        - Nombre de personnes (fourchette)
        - Espace préféré (optionnel)
        - Budget indicatif
        - Nom, Email, Téléphone
        - Message
      action:
        - Création GroupEvent (status: inquiry)
        - Notification manager (push + email)
        - Email confirmation client
        - Vérification auto disponibilité
        
    manual:
      action:
        - Création depuis backoffice
        - Saisie informations
        
  Étape_2_Qualification:
    tasks:
      - Vérifier disponibilité espace
      - Vérifier capacité
      - Évaluer faisabilité
      - Premier contact client (24h max)
      
    outcomes:
      qualified:
        action: "Passage à création devis"
        
      negotiation:
        action: "Discussion dates/prestations alternatives"
        
      declined:
        action: "Refus poli avec explication"
        reasons: ["Complet", "Trop peu de convives", "Hors capacité"]
        
  Étape_3_Creation_Devis:
    link: "→ Module Devis"
    actions:
      - Créer devis depuis événement
      - Lien bidirectionnel event ↔ quote
      - Personnalisation selon besoins
      - Validation interne (optionnel)
      - Envoi client
      
  Étape_4_Suivi_Devis:
    tracking:
      - Devis consulté → notification
      - Relances automatiques (J+3, J+7)
      - Appel si pas de réponse J+10
      
    outcomes:
      accepted:
        - Status event → confirmed
        - Blocage définitif espace
        - Génération facture acompte
        - Email instructions paiement
        - Création jalons préparation
        
      negotiation:
        - Création révision devis
        - Nouveau cycle
        
      rejected:
        - Status event → cancelled
        - Feedback si possible
        - Libération provisoire espace
        
  Étape_5_Acompte:
    amount: 30% (configurable)
    deadline: 7 jours après acceptation
    
    monitoring:
      - Rappel J-2 si non payé
      - Relance J+1 si dépassé
      - Alerte manager J+3
      
    received:
      - Status → confirmed (définitif)
      - Email confirmation
      - Démarrage préparation
```

### 4.2 Préparation Opérationnelle

```yaml
Flow_Preparation:

  J-30_to_J-15:
    tasks:
      - Validation menu définitif
      - Confirmation besoins spéciaux
      - Réservation extras (DJ, déco, etc.)
      - Commandes spéciales fournisseurs
      
  J-14_to_J-7:
    tasks:
      - Attribution équipe
      - Planning personnel
      - Brief cuisine sur menu
      - Préparation checklists
      - Relance confirmation nombre
      
  J-7_Status_Change:
    trigger: automatique à J-7
    action:
      - Status → in_preparation
      - Notification équipe
      - Email client "J-7"
      
  J-3:
    critical_deadline: "Nombre final convives"
    tasks:
      - Confirmation écrite client
      - Mise à jour commandes
      - Ajustements si besoin
      - Briefing cuisine définitif
      
  J-1:
    status: → ready
    tasks:
      - Briefing équipe complet
      - Vérification matériel
      - Mise en place initiale possible
      - Dernier contact client
      - Checklist finale
      
  Jour_J:
    timeline:
      setup:
        - Accueil prestataires externes
        - Mise en place tables
        - Décoration
        - Test sono/vidéo
        - Dernière vérification
        
      event:
        status: → in_progress
        - Accueil organisateur
        - Lancement service
        - Suivi temps réel
        - Gestion imprévus
        - Suivi consommations extras
        
      closing:
        - Rangement
        - Photo avant/après
        - Notes incidents
        - Remise clés/matériel
```

### 4.3 Post-Événement

```yaml
Flow_Post_Event:

  J+1:
    status: → completed
    tasks:
      - Consolidation extras
      - Notes internes
      - Photos événement
      
  J+2_to_J+5:
    tasks:
      - Génération facture finale
      - Envoi client
      - Demande feedback
      
  Feedback:
    email_template:
      - Remerciements
      - Lien vers formulaire satisfaction
      - Demande de témoignage
      - Invitation à partager photos
      
    form:
      - Note globale (1-5 étoiles)
      - Notes détaillées (cuisine, service, lieu)
      - Points positifs (libre)
      - Points à améliorer (libre)
      - Recommanderiez-vous ? (NPS)
      - Témoignage public autorisé ?
      
  Paiement_Final:
    deadline: selon conditions (ex: 30 jours)
    monitoring:
      - Rappels automatiques
      - Suivi comptabilité
      
    received:
      - Status → closed
      - Email remerciement final
      - Archivage dossier
      
  Fidélisation:
    one_year_reminder:
      - Si anniversaire/récurrent
      - Email "Planifiez votre prochain événement"
      - Offre spéciale fidélité
```

---

## 5. FORMULAIRE PUBLIC

```yaml
Public_Form: # /book-event

  Design:
    style: "Landing page épurée"
    branding: "Logo + couleurs établissement"
    responsive: true
    
  Sections:
    
    Hero:
      - Image espace star
      - Titre: "Privatisez notre restaurant"
      - Sous-titre: "Pour vos événements exceptionnels"
      - CTA: "Demander un devis"
      
    Spaces_Gallery:
      - Cards espaces disponibles
      - Filtres par capacité
      - Galerie photos par espace
      
    Form:
      step_1_event:
        - Type d'événement (dropdown)
        - Date souhaitée (datepicker)
        - Flexibilité date (oui/non)
        - Nombre de personnes (range slider)
        
      step_2_preferences:
        - Espace préféré (cards sélection)
        - Type de formule (menu/buffet/cocktail)
        - Budget indicatif (optionnel)
        - Besoins spéciaux (textarea)
        
      step_3_contact:
        - Civilité, Prénom, Nom
        - Email
        - Téléphone
        - Entreprise (optionnel)
        - Comment nous avez-vous connu ?
        - RGPD consent
        
    Confirmation:
      - Message de remerciement
      - Récapitulatif demande
      - "Nous vous recontactons sous 24h"
      - Suggestion: suivre sur Instagram
      
  Backend:
    - Création GroupEvent
    - Email notification manager
    - Email confirmation client
    - Webhook CRM (optionnel)
```

---

## 6. INTÉGRATIONS

```yaml
Dépendances:

  Module_Devis:
    create: "Créer devis depuis événement"
    link: "Lien bidirectionnel event ↔ quote"
    convert: "Conversion auto à l'acceptation"
    sync: "Statuts synchronisés"
    
  Module_Plan_Salle:
    read: "Espaces et configurations"
    block: "Blocage tables/espaces"
    display: "Visualisation attribution"
    
  Module_Reservations:
    create: "Conversion en réservation si groupe simple"
    check: "Conflits horaires"
    
  Module_Menu:
    read: "Forfaits et menus événementiels"
    price: "Calcul prix par personne"
    
  Module_RH:
    assign: "Attribution personnel"
    schedule: "Impact planning"
    
  Module_Stocks:
    forecast: "Prévisions commandes"
    order: "Commandes spéciales"
    
  Module_Comptabilite:
    invoice: "Factures acompte et finale"
    payment: "Suivi encaissements"
    
  Module_CRM:
    link: "Fiche client"
    history: "Historique événements"
    
  Module_Notifications:
    internal: "Alertes équipe"
    client: "Emails automatiques"
```

---

## 7. PERMISSIONS

```yaml
Permissions:

  events.list:
    roles: [owner, manager, host]
    
  events.create:
    roles: [owner, manager, host]
    
  events.read:
    roles: [owner, manager, host, chef, accountant]
    constraints:
      - chef: vue limitée (menu, notes cuisine)
      - accountant: vue financière uniquement
      
  events.update:
    roles: [owner, manager]
    
  events.delete:
    roles: [owner]
    constraints: "inquiry ou cancelled uniquement"
    
  events.manage_operations:
    roles: [owner, manager, chef]
    scope: "Checklists, briefings, notes"
    
  spaces.manage:
    roles: [owner, manager]
    
  spaces.read:
    roles: [owner, manager, host]
```

---

> **Document à utiliser avec** : PROMPT_COMPLET.md, MODULE_DEVIS.md  
> **Dépendances** : Devis, Plan de Salle, Menu, RH, Stocks, Comptabilité
