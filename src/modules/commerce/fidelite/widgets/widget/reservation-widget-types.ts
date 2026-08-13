import type { Transition } from 'framer-motion';

export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface TimeSlot {
  time: string;
  available: boolean;
  tableId: string;
}

export interface FormData {
  date: string;
  covers: number;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
}

export interface CardImprintConfig {
  enabled: boolean;
  condition: string;
  groupMin: number;
  penaltyAmount: number;
  cancelHours: number;
}

export function imprintRequired(cfg: CardImprintConfig | undefined, covers: number): boolean {
  if (!cfg?.enabled) return false;
  if (cfg.condition === 'always') return true;
  if (cfg.condition === 'group' && covers >= cfg.groupMin) return true;
  return false;
}

export function buildICSLink(form: FormData, merchantName: string): string {
  if (!form.date || !form.time) return '#';
  const [year, month, day] = form.date.split('-').map(Number);
  const [hour, minute]     = form.time.split(':').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  const dtStart = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
  const endMs   = new Date(year, month - 1, day, hour, minute).getTime() + 90 * 60 * 1000;
  const e       = new Date(endMs);
  const dtEnd   = `${e.getFullYear()}${pad(e.getMonth() + 1)}${pad(e.getDate())}T${pad(e.getHours())}${pad(e.getMinutes())}00`;
  const uid = `${form.date}T${form.time.replace(':', '')}@restaurant-os`;
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Restaurant OS//Reservation//FR',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:${uid}`, `DTSTART:${dtStart}`, `DTEND:${dtEnd}`,
    `SUMMARY:Reservation chez ${merchantName}`,
    `DESCRIPTION:${form.covers} personne${form.covers > 1 ? 's' : ''}\\n${form.firstName} ${form.lastName}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

export const slideVariants = {
  enter:  (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (direction: number) => ({ x: direction < 0 ? 60 : -60, opacity: 0 }),
};

export const slideTransition: Transition = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};
