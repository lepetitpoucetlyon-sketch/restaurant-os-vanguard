import type { PageKey, PageSettingConfig } from "@nexus/contracts/permissions.types";

export const PAGE_SETTINGS: Record<PageKey, { title: string; settings: PageSettingConfig[] }> = {
    dashboard: {
        title: "Paramètres du Tableau de Bord",
        settings: [
            { key: "show_ca", label: "Afficher le CA", group: "logic", type: "toggle", roles: ["admin", "directeur", "manager"] },
            { key: "ca_target", label: "Objectif CA journalier (€)", group: "logic", type: "number", min: 0, max: 100000, roles: ["admin", "directeur"] },
            { key: "tickets_target", label: "Objectif tickets/jour", group: "logic", type: "number", min: 0, max: 500, roles: ["admin", "directeur"] },
            { key: "occupation_target", label: "Objectif occupation (%)", group: "logic", type: "number", min: 0, max: 100, roles: ["admin", "directeur"] },
        ],
    },
    vanguard: {
        title: "Paramètres Vanguard",
        settings: [
        ]
    },
    franchise: {
        title: "Paramètres Réseau & Franchise",
        settings: [
        ]
    },
    floor_plan: {
        title: "Paramètres du Plan de Salle",
        settings: [
        ],
    },
    reservations: {
        title: "Paramètres des Réservations",
        settings: [
            { key: "noshow_delay", label: "Délai no-show (min)", group: "logic", type: "number", min: 5, max: 60, roles: ["admin", "directeur", "manager"] },
            { key: "turnover_factor_per_guest_pct", label: "Allongement par convive au-delà de 2 (%)", description: "Modèle de rotation de table (DF-C5).", group: "logic", type: "number", min: 0, max: 30, roles: ["admin", "directeur"] },
            { key: "turnover_kds_impact_max_pct", label: "Impact max du retard cuisine (%)", description: "Impact de la surchauffe KDS sur la rotation (DF-C6).", group: "logic", type: "number", min: 0, max: 100, roles: ["admin", "directeur"] },
        ],
    },
    pos: {
        title: "Paramètres de la Caisse & Vente",
        settings: [
            { key: "show_images", label: "Afficher les images", group: "style", type: "toggle", roles: ["admin", "directeur", "manager"] },
            { key: "split_bill_enabled", label: "Addition divisée", group: "logic", type: "toggle", roles: ["admin", "directeur"] },
            { key: "table_lock_ttl_sec", label: "Durée de réservation d'une table (secondes)", description: "Temps avant expiration du verrou table (DF-A1).", group: "logic", type: "number", min: 30, max: 600, roles: ["admin", "directeur", "manager", "chef_rang"] },
            { key: "delivery_min_address_score", label: "Score d'adresse livraison minimal", description: "Score d'adresse requis pour acceptation automatique (DF-M2).", group: "logic", type: "number", min: 0, max: 100, roles: ["admin", "directeur", "manager"] },
            { key: "failover_group_only", label: "Secours imprimante limité au groupe (cuisine/bar)", description: "Évite qu'un bon cuisine sorte au bar (DF-D1).", group: "logic", type: "toggle", roles: ["admin", "directeur", "manager"] },
            { key: "on_print_failure", label: "Comportement si échec d'impression", description: "Gestion d'incident NF525 après validation fiscale (DF-D3).", group: "logic", type: "select", options: [{ value: "queue", label: "Mettre en file et alerter" }, { value: "block", label: "Bloquer la vente" }, { value: "continue", label: "Continuer sans ticket" }], roles: ["admin", "directeur"] },
        ],
    },
    kitchen: {
        title: "Paramètres Cuisine & Recettes",
        settings: [
        ],
    },
    kds: {
        title: "Paramètres KDS & Production",
        settings: [
            { key: "columns", label: "Nombre de colonnes", group: "style", type: "select", options: [{ value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }, { value: "5", label: "5" }], roles: ["admin", "directeur", "manager"] },
            { key: "overheat_threshold_min", label: "Seuil de surchauffe cuisine (min)", description: "Au-delà, le bridage automatique s'active (DF-B1).", group: "logic", type: "number", min: 5, max: 60, roles: ["admin", "directeur", "chef_cuisinier"] },
            { key: "throttle_max_orders", label: "Commandes max pendant le bridage", description: "Capacité maximale admise par tranche de régulation (DF-B2).", group: "logic", type: "number", min: 1, max: 20, roles: ["admin", "directeur", "chef_cuisinier"] },
            { key: "throttle_duration_sec", label: "Durée du bridage (secondes)", group: "logic", type: "number", min: 60, max: 3600, roles: ["admin", "directeur", "chef_cuisinier"] },
            { key: "throttle_enabled", label: "Activer le bridage automatique", description: "Permet de débrider en urgence pendant un coup de feu (DF-B2).", group: "logic", type: "toggle", roles: ["admin", "directeur", "chef_cuisinier"] },
        ],
    },
    inventory: {
        title: "Paramètres Inventaire & Approvisionnement",
        settings: [
            { key: "supplier_cutoff_warning_min", label: "Alerte avant clôture fournisseur (min)", group: "logic", type: "number", min: 15, max: 240, roles: ["admin", "directeur", "chef_cuisinier"] },
            { key: "commodity_surge_alert_pct", label: "Flambée de cours — seuil d'alerte (%)", group: "logic", type: "number", min: 5, max: 50, roles: ["admin", "directeur", "chef_cuisinier"] },
            { key: "food_cost_weight_pct", label: "Poids food cost dans l'ajustement prix (%)", description: "Pondération de la hausse des cours sur la recommandation de prix menu (DF-J3).", group: "logic", type: "number", min: 10, max: 60, roles: ["admin", "directeur"] },
            { key: "ocr_confidence_threshold", label: "Confiance OCR minimale (%)", description: "En dessous, la facture part en validation manuelle (DF-J4).", group: "logic", type: "number", min: 60, max: 99, roles: ["admin", "directeur", "comptable"] },
            { key: "weather_procurement_temp_c", label: "Température déclenchant ajustement météo (°C)", group: "logic", type: "number", min: 15, max: 40, roles: ["admin", "directeur", "chef_cuisinier"] },
            { key: "weather_procurement_boost_pct", label: "Ajustement météo produits frais (%)", group: "logic", type: "number", min: 0, max: 50, roles: ["admin", "directeur", "chef_cuisinier"] },
        ],
    },
    storage_map: {
        title: "Paramètres Stockage",
        settings: [
        ],
    },
    customer: {
        title: "Paramètres Clients & Fidélité",
        settings: [
            { key: "vip_threshold_visits", label: "Seuil visites VIP", group: "logic", type: "number", min: 1, max: 50, roles: ["admin", "directeur"] },
            { key: "vip_threshold_spend", label: "Seuil dépenses VIP (€)", group: "logic", type: "number", min: 100, max: 10000, roles: ["admin", "directeur"] },
            { key: "loyalty_points_per_euro", label: "Points de fidélité par euro dépensé", description: "Cœur économique du programme de fidélité (DF-K1).", group: "logic", type: "number", min: 0, max: 10, roles: ["admin", "directeur"] },
        ],
    },
    staff: {
        title: "Paramètres Équipe",
        settings: [
        ],
    },
    planning: {
        title: "Paramètres Planning",
        settings: [
            { key: "max_hours_day", label: "Max heures/jour", group: "logic", type: "number", min: 6, max: 12, roles: ["admin", "directeur"] },
            { key: "max_hours_week", label: "Max heures/semaine", group: "logic", type: "number", min: 20, max: 48, roles: ["admin", "directeur"] },
            { key: "min_rest_hours", label: "Repos min entre shifts (h)", group: "logic", type: "number", min: 8, max: 14, roles: ["admin", "directeur"] },
        ],
    },
    leaves: {
        title: "Paramètres Congés",
        settings: [
        ],
    },
    finance: {
        title: "Paramètres Finance & Rapprochement",
        settings: [
            { key: "auto_reconcile_score", label: "Score rapprochement automatique", description: "Score minimal au-delà duquel l'écriture est rapprochée sans validation manuelle (DF-N1).", group: "logic", type: "number", min: 80, max: 100, roles: ["admin", "directeur", "comptable"] },
            { key: "tips_distribution_method", label: "Méthode répartition pourboires", group: "logic", type: "select", options: [{ value: "equal", label: "Égale" }, { value: "hours", label: "Par heures" }, { value: "points", label: "Par points" }], roles: ["admin", "directeur"] },
        ],
    },
    analytics: {
        title: "Paramètres Analyses",
        settings: [
        ],
    },
    haccp: {
        title: "Paramètres HACCP & Hygiène",
        settings: [
            { key: "thaw_max_hold_hours", label: "Durée max après décongélation (h)", description: "Délai maximal de conservation des produits décongelés (DF-E3).", group: "logic", type: "number", min: 6, max: 96, roles: ["admin", "directeur", "chef_cuisinier"] },
        ],
    },
    groups: {
        title: "Paramètres Groupes",
        settings: [
        ],
    },
    seo: {
        title: "Paramètres SEO & Réputation",
        settings: [
            { key: "review_bombing_burst_threshold", label: "Avis négatifs déclenchant alerte", description: "Seuil de détection d'attaque e-réputation (DF-L1).", group: "logic", type: "number", min: 3, max: 50, roles: ["admin", "directeur"] },
            { key: "review_bombing_no_text_ratio", label: "Part suspecte avis sans texte (%)", group: "logic", type: "number", min: 20, max: 100, roles: ["admin", "directeur"] },
        ],
    },
    bar: {
        title: "Paramètres Bar & Tireuses",
        settings: [
            { key: "alcohol_loss_alert_eur", label: "Seuil alerte perte alcool (€)", description: "Seuil d'écart financier déclenchant une alerte inventaire bar (DF-A3).", group: "logic", type: "number", min: 1, max: 500, roles: ["admin", "directeur", "manager", "barman"] },
            { key: "spout_variance_cl", label: "Écart toléré bec verseur (cl)", description: "Tolérance télémétrique par dose servie SmartSpout (DF-A4).", group: "logic", type: "number", min: 1, max: 50, roles: ["admin", "directeur", "manager", "barman"] },
        ],
    },
    registre: {
        title: "Paramètres Registres",
        settings: [
        ],
    },
    workshop: {
        title: "Paramètres Atelier & Baies",
        settings: [
        ],
    },
    consultations: {
        title: "Paramètres Consultations & Actes",
        settings: [
        ],
    },
    vault: {
        title: "Paramètres Chambre Forte & Scellés",
        settings: [
        ],
    },
    settings: {
        title: "Paramètres Système",
        settings: [], // Settings page has its own interface
    },
};
