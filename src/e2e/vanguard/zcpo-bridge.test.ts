import { describe, it, expect } from 'vitest';
import { degradeImportanceMap, type ZcpoState } from '@/lib/icm/zcpoBridge';
import { TASK_MAPS } from '@/lib/icm/TaskContext';

const state = (p: ZcpoState['memoryPressure']): ZcpoState => ({
  isVetoActive: false,
  idleSeconds: 0,
  memoryPressure: p,
});

describe('🧠 ICM × ZCPO bridge — degradeImportanceMap', () => {
  it('normal pressure → map inchangée', () => {
    const map = TASK_MAPS.pos.importance;
    expect(degradeImportanceMap(map, state('normal'))).toEqual(map);
  });

  it('état null (ZCPO absent) → map inchangée', () => {
    const map = TASK_MAPS.pos.importance;
    expect(degradeImportanceMap(map, null)).toEqual(map);
  });

  it('warning → LAZY devient OFF, HIGH/MEDIUM intacts', () => {
    const map = TASK_MAPS.pos.importance; // stocks/recipes = LAZY
    const out = degradeImportanceMap(map, state('warning'));
    expect(out.stocks).toBe('OFF');
    expect(out.recipes).toBe('OFF');
    expect(out.orders).toBe('HIGH');
    expect(out.products).toBe('HIGH');
  });

  it('critical → LAZY→OFF et MEDIUM→LAZY, seul HIGH survit', () => {
    const map = TASK_MAPS.kds.importance; // orders HIGH, tables MEDIUM, recipes MEDIUM
    const out = degradeImportanceMap(map, state('critical'));
    expect(out.orders).toBe('HIGH');
    expect(out.tables).toBe('LAZY');
    expect(out.recipes).toBe('LAZY');
  });

  it('ne mute pas la map d\'origine', () => {
    const map = TASK_MAPS.pos.importance;
    const snapshot = { ...map };
    degradeImportanceMap(map, state('critical'));
    expect(map).toEqual(snapshot);
  });
});
