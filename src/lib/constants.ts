// Shared constants and labels across the application
// This file centralizes commonly used constants to avoid duplication

import type { UserRole } from '@/types';

export const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Administrateur',
    manager: 'Directeur',
    floor_manager: 'Maître d\'Hôtel',
    server: 'Serveur',
    bartender: 'Barman',
    kitchen_chef: 'Chef de Cuisine',
    kitchen_line: 'Commis de Cuisine',
    host: 'Hôte d\'Accueil',
    cashier: 'Caissier',
    'kds-view': 'Vision KDS',
    'pos-standard': 'Point de Vente',
    'guest-view': 'Vue Client',
    kitchen: 'Brigade Cuisine'
};

export const ROLE_COLORS: Record<UserRole, string> = {
    admin: '#EF4444',
    manager: '#3B82F6',
    floor_manager: '#8B5CF6',
    server: '#10B981',
    bartender: '#F59E0B',
    kitchen_chef: '#EC4899',
    kitchen_line: '#06B6D4',
    host: '#6366F1',
    cashier: '#84CC16',
    'kds-view': '#94A3B8',
    'pos-standard': '#475569',
    'guest-view': '#CBD5E1',
    kitchen: '#F43F5E'
};

// Common status labels
export const ORDER_STATUS_LABELS = {
    pending: 'En attente',
    preparing: 'En préparation',
    ready: 'Prêt',
    served: 'Servi',
    cancelled: 'Annulé',
} as const;

// Table status
export const TABLE_STATUS_LABELS = {
    available: 'Disponible',
    busy: 'En Service',
    reserved: 'Réservée',
    cleaning: 'Nettoyage',
} as const;

// Time formatters
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
};

export const formatDate = (date: Date | string): string => {
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(date));
};

export const formatTime = (date: Date | string): string => {
    return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
};
