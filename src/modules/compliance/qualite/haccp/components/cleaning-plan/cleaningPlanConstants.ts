import {
    ChefHat,
    Refrigerator,
    UtensilsCrossed,
    ShowerHead,
    Wine,
} from 'lucide-react';
import { buildTenantPath } from '@/lib/nexus/utils/tenantPath';

export interface CleaningRecord {
    id: string;
    zone: string;
    date: string; // ISO date string YYYY-MM-DD
    taskKey: string;
    completedAt: number; // timestamp ms
    signedByPin: string; // SHA-256 hex of PIN
    signedByName: string;
}

export interface PinDialogState {
    zone: string;
    dayIdx: number;
    taskKey: string;
    taskLabel: string;
}

export const ZONES = [
    { id: 'cuisine', label: 'Cuisine', icon: ChefHat, tasks: ['Désinfecter les plans de travail', 'Nettoyer les équipements de cuisson', 'Laver les sols'] },
    { id: 'stockage_froid', label: 'Stockage froid', icon: Refrigerator, tasks: ['Contrôler les T° chambres froides', 'Nettoyer les joints de portes', 'Ranger selon FIFO'] },
    { id: 'salle', label: 'Salle', icon: UtensilsCrossed, tasks: ['Nettoyer les tables', 'Aspirer/laver le sol', 'Désinfecter les menus & supports'] },
    { id: 'sanitaires', label: 'Sanitaires', icon: ShowerHead, tasks: ['Nettoyer WC & lavabos', 'Réapprovisionner consommables', 'Désinfecter les poignées'] },
    { id: 'bar', label: 'Bar', icon: Wine, tasks: ['Nettoyer la machine à café', 'Désinfecter le plan de bar', 'Vidanger les bacs de rinçage'] },
] as const;

export const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export async function hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + '_haccp_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getWeekDates(): string[] {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toISOString().split('T')[0];
    });
}

export function taskKey(zone: string, dayIdx: number, task: string): string {
    return `${zone}__${dayIdx}__${task.slice(0, 20).replace(/\s/g, '_')}`;
}

export function buildRecordPath(tenantId: string, id: string): string {
    return buildTenantPath(tenantId, 'cleaningRecords', id);
}

export function buildQueryPath(tenantId: string): string {
    return buildTenantPath(tenantId, 'cleaningRecords');
}
