/**
 * KDSAudioHardwareService.ts
 * 
 * Moteur Audio & Hardware pour KDS Cuisine & Bar (Bips différenciés par station et raccourcis clavier/pédale).
 * Invariants :
 * - Zéro dépendance audio externe (synthèse pure Web Audio API oscillator).
 * - Résilience SSR / tests (garde typeof window).
 */

import { KitchenStation } from '../contracts/kds-constants';

export type KDSChimeType = KitchenStation | 'suite_fire' | 'urgent_rush' | 'bump_success';

export interface KDSKeyboardShortcutConfig {
  key: string;
  action: 'BUMP_TICKET' | 'NEXT_TICKET' | 'PREV_TICKET' | 'FIRE_NEXT_COURSE' | 'TOGGLE_RECALL' | 'CYCLE_STATION';
  description: string;
  pedalMapping?: string;
}

export class KDSAudioHardwareService {
  private static audioCtx: AudioContext | null = null;

  /**
   * Initialise ou récupère le contexte audio du navigateur.
   */
  private static getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx && AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Joue un carillon ou bip sonore distinct selon le type de station ou d'événement.
   */
  public static playChime(chimeType: KDSChimeType): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      switch (chimeType) {
        case 'hot': {
          // Double bip dynamique (880Hz -> 1046Hz)
          this.playTone(ctx, 880, now, 0.12, 'sawtooth', 0.15);
          this.playTone(ctx, 1046.5, now + 0.14, 0.18, 'sine', 0.2);
          break;
        }
        case 'cold': {
          // Carillon doux (587Hz -> 659Hz)
          this.playTone(ctx, 587.33, now, 0.15, 'sine', 0.12);
          this.playTone(ctx, 659.25, now + 0.15, 0.22, 'sine', 0.15);
          break;
        }
        case 'pastry': {
          // Triple note cristalline (1174Hz -> 1318Hz -> 1567Hz)
          this.playTone(ctx, 1174.66, now, 0.08, 'sine', 0.12);
          this.playTone(ctx, 1318.51, now + 0.09, 0.08, 'sine', 0.12);
          this.playTone(ctx, 1567.98, now + 0.18, 0.25, 'triangle', 0.15);
          break;
        }
        case 'bar': {
          // Tintement cloche de comptoir (784Hz) avec décroissance
          this.playTone(ctx, 783.99, now, 0.35, 'triangle', 0.18);
          break;
        }
        case 'suite_fire': {
          // Réclame "Envoyer la suite" — Alerte double pulse (440Hz -> 880Hz x2)
          this.playTone(ctx, 440, now, 0.1, 'square', 0.18);
          this.playTone(ctx, 880, now + 0.12, 0.15, 'square', 0.22);
          this.playTone(ctx, 440, now + 0.3, 0.1, 'square', 0.18);
          this.playTone(ctx, 880, now + 0.42, 0.25, 'square', 0.25);
          break;
        }
        case 'bump_success': {
          // Validation de ticket
          this.playTone(ctx, 523.25, now, 0.08, 'sine', 0.1);
          this.playTone(ctx, 659.25, now + 0.08, 0.12, 'sine', 0.12);
          break;
        }
        default: {
          this.playTone(ctx, 600, now, 0.15, 'sine', 0.1);
          break;
        }
      }
    } catch {
      // Ignorer silencieusement si bloqué par l'autoplay policy du navigateur
    }
  }

  private static playTone(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.15
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /**
   * Cartographie officielle des raccourcis clavier & pédales physiques pour la cuisine.
   */
  public static getKeyboardShortcuts(): KDSKeyboardShortcutConfig[] {
    return [
      { key: 'Space', action: 'BUMP_TICKET', description: 'Valider le ticket sélectionné', pedalMapping: 'Pédale 1' },
      { key: 'Enter', action: 'BUMP_TICKET', description: 'Valider le ticket sélectionné' },
      { key: 'ArrowRight', action: 'NEXT_TICKET', description: 'Ticket suivant', pedalMapping: 'Pédale 2' },
      { key: 'ArrowLeft', action: 'PREV_TICKET', description: 'Ticket précédent', pedalMapping: 'Pédale 3' },
      { key: 'KeyF', action: 'FIRE_NEXT_COURSE', description: 'Envoyer la suite (Fire Next Course)' },
      { key: 'KeyR', action: 'TOGGLE_RECALL', description: 'Ouvrir / Fermer le mode rappel' },
      { key: 'KeyS', action: 'CYCLE_STATION', description: 'Changer de poste de cuisson' },
    ];
  }

  /**
   * Résout l'action KDS correspondant à un événement clavier ou signal pédale USB.
   */
  public static resolveKeyEvent(code: string): KDSKeyboardShortcutConfig['action'] | null {
    const shortcuts = this.getKeyboardShortcuts();
    const match = shortcuts.find((s) => s.key === code);
    return match ? match.action : null;
  }
}
