# 🔍 MODULE SEO & RÉFÉRENCEMENT NATUREL — SPÉCIFICATION TECHNIQUE

> **Version 1.0** | Extension Restaurant OS  
> Respect du Master Prompt UI • Optimisation moteurs de recherche

---

## 1. CONTEXTE ET OBJECTIFS

```yaml
Objectif_Principal: |
  Optimiser la visibilité du restaurant sur les moteurs de recherche
  (Google, Bing) et les plateformes tierces (Google Business, TripAdvisor)
  avec génération automatique de données structurées et contenu optimisé.

Valeur_Métier:
  - Augmentation trafic organique
  - Meilleure conversion visiteurs → réservations
  - Visibilité locale renforcée
  - Réduction dépendance publicités payantes
  - Image professionnelle cohérente

Périmètre:
  - Pages publiques (site vitrine)
  - Module réservation en ligne
  - Menu digital
  - Blog/Actualités
  - Événements publics
  - Synchronisation Google Business Profile

Métriques_Succès:
  - Position moyenne Google: top 5 local
  - Trafic organique: +30% en 6 mois
  - CTR SERP: > 5%
  - Score Core Web Vitals: 90+
```

---

## 2. ARCHITECTURE DE DONNÉES

### 2.1 Configuration SEO Globale

```yaml
SEOConfig:
  id: UUID
  establishment_id: UUID
  
  # ═══════════════════════════════════════════════════════════════
  # INFORMATIONS DE BASE
  # ═══════════════════════════════════════════════════════════════
  
  site:
    title: string (max 60)
    # Ex: "Le Gourmet - Restaurant Gastronomique Paris 8ème"
    
    title_template: string
    # Ex: "{page_title} | {site_title}"
    
    description: string (max 160)
    # Description par défaut pour les pages sans description
    
    keywords: string[]
    # Mots-clés principaux
    # Ex: ["restaurant gastronomique", "paris 8", "cuisine française"]
    
    language: string
    # Ex: "fr-FR"
    
    locale: string
    # Ex: "fr_FR"
    
  # ═══════════════════════════════════════════════════════════════
  # ORGANISATION / RESTAURANT
  # ═══════════════════════════════════════════════════════════════
  
  organization:
    name: string
    legal_name: string | null
    
    description: string (500 chars)
    
    logo: URL
    logo_square: URL (pour favicon et socials)
    
    contact:
      telephone: string
      email: string
      
    address:
      street: string
      city: string
      postal_code: string
      region: string | null
      country: string
      
    geo:
      latitude: decimal
      longitude: decimal
      
    social_profiles:
      facebook: URL | null
      instagram: URL | null
      twitter: URL | null
      linkedin: URL | null
      youtube: URL | null
      tiktok: URL | null
      
  # ═══════════════════════════════════════════════════════════════
  # RESTAURANT SPÉCIFIQUE
  # ═══════════════════════════════════════════════════════════════
  
  restaurant:
    cuisine_types: string[]
    # Ex: ["French", "Contemporary", "Fine Dining"]
    
    price_range: enum [€, €€, €€€, €€€€]
    
    accepts_reservations: boolean
    reservation_url: URL | null
    
    menu_url: URL
    
    opening_hours:
      type: array
      items:
        day_of_week: enum [Monday, Tuesday, ...]
        opens: time | null
        closes: time | null
        valid_from: date | null
        valid_through: date | null
        
    special_hours:
      type: array
      items:
        date: date
        opens: time | null
        closes: time | null
        description: string
        # Ex: "Fermé exceptionnellement"
        
    payment_methods: string[]
    # Ex: ["Cash", "Credit Card", "Debit Card"]
    
    services:
      dine_in: boolean
      takeaway: boolean
      delivery: boolean
      outdoor_seating: boolean
      wifi: boolean
      parking: boolean
      wheelchair_accessible: boolean
      
    aggregate_rating:
      value: decimal (1-5) | null
      count: integer | null
      source: string | null
      # Ex: "Google Reviews"
      
  # ═══════════════════════════════════════════════════════════════
  # OPEN GRAPH (RÉSEAUX SOCIAUX)
  # ═══════════════════════════════════════════════════════════════
  
  open_graph:
    default_image: URL
    # Image par défaut pour partages
    
    image_dimensions:
      width: 1200
      height: 630
      
    type: "restaurant"
    
  # ═══════════════════════════════════════════════════════════════
  # TWITTER CARDS
  # ═══════════════════════════════════════════════════════════════
  
  twitter:
    card_type: enum [summary, summary_large_image]
    site_handle: string | null
    # Ex: "@legourmet_paris"
    
    creator_handle: string | null
    
  # ═══════════════════════════════════════════════════════════════
  # TECHNIQUE
  # ═══════════════════════════════════════════════════════════════
  
  technical:
    canonical_domain: string
    # Ex: "https://www.legourmet.fr"
    
    trailing_slash: boolean
    
    robots:
      index: boolean
      follow: boolean
      
    sitemap:
      enabled: boolean
      frequency: enum [daily, weekly, monthly]
      priority_home: decimal (0-1)
      priority_menu: decimal
      priority_blog: decimal
      
  # ═══════════════════════════════════════════════════════════════
  # INTÉGRATIONS
  # ═══════════════════════════════════════════════════════════════
  
  integrations:
    google_analytics:
      measurement_id: string | null
      # Ex: "G-XXXXXXXXXX"
      
    google_tag_manager:
      container_id: string | null
      
    google_search_console:
      verified: boolean
      verification_method: enum [dns, meta_tag, file]
      
    google_business_profile:
      linked: boolean
      place_id: string | null
      last_sync: timestamp | null
      
    facebook_pixel:
      pixel_id: string | null
      
  # ═══════════════════════════════════════════════════════════════
  # MÉTADONNÉES
  # ═══════════════════════════════════════════════════════════════
  
  metadata:
    created_at: timestamp
    updated_at: timestamp
    last_sitemap_generated: timestamp | null
```

### 2.2 SEO Par Page

```yaml
PageSEO:
  id: UUID
  establishment_id: UUID
  
  # Identification
  page_type: enum [
    home,
    menu,
    menu_category,
    menu_item,
    reservations,
    contact,
    about,
    blog_index,
    blog_post,
    event,
    space,          # Espace privatisable
    gallery,
    legal,          # CGV, mentions légales
    custom
  ]
  
  page_path: string
  # Ex: "/menu/entrees"
  
  reference_id: UUID | null
  # ID de l'entité liée (menu_item, blog_post, etc.)
  
  # ═══════════════════════════════════════════════════════════════
  # META TAGS
  # ═══════════════════════════════════════════════════════════════
  
  meta:
    title: string (max 60)
    title_auto_generated: boolean
    
    description: string (max 160)
    description_auto_generated: boolean
    
    keywords: string[] | null
    
    robots:
      index: boolean
      follow: boolean
      
    canonical_url: string
    # URL canonique absolue
    
  # ═══════════════════════════════════════════════════════════════
  # OPEN GRAPH
  # ═══════════════════════════════════════════════════════════════
  
  open_graph:
    title: string | null
    # Si null, utilise meta.title
    
    description: string | null
    
    image: URL | null
    image_alt: string | null
    
    type: string
    # Ex: "restaurant.menu_item", "article", "website"
    
  # ═══════════════════════════════════════════════════════════════
  # TWITTER
  # ═══════════════════════════════════════════════════════════════
  
  twitter:
    title: string | null
    description: string | null
    image: URL | null
    card: enum [summary, summary_large_image]
    
  # ═══════════════════════════════════════════════════════════════
  # STRUCTURED DATA
  # ═══════════════════════════════════════════════════════════════
  
  structured_data:
    type: string
    # Ex: "MenuItem", "Article", "Event"
    
    json_ld: object
    # Objet JSON-LD complet
    
    auto_generated: boolean
    
  # ═══════════════════════════════════════════════════════════════
  # SCORING
  # ═══════════════════════════════════════════════════════════════
  
  seo_score:
    overall: integer (0-100)
    
    breakdown:
      title_length: integer
      description_length: integer
      has_h1: boolean
      has_image_alt: boolean
      has_structured_data: boolean
      mobile_friendly: boolean
      page_speed: integer
      
    issues: string[]
    recommendations: string[]
    
  # Métadonnées
  last_analyzed: timestamp | null
  last_updated: timestamp
```

### 2.3 Menu Item SEO

```yaml
MenuItemSEO:
  menu_item_id: UUID
  
  # Auto-généré depuis les données du menu
  slug: string
  # Ex: "entrecote-sauce-bearnaise"
  
  auto_title: string
  # Ex: "Entrecôte Sauce Béarnaise - Le Gourmet Paris"
  
  auto_description: string
  # Généré depuis description + allergènes + prix
  # Ex: "Savoureuse entrecôte de bœuf servie avec sa sauce béarnaise maison. 
  #      Allergènes: lait, œufs. 32€. Restaurant Le Gourmet Paris 8ème."
  
  # Schema.org MenuItem
  structured_data:
    "@context": "https://schema.org"
    "@type": "MenuItem"
    name: string
    description: string
    offers:
      "@type": "Offer"
      price: decimal
      priceCurrency: "EUR"
      availability: "https://schema.org/InStock"
    nutrition:
      "@type": "NutritionInformation"
      calories: string | null
      # Ex: "850 calories"
    suitableForDiet:
      - "https://schema.org/VegetarianDiet"  # si applicable
    image: URL | null
```

---

## 3. GÉNÉRATION AUTOMATIQUE

### 3.1 Structured Data (JSON-LD)

```yaml
Schemas_Générés:

  Restaurant:
    trigger: "Page d'accueil"
    schema:
      "@context": "https://schema.org"
      "@type": "Restaurant"
      "@id": "{canonical_url}#restaurant"
      name: "{restaurant_name}"
      description: "{description}"
      url: "{canonical_url}"
      telephone: "{phone}"
      email: "{email}"
      address:
        "@type": "PostalAddress"
        streetAddress: "{street}"
        addressLocality: "{city}"
        postalCode: "{postal_code}"
        addressCountry: "{country}"
      geo:
        "@type": "GeoCoordinates"
        latitude: "{lat}"
        longitude: "{lng}"
      openingHoursSpecification:
        - "@type": "OpeningHoursSpecification"
          dayOfWeek: ["Monday", "Tuesday", ...]
          opens: "12:00"
          closes: "14:30"
      priceRange: "€€€"
      servesCuisine: ["French", "Contemporary"]
      acceptsReservations: true
      menu: "{menu_url}"
      hasMenu:
        "@type": "Menu"
        "@id": "{canonical_url}/menu#menu"
      aggregateRating:
        "@type": "AggregateRating"
        ratingValue: "4.5"
        reviewCount: "127"
      image: ["{image_urls}"]
      sameAs: ["{social_urls}"]
      
  Menu:
    trigger: "Page menu"
    schema:
      "@context": "https://schema.org"
      "@type": "Menu"
      "@id": "{canonical_url}/menu#menu"
      name: "Menu - {restaurant_name}"
      description: "Découvrez notre carte"
      hasMenuSection:
        - "@type": "MenuSection"
          name: "Entrées"
          hasMenuItem: [...]
          
  Event:
    trigger: "Événement public"
    schema:
      "@context": "https://schema.org"
      "@type": "FoodEvent"
      name: "{event_name}"
      description: "{description}"
      startDate: "{date_time}"
      endDate: "{end_date_time}"
      location:
        "@type": "Restaurant"
        "@id": "{canonical_url}#restaurant"
      offers:
        "@type": "Offer"
        price: "{price}"
        priceCurrency: "EUR"
        url: "{reservation_url}"
        availability: "https://schema.org/InStock"
      image: "{image}"
      organizer:
        "@type": "Restaurant"
        name: "{restaurant_name}"
        
  Article:
    trigger: "Blog post"
    schema:
      "@context": "https://schema.org"
      "@type": "Article"
      headline: "{title}"
      description: "{excerpt}"
      image: "{featured_image}"
      datePublished: "{published_at}"
      dateModified: "{updated_at}"
      author:
        "@type": "Organization"
        name: "{restaurant_name}"
      publisher:
        "@type": "Organization"
        name: "{restaurant_name}"
        logo:
          "@type": "ImageObject"
          url: "{logo_url}"
      mainEntityOfPage:
        "@type": "WebPage"
        "@id": "{canonical_url}"
        
  BreadcrumbList:
    trigger: "Toutes les pages sauf home"
    schema:
      "@context": "https://schema.org"
      "@type": "BreadcrumbList"
      itemListElement:
        - "@type": "ListItem"
          position: 1
          name: "Accueil"
          item: "{home_url}"
        - "@type": "ListItem"
          position: 2
          name: "Menu"
          item: "{menu_url}"
        # ...
        
  LocalBusiness:
    trigger: "Page contact"
    schema:
      "@context": "https://schema.org"
      "@type": "Restaurant"
      # + tous les champs Restaurant
      # + heures d'ouverture détaillées
```

### 3.2 Génération Meta Tags

```yaml
Auto_Generation_Rules:

  Title:
    home:
      template: "{restaurant_name} - {tagline}"
      example: "Le Gourmet - Restaurant Gastronomique Paris 8ème"
      
    menu:
      template: "Carte et Menu | {restaurant_name}"
      
    menu_category:
      template: "{category_name} | Carte {restaurant_name}"
      example: "Nos Entrées | Carte Le Gourmet"
      
    menu_item:
      template: "{item_name} | {restaurant_name}"
      example: "Foie Gras Mi-Cuit | Le Gourmet"
      
    blog_post:
      template: "{post_title} | Blog {restaurant_name}"
      
    event:
      template: "{event_name} - {date} | {restaurant_name}"
      
  Description:
    home:
      template: "{description}. {cuisine_type} à {city}. Réservation en ligne."
      max_length: 160
      
    menu_item:
      template: "{item_description}. {price}€. {allergenes}."
      fallback: "{item_name} - Découvrez ce plat signature du {restaurant_name}."
      
    blog_post:
      source: "excerpt ou premiers 160 caractères"
      
  Validation:
    title:
      min_length: 30
      max_length: 60
      warning_if_duplicate: true
      
    description:
      min_length: 120
      max_length: 160
      warning_if_missing: true
```

---

## 4. INTERFACE UTILISATEUR

### 4.1 Layout Pages

```yaml
Page_SEO_Dashboard: # /settings/seo
  Layout:
    ┌─────────────────────────────────────────────────────────────┐
    │ HEADER                                                       │
    │ [← Paramètres] SEO & Référencement                          │
    ├─────────────────────────────────────────────────────────────┤
    │ SCORE GLOBAL                                                 │
    │ ┌─────────────────────────────────────────────────────────┐ │
    │ │                                                          │ │
    │ │     ┌─────────┐                                         │ │
    │ │     │   78    │  Score SEO global                       │ │
    │ │     │  /100   │  Bon, mais peut être amélioré          │ │
    │ │     └─────────┘                                         │ │
    │ │                                                          │ │
    │ │  ✓ 12 pages optimisées                                  │ │
    │ │  ⚠ 3 pages avec avertissements                          │ │
    │ │  ✗ 1 page avec problèmes critiques                      │ │
    │ │                                                          │ │
    │ └─────────────────────────────────────────────────────────┘ │
    ├─────────────────────────────────────────────────────────────┤
    │ QUICK ACTIONS                                                │
    │ [🔄 Régénérer sitemap] [📊 Voir dans Search Console]       │
    │ [🔗 Sync Google Business] [📝 Analyser toutes les pages]   │
    ├─────────────────────────────────────────────────────────────┤
    │ TABS                                                         │
    │ [Configuration] [Pages] [Google Business] [Performances]    │
    ├─────────────────────────────────────────────────────────────┤
    │ CONTENT                                                      │
    │                                                              │
    │ ┌─────────────────────────────────────────────────────────┐ │
    │ │ INFORMATIONS RESTAURANT                                  │ │
    │ │                                                          │ │
    │ │ Nom: [Le Gourmet                    ]                   │ │
    │ │ Description: [Restaurant gastronomique au cœur de...]   │ │
    │ │ Téléphone: [+33 1 23 45 67 89       ]                   │ │
    │ │ Adresse: [12 rue de la Gastronomie, 75008 Paris    ]   │ │
    │ │                                                          │ │
    │ │ [Enregistrer]                                            │ │
    │ └─────────────────────────────────────────────────────────┘ │
    │                                                              │
    │ ┌─────────────────────────────────────────────────────────┐ │
    │ │ RÉSEAUX SOCIAUX                                          │ │
    │ │                                                          │ │
    │ │ Facebook: [https://facebook.com/legourmet    ]          │ │
    │ │ Instagram: [https://instagram.com/legourmet  ]          │ │
    │ │ Twitter: [                                    ]          │ │
    │ └─────────────────────────────────────────────────────────┘ │
    └─────────────────────────────────────────────────────────────┘

Page_SEO_Pages: # /settings/seo/pages
  Layout:
    ┌─────────────────────────────────────────────────────────────┐
    │ FILTERS                                                      │
    │ [Type ▼] [Score ▼] [Statut ▼] [Rechercher...]              │
    ├─────────────────────────────────────────────────────────────┤
    │ PAGES LIST                                                   │
    │ ┌─────────────────────────────────────────────────────────┐ │
    │ │ Page            │ Score │ Title │ Desc. │ Actions       │ │
    │ ├─────────────────┼───────┼───────┼───────┼───────────────┤ │
    │ │ / (Accueil)     │  92   │  ✓    │   ✓   │ [✏️] [👁]     │ │
    │ │ /menu           │  88   │  ✓    │   ✓   │ [✏️] [👁]     │ │
    │ │ /menu/entrees   │  75   │  ⚠    │   ✓   │ [✏️] [👁]     │ │
    │ │ /contact        │  45   │  ✗    │   ✗   │ [✏️] [👁]     │ │
    │ │ /reservations   │  82   │  ✓    │   ✓   │ [✏️] [👁]     │ │
    │ └─────────────────────────────────────────────────────────┘ │
    │                                                              │
    │ LÉGENDE: ✓ Optimal  ⚠ À améliorer  ✗ Problème              │
    └─────────────────────────────────────────────────────────────┘

Page_SEO_Edit: # /settings/seo/pages/[id]
  Layout:
    ┌─────────────────────────────────────────────────────────────┐
    │ HEADER                                                       │
    │ [← Retour] SEO: Page Accueil                                │
    ├───────────────────────────────┬─────────────────────────────┤
    │ EDITOR (60%)                  │ PREVIEW (40%)               │
    │                               │                             │
    │ ┌───────────────────────────┐ │ ┌─────────────────────────┐ │
    │ │ TITRE (Meta Title)        │ │ │ APERÇU GOOGLE           │ │
    │ │ [Le Gourmet - Restaurant] │ │ │                         │ │
    │ │ 43/60 caractères ✓        │ │ │ Le Gourmet - Restaurant │ │
    │ └───────────────────────────┘ │ │ www.legourmet.fr        │ │
    │                               │ │ Restaurant gastronomique│ │
    │ ┌───────────────────────────┐ │ │ au cœur de Paris...     │ │
    │ │ DESCRIPTION               │ │ │                         │ │
    │ │ [Restaurant gastronomique │ │ └─────────────────────────┘ │
    │ │  au cœur de Paris 8ème...]│ │                             │
    │ │ 142/160 caractères ✓      │ │ ┌─────────────────────────┐ │
    │ └───────────────────────────┘ │ │ APERÇU FACEBOOK         │ │
    │                               │ │                         │ │
    │ ┌───────────────────────────┐ │ │ ┌───────────────────┐   │ │
    │ │ IMAGE OPEN GRAPH          │ │ │ │    [IMAGE]        │   │ │
    │ │                           │ │ │ │                   │   │ │
    │ │ [📷 Choisir une image]    │ │ │ └───────────────────┘   │ │
    │ │                           │ │ │ Le Gourmet              │ │
    │ │ Recommandé: 1200×630px    │ │ │ legourmet.fr            │ │
    │ └───────────────────────────┘ │ └─────────────────────────┘ │
    │                               │                             │
    │ ┌───────────────────────────┐ │ ┌─────────────────────────┐ │
    │ │ OPTIONS AVANCÉES ▼        │ │ │ SCORE SEO           92  │ │
    │ │                           │ │ │ ████████████████░░  │ │
    │ │ ☐ Ne pas indexer          │ │ │                         │ │
    │ │ ☐ Ne pas suivre les liens │ │ │ ✓ Titre optimisé        │ │
    │ │                           │ │ │ ✓ Description OK        │ │
    │ │ URL canonique:            │ │ │ ✓ Image OG présente     │ │
    │ │ [https://www.legourmet...]│ │ │ ✓ Structured Data       │ │
    │ └───────────────────────────┘ │ └─────────────────────────┘ │
    │                               │                             │
    │ [Réinitialiser]  [Enregistrer]│                             │
    └───────────────────────────────┴─────────────────────────────┘
```

### 4.2 Composants UI

```yaml
Components:

  SEOScoreGauge:
    usage: "Affichage score SEO"
    display:
      - Cercle progressif
      - Score numérique au centre
      - Couleur selon niveau
        - 0-50: rouge
        - 51-70: orange
        - 71-85: jaune
        - 86-100: vert
      - Label descriptif
    animation:
      - Fill animation on load
      
  SERPPreview:
    usage: "Aperçu résultat Google"
    display:
      - Titre (bleu, 60 chars max)
      - URL (vert)
      - Description (gris, 160 chars)
      - Date (optionnel)
      - Rich snippets (si applicable)
    variants:
      desktop: largeur standard
      mobile: compact
    features:
      - Caractère counter
      - Troncature preview
      
  SocialCardPreview:
    usage: "Aperçu partages sociaux"
    display:
      - Image (ratio selon plateforme)
      - Titre
      - Description
      - URL/domaine
    variants:
      facebook: 1200×630
      twitter_large: 1200×628
      twitter_summary: 144×144
      linkedin: 1200×627
      
  SEOChecklist:
    usage: "Liste vérifications SEO"
    items:
      - Titre meta (longueur, mots-clés)
      - Description meta
      - H1 unique
      - Images avec alt
      - Liens internes
      - Données structurées
      - Mobile-friendly
      - Vitesse chargement
    display:
      - Check / Warning / Error icon
      - Texte explicatif
      - CTA correction
      
  KeywordDensityMeter:
    usage: "Densité mots-clés"
    display:
      - Mot-clé principal
      - Occurences
      - Densité (%)
      - Barre visuelle
    recommendations:
      optimal: 1-3%
      warning: < 1% ou > 5%
```

---

## 5. SYNCHRONISATION GOOGLE BUSINESS

### 5.1 Flux de Synchronisation

```yaml
GoogleBusinessSync:

  Connexion:
    oauth:
      scopes:
        - "https://www.googleapis.com/auth/business.manage"
      flow:
        1. Bouton "Connecter Google Business"
        2. Redirection OAuth Google
        3. Sélection compte Business
        4. Autorisation
        5. Stockage tokens
        6. Lecture établissement(s)
        
  Données_Synchronisées:
    
    from_ros_to_google:
      # Poussées vers Google
      - Nom établissement
      - Adresse
      - Téléphone
      - Site web
      - Horaires d'ouverture
      - Horaires spéciaux
      - Description
      - Catégories
      - Attributs (WiFi, parking, etc.)
      - Photos (galerie)
      - Menu (prix, items)
      - Posts / Actualités
      - Événements
      
    from_google_to_ros:
      # Récupérées depuis Google
      - Avis clients
      - Note moyenne
      - Questions clients
      - Insights (vues, clics)
      - Photos clients
      
  Scheduling:
    auto_sync:
      frequency: daily
      time: "04:00" # Nuit
      
    triggers:
      - Modification horaires
      - Nouveau post blog
      - Modification menu
      - Nouvel événement
      
    manual:
      - Bouton "Synchroniser maintenant"
      
  Conflict_Resolution:
    strategy: "ROS is source of truth"
    exceptions:
      - Reviews: Google only
      - Q&A: Both ways
```

### 5.2 Posts Google Business

```yaml
GooglePosts:

  Types:
    whats_new:
      title: optional
      content: 1500 chars max
      image: optional
      cta: optional
      
    event:
      title: required
      content: 1500 chars
      start_date: required
      end_date: required
      image: optional
      cta: optional
      
    offer:
      title: required
      content: 1500 chars
      start_date: optional
      end_date: optional
      coupon_code: optional
      terms: optional
      image: optional
      
  Auto_Generation:
    sources:
      - Blog posts → What's New
      - Events → Event posts
      - Promotions → Offers
      
    scheduling:
      max_active_posts: 10
      expiry: 7 days (what's new)
```

---

## 6. SITEMAP & ROBOTS

### 6.1 Sitemap XML

```yaml
Sitemap:

  Generation:
    trigger:
      - Manuel (bouton)
      - Automatique (modifications)
      - Cron (quotidien)
      
    output: "/sitemap.xml"
    
  Structure:
    pages:
      static:
        - / (priority: 1.0, changefreq: weekly)
        - /menu (0.9, daily)
        - /reservations (0.8, monthly)
        - /contact (0.5, monthly)
        - /about (0.5, monthly)
        
      dynamic:
        menu_categories:
          pattern: "/menu/{slug}"
          priority: 0.7
          changefreq: weekly
          
        menu_items:
          pattern: "/menu/{category}/{slug}"
          priority: 0.6
          changefreq: weekly
          
        blog_posts:
          pattern: "/blog/{slug}"
          priority: 0.7
          changefreq: monthly
          lastmod: from_updated_at
          
        events:
          pattern: "/events/{slug}"
          priority: 0.8
          changefreq: weekly
          exclude_if: date < today
          
    images:
      include: true
      format: image:image extension
      
  Index:
    if_pages_gt: 1000
    split_by: page_type
    files:
      - /sitemap-pages.xml
      - /sitemap-blog.xml
      - /sitemap-menu.xml
```

### 6.2 Robots.txt

```yaml
Robots:

  Generation:
    output: "/robots.txt"
    
  Content:
    default:
      User-agent: *
      Allow: /
      
      Disallow: /admin
      Disallow: /api
      Disallow: /auth
      Disallow: /_next
      
      Sitemap: https://www.example.com/sitemap.xml
      
  Management:
    editable: true
    presets:
      - "Standard (recommandé)"
      - "Bloquer tout sauf accueil"
      - "Personnalisé"
```

---

## 7. PERFORMANCES (CORE WEB VITALS)

```yaml
Monitoring:

  Metrics:
    LCP:
      name: "Largest Contentful Paint"
      target: "< 2.5s"
      good: "< 2.5s"
      needs_improvement: "2.5s - 4s"
      poor: "> 4s"
      
    FID:
      name: "First Input Delay"
      target: "< 100ms"
      
    CLS:
      name: "Cumulative Layout Shift"
      target: "< 0.1"
      
    TTFB:
      name: "Time to First Byte"
      target: "< 600ms"
      
  Sources:
    - Chrome UX Report (CrUX)
    - Lighthouse
    - Web Vitals JS library
    
  Display:
    dashboard: Core Web Vitals cards
    alerts: Si dégradation
    history: Graphique 30 jours
```

---

## 8. INTÉGRATIONS

```yaml
Dépendances:

  Module_Menu:
    read: "Données produits pour structured data"
    images: "Photos plats pour OG"
    
  Module_Reservations:
    link: "URL réservation"
    schema: "Reservation action"
    
  Module_Blog:
    seo: "SEO par article"
    sitemap: "Inclusion articles"
    posts: "Auto-post Google Business"
    
  Module_Groupes_Privatisation:
    spaces: "Pages espaces"
    events: "Événements publics"

External:
  
  Google_APIs:
    - Search Console API
    - Business Profile API
    - PageSpeed Insights API
    - Analytics Data API
    
  Validation:
    - Schema.org Validator
    - Google Rich Results Test
```

---

## 9. PERMISSIONS

```yaml
Permissions:

  seo.config.view:
    roles: [owner, manager]
    
  seo.config.edit:
    roles: [owner]
    
  seo.pages.view:
    roles: [owner, manager]
    
  seo.pages.edit:
    roles: [owner, manager]
    
  seo.google_business.connect:
    roles: [owner]
    
  seo.google_business.post:
    roles: [owner, manager]
    
  seo.sitemap.regenerate:
    roles: [owner, manager]
```

---

> **Objectif** : Position top 5 sur recherches locales  
> **Dépendances** : Menu, Blog, Réservations, Événements
