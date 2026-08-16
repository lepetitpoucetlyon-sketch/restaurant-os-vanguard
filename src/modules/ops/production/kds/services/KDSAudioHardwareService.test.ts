import { describe, it, expect } from 'vitest';
import { KDSAudioHardwareService } from './KDSAudioHardwareService';

describe('KDSAudioHardwareService', () => {
  it('resolves keyboard shortcuts and foot pedal bindings accurately', () => {
    expect(KDSAudioHardwareService.resolveKeyEvent('Space')).toBe('BUMP_TICKET');
    expect(KDSAudioHardwareService.resolveKeyEvent('Enter')).toBe('BUMP_TICKET');
    expect(KDSAudioHardwareService.resolveKeyEvent('ArrowRight')).toBe('NEXT_TICKET');
    expect(KDSAudioHardwareService.resolveKeyEvent('ArrowLeft')).toBe('PREV_TICKET');
    expect(KDSAudioHardwareService.resolveKeyEvent('KeyF')).toBe('FIRE_NEXT_COURSE');
    expect(KDSAudioHardwareService.resolveKeyEvent('KeyR')).toBe('TOGGLE_RECALL');
    expect(KDSAudioHardwareService.resolveKeyEvent('KeyS')).toBe('CYCLE_STATION');
    expect(KDSAudioHardwareService.resolveKeyEvent('KeyZ')).toBeNull();
  });

  it('exposes full keyboard shortcut mappings with pedal annotations', () => {
    const list = KDSAudioHardwareService.getKeyboardShortcuts();
    expect(list.length).toBeGreaterThanOrEqual(6);

    const spaceShortcut = list.find((s) => s.key === 'Space');
    expect(spaceShortcut?.pedalMapping).toBe('Pédale 1');
  });

  it('executes playChime safely without throwing in headless SSR environment', () => {
    expect(() => {
      KDSAudioHardwareService.playChime('hot');
      KDSAudioHardwareService.playChime('cold');
      KDSAudioHardwareService.playChime('pastry');
      KDSAudioHardwareService.playChime('bar');
      KDSAudioHardwareService.playChime('suite_fire');
    }).not.toThrow();
  });
});
