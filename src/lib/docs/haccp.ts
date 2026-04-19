import { ClipboardCheck } from 'lucide-react';
import { DocCategory } from '@/types';

export const haccp: DocCategory = {
    title: 'Sécurité Alimentaire & HACCP',
    description: 'La garantie d\'une hygiène irréprochable. Ce module digitalise l\'ensemble des registres obligatoires et automatise les relevés sanitaires pour une sérénité totale face aux contrôles.',
    icon: ClipboardCheck,
    color: '#C5A059',
    details: [
        { label: 'IoT Température', content: 'Relevés automatiques 24h/24 des enceintes froides avec alertes immédiates en cas de rupture de la chaîne du froid.' },
        { label: 'Traçabilité Photo', content: 'Numérisation instantanée des étiquettes sanitaires et numéros de lots lors de la réception des marchandises.' },
        { label: 'Plan de Nettoyage (PMS)', content: 'Checklists interactives des protocoles d\'hygiène par station avec validation par signature électronique du responsable.' },
        { label: 'Registre des Huiles', content: 'Suivi des changements d\'huile de friture et contrôles des composés polaires avec archivage des résultats.' },
        { label: 'Dossier d\'Inspection', content: 'Génération en un clic du dossier sanitaire complet prêt pour une présentation aux services vétérinaires (DDPP).' },
        { label: 'Check réception', content: 'Protocole de vérification des températures et de l\'état des colis à l\'arrivée du camion fournisseur.' }
    ],
    fullTutorial: [
        {
            title: "Relevés & Checklists Quotidiennes",
            icon: "🌡️",
            content: "Assurez une traçabilité irréprochable avec des protocoles automatisés.",
            points: [
                "Voir les températures → [PATH:/haccp] Onglet 'Capteurs' → Graphique temps réel par enceinte → Cliquez pour l'historique.",
                "Fréquence de contrôle → Définissez l'intervalle (ex: toutes les 4h) dans les paramètres avancés.",
                "Alerte de dépassement → Configurez les délais d'alerte (Délai Alerte vs Délai Critique) pour une réactivité maximale."
            ]
        },
        {
            title: "Audits & Export Réglementaire",
            icon: "🛡️",
            content: "Préparez vos inspections avec des données certifiées.",
            points: [
                "Générer le dossier DDPP → Menu 'Rapports' → 'Dossier Sanitaire' → Sélectionnez la période → Télécharger.",
                "Intégration Capteurs → Activez la synchronisation IoT pour des relevés immuables sans intervention humaine.",
                "Plan de Conservation → Définissez les seuils de rétention des logs (par défaut 90 jours) pour la conformité légale."
            ]
        }
    ]
};
