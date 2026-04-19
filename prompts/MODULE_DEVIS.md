# 📄 MODULE DEVIS — SPÉCIFICATION TECHNIQUE COMPLÈTE

> **Version 1.0** | Extension Restaurant OS  
> Respect du Master Prompt UI • Précision maximale

---

## 1. CONTEXTE ET OBJECTIFS

```yaml
Objectif_Principal: |
  Système complet de création, gestion et conversion de devis professionnels
  pour toutes prestations restaurant : événements, groupes, traiteur, privatisation.

Valeur_Métier:
  - Professionnalisation de l'offre commerciale
  - Réduction du temps de création (< 5 min)
  - Suivi automatisé des relances
  - Conversion optimisée (devis → réservation → facture)
  - Traçabilité complète

Métriques_Succès:
  - Temps création devis: < 5 minutes
  - Taux d'ouverture email: > 70%
  - Taux de conversion: > 40%
  - Délai moyen acceptation: < 5 jours
```

---

## 2. ARCHITECTURE DE DONNÉES

### 2.1 Entité Quote (Devis)

```yaml
Quote:
  id: UUID
  establishment_id: UUID
  
  # ═══════════════════════════════════════════════════════════════
  # IDENTIFICATION
  # ═══════════════════════════════════════════════════════════════
  
  quote_number:
    format: "DEV-{YYYY}-{XXXXX}"
    example: "DEV-2026-00042"
    generation: sequential_per_year
    unique: true
    immutable: true (une fois créé)
    
  version:
    type: integer
    default: 1
    increment: on_revision
    max: 99
    display: "v{version}" # "v1", "v2"
    
  parent_quote_id: UUID | null
  # Si révision, référence au devis original
  # Permet de tracer l'historique des versions
  
  # ═══════════════════════════════════════════════════════════════
  # CLIENT
  # ═══════════════════════════════════════════════════════════════
  
  client:
    type: enum [individual, company, existing_customer]
    
    # Lien CRM (si client existant)
    customer_id: UUID | null
    company_id: UUID | null
    
    # Données directes (copie ou création)
    contact:
      civility: enum [mr, mrs, ms] | null
      first_name: string (max 50)
      last_name: string (max 50)
      email: string (email valide, required)
      phone: string (format international, required)
      phone_secondary: string | null
      
    company:
      name: string | null
      siret: string (14 digits) | null
      vat_number: string | null
      address:
        street: string
        street2: string | null
        postal_code: string (5 digits France)
        city: string
        country: string (default: "France")
        
    billing_address:
      same_as_company: boolean (default: true)
      # Si false, champs adresse dédiés
      
  # ═══════════════════════════════════════════════════════════════
  # ÉVÉNEMENT ASSOCIÉ
  # ═══════════════════════════════════════════════════════════════
  
  event:
    type: enum [
      privatisation_full,    # Privatisation complète
      privatisation_partial, # Privatisation partielle (salon)
      group_dining,          # Repas de groupe (sans privatisation)
      catering_delivery,     # Traiteur livré
      catering_onsite,       # Traiteur sur place (externe)
      wedding,               # Mariage
      corporate,             # Séminaire / Entreprise
      celebration,           # Anniversaire / Fête
      funeral,               # Repas funéraire
      custom                 # Autre
    ]
    
    name: string (max 100)
    # Ex: "Mariage Martin-Dubois", "Séminaire TechCorp Q1"
    
    date: date (required)
    date_end: date | null (si multi-jours)
    
    time_setup: time | null
    # Ex: 14:00 (accès décorateur)
    
    time_start: time (required)
    # Ex: 19:00 (début cocktail)
    
    time_end: time (required)
    # Ex: 02:00 (fin prévue)
    
    time_cleanup: time | null
    # Ex: 03:00 (fin rangement)
    
    # Convives
    guests:
      count_expected: integer (required)
      count_min: integer | null (facturation minimum)
      count_max: integer | null (capacité max)
      
    # Espace réservé
    space_id: UUID | null
    # Lien vers PrivatizableSpace si privatisation
    
    # Besoins spéciaux
    requirements:
      dietary:
        vegetarian_count: integer | null
        vegan_count: integer | null
        halal_count: integer | null
        kosher_count: integer | null
        allergies: string[] # ["gluten", "nuts"]
        other: string | null
        
      logistics:
        parking_needed: integer | null (places)
        accessibility: boolean
        cloakroom: boolean
        children_count: integer | null
        highchair_count: integer | null
        
      external_vendors:
        allowed: boolean
        list: [{name: string, type: string, contact: string}]
        # Ex: DJ, Photographe, Fleuriste
        
      notes: text (2000 chars max)
      
  # ═══════════════════════════════════════════════════════════════
  # CONTENU DU DEVIS
  # ═══════════════════════════════════════════════════════════════
  
  sections:
    type: array
    items:
      id: UUID
      title: string (max 80)
      # Ex: "Cocktail dinatoire", "Menu", "Location salle"
      
      description: string | null (max 500)
      display_order: integer
      
      items:
        type: array
        items:
          id: UUID
          
          type: enum [
            menu_item,     # Article du menu
            package,       # Forfait prédéfini
            service,       # Prestation de service
            rental,        # Location (salle, matériel)
            staff,         # Personnel supplémentaire
            custom         # Ligne libre
          ]
          
          # Référence (si lié à un élément existant)
          reference_id: UUID | null
          reference_type: string | null
          
          # Détails
          name: string (max 150)
          description: string | null (max 500)
          
          # Quantification
          quantity: decimal(10,2)
          unit: string (max 20)
          # Ex: "personne", "pièce", "heure", "jour", "forfait"
          
          # Prix
          unit_price_ht: decimal(10,2)
          tax_rate: decimal(4,2)
          # Ex: 10.00 (restauration), 20.00 (alcool/service)
          
          # Remises
          discount:
            type: enum [none, percent, amount] | null
            value: decimal(10,2) | null
            reason: string | null
            
          # Totaux calculés
          subtotal_ht: decimal(10,2)
          tax_amount: decimal(10,2)
          subtotal_ttc: decimal(10,2)
          
          # Marqueurs
          is_optional: boolean (default: false)
          # Si true, non inclus dans total par défaut
          
          display_order: integer
          notes: string | null
          
  # ═══════════════════════════════════════════════════════════════
  # VARIANTES (Formules A/B/C)
  # ═══════════════════════════════════════════════════════════════
  
  has_variants: boolean (default: false)
  
  variants:
    type: array | null
    items:
      id: UUID
      name: string (max 50)
      # Ex: "Formule Essentielle", "Formule Prestige"
      
      description: string | null
      is_recommended: boolean (default: false)
      
      # Contenu spécifique à cette variante
      sections: [...] # Même structure que sections principale
      
      # Totaux de la variante
      totals:
        subtotal_ht: decimal
        discount_total: decimal
        total_ht: decimal
        total_ttc: decimal
        
  # ═══════════════════════════════════════════════════════════════
  # TOTAUX
  # ═══════════════════════════════════════════════════════════════
  
  totals:
    # Sous-total avant remises
    subtotal_ht: decimal(10,2)
    
    # Remise globale
    global_discount:
      type: enum [none, percent, amount]
      value: decimal(10,2) | null
      reason: string | null
      amount_ht: decimal(10,2)
      
    # Total après remises
    total_ht: decimal(10,2)
    
    # Détail TVA (groupé par taux)
    tax_details:
      type: array
      items:
        rate: decimal(4,2)
        base_ht: decimal(10,2)
        amount: decimal(10,2)
        
    # Total TTC
    total_ttc: decimal(10,2)
    
    # Acompte
    deposit:
      required: boolean
      percent: decimal(4,2) | null
      amount: decimal(10,2) | null
      due_date: date | null
      
    # Solde
    balance_due: decimal(10,2)
    balance_due_date: date | null
    
  # ═══════════════════════════════════════════════════════════════
  # CONDITIONS
  # ═══════════════════════════════════════════════════════════════
  
  terms:
    validity_days: integer (default: 30)
    expiration_date: date (calculated)
    
    payment_terms: text
    # Ex: "Acompte de 30% à la commande, solde 8 jours avant"
    
    cancellation_policy: text
    # Ex: "Annulation gratuite jusqu'à 15j avant, 50% entre 15j et 7j"
    
    special_conditions: text | null
    
    general_terms_url: URL | null
    # Lien vers CGV complètes
    
  # ═══════════════════════════════════════════════════════════════
  # ÉTAT ET WORKFLOW
  # ═══════════════════════════════════════════════════════════════
  
  status:
    type: enum
    values:
      draft:
        label: "Brouillon"
        color: "#6B7280"
        icon: "file-edit"
        
      pending_review:
        label: "En validation"
        color: "#F59E0B"
        icon: "eye"
        
      sent:
        label: "Envoyé"
        color: "#3B82F6"
        icon: "send"
        
      viewed:
        label: "Consulté"
        color: "#8B5CF6"
        icon: "eye-check"
        
      accepted:
        label: "Accepté"
        color: "#22C55E"
        icon: "check-circle"
        
      rejected:
        label: "Refusé"
        color: "#EF4444"
        icon: "x-circle"
        
      expired:
        label: "Expiré"
        color: "#9CA3AF"
        icon: "clock-x"
        
      converted:
        label: "Converti"
        color: "#10B981"
        icon: "arrow-right-circle"
        
      cancelled:
        label: "Annulé"
        color: "#DC2626"
        icon: "ban"
        
  # ═══════════════════════════════════════════════════════════════
  # SUIVI INTERACTIONS
  # ═══════════════════════════════════════════════════════════════
  
  tracking:
    # Envoi
    sent_at: timestamp | null
    sent_via: enum [email, whatsapp, sms, print, link] | null
    sent_by: UUID | null
    send_count: integer (default: 0)
    
    # Consultation
    first_viewed_at: timestamp | null
    last_viewed_at: timestamp | null
    view_count: integer (default: 0)
    view_duration_seconds: integer | null
    
    # Réponse
    responded_at: timestamp | null
    response_type: enum [accepted, rejected, negotiation] | null
    
    # Acceptation
    accepted_at: timestamp | null
    accepted_variant_id: UUID | null
    accepted_options: UUID[] # IDs des items optionnels acceptés
    
    # Signature
    signature:
      captured: boolean
      data: base64 | null
      timestamp: timestamp | null
      ip_address: string | null
      user_agent: string | null
      
    # Refus
    rejection_reason: string | null
    
    # Relances
    reminders:
      type: array
      items:
        sent_at: timestamp
        type: enum [email, sms, phone]
        outcome: enum [sent, opened, clicked, replied] | null
        
  # ═══════════════════════════════════════════════════════════════
  # CONVERSION
  # ═══════════════════════════════════════════════════════════════
  
  conversion:
    event_id: UUID | null
    # Lien vers GroupEvent créé
    
    reservation_id: UUID | null
    # Lien vers Reservation créée
    
    deposit_invoice_id: UUID | null
    # Facture d'acompte
    
    deposit_payment_id: UUID | null
    # Paiement de l'acompte
    
    final_invoice_id: UUID | null
    # Facture finale
    
  # ═══════════════════════════════════════════════════════════════
  # MÉTADONNÉES
  # ═══════════════════════════════════════════════════════════════
  
  metadata:
    created_at: timestamp
    created_by: UUID
    updated_at: timestamp
    updated_by: UUID
    
    notes_internal: text (2000 chars)
    # Notes internes, non visibles client
    
    tags: string[]
    # Ex: ["VIP", "Récurrent", "Partenaire"]
    
    source: enum [manual, website_form, phone, email, referral]
    source_details: string | null
```

### 2.2 Entités Liées

```yaml
QuoteTemplate:
  id: UUID
  establishment_id: UUID
  
  name: string
  description: string | null
  event_type: enum
  
  default_sections: [...]
  default_terms: {...}
  
  is_active: boolean
  usage_count: integer
  
QuoteItem_Preset:
  id: UUID
  establishment_id: UUID
  
  type: enum [package, service, rental, staff]
  name: string
  description: string
  default_price_ht: decimal
  tax_rate: decimal
  unit: string
  
  is_active: boolean
  
Quote_AccessToken:
  id: UUID
  quote_id: UUID
  
  token: string (64 chars, secure random)
  expires_at: timestamp
  
  permissions: enum [view, accept, reject, negotiate]
  
  created_at: timestamp
  used_at: timestamp | null
  revoked: boolean
```

---

## 3. INTERFACE UTILISATEUR

### 3.1 Layout Desktop (≥ 1024px)

```yaml
Page_Liste_Devis: # /quotes
  Layout:
    ┌─────────────────────────────────────────────────────────────┐
    │ HEADER                                                       │
    │ [← Retour] Devis [+ Nouveau Devis]                          │
    ├─────────────────────────────────────────────────────────────┤
    │ FILTERS BAR                                                  │
    │ [🔍 Rechercher...] [Statut ▼] [Type ▼] [Date ▼] [Export]    │
    ├─────────────────────────────────────────────────────────────┤
    │ KPI CARDS (4 colonnes)                                       │
    │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
    │ │ 12       │ │ 8        │ │ 67%      │ │ 45,200€  │         │
    │ │ En cours │ │ À relancer│ │ Conversion│ │ CA potent│         │
    │ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
    ├─────────────────────────────────────────────────────────────┤
    │ TABLE                                                        │
    │ ┌─────┬──────────┬──────────┬────────┬────────┬───────────┐ │
    │ │ N°  │ Client   │ Événement│ Montant│ Statut │ Actions   │ │
    │ ├─────┼──────────┼──────────┼────────┼────────┼───────────┤ │
    │ │DEV..│ Martin   │ Mariage  │25,000€ │ Envoyé │ [👁][✏][…]│ │
    │ │DEV..│ Dupont   │ Séminaire│ 3,500€ │Consulté│ [👁][✏][…]│ │
    │ └─────┴──────────┴──────────┴────────┴────────┴───────────┘ │
    ├─────────────────────────────────────────────────────────────┤
    │ PAGINATION                                                   │
    │ [← Précédent] Page 1 sur 5 [Suivant →]                      │
    └─────────────────────────────────────────────────────────────┘

Page_Creation_Devis: # /quotes/new
  Layout:
    ┌─────────────────────────────────────────────────────────────┐
    │ HEADER                                                       │
    │ [✕ Annuler] Nouveau Devis [Brouillon ●] [Prévisualiser]     │
    ├────────────────────────────────┬────────────────────────────┤
    │ EDITOR (flex: 1)               │ APERÇU LIVE (400px)        │
    │                                │                            │
    │ ┌────────────────────────────┐ │ ┌────────────────────────┐ │
    │ │ ÉTAPE 1/5: Type           │ │ │                        │ │
    │ │ ○ Privatisation           │ │ │   [LOGO]               │ │
    │ │ ● Groupe                  │ │ │                        │ │
    │ │ ○ Traiteur                │ │ │   DEVIS               │ │
    │ │ ○ Sur-mesure              │ │ │   N° DEV-2026-00043    │ │
    │ └────────────────────────────┘ │ │                        │ │
    │                                │ │   Client:              │ │
    │ [Étape suivante →]             │ │   M. Martin            │ │
    │                                │ │                        │ │
    │                                │ │   Événement:           │ │
    │                                │ │   Mariage              │ │
    │                                │ │   15 juin 2026         │ │
    │                                │ │                        │ │
    │                                │ └────────────────────────┘ │
    │                                │                            │
    │                                │ [📥 Télécharger PDF]       │
    └────────────────────────────────┴────────────────────────────┘

Page_Detail_Devis: # /quotes/[id]
  Layout:
    ┌─────────────────────────────────────────────────────────────┐
    │ HEADER                                                       │
    │ [← Retour] DEV-2026-00043 [Statut: Envoyé ●]                │
    │                          [Modifier] [Dupliquer] [Envoyer]   │
    ├─────────────────────────────────────────────────────────────┤
    │ TABS                                                         │
    │ [Aperçu] [Historique] [Documents] [Messages]                │
    ├────────────────────────────────┬────────────────────────────┤
    │ INFORMATIONS (60%)             │ TIMELINE (40%)             │
    │                                │                            │
    │ ┌────────────────────────────┐ │ ┌────────────────────────┐ │
    │ │ CLIENT                     │ │ │ Aujourd'hui            │ │
    │ │ M. Pierre Martin           │ │ │ ● 10:32 - Créé         │ │
    │ │ 📧 pierre@email.com       │ │ │ ● 10:45 - Envoyé       │ │
    │ │ 📱 +33 6 12 34 56 78      │ │ │                        │ │
    │ └────────────────────────────┘ │ │ Hier                   │ │
    │                                │ │ ○ 15:30 - Consulté     │ │
    │ ┌────────────────────────────┐ │ │   (3 min 42s)          │ │
    │ │ ÉVÉNEMENT                  │ │ │                        │ │
    │ │ 🎂 Mariage                 │ │ │ Prochaine action:      │ │
    │ │ 📅 15 juin 2026, 19h-02h  │ │ │ Relance dans 2 jours   │ │
    │ │ 👥 120 personnes          │ │ │ [Relancer maintenant]  │ │
    │ └────────────────────────────┘ │ └────────────────────────┘ │
    │                                │                            │
    │ ┌────────────────────────────┐ │                            │
    │ │ MONTANT                    │ │                            │
    │ │ Total TTC: 25,000.00€     │ │                            │
    │ │ Acompte: 7,500.00€ (30%) │ │                            │
    │ │ Solde: 17,500.00€        │ │                            │
    │ └────────────────────────────┘ │                            │
    └────────────────────────────────┴────────────────────────────┘
```

### 3.2 Composants UI

```yaml
Components:

  QuoteCard:
    usage: "Liste des devis"
    props:
      quote: Quote
      onView: () => void
      onEdit: () => void
      onDuplicate: () => void
      onDelete: () => void
    display:
      - Badge numéro + version
      - Nom client (bold)
      - Type événement + date
      - Montant TTC
      - Statut pill coloré
      - Menu actions (...)
    states:
      default: bg-card
      hover: bg-card-hover, shadow-lg
      selected: ring-2 ring-primary
      
  QuoteBuilder:
    usage: "Création/Édition de devis"
    sections:
      - TypeSelector (étape 1)
      - ClientForm (étape 2)
      - EventDetails (étape 3)
      - ContentEditor (étape 4)
      - TermsConditions (étape 5)
    features:
      - Sauvegarde automatique (30s)
      - Navigation étapes
      - Validation en temps réel
      - Prévisualisation live
      
  QuoteItemRow:
    usage: "Ligne article dans l'éditeur"
    props:
      item: QuoteItem
      onUpdate: (item) => void
      onDelete: () => void
      onDuplicate: () => void
      draggable: boolean
    display:
      - Drag handle
      - Type icon
      - Nom + description
      - Quantité (editable)
      - Prix unitaire (editable)
      - Total ligne
      - Toggle optionnel
      - Actions (edit, delete)
    interactions:
      - Inline editing
      - Drag & drop reorder
      - Swipe to delete (mobile)
      
  QuoteSectionBlock:
    usage: "Bloc section dans l'éditeur"
    props:
      section: QuoteSection
      items: QuoteItem[]
      onAddItem: () => void
      onEditSection: () => void
      onDeleteSection: () => void
    display:
      - Header avec titre editable
      - Liste des items
      - Bouton ajouter item
      - Sous-total section
    features:
      - Collapse/Expand
      - Drag & drop sections
      
  QuotePreview:
    usage: "Aperçu PDF en temps réel"
    props:
      quote: Quote
      scale: number
    display:
      - Rendu fidèle au PDF final
      - Pagination
      - Zoom controls
    features:
      - Scroll sync avec éditeur
      - Click pour focus section
      
  QuoteSendModal:
    usage: "Modal d'envoi"
    fields:
      - Destinataire email
      - CC (optionnel)
      - Objet personnalisable
      - Message personnalisable
      - Options: SMS, WhatsApp, Lien
    templates:
      - Email standard
      - Relance amicale
      - Dernière relance
      
  SignatureCanvas:
    usage: "Capture signature client"
    props:
      onSign: (base64) => void
      onClear: () => void
    display:
      - Canvas tactile
      - Bouton effacer
      - Bouton valider
    validation:
      - Minimum strokes
      - Checkbox "J'accepte les conditions"
```

### 3.3 États et Animations

```yaml
States:

  Page_Loading:
    display: "Skeleton cards/rows"
    duration: "< 500ms"
    
  Quote_Saving:
    indicator: "Saving..." with spinner
    position: "Header right"
    success: "Saved ✓" (fade after 2s)
    
  Quote_Sending:
    modal: "Envoi en cours..."
    progress: indeterminate
    success: "Devis envoyé ! 🎉"
    
  Quote_Viewed_Notification:
    type: toast
    position: bottom-right
    content: "M. Martin vient de consulter votre devis"
    action: "Voir le devis"
    auto_dismiss: 10s
    
Animations:

  List_Item_Entry:
    type: stagger
    delay: 50ms between items
    animation: fadeInUp
    duration: 200ms
    
  Quote_Status_Change:
    trigger: status update
    animation: 
      - Pill pulse
      - Confetti (if accepted)
    duration: 500ms
    
  Section_Expand:
    type: accordion
    animation: height + opacity
    duration: 300ms
    easing: ease-out
    
  Item_Delete:
    animation: slideOutLeft + fadeOut
    duration: 200ms
    confirmation: undo toast (5s)
    
  PDF_Preview_Load:
    placeholder: blur skeleton
    animation: fadeIn
    duration: 300ms
```

---

## 4. WORKFLOWS DÉTAILLÉS

### 4.1 Création de Devis

```yaml
Flow_Creation:

  Étape_1_Type:
    display: "Cards sélection type événement"
    options:
      - icon: "🏠"
        title: "Privatisation"
        description: "Location exclusive d'un espace"
      - icon: "👥"
        title: "Groupe"
        description: "Repas de groupe (10+ personnes)"
      - icon: "🚚"
        title: "Traiteur"
        description: "Livraison ou prestation externe"
      - icon: "✨"
        title: "Sur-mesure"
        description: "Demande personnalisée"
    action_next: "Sélection → Étape 2"
    
  Étape_2_Client:
    display: "Formulaire client"
    modes:
      search_existing:
        - Champ recherche
        - Résultats dropdown
        - Sélection → pré-remplissage
      create_new:
        - Basculer vers formulaire vide
        - Validation temps réel
    fields:
      - type (individual/company)
      - Civilité, Prénom, Nom
      - Email, Téléphone
      - Si entreprise: Raison sociale, SIRET
      - Adresse (autocomplete)
    validation:
      email: format valide
      phone: format international
      required: [nom, email, phone]
    action_next: "Valider → Étape 3"
    
  Étape_3_Evenement:
    display: "Détails de l'événement"
    fields:
      - Nom de l'événement
      - Date (DatePicker avec unavailabilities)
      - Horaires (setup, début, fin)
      - Nombre de convives (slider + input)
      - Espace souhaité (si privatisation)
      - Besoins spéciaux (accordéon)
    validation:
      date: >= aujourd'hui + délai minimum
      convives: dans capacité espace
    action_next: "Valider → Étape 4"
    
  Étape_4_Contenu:
    display: "Éditeur de contenu"
    panels:
      left:
        - Catalogue items (menu, forfaits, services)
        - Recherche / Filtres
        - Drag & drop vers éditeur
      center:
        - Sections du devis
        - Items par section
        - Totaux par section
        - Actions: ajouter section, item libre
      right:
        - Prévisualisation live
        - Totaux globaux
    features:
      - Import template
      - Dupliquer items
      - Réorganiser drag & drop
      - Édition inline
      - Calcul automatique
    validation:
      - Au moins 1 item
      - Tous les prix renseignés
    action_next: "Valider → Étape 5"
    
  Étape_5_Conditions:
    display: "Conditions et finalisation"
    fields:
      - Validité (jours)
      - Acompte (% ou montant)
      - Conditions de paiement (template)
      - Conditions d'annulation (template)
      - Conditions spéciales (libre)
      - Notes internes (non visibles client)
    actions:
      preview: "Ouvrir aperçu PDF plein écran"
      save_draft: "Sauvegarder brouillon"
      send: "Envoyer au client"
      
  Flow_Envoi:
    trigger: "Clic Envoyer"
    steps:
      1. Validation finale complète
      2. Génération PDF définitif
      3. Modal configuration envoi:
         - Email (pré-rempli)
         - Objet (template)
         - Message (template)
         - Pièce jointe PDF
         - Options: SMS, WhatsApp, Copie à moi
      4. Confirmation
      5. Envoi async
      6. Mise à jour statut → "sent"
      7. Création token accès client
      8. Notification succès
```

### 4.2 Parcours Client (Acceptation)

```yaml
Flow_Client:

  Réception_Email:
    content:
      - Logo restaurant
      - "Bonjour M. {nom}"
      - Résumé: événement, date, montant
      - Bouton CTA: "Consulter le devis"
      - Texte: "Valide jusqu'au {date}"
      - Bouton secondaire: "Questions ?"
      
  Page_Devis_Client: # /quotes/view/{token}
    layout:
      header:
        - Logo restaurant
        - Coordonnées
      body:
        - Numéro devis + date
        - Informations client
        - Détails événement
        - Tableau des prestations
        - Totaux
        - Conditions
      footer:
        - Boutons: [Accepter] [Refuser] [Questions]
        - Expiration countdown
        
  Flow_Acceptation:
    steps:
      1. Clic "Accepter ce devis"
      2. Si variantes: sélection variante
      3. Si options: toggle options souhaitées
      4. Récapitulatif final avec montant
      5. Checkbox "J'accepte les conditions"
      6. Capture signature (canvas)
      7. Confirmation
      8. Email confirmation automatique
      9. Notification interne (push + in-app)
      
  Flow_Refus:
    steps:
      1. Clic "Refuser"
      2. Modal raison (optionnel):
         - Trop cher
         - Date non disponible
         - Autre choix
         - Autre (préciser)
      3. Confirmation
      4. Notification interne
      5. Marquage statut "rejected"
```

---

## 5. GÉNÉRATION PDF

```yaml
PDF_Template:
  format: A4 (210 × 297 mm)
  margins: 20mm
  
  header:
    height: 40mm
    content:
      left:
        - Logo (max 50×25mm)
        - Nom restaurant
      right:
        - "DEVIS"
        - N° {quote_number}
        - Date: {created_at}
        - Valide jusqu'au: {expiration}
        
  client_block:
    position: left
    content:
      - Destinataire:
      - {company_name}
      - {civility} {first_name} {last_name}
      - {address}
      - {email}
      - {phone}
      
  event_block:
    position: right
    content:
      - Événement: {event_name}
      - Type: {event_type}
      - Date: {event_date}
      - Horaires: {time_start} - {time_end}
      - Convives: {guests_count}
      - Lieu: {space_name}
      
  content:
    sections:
      - Titre section (bold, bg color)
      - Tableau items:
          columns: [Description, Qté, Unité, PU HT, TVA, Total HT]
          widths: [40%, 10%, 10%, 15%, 10%, 15%]
      - Sous-total section
      
  totals_block:
    position: right
    width: 50%
    content:
      - Sous-total HT: {subtotal_ht}€
      - Remise: -{discount}€
      - Total HT: {total_ht}€
      - TVA {rate}%: {tva_amount}€
      - (répété par taux)
      - Total TTC: {total_ttc}€ (bold, large)
      - Acompte demandé: {deposit}€
      
  conditions_block:
    content:
      - Conditions de paiement
      - Conditions d'annulation
      - Conditions spéciales
      - CGV (lien ou texte)
      
  footer:
    height: 20mm
    content:
      - Raison sociale, SIRET, TVA intra
      - Adresse
      - Contact
      
  signature_block:
    content:
      - "Bon pour accord"
      - Zone signature (si accepté)
      - Date de signature
      
  styling:
    font_family: Inter
    font_sizes:
      title: 24pt
      section: 14pt
      body: 10pt
      small: 8pt
    colors:
      primary: {establishment_primary_color}
      text: #1a1a1a
      muted: #6b7280
      lines: #e5e7eb
```

---

## 6. INTÉGRATIONS ET DÉPENDANCES

```yaml
Dépendances_Critiques:

  Module_CRM:
    read:
      - Liste clients pour recherche
      - Historique client pour contexte
    write:
      - Création client depuis devis
      - Ajout devis à fiche client
    sync:
      - Mise à jour coordonnées
      
  Module_Reservations:
    read:
      - Disponibilités pour date événement
      - Conflits potentiels
    write:
      - Création réservation depuis devis accepté
      - Mise à jour réservation
    block:
      - Blocage provisoire dates (option)
      
  Module_Menu:
    read:
      - Liste produits pour catalogue
      - Prix actuels
      - Disponibilité
    import:
      - Items menu → items devis
      
  Module_Comptabilite:
    write:
      - Création facture acompte
      - Création facture finale
      - Lien paiement
    read:
      - Suivi encaissements
      
  Module_GroupesPrivatisation:
    write:
      - Création événement depuis devis
      - Liaison devis ↔ événement
    read:
      - Espaces disponibles
      - Capacités
      
  Module_Notifications:
    triggers:
      - Devis créé (notification interne)
      - Devis envoyé (email client)
      - Devis consulté (notification interne)
      - Devis accepté (notification interne + email)
      - Devis expirant (rappel client)
      - Devis expiré (notification interne)
```

---

## 7. API ENDPOINTS

```yaml
Endpoints:

  GET /api/quotes:
    description: Liste des devis
    query_params:
      - status: string[]
      - event_type: string[]
      - date_from: date
      - date_to: date
      - client_search: string
      - sort_by: string
      - sort_order: asc|desc
      - page: integer
      - per_page: integer
    response: PaginatedList<QuoteSummary>
    
  POST /api/quotes:
    description: Créer un devis
    body: CreateQuoteDTO
    response: Quote
    
  GET /api/quotes/{id}:
    description: Détail d'un devis
    response: Quote
    
  PUT /api/quotes/{id}:
    description: Modifier un devis
    body: UpdateQuoteDTO
    response: Quote
    
  DELETE /api/quotes/{id}:
    description: Supprimer un devis (brouillon uniquement)
    response: void
    
  POST /api/quotes/{id}/send:
    description: Envoyer le devis
    body: SendQuoteDTO
    response: { sent_at, tracking_id }
    
  POST /api/quotes/{id}/duplicate:
    description: Dupliquer un devis
    response: Quote
    
  POST /api/quotes/{id}/revision:
    description: Créer une révision
    response: Quote
    
  GET /api/quotes/{id}/pdf:
    description: Télécharger le PDF
    response: binary (application/pdf)
    
  # Endpoints client (token-based)
  
  GET /api/quotes/view/{token}:
    description: Voir le devis (client)
    response: QuotePublicView
    triggers: "mark as viewed"
    
  POST /api/quotes/view/{token}/accept:
    description: Accepter le devis
    body: AcceptQuoteDTO
    response: { confirmation_number }
    
  POST /api/quotes/view/{token}/reject:
    description: Refuser le devis
    body: RejectQuoteDTO
    response: void
```

---

## 8. PERMISSIONS

```yaml
Permissions:

  quotes.create:
    roles: [owner, manager]
    description: Créer un devis
    
  quotes.read:
    roles: [owner, manager, accountant]
    description: Voir les devis
    
  quotes.update:
    roles: [owner, manager]
    description: Modifier un devis
    constraints:
      - Brouillon: tous
      - Envoyé: crée une révision
      
  quotes.delete:
    roles: [owner]
    description: Supprimer un devis
    constraints:
      - Brouillon uniquement
      
  quotes.send:
    roles: [owner, manager]
    description: Envoyer un devis
    
  quotes.approve:
    roles: [owner]
    description: Valider avant envoi (si workflow)
    
  quotes.convert:
    roles: [owner, manager]
    description: Convertir en réservation
    
  quotes.export:
    roles: [owner, manager, accountant]
    description: Exporter la liste
```

---

> **Document à utiliser avec** : PROMPT_COMPLET.md (PRD principal)  
> **Module dépendant** : MODULE_GROUPES_PRIVATISATION.md
