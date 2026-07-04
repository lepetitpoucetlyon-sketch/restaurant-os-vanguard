import { Users, Calendar, BarChart3, Star } from "lucide-react";

export const MOCK_STATS = [
    { label: "Total Groupes", value: "156", icon: Users, change: 12 },
    { label: "Réservations", value: "48", icon: Calendar, change: 8 },
    { label: "CA Prévisionnel", value: "42.5k€", icon: BarChart3, change: 15 },
    { label: "Note Moyenne", value: "4.8", icon: Star, change: 5 }
];

export const MOCK_GROUPS = [
    {
        id: "1",
        name: "Mariage Dupont-Leroi",
        type: "Wedding",
        date: "2026-06-15",
        time: "19:00",
        pax: 85,
        status: "Confirmed",
        contact: "Jean Dupont",
        budget: "12,500€",
        tags: ["Privatisation", "Menu Prestige", "Végétarien"]
    },
    {
        id: "2",
        name: "Séminaire Tech Corp",
        type: "Corporate",
        date: "2026-05-20",
        time: "09:00",
        pax: 45,
        status: "Pending",
        contact: "Sophie Martin",
        budget: "4,800€",
        tags: ["Projecteur", "Petit-déjeuner", "Buffet"]
    },
    {
        id: "3",
        name: "Anniversaire 50 ans",
        type: "Party",
        date: "2026-04-30",
        time: "20:30",
        pax: 30,
        status: "Confirmed",
        contact: "Robert Bernard",
        budget: "3,200€",
        tags: ["Gâteau", "Musique", "Cocktails"]
    },
    {
        id: "4",
        name: "Dîner Gala Rotary",
        type: "Association",
        date: "2026-07-05",
        time: "20:00",
        pax: 120,
        status: "Inquiry",
        contact: "Michel Petit",
        budget: "15,600€",
        tags: ["Discours", "Vin d'honneur"]
    }
];

export const GROUP_TYPES = ["Tous", "Corporate", "Wedding", "Party", "Association", "Other"];
export const STATUS_TYPES = ["Tous", "Confirmed", "Pending", "Inquiry", "Cancelled"];
export const ACCENT = "#A855F7"; // Purple accent for Groups
export const BG_GRADIENTS = {
    purple: "from-action-primary/5 to-transparent",
    blue: "from-action-primary/5 to-transparent",
    amber: "from-status-warning/5 to-transparent"
};
