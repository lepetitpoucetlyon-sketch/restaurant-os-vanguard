export type VerticalType =
  | 'RESTAURANT'
  | 'BAR'
  | 'FAST_FOOD'
  | 'BAKERY'
  | 'HOTEL'
  | 'SALON'
  | 'GARAGE'
  | 'FITNESS'
  | 'COWORKING'
  | 'RETAIL'
  | 'FLORIST'
  | 'CLINIC'
  | 'GENERIC';

export interface ContractPartyInfo {
  companyName: string;
  legalForm: string; // SAS, SARL, SASU, EURL, Auto-entrepreneur
  siren: string;
  representativeName: string;
  representativeRole: string; // Gérant, Président, Directeur Général
  email: string;
  phone?: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface ContractPricingPlan {
  planName: string; // Starter, Pro, Empire Enterprise
  monthlyPriceInEuros: number;
  setupFeeInEuros: number;
  commitmentMonths: number; // 0 (sans engagement), 12, 24, 36
  billingCycle: 'MONTHLY' | 'ANNUAL';
  includedRegistersCount: number;
  includedModules: string[];
}

export interface ContractDraftInput {
  tenantId: string;
  vertical: VerticalType;
  client: ContractPartyInfo;
  pricing: ContractPricingPlan;
  customClauses?: string[];
}

export interface GeneratedContractDocument {
  contractId: string;
  version: string;
  title: string;
  sections: {
    title: string;
    content: string;
  }[];
  verticalAddendumTitle: string;
  verticalAddendumContent: string;
  dpaSection: {
    title: string;
    subProcessors: Array<{
      name: string;
      role: string;
      location: string;
      guarantees: string;
    }>;
    terms: string;
  };
  fullTextContent: string;
  generatedAt: number;
}

/**
 * 📜 LegalContractGenerator — Moteur de Contrats SaaS B2B & DPA RGPD Art. 28
 * Génère des contrats exhaustifs et juridiquement verrouillés, adaptés à chaque verticale métier.
 */
export class LegalContractGenerator {
  static generateContract(input: ContractDraftInput): GeneratedContractDocument {
    const contractId = `CTR-${input.vertical}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const now = Date.now();
    const dateFormatted = new Date(now).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const publisherInfo = {
      name: 'RESTAURANT OS SAS',
      capital: '100 000 €',
      rcs: 'RCS Paris B 987 654 321',
      vat: 'FR 12 987654321',
      headquarters: '10 Place de la Madeleine, 75008 Paris, France',
      representative: 'Président Directeur Général',
    };

    // 1. Sections Générales CGU / CGV
    const sections = [
      {
        title: 'ARTICLE 1 — OBJET & DÉSIGNATION DES PARTIES',
        content: `Le présent Contrat de Souscription SaaS et d'Accord de Traitement des Données (ci-après le « Contrat ») est conclu entre :
D'une part, la société ${publisherInfo.name}, au capital de ${publisherInfo.capital}, immatriculée sous le numéro ${publisherInfo.rcs}, sise au ${publisherInfo.headquarters} (ci-après « L'ÉDITEUR »),
Et d'autre part, la société ${input.client.companyName} (${input.client.legalForm}), immatriculée sous le numéro SIREN ${input.client.siren}, sise au ${input.client.address}, ${input.client.postalCode} ${input.client.city}, représentée par M./Mme ${input.client.representativeName}, en qualité de ${input.client.representativeRole} dûment habilité(e) (ci-après « LE CLIENT »).`,
      },
      {
        title: 'ARTICLE 2 — LICENCE D ACCÈS & SERVICES FOURNIS',
        content: `L'Éditeur concède au Client, pour la durée stipulée au Contrat, un droit d'utilisation non exclusif, personnel et non transférable de la plateforme logicielle « Restaurant OS » dans sa déclinaison ${input.vertical}.
Cette licence comprend l'accès aux modules : ${input.pricing.includedModules.join(', ')}, pour un nombre de terminaux / caisses autorisé de ${input.pricing.includedRegistersCount} unité(s).`,
      },
      {
        title: 'ARTICLE 3 — CONDITIONS FINANCIÈRES & RÈGLEMENT',
        content: `L'abonnement est souscrit pour la formule « ${input.pricing.planName} » au tarif de ${input.pricing.monthlyPriceInEuros} € HT / mois.
Frais de mise en service et d'intégration initiale : ${input.pricing.setupFeeInEuros} € HT.
Durée d'engagement initial : ${input.pricing.commitmentMonths === 0 ? 'Sans engagement (résiliable mensuellement avec préavis de 30 jours)' : `${input.pricing.commitmentMonths} mois fermes avec tacite reconduction`}.
Règlement par prélèvement bancaire automatique SEPA ou carte bancaire professionnelle via la passerelle de paiement sécurisée Stripe.`,
      },
      {
        title: 'ARTICLE 4 — NIVEAU DE SERVICE (SLA) & DISPONIBILITÉ (99.9%)',
        content: `L'Éditeur garantit un taux de disponibilité mensuel du service de 99,9% hors plages de maintenance programmée de nuit (02h00 - 05h00 CET).
En cas d'incident bloquant en cours de service (ex: arrêt complet d'encaissement POS), le Client bénéficie du bouton d'urgence « SOS Caisse » :
- Garantie de Temps d'Intervention (GTI) : inférieure à 15 minutes.
- Garantie de Temps de Rétablissement (GTR) : inférieure à 2 heures ouvrées.
En cas de coupure de la connexion Internet chez le Client, la plateforme bascule automatiquement en mode hors-ligne garantissant la continuité des encaissements et la synchronisation différée.`,
      },
      {
        title: 'ARTICLE 5 — PROPRIÉTÉ DES DONNÉES & RÉVERSIBILITÉ',
        content: `Le Client demeure l'unique et exclusif propriétaire de l'ensemble des données introduites dans la plateforme (fichiers clients, catalogue, recettes, écritures de caisse, plannings).
À tout moment, et notamment en cas de résiliation du Contrat pour quelque cause que ce soit, l'Éditeur s'engage à restituer l'intégralité des données du Client dans un format structuré standard (JSON, CSV, PDF scellés) sous un délai maximal de 30 jours, suivi de l'effacement irréversible des sauvegardes (crypto-shredding).`,
      },
    ];

    // 2. Addendum spécifique par Verticale
    const verticalAddenda: Record<VerticalType, { title: string; content: string }> = {
      RESTAURANT: {
        title: 'ADDENDUM SPÉCIFIQUE — RESTAURATION, BARS & CAFÉS',
        content: `1. Conformité Fiscale NF525 : La plateforme intègre un scellement cryptographique continu par chaîne de blocs SHA-256 et grand livre inaltérable conforme aux exigences de l'Article 88 de la loi de finances n° 2015-1785.
2. Traçabilité Sanitaire HACCP : La solution fournit les registres digitaux obligatoires (relevés de température chambres froides, contrôles des huiles de friture, plan de nettoyage).
3. Allergènes Majeurs INCO : Conformément au Règlement UE 1169/2011, la plateforme assure la gestion et l'affichage des 14 allergènes à déclaration obligatoire sur les fiches recettes et terminaux de commande.`,
      },
      BAR: {
        title: 'ADDENDUM SPÉCIFIQUE — BARS, PUBS & ÉTABLISSEMENTS DE NUIT',
        content: `1. Gestion des Débits de Boissons : Suivi rigoureux des fûts, bouteilles et spiritueux au centilitre, alertes anti-coulage bar.
2. Sessions Nocturnes : Prise en charge des services à cheval sur minuit avec rattachement comptable à la date d'ouverture du shift d'exploitation.`,
      },
      FAST_FOOD: {
        title: 'ADDENDUM SPÉCIFIQUE — RESTAURATION RAPIDE & DARK KITCHENS',
        content: `1. Cadençage KDS & Bornes : Optimisation du flux de production avec routage multi-écrans cuisine et bornes de self-ordering.
2. Connecteurs Livraison : Ingestion normalisée et automatisée des commandes UberEats, Deliveroo et Just Eat sans ressaisie manuelle.`,
      },
      BAKERY: {
        title: 'ADDENDUM SPÉCIFIQUE — BOULANGERIE, PÂTISSERIE & SNACKING',
        content: `1. Traçabilité des Farines & Lots : Gestion des numéros de lot matières premières et DLUO.
2. Gestion des Invendus : Traçabilité et valorisation des invendus du jour conformément aux dispositions de la Loi AGEC.`,
      },
      HOTEL: {
        title: 'ADDENDUM SPÉCIFIQUE — HÔTELLERIE & HÉBERGEMENT',
        content: `1. Fiches Individuelles de Police : Génération numérique des fiches de police pour les voyageurs étrangers (Art. R. 611-35 CESEDA).
2. Taxe de Séjour : Calcul automatique et reporting périodique de la taxe de séjour selon le barème de la collectivité locale.`,
      },
      SALON: {
        title: 'ADDENDUM SPÉCIFIQUE — SALONS DE COIFFURE, BARBIERS & INSTITUTS',
        content: `1. Données de Santé & Sensibilité Cutanée (RGPD Art. 9) : Le Client s'engage à recueillir le consentement explicite de sa clientèle pour l'enregistrement de l'historique des colorations chimiques, allergies cutanées et photos avant/après.
2. Chiffrement Renforcé : Ces données sensibles font l'objet d'un chiffrement de repos AES-256-GCM dédié.`,
      },
      GARAGE: {
        title: 'ADDENDUM SPÉCIFIQUE — GARAGES & ATELIERS DE RÉPARATION',
        content: `1. Ordre de Réparation (OR) : Émission et signature dématérialisée d'ordres de réparation préalables à valeur contractuelle engageante.
2. Pièces Issues de l'Économie Circulaire (PIEC) : Mention légale obligatoire proposant des pièces de réemploi au client.`,
      },
      FITNESS: {
        title: 'ADDENDUM SPÉCIFIQUE — CLUBS DE FITNESS, SPORTS & BIEN-ÊTRE',
        content: `1. Mandats de Prélèvement SEPA Récurrents : Gestion automatisée des échéances d'abonnement et rejet de paiement.
2. Contrôle d'Accès : Synchronisation des accès physiques (tourniquets/badges) conditionnée à la validité du titre d'adhésion.`,
      },
      COWORKING: {
        title: 'ADDENDUM SPÉCIFIQUE — ESPACES DE COWORKING & TIERS-LIEUX',
        content: `1. Facturation au m² et à l'Heure : Gestion flexible des réservations de salles de réunion, postes nomades et bureaux privatifs.
2. Journal des Accès : Horodatage des entrées/sorties pour la sécurité des locaux et des biens.`,
      },
      RETAIL: {
        title: 'ADDENDUM SPÉCIFIQUE — COMMERCE DE DÉTAIL & BOUTIQUES',
        content: `1. Gestion des Dépôts-Ventes : Suivi des contrats d'apport, commissionnement et reddition de comptes aux déposants.
2. Garanties Légales : Émission automatique des mentions de garantie légale de conformité (2 ans) sur les tickets et factures.`,
      },
      FLORIST: {
        title: 'ADDENDUM SPÉCIFIQUE — FLEURISTES & ARTISANS DU VÉGÉTAL',
        content: `1. Gestion des Produits Périssables : Alertes fraîcheur et dépréciation dynamique des stocks de fleurs coupées.
2. Livraisons & Transmissions Florales : Suivi des courses locales et intégration des réseaux de transmission.`,
      },
      CLINIC: {
        title: 'ADDENDUM SPÉCIFIQUE — CABINETS & PROFESSIONS LIBÉRALES',
        content: `1. Périmètre Fonctionnel Pré-Agrément HDS : L'utilisation de la plateforme est strictement limitée à la gestion administrative, la prise de rendez-vous et la facturation d'honoraires, à l'exclusion formelle de l'hébergement de dossiers médicaux lourds soumis à certification HDS obligatoire.`,
      },
      GENERIC: {
        title: 'ADDENDUM SPÉCIFIQUE — ACTIVITÉS COMMERCIALES UNIVERSELLES',
        content: `1. Encaissement & Facturation : Respect des règles générales de commerce et d'enregistrement comptable des transactions.`,
      },
    };

    const addendum = verticalAddenda[input.vertical] || verticalAddenda.GENERIC;

    // 3. Accord de Sous-Traitance RGPD (DPA Art. 28)
    const subProcessors = [
      {
        name: 'Stripe Payments Europe Ltd',
        role: 'Passerelle de paiement, TPE connectés & abonnements',
        location: 'Irlande (Union Européenne)',
        guarantees: 'Certifié PCI-DSS Niveau 1, DPA conforme Art. 28',
      },
      {
        name: 'Google Cloud Platform / Firebase',
        role: 'Hébergement de l infrastructure cloud & bases de données chiffrées',
        location: 'France (Europe-West9 Paris) / Allemagne (Francfort)',
        guarantees: 'ISO 27001, SOC 1/2/3, Chiffrement repos AES-256',
      },
      {
        name: 'Axiom Inc.',
        role: 'Journalisation d audit, observabilité & détection d intrusions',
        location: 'Union Européenne / USA (Data Privacy Framework)',
        guarantees: 'Anonymisation des logs & masquage PII systématique',
      },
      {
        name: 'Functional Software Inc. (Sentry)',
        role: 'Monitoring télémétrique des crashs applicatifs',
        location: 'Union Européenne / USA (Data Privacy Framework)',
        guarantees: 'Filtrage des secrets & jetons côté client',
      },
      {
        name: 'Google Cloud Vertex AI (Gemini)',
        role: 'Assistance opérateur & diagnostic d urgence SOS Caisse',
        location: 'Europe-West9 (Paris)',
        guarantees: 'Zéro entraînement sur les données client (Zero Data Retention SLA)',
      },
    ];

    const dpaSection = {
      title: 'ANNEXE RGPD — ACCORD SUR LE TRAITEMENT DES DONNÉES PERSONNELLES (ARTICLE 28 RGPD)',
      subProcessors,
      terms: `1. Qualification des Rôles : Le Client agit en qualité de « Responsable de Traitement » et l'Éditeur en qualité de « Sous-traitant » au sens du Règlement (UE) 2016/679 (RGPD).
2. Instructions Documentées : L'Éditeur s'engage à ne traiter les données personnelles que sur instruction documentée du Client, exclusivement pour l'exécution des fonctionnalités du logiciel.
3. Sécurité des Traitements : L'Éditeur met en œuvre les mesures techniques et organisationnelles appropriées :
   - Chiffrement AES-256-GCM des données sensibles (allergies, notes confidentielles).
   - Traçabilité et hachage SHA-256 de chaque événement système.
   - Contrôle d'accès strict par rôles (RBAC) et authentification forte.
4. Notifications d'Incidents : L'Éditeur s'engage à notifier au Client toute violation de données personnelles dans un délai maximal de 48 heures suivant sa prise de connaissance.
5. Sort des Données : Au terme de la relation contractuelle, l'Éditeur procède à la restitution complète des données au Client, puis à leur destruction définitive certifiée (crypto-shredding).`,
    };

    // Construction du texte intégral compilé pour la signature
    const fullTextContent = `
================================================================================
CONTRAT DE SOUSCRIPTION SAAS & ACCORD DE TRAITEMENT DE DONNÉES (DPA RGPD ART. 28)
Référence : ${contractId} — Fait le ${dateFormatted}
================================================================================

${sections.map((s) => `${s.title}\n\n${s.content}`).join('\n\n--------------------------------------------------------------------------------\n\n')}

================================================================================
${addendum.title}
================================================================================
${addendum.content}

================================================================================
${dpaSection.title}
================================================================================
${dpaSection.terms}

LISTE DES SOUS-TRAITANTS ULTÉRIEURS AUTORISÉS :
${subProcessors.map((sp, idx) => `${idx + 1}. ${sp.name} [${sp.location}] — Rôle : ${sp.role} (Garanties : ${sp.guarantees})`).join('\n')}

================================================================================
ENGAGEMENT & SIGNATURE ÉLECTRONIQUE DES PARTIES
================================================================================
La signature électronique du présent contrat emporte acceptation pleine, entière et sans réserve des CGU/CGV, des dispositions financières, de l'addendum sectoriel et du DPA RGPD.
`.trim();

    return {
      contractId,
      version: '1.0.0',
      title: `Contrat SaaS Restaurant OS — ${input.client.companyName} (${input.vertical})`,
      sections,
      verticalAddendumTitle: addendum.title,
      verticalAddendumContent: addendum.content,
      dpaSection,
      fullTextContent,
      generatedAt: now,
    };
  }
}
