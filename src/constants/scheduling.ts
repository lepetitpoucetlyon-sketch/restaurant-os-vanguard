import { DayOfWeek } from "@/types";

export const DAYS_CONFIG: { id: DayOfWeek; label: string; shortLabel: string }[] = [
    { id: 'monday', label: 'Lundi', shortLabel: 'Lun' },
    { id: 'tuesday', label: 'Mardi', shortLabel: 'Mar' },
    { id: 'wednesday', label: 'Mercredi', shortLabel: 'Mer' },
    { id: 'thursday', label: 'Jeudi', shortLabel: 'Jeu' },
    { id: 'friday', label: 'Vendredi', shortLabel: 'Ven' },
    { id: 'saturday', label: 'Samedi', shortLabel: 'Sam' },
    { id: 'sunday', label: 'Dimanche', shortLabel: 'Dim' },
];
