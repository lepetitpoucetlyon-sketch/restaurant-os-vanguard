// POS, Planning, Inventory, Reservations, Customer, Recruitment translations
export const operationsTranslations = {
    fr: {
        planning: {
            title: "Planification des Équipes",
            subtitle: "JURIDICTION BRIGADE",
            week: "Semaine",
            today: "Aujourd'hui",
            publish: "PUBLIER",
            new_shift: "Nouveau Protocole",
            edit_shift: "Rectification Shift",
            shift_midi: "Midi",
            shift_soir: "Soir",
            shift_coupure: "Coupure",
            shift_off: "Repos",
            startTime: "Déclenchement",
            endTime: "Clôture",
            zone: "Juridiction de Service",
            save_shift: "SCELLER SHIFT",
            update_shift: "MAINTENIR MODIFICATIONS",
            delete_shift: "AUTORISER DESTRUCTION",
            summary_title: "Compendium d'Occupation Heureuse",
            summary_midi: "Service Midi",
            summary_soir: "Service Soir",
            summary_total: "Volume Total",
            zones: {
                main: "Salle Principale",
                terrace: "Terrasse",
                vip: "Carré VIP",
                bar: "Comptoir Bar"
            },
            filter_all: "Tous",
            filter_server: "Salle",
            filter_kitchen: "Cuisine",
            unassigned: "Non assigné",
            roles: {
                admin: "Administrateur",
                manager: "Directeur",
                floor_manager: "Responsable Salle",
                server: "Serveur",
                bartender: "Barman",
                kitchen_chef: "Chef",
                kitchen_line: "Cuisinier",
                host: "Hôte",
                cashier: "Caissier"
            }
        },
        pos: {
            title: "Point de Vente",
            search_placeholder: "Quête d'une pièce d'exception...",
            fallback_description: "Une création signature, harmonie de textures et de saveurs authentiques repensées pour l'excellence.",
            table: "Table",
            covers: "Cvt",
            finalise: "Finaliser",
            send_kitchen: "Partir en Cuisine",
            clear_cart: "Vider le Panier",
            split_bill: "Partager l'Addition",
            payment_label: "Encaissement",
            back: "Retour",
            favorites: "Favoris",
            configure: "Configure",
            items_count: "Articles",
            total: "Total",
            details: {
                selection: "Maître Sélection",
                required: "Obligatoire",
                single_choice: "Choix Unique",
                max_selection: "Sélection Max",
                allergens: "Exclusions & Allergènes",
                add_custom_allergen: "Ajouter une exclusion spécifique",
                notes: "Notes de Préparation",
                notes_placeholder: "Précisez ici vos exigences culinaires particulières...",
                allergen_placeholder: "Nom de l'allergène...",
                add_to: "Ajouter à",
                archive: "L'Archive"
            },
            cart: {
                empty: "Panier Vacant",
                empty_desc: "AUCUNE SÉLECTION DANS LE MANIFESTE ACTUEL",
                subtotal: "Sous-total HT",
                tax: "TVA",
                total: "TOTAL TTC",
                kitchen: "CUISINE",
                split: "PARTAGE",
                checkout: "ENCAISSER",
                standards: "Standards",
                edit: "Modifier",
                view: "VOIR"
            },
            categories: {
                antipasti: "Antipasti",
                pizzas: "Pizzas",
                pasta: "Pâtes",
                viandes: "Viandes",
                cocktails: "Cocktails",
                desserts: "Desserts"
            },
            options: {
                opt_cooking: "Cuisson",
                cook_bleu: "Bleu",
                cook_saignant: "Saignant",
                cook_apoint: "À point",
                cook_biencuit: "Bien cuit",
                opt_supplements: "Suppléments",
                supp_truffle: "Truffes Fraîches",
                supp_mozzarella: "Extra Mozzarella",
                supp_jambon: "Jambon de Parme"
            },
            payment: {
                title: "Règlement",
                subtitle: "Étape Finale",
                transaction_success: "Transaction Honorée",
                archive_updated: "L'Archive a été mise à jour avec succès.",
                generating_receipt: "Génération du reçu officiel...",
                total_exhibition: "Total de l'Exposition",
                fees_included: "Frais Inclus",
                methods: {
                    card: "Carte",
                    cash: "Espèces",
                    mobile: "Apple Pay"
                },
                processing: "Vérification de l'Authenticité...",
                confirm_seal: "Confirmer le Sceau",
                security_seal: "Sceau de Sécurité RestaurantOS",
                encryption_protocol: "Protocole de cryptage maître v4.2"
            },
            split: {
                title: "Partage de l'Archive",
                subtitle: "Protocoles de Division",
                signatures: "SIGNATURES",
                convive_signature_title: "Signature de Haute Excellence",
                convive: "Convive",
                methods: {
                    card: "CARTE EXECUTIVE",
                    cash: "ESPÈCES ARCHIVE",
                    mobile: "PREMIUM MOBILE"
                },
                back: "RETOUR",
                seal_transaction: "SCELLER LA TRANSACTION",
                modes: {
                    equal: "PARTS ÉGALES",
                    by_item: "PAR ARTEFACT",
                    custom: "MESURE LIBRE"
                },
                seats_control: "CONTRÔLE DES SIÈGES",
                convive_count: "Nombre de Convives",
                investment_per_seat: "INVESTISSEMENT PAR SIÈGE",
                convive_spirit: "CONVIVE ESPRIT",
                master: "Maître",
                honored: "HONORÉ",
                collect: "ENCAISSER",
                signature: "SIGNATURE",
                remaining: "RESTE À PERCEVOIR",
                close_archive: "CLÔTURER L'ARCHIVE",
                protocol_in_progress: "PROTOCOLE EN COURS",
                waiting_seals: "EN ATTENTE DE SCELLÉS",
                paid_msg: "a payé"
            },
            settings: {
                title: "L'Archive POS",
                intel_hub: "Intelligence Hub",
                arch_section: "Section d'Archive",
                tabs: {
                    interface: "Interface",
                    hardware: "Matériel",
                    sales: "Ventes",
                    system: "Système"
                },
                grid: {
                    title: "Architecture de Grille",
                    subtitle: "Optimisation visuelle dynamique",
                    auto: "ADAPTATIF",
                    auto_desc: "Auto Layout",
                    compact: "COMPACT",
                    compact_desc: "6 Col Grid",
                    relaxed: "AÉRÉ",
                    relaxed_desc: "4 Col Grid"
                },
                render: {
                    title: "Protocoles de Rendu",
                    visual: "Visual Intelligence",
                    visual_desc: "Charger les miniatures des produits",
                    neural: "Neural Density",
                    neural_desc: "Interface tactile haute densité",
                    acoustic: "Acoustic Feedback",
                    acoustic_desc: "Sons lors des actions POS"
                },
                hardware: {
                    title: "Périphériques Réseau",
                    scan: "Relancer l'Analyse",
                    testing: "Neural scan in progress : EPSON & STAR Hardware Nodes"
                },
                sales: {
                    title: "Protocoles Opérationnels",
                    logistics: "Logistique Ticket",
                    logistics_desc: "Impression auto après règlement",
                    speed: "Mode Vitesse",
                    speed_desc: "Sauter les sélections non-critiques",
                    kitchen: "Validation Cuisine",
                    kitchen_desc: "Confirmer l'envoi des bons",
                    cart_security: "Sécurité Panier",
                    cart_security_desc: "Confirmer la suppression d'article"
                },
                system: {
                    kernel: "Kernel Engine",
                    uptime: "Exhibition Uptime",
                    latency: "Telemetry Latency",
                    archive_sync: "Archive Status"
                },
                actions: {
                    save_success: "Protocoles mémorisés avec succès",
                    reset: "Reset Logic",
                    abandon: "Abandonner",
                    save: "Homologuer Protocoles",
                    saving: "Neural Sync..."
                }
            }
        },
        inventory: {
            title: "Stocks & Inventaire",
            stats: {
                value: "Valeur Inventaire",
                items_in_stock: "articles en stock",
                low_stock: "Alertes Stock Bas",
                low_stock_desc: "Ingrédients sous seuil",
                expiring: "Péremptions Proches",
                expiring_desc: "Articles à surveiller",
                active_preps: "Préparations Actives",
                active_preps_desc: "Mises en place"
            },
            tabs: { archive: "ARCHIVE", kitchen: "CUISINE", logistics: "LOGISTIQUE" },
            actions: { transfer: "Transfert", reception: "Réception", new_prep: "NOUVELLE PRÉPARATION" },
            search: { archive: "RECHERCHER DANS L'ARCHIVE...", kitchen: "RECHERCHER DANS LE LABORATOIRE..." },
            table: { article: "ARTICLE", location: "SITU", quantity: "QUANTUM", dlc: "DLC", protocol: "PROTOCOL", action: "ACTION", empty: "Silences dans l'Archive", expires: "EXPIRES" },
            prep: { empty: "Cuisine en Pause", immediate: "IMMÉDIAT", executive: "EXÉCUTIF" },
            orders: { title: "Protocoles de Convoi.", subtitle: "Logistique Culinaire & Approvisionnement", active_count: "Commandes En Cours", empty: "Aucun Convoi en Route", receive: "RÉCEPTIONNER", sealed: "SCÈLLEMENT", arrival: "ARRIVÉE" },
            status: { draft: "Brouillon", pending: "En attente", confirmed: "Confirmée", shipped: "Expédiée", delivered: "Livrée", cancelled: "Annulée" }
        },
        reservations: {
            sidebar: { manifest: "Manifeste Quotidien", search_placeholder: "IDENTIFICATION NOMINATIVE...", manifest_count: "MANIFESTE", sort: "TRIER", empty: "Agenda Vacant", expected: "Attendu", seated: "En Cuisine", unit: "Unité", total_covers: "SERVICES ENGAGÉS" },
            tabs: { plan: "PLAN", list: "LISTE", day: "JOUR", week: "SEMAINE" },
            actions: { reserve: "RÉSERVER" },
            zones: { zone: "ZONE" },
            list: { search_placeholder: "RECHERCHER UN CONVIVE...", registry: "REGISTRE", profiles: "PROFILS", services: "Services", value: "Valeur" },
            customer: { executive_intelligence: "Intelligence Exécutive", total_spent: "Total Dépensé", visits: "Nombre de Visites", last_visit: "Dernière Visite", contact: "Informations de Contact", preferences: "Préférences & Habitudes", close: "Fermer le Profil", new_table: "Affecter à une Table", add_success: "Profil Gastronomique Enregistré", reserve_success: "Affectation Table Confirmée" }
        },
        customer: {
            database_title: "Base de Données", brigade_title: "Brigade Opérative", clients_subtitle: "Clients", search_placeholder: "RECHERCHER UN PROFIL...", global_portfolio: "Portefeuille Global", lifetime_value: "Lifetime Value Total", all_clients: "Tous les clients", export_db: "EXPORTER DATABASE", new_profile: "NOUVEAU PROFIL", visits: "Visites", value: "Valeur", last_visit: "Dernière", contact_info: "Informations de Contact", personalized_exp: "Expérience Personnalisée", operational_comments: "Commentaires Opérationnels", ledger_title: "Grand Livre des Réservations", new_table: "Nouvelle Table", new_profile_title: "Nouveau Profil Client", secure_db: "Enregistrement dans la base de données sécurisée", full_name: "Nom Complet", phone: "Téléphone", email: "Adresse Email", birthday: "Anniversaire", segment: "Segment", operational_note: "Note Opérationnelle", abandon: "Abandonner", save_profile: "Enregistrer le Profil",
            segments: { vip: "VIP", regular: "Régulier", new: "Nouveau", lost: "À réactiver" }
        }
    },
    en: {
        planning: {
            title: "Staff Scheduling", subtitle: "BRIGADE JURISDICTION", week: "Week", today: "Today", publish: "PUBLISH", new_shift: "New Protocol", edit_shift: "Shift Rectification", shift_midi: "Lunch", shift_soir: "Dinner", shift_coupure: "Split", shift_off: "Off", startTime: "Start Time", endTime: "End Time", zone: "Service Jurisdiction", save_shift: "SEAL SHIFT", update_shift: "MAINTAIN CHANGES", delete_shift: "AUTHORIZE DESTRUCTION", summary_title: "Staff Occupation Compendium", summary_midi: "Lunch Service", summary_soir: "Dinner Service", summary_total: "Total Volume",
            zones: { main: "Main Hall", terrace: "Terrace", vip: "VIP Area", bar: "Bar Counter" },
            filter_all: "All", filter_server: "Service", filter_kitchen: "Kitchen", unassigned: "Unassigned",
            roles: { admin: "Administrator", manager: "Manager", floor_manager: "Floor Manager", server: "Server", bartender: "Bartender", kitchen_chef: "Chef", kitchen_line: "Line Cook", host: "Host", cashier: "Cashier" }
        },
        pos: {
            title: "Point of Sale", search_placeholder: "Searching for an exceptional item...", fallback_description: "A signature creation, harmony of textures and authentic flavors reimagined for excellence.", table: "Table", covers: "Cvt", finalise: "Finalize", send_kitchen: "Send to Kitchen", clear_cart: "Clear Cart", split_bill: "Split Bill", payment_label: "Checkout", back: "Back", favorites: "Favorites", configure: "Configure", items_count: "Items", total: "Total",
            details: { selection: "Master Selection", required: "Required", single_choice: "Single Choice", max_selection: "Max Selection", allergens: "Exclusions & Allergens", add_custom_allergen: "Add specific exclusion", notes: "Preparation Notes", notes_placeholder: "Specify your particular culinary requirements here...", allergen_placeholder: "Allergen name...", add_to: "Add to", archive: "The Archive" },
            cart: { empty: "Empty Cart", empty_desc: "NO SELECTION IN THE CURRENT MANIFEST", subtotal: "Subtotal", tax: "Tax", total: "TOTAL", kitchen: "KITCHEN", split: "SPLIT", checkout: "CHECKOUT", standards: "Standards", edit: "Edit", view: "VIEW" },
            categories: { antipasti: "Antipasti", pizzas: "Pizzas", pasta: "Pasta", viandes: "Meat", cocktails: "Cocktails", desserts: "Desserts" },
            options: { opt_cooking: "Cooking Info", cook_bleu: "Rare (Bleu)", cook_saignant: "Medium Rare", cook_apoint: "Medium", cook_biencuit: "Well Done", opt_supplements: "Supplements", supp_truffle: "Fresh Truffle", supp_mozzarella: "Extra Mozzarella", supp_jambon: "Parma Ham" },
            payment: { title: "Settlement", subtitle: "Final Step", transaction_success: "Transaction Honored", archive_updated: "The Archive has been successfully updated.", generating_receipt: "Generating official receipt...", total_exhibition: "Exhibition Total", fees_included: "Fees Included", methods: { card: "Card", cash: "Cash", mobile: "Apple Pay" }, processing: "Authenticity Verification...", confirm_seal: "Confirm the Seal", security_seal: "RestaurantOS Security Seal", encryption_protocol: "Master encryption protocol v4.2" },
            split: { title: "Archive Splitting", subtitle: "Division Protocols", signatures: "SIGNATURES", convive_signature_title: "High Excellence Signature", convive: "Convive", methods: { card: "EXECUTIVE CARD", cash: "ARCHIVE CASH", mobile: "PREMIUM MOBILE" }, back: "BACK", seal_transaction: "SEAL TRANSACTION", modes: { equal: "EQUAL PARTS", by_item: "BY ARTEFACT", custom: "FREE MEASURE" }, seats_control: "SEATS CONTROL", convive_count: "Convive Count", investment_per_seat: "INVESTMENT PER SEAT", convive_spirit: "CONVIVE SPIRIT", master: "Master", honored: "HONORED", collect: "CHECKOUT", signature: "SIGNATURE", remaining: "REMAINING TO PERCEIVE", close_archive: "CLOSE ARCHIVE", protocol_in_progress: "PROTOCOL IN PROGRESS", waiting_seals: "WAITING FOR SEALS", paid_msg: "paid" },
            settings: { title: "POS Archive", intel_hub: "Intelligence Hub", arch_section: "Archive Section", tabs: { interface: "Interface", hardware: "Hardware", sales: "Sales", system: "System" }, grid: { title: "Grid Architecture", subtitle: "Dynamic Visual Optimization", auto: "ADAPTIVE", auto_desc: "Auto Layout", compact: "COMPACT", compact_desc: "6 Col Grid", relaxed: "RELAXED", relaxed_desc: "4 Col Grid" }, render: { title: "Rendering Protocols", visual: "Visual Intelligence", visual_desc: "Load product miniatures", neural: "Neural Density", neural_desc: "High density touch interface", acoustic: "Acoustic Feedback", acoustic_desc: "POS action sounds" }, hardware: { title: "Network Peripherals", scan: "Relaunch Analysis", testing: "Neural scan in progress : EPSON & STAR Hardware Nodes" }, sales: { title: "Operational Protocols", logistics: "Ticket Logistics", logistics_desc: "Auto print after settlement", speed: "Speed Mode", speed_desc: "Skip non-critical selections", kitchen: "Kitchen Validation", kitchen_desc: "Confirm order sending", cart_security: "Cart Security", cart_security_desc: "Confirm item deletion" }, system: { kernel: "Kernel Engine", uptime: "Exhibition Uptime", latency: "Telemetry Latency", archive_sync: "Archive Status" }, actions: { save_success: "Protocols successfully memorized", reset: "Reset Logic", abandon: "Abandon", save: "Homologate Protocols", saving: "Neural Sync..." } }
        },
        inventory: {
            title: "Inventory & Stock",
            stats: { value: "Inventory Value", items_in_stock: "items in stock", low_stock: "Low Stock Alerts", low_stock_desc: "Ingredients below threshold", expiring: "Near Expiry", expiring_desc: "Items to monitor", active_preps: "Active Preparations", active_preps_desc: "Mise en place" },
            tabs: { archive: "ARCHIVE", kitchen: "KITCHEN", logistics: "LOGISTICS" },
            actions: { transfer: "Transfer", reception: "Reception", new_prep: "NEW PREPARATION" },
            search: { archive: "SEARCH IN ARCHIVE...", kitchen: "SEARCH IN LABORATORY..." },
            table: { article: "ARTICLE", location: "LOC", quantity: "QUANTUM", dlc: "EXP", protocol: "PROTOCOL", action: "ACTION", empty: "Silence in Archive", expires: "EXPIRES" },
            prep: { empty: "Kitchen on Break", immediate: "IMMEDIATE", executive: "EXECUTIVE" },
            orders: { title: "Convoy Protocols.", subtitle: "Culinary Logistics & Supply", active_count: "Active Orders", empty: "No Convoy En Route", receive: "RECEIVE", sealed: "SEALING", arrival: "ARRIVAL" },
            status: { draft: "Draft", pending: "Pending", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" }
        },
        reservations: {
            sidebar: { manifest: "Daily Manifest", search_placeholder: "NOMINATIVE IDENTIFICATION...", manifest_count: "MANIFEST", sort: "SORT", empty: "Vacant Agenda", expected: "Expected", seated: "In Kitchen", unit: "Unit", total_covers: "ENGAGED SERVICES" },
            tabs: { plan: "PLAN", list: "LIST", day: "DAY", week: "WEEK" },
            actions: { reserve: "RESERVE" },
            zones: { zone: "ZONE" },
            list: { search_placeholder: "SEARCH A CONVIVE...", registry: "REGISTRY", profiles: "PROFILES", services: "Services", value: "Value" },
            customer: { executive_intelligence: "Executive Intelligence", total_spent: "Total Spent", visits: "Number of Visits", last_visit: "Last Visit", contact: "Contact Information", preferences: "Preferences & Habits", close: "Close Profile", new_table: "Assign to Table", add_success: "Gastronomic Profile Registered", reserve_success: "Table Assignment Confirmed" }
        },
        customer: {
            database_title: "Database", brigade_title: "Brigade", clients_subtitle: "Clients", search_placeholder: "SEARCH A PROFILE...", global_portfolio: "Global Portfolio", lifetime_value: "Total Lifetime Value", all_clients: "All Clients", export_db: "EXPORT DATABASE", new_profile: "NEW PROFILE", visits: "Visits", value: "Value", last_visit: "Last", contact_info: "Contact Information", personalized_exp: "Personalized Experience", operational_comments: "Operational Comments", ledger_title: "Reservation Ledger", new_table: "New Table", new_profile_title: "New Client Profile", secure_db: "Registration in secured database", full_name: "Full Name", phone: "Phone", email: "Email Address", birthday: "Birthday", segment: "Segment", operational_note: "Operational Note", abandon: "Abandon", save_profile: "Save Profile",
            segments: { vip: "VIP", regular: "Regular", new: "New", lost: "To Reactivate" }
        },
        recruitment: {
            title: "Recruitment Pipeline", subtitle: "GDPR Talent Management", new_candidate: "New Candidate", search_placeholder: "Search for a candidate...", gdpr_compliant: "GDPR: Compliant",
            columns: { new: "New", interview: "Interview", trial: "Trial", refused: "Refused", hired: "Hired" },
            modal: { title: "Application Entry", step_1: "Information", step_2: "Consent & CV", scan_cv: "Scan Paper CV", upload_pdf: "Upload PDF", gdpr_notice: "I confirm that I have received the candidate's consent to store their data.", finish: "Finish Application" }
        }
    },
    ja: {},
    pt: {},
    es: {
        recruitment: {
            title: "Pipeline de Reclutamiento", subtitle: "Gestión GDPR de Talentos", new_candidate: "Nuevo Candidato", search_placeholder: "Buscar un candidato...", gdpr_compliant: "RGPD: Conforme",
            columns: { new: "Nuevos", interview: "Entrevista", trial: "Prueba", refused: "Rechazados", hired: "Contratados" },
            modal: { title: "Entrada de Solicitud", step_1: "Información", step_2: "Consentimiento y CV", scan_cv: "Escanear CV en papel", upload_pdf: "Subir PDF", gdpr_notice: "Confirmo haber recibido el consentimiento del candidato para el almacenamiento de sus datos.", finish: "Finalizar Solicitud" }
        }
    }
};
