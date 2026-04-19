export type TutorialItem = {
    title: string;
    description: string;
    icon?: string;
  };
  
  export type TutorialCategory = {
    id: string;
    title: string;
    items: TutorialItem[];
  };
  
  export const tutorialContent: Record<string, TutorialCategory> = {
    dashboard: {
      id: 'dashboard',
      title: 'Guide : Tableau de Bord',
      items: [
        {
          title: 'Aperçu des performances',
          description: 'Suivez votre chiffre d\'affaires, le ticket moyen et le nombre de commandes en temps réel pour analyser votre activité.',
        },
        {
          title: 'Filtres de période',
          description: 'Utilisez le sélecteur de dates pour comparer vos ventes (Aujourd\'hui, Semaine, Mois) avec vos périodes précédentes.',
        },
        {
          title: 'Meilleures ventes quotidiennes',
          description: 'Identifiez en un coup d\'œil vos plats et produits stars pour ajuster votre production et prévoir vos stocks.',
        },
      ],
    },
    pos: {
      id: 'pos',
      title: 'Guide : Commandes & Caisse',
      items: [
        {
          title: 'Prise de commande intuitive',
          description: 'Cliquez sur les plats pour les ajouter au ticket, modifiez les quantités et ajoutez des notes liées à la préparation en cuisine (ex: "sans sel", "bien cuit").',
        },
        {
          title: 'Gestion de la Cuisine (KDS)',
          description: 'Faites glisser virtuellement les tickets de \'À préparer\' vers \'En cours\' puis \'Prêt à servir\' pour simplifier la coordination entre la salle et les chefs.',
        },
        {
          title: 'Paiement et Séparation de note',
          description: 'Divisez facilement une addition entre plusieurs convives et encaissez en utilisant différents moyens de paiement (CB, Espèces, Titres Restaurant) pour valider la table.',
        },
      ],
    },
    products: {
      id: 'products',
      title: 'Guide : Catalogue & Menu',
      items: [
        {
          title: 'Création d\'articles',
          description: 'Ajoutez un nouveau plat en renseignant sa photo, son nom complet, sa description, son prix et sa catégorie de taxe (TVA).',
        },
        {
          title: 'Options, Variantes & Suppléments',
          description: 'Configurez les choix imposés (ex: Choix de la cuisson ou parfum de glace) ou les extras payants directement liés au produit.',
        },
        {
          title: 'Organisation par Départements',
          description: 'Structurez proprement votre offre (Entrées, Plats, Desserts, Boissons) pour lisser la navigation du personnel sur l\'écran de caisse.',
        },
      ],
    },
    crm: {
      id: 'crm',
      title: 'Guide : Clients (CRM)',
      items: [
        {
          title: 'Fiche Client',
          description: 'Enregistrez le nom, téléphone, email et adresse de vos clients, essentiel pour la gestion des commandes à emporter ou en livraison.',
        },
        {
          title: 'Historique de consommation',
          description: 'Visualisez toutes les commandes clôturées par un client spécifique pour mieux le conseiller lors de sa prochaine visite.',
        },
        {
          title: 'Programme de Fidélité',
          description: 'Consultez les compteurs et attribuez des points de fidélité permettant de générer des réductions ou d\'offrir un produit.',
        },
      ],
    },
    inventory: {
      id: 'inventory',
      title: 'Guide : Stocks & Approvisionnement',
      items: [
        {
          title: 'Gestion de l\'inventaire',
          description: 'Visualisez les quantités restantes pour vos articles ou ingrédients ; les valeurs sont déduites automatiquement à partir de vos volumes de vente.',
        },
        {
          title: 'Ruptures et Alertes',
          description: 'Configurez un seuil minimal. Dès qu\'un stock passe en dessous, un indicateur d\'alerte apparaît pour lancer une commande fournisseur.',
        },
      ],
    },
    staff: {
      id: 'staff',
      title: 'Guide : Équipe',
      items: [
        {
          title: 'Création de profils employés',
          description: 'Ajoutez vos serveurs, cuisiniers et managers, et attribuez-leur un code de connexion ou PIN personnel d\'authentification.',
        },
        {
          title: 'Permissions des Rôles',
          description: 'Restreignez les accès sensibles (ex: serveur vs. gérant) pour protéger les données financières, les annulations de tickets ou la modification de la carte.',
        },
      ],
    },
    settings: {
      id: 'settings',
      title: 'Guide : Paramètres & Configuration',
      items: [
        {
          title: 'Profil de l\'Établissement',
          description: 'Modifiez à n\'importe quel moment l\'adresse de votre restaurant, le numéro de téléphone, votre logo ou le SIRET visible sur les factures.',
        },
        {
          title: 'Taxes et Moyens de paiement',
          description: 'Activez ou désactivez les moyens d\'encaissements souhaités sur l\'écran de paiement et mettez à jour la TVA par défaut.',
        },
      ],
    },
  };
  
