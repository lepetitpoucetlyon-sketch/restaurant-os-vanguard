import type { ICMImportanceMap, ICMPriority } from './TaskContext';

/**
 * ICM-lite × ZCPO bridge.
 *
 * ZCPO (the macOS resource orchestrator) writes a live `zcpo_state.json`. When the
 * machine is under memory pressure, we degrade the *static* per-route importance map
 * so non-essential modules stop hydrating — the runtime state of the machine refines
 * the route-based decision.
 */

export interface ZcpoState {
  isVetoActive: boolean;
  idleSeconds: number;
  promptCacheWarmingActive?: boolean;
  memoryPressure: 'normal' | 'warning' | 'critical';
}

const PRESSURE_OK: ZcpoState['memoryPressure'][] = ['normal'];

/**
 * Degrades an importance map according to ZCPO runtime state.
 * Pure function — fully testable, no I/O.
 *
 * - normal   → map unchanged
 * - warning  → LAZY modules become OFF (stop loading deferred modules)
 * - critical → LAZY→OFF and MEDIUM→LAZY (only HIGH survives eagerly)
 */
export function degradeImportanceMap(
  map: ICMImportanceMap,
  state: ZcpoState | null
): ICMImportanceMap {
  if (!state || PRESSURE_OK.includes(state.memoryPressure)) return map;

  const critical = state.memoryPressure === 'critical';

  const degrade = (p: ICMPriority): ICMPriority => {
    if (p === 'LAZY') return 'OFF';
    if (critical && p === 'MEDIUM') return 'LAZY';
    return p;
  };

  const out = {} as ICMImportanceMap;
  (Object.keys(map) as (keyof ICMImportanceMap)[]).forEach((k) => {
    out[k] = degrade(map[k]);
  });
  return out;
}

/**
 * Reads `zcpo_state.json` if present. Server-only — returns null in the browser
 * or when ZCPO is not running. Never throws.
 */
export async function readZcpoState(): Promise<ZcpoState | null> {
  if (typeof window !== 'undefined') return null;
  try {
    const { readFile } = await import('fs/promises');
    const home = process.env.HOME ?? `/Users/${process.env.USER}`;
    const raw = await readFile(
      `${home}/Library/Application Support/ZCPO/zcpo_state.json`,
      'utf-8'
    );
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.memoryPressure === 'string') {
      return parsed as ZcpoState;
    }
    return null;
  } catch {
    return null;
  }
}
