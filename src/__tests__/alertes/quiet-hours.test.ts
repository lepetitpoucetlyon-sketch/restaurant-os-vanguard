import { describe, it, expect } from 'vitest';
import { evaluatePush, isWithinQuietWindow } from '@/kernel/alerts/QuietHoursPolicy';

/** Construit une Date locale à l'heure voulue (le jour importe peu). */
function at(hh: number, mm = 0): Date {
  const d = new Date(2026, 8, 3, hh, mm, 0, 0);
  return d;
}

describe('QuietHoursPolicy — heures calmes & gating par sévérité (N8)', () => {
  describe('isWithinQuietWindow', () => {
    it('fenêtre de nuit 22:00→08:00 : 23:00 dedans, 07:00 dedans, 12:00 dehors', () => {
      expect(isWithinQuietWindow(at(23), '22:00', '08:00')).toBe(true);
      expect(isWithinQuietWindow(at(7), '22:00', '08:00')).toBe(true);
      expect(isWithinQuietWindow(at(12), '22:00', '08:00')).toBe(false);
    });

    it('borne de fin exclusive : 08:00 pile est HORS de la fenêtre', () => {
      expect(isWithinQuietWindow(at(8, 0), '22:00', '08:00')).toBe(false);
    });

    it('fenêtre de jour 01:00→06:00 : 03:00 dedans, 23:00 dehors', () => {
      expect(isWithinQuietWindow(at(3), '01:00', '06:00')).toBe(true);
      expect(isWithinQuietWindow(at(23), '01:00', '06:00')).toBe(false);
    });

    it('config invalide/vide → jamais en heures calmes', () => {
      expect(isWithinQuietWindow(at(3), undefined, undefined)).toBe(false);
      expect(isWithinQuietWindow(at(3), '99:99', '08:00')).toBe(false);
      expect(isWithinQuietWindow(at(3), '22:00', '22:00')).toBe(false);
    });
  });

  describe('evaluatePush', () => {
    it('CRITIQUE traverse toujours — même en mode silencieux permanent', () => {
      expect(evaluatePush('CRITICAL', { doNotDisturb: true }, at(3))).toBe('DELIVER');
      expect(evaluatePush('CRITICAL', { dndStartTime: '22:00', dndEndTime: '08:00' }, at(3))).toBe('DELIVER');
    });

    it('HAUTE + mode silencieux permanent → différée', () => {
      expect(evaluatePush('HIGH', { doNotDisturb: true }, at(12))).toBe('SUPPRESS_QUIET_HOURS');
    });

    it('HAUTE dans la fenêtre de nuit → différée ; hors fenêtre → livrée', () => {
      const cfg = { dndStartTime: '22:00', dndEndTime: '08:00' };
      expect(evaluatePush('HIGH', cfg, at(23))).toBe('SUPPRESS_QUIET_HOURS');
      expect(evaluatePush('HIGH', cfg, at(14))).toBe('DELIVER');
    });

    it('HAUTE sans config → livrée (on ne bâillonne pas par défaut)', () => {
      expect(evaluatePush('HIGH', null, at(3))).toBe('DELIVER');
      expect(evaluatePush('HIGH', {}, at(3))).toBe('DELIVER');
    });
  });
});
