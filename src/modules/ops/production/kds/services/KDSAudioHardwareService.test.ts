import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KDSAudioHardwareService } from './KDSAudioHardwareService';

describe('🔊 KDSAudioHardwareService — Audio & Hardware KDS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait cartographier et résoudre correctement les raccourcis clavier KDS', () => {
    const shortcuts = KDSAudioHardwareService.getKeyboardShortcuts();
    expect(shortcuts.length).toBeGreaterThanOrEqual(6);

    expect(KDSAudioHardwareService.resolveKeyEvent('Space')).toBe('BUMP_TICKET');
    expect(KDSAudioHardwareService.resolveKeyEvent('Enter')).toBe('BUMP_TICKET');
    expect(KDSAudioHardwareService.resolveKeyEvent('ArrowRight')).toBe('NEXT_TICKET');
    expect(KDSAudioHardwareService.resolveKeyEvent('ArrowLeft')).toBe('PREV_TICKET');
    expect(KDSAudioHardwareService.resolveKeyEvent('KeyF')).toBe('FIRE_NEXT_COURSE');
    expect(KDSAudioHardwareService.resolveKeyEvent('KeyR')).toBe('TOGGLE_RECALL');
    expect(KDSAudioHardwareService.resolveKeyEvent('KeyS')).toBe('CYCLE_STATION');
    expect(KDSAudioHardwareService.resolveKeyEvent('KeyX')).toBeNull();
  });

  it('devrait jouer les différents carillons sans planter même si Web Audio API est mocké ou absent', () => {
    // Teste la résilience face à l'environnement d'exécution
    expect(() => KDSAudioHardwareService.playChime('hot')).not.toThrow();
    expect(() => KDSAudioHardwareService.playChime('cold')).not.toThrow();
    expect(() => KDSAudioHardwareService.playChime('pastry')).not.toThrow();
    expect(() => KDSAudioHardwareService.playChime('bar')).not.toThrow();
    expect(() => KDSAudioHardwareService.playChime('suite_fire')).not.toThrow();
    expect(() => KDSAudioHardwareService.playChime('bump_success')).not.toThrow();
    expect(() => KDSAudioHardwareService.playChime('pass' as never)).not.toThrow();
  });
});
