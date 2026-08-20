/**
 * 🗂️ AssistantToolRegistry — Types + registre unique des outils IA
 *
 * Séparé du dispatcher pour :
 *   - lisibilité (les 30+ outils sont ici, la logique ailleurs)
 *   - testabilité (le registre est de la data pure)
 *   - évolutivité (ajouter un vertical = éditer un seul fichier)
 */

export type ActionToolCategory =
    | 'navigation'
    | 'pos'
    | 'culinary'
    | 'bakery'
    | 'retail'
    | 'salon'
    | 'garage'
    | 'hotel'
    | 'health'
    | 'gym'
    | 'coworking'
    | 'veterinary'
    | 'florist'
    | 'logistics'
    | 'facility'
    | 'finance';

export interface AssistantToolDefinition {
    id: string;
    name: string;
    description: string;
    category: ActionToolCategory;
    /** 10 (Opérateur) · 40 (Employé/Praticien) · 70 (Manager) · 100 (Directeur/Propriétaire) */
    minRoleLevel: number;
    parameters: Array<{
        name: string;
        type: 'string' | 'number' | 'boolean';
        description: string;
        required: boolean;
    }>;
}

export interface ActionProposal {
    id: string;
    toolId: string;
    title: string;
    description: string;
    params: Record<string, unknown>;
    minRoleLevel: number;
    status: 'proposed' | 'executed' | 'rejected';
}

export const UNIVERSAL_ASSISTANT_TOOLS: Record<string, AssistantToolDefinition> = {
    // ── Transversal & Navigation ─────────────────────────────────────────────
    navigate_to_module: {
        id: 'navigate_to_module',
        name: 'Navigation vers un Module',
        description: "Redirige l'utilisateur vers une page ou un écran spécifique de l'application.",
        category: 'navigation',
        minRoleLevel: 10,
        parameters: [
            { name: 'targetPath', type: 'string', description: 'Chemin de destination (ex: /pos, /inventory, /fec)', required: true },
            { name: 'label', type: 'string', description: "Intitulé de l'écran cible", required: false },
        ],
    },
    lock_space_or_table: {
        id: 'lock_space_or_table',
        name: "Verrouillage d'Espace ou Table",
        description: 'Verrouille une table, baie de garage, cabine de soin ou espace de travail.',
        category: 'pos',
        minRoleLevel: 40,
        parameters: [
            { name: 'spaceId', type: 'string', description: "Identifiant de l'espace ou de la table", required: true },
            { name: 'reason', type: 'string', description: 'Motif du verrouillage (ex: Réservation VIP, Nettoyage)', required: false },
        ],
    },
    create_maintenance_ticket: {
        id: 'create_maintenance_ticket',
        name: 'Alerte Incident Équipement',
        description: "Crée un ticket d'incident matériel ou de panne d'équipement technique.",
        category: 'facility',
        minRoleLevel: 30,
        parameters: [
            { name: 'equipmentName', type: 'string', description: "Nom de l'appareil (ex: Fournil, TPE, Pont élévateur)", required: true },
            { name: 'severity', type: 'string', description: 'Gravité (low, medium, critical)', required: true },
            { name: 'description', type: 'string', description: 'Description de la panne constatée', required: true },
        ],
    },
    trigger_stock_reorder: {
        id: 'trigger_stock_reorder',
        name: 'Préparation Commande Fournisseur',
        description: 'Génère un bon de réapprovisionnement pour un article en rupture ou seuil critique.',
        category: 'logistics',
        minRoleLevel: 50,
        parameters: [
            { name: 'itemId', type: 'string', description: 'Identifiant du produit ou ingrédient', required: true },
            { name: 'quantity', type: 'number', description: 'Quantité à commander', required: true },
            { name: 'supplierName', type: 'string', description: 'Nom du fournisseur principal', required: false },
        ],
    },
    query_financial_snapshot: {
        id: 'query_financial_snapshot',
        name: 'Consultation Synthèse Financière',
        description: "Affiche la synthèse du chiffre d'affaires, du CA d'hier ou du mois, de la marge ou du FEC.",
        category: 'finance',
        minRoleLevel: 70,
        parameters: [
            { name: 'period', type: 'string', description: 'Période analysée (yesterday, today, this_week, this_month, 2026-08)', required: true },
            { name: 'metric', type: 'string', description: 'Métrique financière (turnover, food_cost, margin, vat)', required: false },
        ],
    },
    get_latest_supplier_invoices: {
        id: 'get_latest_supplier_invoices',
        name: 'Consultation Factures Fournisseurs',
        description: "Liste les dernières factures d'achats et bons de livraison reçus avec montants et statuts de paiement.",
        category: 'finance',
        minRoleLevel: 40,
        parameters: [
            { name: 'limit', type: 'number', description: 'Nombre de factures à remonter (ex: 5)', required: false },
            { name: 'supplierName', type: 'string', description: 'Filtrer par nom de fournisseur (optionnel)', required: false },
        ],
    },

    // ── 🍽️ Verticale 1 : Restaurant & Bar ────────────────────────────────────
    get_stock_by_location: {
        id: 'get_stock_by_location',
        name: 'Consultation Stock par Emplacement',
        description: 'Liste les ingrédients et quantités restantes dans un emplacement de stockage précis (ex: Frigo N°4, Chambre Froide, Cave).',
        category: 'culinary',
        minRoleLevel: 20,
        parameters: [
            { name: 'locationName', type: 'string', description: "Nom ou numéro de l'emplacement (ex: \"Frigo 4\", \"Chambre Froide\", \"Cave\")", required: true },
        ],
    },
    fire_course_sequence: {
        id: 'fire_course_sequence',
        name: 'Envoi Suite en Cuisine (KDS)',
        description: "Déclenche l'envoi de la suite d'une table (plats, desserts) vers les stations KDS.",
        category: 'culinary',
        minRoleLevel: 40,
        parameters: [
            { name: 'tableId', type: 'string', description: 'Numéro ou ID de la table', required: true },
            { name: 'course', type: 'string', description: 'Suite à envoyer (plats, desserts, fromages)', required: true },
        ],
    },
    get_haccp_temperatures: {
        id: 'get_haccp_temperatures',
        name: 'Relevé Températures Sondes IoT',
        description: "Consulte les températures en direct et l'historique des sondes connectées (frigos, chambres froides).",
        category: 'facility',
        minRoleLevel: 20,
        parameters: [
            { name: 'equipmentName', type: 'string', description: 'Nom du meuble ou de la sonde (ex: "Frigo 4", "Chambre Froide")', required: true },
        ],
    },

    // ── 🥖 Verticale 2 : Boulangerie & Pâtisserie ───────────────────────────
    schedule_baking_batch: {
        id: 'schedule_baking_batch',
        name: 'Programmation Fournée & Cuisson',
        description: 'Planifie une fournée de baguettes, pains spéciaux ou viennoiseries sur les fours.',
        category: 'bakery',
        minRoleLevel: 40,
        parameters: [
            { name: 'recipeId', type: 'string', description: 'Nom ou SKU de la recette (ex: Baguette Tradition)', required: true },
            { name: 'quantity', type: 'number', description: 'Nombre de pièces à enfourner', required: true },
            { name: 'targetTime', type: 'string', description: 'Heure de sortie visée (ex: 07:30)', required: false },
        ],
    },
    read_scale_weight: {
        id: 'read_scale_weight',
        name: 'Pesée Balance Homologuée (Dialogue 06)',
        description: 'Capte le poids instantané de la balance comptoir connectée et applique le tarif au kilo.',
        category: 'bakery',
        minRoleLevel: 20,
        parameters: [
            { name: 'scaleId', type: 'string', description: 'Identifiant de la balance (ex: SCALE_01)', required: true },
            { name: 'productSku', type: 'string', description: 'SKU du produit au poids', required: true },
        ],
    },
    publish_tgtg_basket: {
        id: 'publish_tgtg_basket',
        name: 'Publication Panier Invendus TooGoodToGo',
        description: "Publie un lot d'invendus de la journée sur l'API TooGoodToGo avec déduction loi Garot.",
        category: 'bakery',
        minRoleLevel: 50,
        parameters: [
            { name: 'quantity', type: 'number', description: 'Nombre de paniers à proposer', required: true },
            { name: 'priceCents', type: 'number', description: 'Prix public du panier en centimes', required: true },
        ],
    },

    // ── 🛍️ Verticale 3 : Commerce de Détail (Retail) ────────────────────────
    scan_and_check_ean: {
        id: 'scan_and_check_ean',
        name: 'Consultation Stock Code-Barre EAN13',
        description: 'Scanne ou recherche un code EAN13 et affiche les stocks par déclinaison taille/couleur.',
        category: 'retail',
        minRoleLevel: 20,
        parameters: [
            { name: 'ean13Barcode', type: 'string', description: 'Code-barre EAN13 ou référence article', required: true },
            { name: 'size', type: 'string', description: 'Taille recherchée (ex: M, 42)', required: false },
        ],
    },
    trigger_boutique_restock: {
        id: 'trigger_boutique_restock',
        name: 'Réassort Portant & Rayon Magasin',
        description: "Crée un ordre de transfert de la réserve vers la surface de vente pour un portant.",
        category: 'retail',
        minRoleLevel: 40,
        parameters: [
            { name: 'productSku', type: 'string', description: "Référence de l'article", required: true },
            { name: 'quantity', type: 'number', description: 'Quantité à descendre du stock', required: true },
        ],
    },

    // ── 💇 Verticale 4 : Salon & Esthétique ──────────────────────────────────
    check_chair_availability: {
        id: 'check_chair_availability',
        name: 'Disponibilité Cabine & Praticien',
        description: 'Recherche les créneaux libres pour une prestation avec un coiffeur ou esthéticienne.',
        category: 'salon',
        minRoleLevel: 20,
        parameters: [
            { name: 'stylistId', type: 'string', description: 'Nom ou ID du coiffeur/praticien', required: false },
            { name: 'date', type: 'string', description: 'Date visée (ex: 2026-08-18)', required: false },
        ],
    },
    book_client_treatment: {
        id: 'book_client_treatment',
        name: 'Réservation Soin / Forfait Coiffure',
        description: "Enregistre un rendez-vous client avec forfait de prestations sur l'agenda.",
        category: 'salon',
        minRoleLevel: 40,
        parameters: [
            { name: 'clientId', type: 'string', description: 'Nom ou ID du client', required: true },
            { name: 'serviceId', type: 'string', description: 'Forfait choisi (ex: Coupe + Balayage)', required: true },
            { name: 'startTime', type: 'string', description: 'Heure de début (ex: 14:00)', required: true },
        ],
    },

    // ── 🚗 Verticale 5 : Garage & Auto ──────────────────────────────────────
    query_repair_order: {
        id: 'query_repair_order',
        name: 'Consultation Ordre de Réparation (OR)',
        description: "Affiche l'avancement d'un OR, les pièces engagées et les heures de main d'œuvre.",
        category: 'garage',
        minRoleLevel: 40,
        parameters: [
            { name: 'licensePlate', type: 'string', description: "Plaque d'immatriculation ou N° d'OR", required: true },
        ],
    },
    track_waste_bsdd: {
        id: 'track_waste_bsdd',
        name: 'Bordereau Déchets Dangereux (Trackdéchets BSDD)',
        description: 'Émet et scelle le bordereau réglementaire BSDD pour huiles usagées ou batteries.',
        category: 'garage',
        minRoleLevel: 50,
        parameters: [
            { name: 'wasteType', type: 'string', description: 'Type de déchet (huiles_moteur, batteries, filtres)', required: true },
            { name: 'volume', type: 'number', description: 'Volume en litres ou poids en kg', required: true },
        ],
    },

    // ── 🏨 Verticale 6 : Hôtel & Hébergement ────────────────────────────────
    query_room_rack: {
        id: 'query_room_rack',
        name: 'Consultation Rack & Chambres PMS',
        description: "Affiche l'état du rack hôtelier, les chambres prêtes, occupées ou en recouche.",
        category: 'hotel',
        minRoleLevel: 20,
        parameters: [
            { name: 'roomType', type: 'string', description: 'Catégorie de chambre (suite, deluxe, standard)', required: false },
            { name: 'date', type: 'string', description: 'Date de séjour analysée', required: false },
        ],
    },
    generate_police_sheet: {
        id: 'generate_police_sheet',
        name: 'Génération Fiche Police CESEDA Art. L.611-1',
        description: 'Génère la fiche individuelle de police scellée pour les clients étrangers.',
        category: 'hotel',
        minRoleLevel: 40,
        parameters: [
            { name: 'bookingId', type: 'string', description: 'Identifiant de réservation', required: true },
            { name: 'guestName', type: 'string', description: 'Nom du client hébergé', required: true },
        ],
    },

    // ── 🩺 Verticale 7 : Clinique & Santé ───────────────────────────────────
    query_practitioner_agenda: {
        id: 'query_practitioner_agenda',
        name: 'Planning Consultations & Actes CCAM',
        description: "Consulte l'agenda médical d'un praticien et les actes CCAM programmés.",
        category: 'health',
        minRoleLevel: 40,
        parameters: [
            { name: 'practitionerId', type: 'string', description: 'Nom ou ID du praticien', required: true },
            { name: 'date', type: 'string', description: 'Date de consultation', required: false },
        ],
    },
    verify_hds_consent: {
        id: 'verify_hds_consent',
        name: 'Vérification Consentement HDS & RGPD Santé',
        description: "Vérifie l'existence du consentement éclairé du patient avant partage du dossier.",
        category: 'health',
        minRoleLevel: 50,
        parameters: [
            { name: 'patientId', type: 'string', description: 'Identifiant anonymisé du patient', required: true },
            { name: 'treatmentCode', type: 'string', description: "Code de l'acte CCAM", required: true },
        ],
    },

    // ── 🏋️ Verticale : Salle de Sport ────────────────────────────────────
    book_gym_class: {
        id: 'book_gym_class',
        name: 'Réservation de Cours Collectif',
        description: 'Inscrit un adhérent à une session de cours ou coaching privé.',
        category: 'gym',
        minRoleLevel: 40,
        parameters: [
            { name: 'classId', type: 'string', description: 'Identifiant du cours', required: true },
            { name: 'memberId', type: 'string', description: "Identifiant de l'adhérent", required: true },
            { name: 'slot', type: 'string', description: 'Créneau horaire', required: true },
        ],
    },

    // ── 💼 Verticale : Coworking ──────────────────────────────────────────
    book_coworking_room: {
        id: 'book_coworking_room',
        name: 'Réservation Salle de Réunion',
        description: 'Réserve un espace ou une salle de réunion pour une entreprise ou un coworker.',
        category: 'coworking',
        minRoleLevel: 40,
        parameters: [
            { name: 'roomId', type: 'string', description: 'Identifiant de la salle', required: true },
            { name: 'companyId', type: 'string', description: "Identifiant de l'entreprise", required: true },
            { name: 'hours', type: 'number', description: "Nombre d'heures réservées", required: true },
        ],
    },

    // ── 🐾 Verticale : Clinique Vétérinaire ────────────────────────────────
    schedule_pet_vaccine: {
        id: 'schedule_pet_vaccine',
        name: 'Programmation Rappel Vaccin Animal',
        description: 'Planifie ou envoie un rappel de vaccin pour un animal enregistré.',
        category: 'veterinary',
        minRoleLevel: 40,
        parameters: [
            { name: 'animalId', type: 'string', description: "Identifiant de l'animal (ICAD)", required: true },
            { name: 'vaccineName', type: 'string', description: 'Nom du vaccin', required: true },
        ],
    },

    // ── 🌸 Verticale : Fleuriste ──────────────────────────────────────────
    create_custom_bouquet_order: {
        id: 'create_custom_bouquet_order',
        name: 'Commande Composition Florale',
        description: 'Enregistre une commande de composition ou bouquet sur-mesure.',
        category: 'florist',
        minRoleLevel: 40,
        parameters: [
            { name: 'customerId', type: 'string', description: 'Identifiant du client', required: true },
            { name: 'recipeId', type: 'string', description: "Identifiant de la formule ou arrangement", required: true },
        ],
    },
};

export function getToolById(toolId: string): AssistantToolDefinition | undefined {
    return UNIVERSAL_ASSISTANT_TOOLS[toolId];
}
