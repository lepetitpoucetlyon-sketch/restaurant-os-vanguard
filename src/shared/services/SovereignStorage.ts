import { ZodSchema } from 'zod';
import { atom, WritableAtom } from 'jotai';
import { tenantScopedKey } from '@/infrastructure/services/storage/tenantScopedKey';

/** Keys that identify the tenant itself — MUST stay unscoped to bootstrap. */
const UNSCOPED_KEYS = new Set(['nexus_tenant_id']);

// ── Types du service ───────────────────────────────────────────────────────
interface StorageReadResult<T> {
  success:  boolean;
  data:     T;
  wasCorrupted: boolean;
  error?:   string;
}

interface StorageWriteResult {
  success: boolean;
  error?:  string;
}

type CorruptionLog = {
  key:       string;
  timestamp: number;
  rawValue:  string;
  zodError:  string;
};

/**
 * 🏛️ SOVEREIGN STORAGE - Grade X Shield
 * Protects localStorage with Zod validation and automatic corruption recovery.
 */
class SovereignStorageService {
  private readonly prefix = 'sovereign:';
  private corruptionLog: CorruptionLog[] = [];

  /** Resolve the physical storage key: `sovereign:t:{tenant}:{key}` unless bootstrap key. */
  private physicalKey(key: string): string {
    if (UNSCOPED_KEYS.has(key)) return this.prefix + key;
    return this.prefix + tenantScopedKey(key);
  }

  // ── LECTURE SOUVERAINE ─────────────────────────────────────────────────
  get<T>(
    key: string,
    schema: ZodSchema<T>,
    defaultValue: T
  ): StorageReadResult<T> {
    const prefixedKey = this.physicalKey(key);

    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(prefixedKey) : null;

      if (raw === null) {
        return { success: true, data: defaultValue, wasCorrupted: false };
      }

      const parsed = JSON.parse(raw);
      const result = schema.safeParse(parsed);

      if (result.success) {
        return { success: true, data: result.data, wasCorrupted: false };
      }

      // Donnée corrompue → purge + log + valeur par défaut saine
      this.purge(key);
      this.logCorruption(key, raw, result.error.message);

      return {
        success:      false,
        data:         defaultValue,
        wasCorrupted: true,
        error:        result.error.message,
      };

    } catch (_parseError) {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(prefixedKey) ?? '' : '';
      this.purge(key);
      this.logCorruption(key, raw, 'JSON.parse failed');

      return {
        success:      false,
        data:         defaultValue,
        wasCorrupted: true,
        error:        'Donnée non-JSON purgée',
      };
    }
  }

  // ── ÉCRITURE SOUVERAINE ────────────────────────────────────────────────
  set<T>(
    key: string,
    value: T,
    schema: ZodSchema<T>
  ): StorageWriteResult {
    const result = schema.safeParse(value);

    if (!result.success) {
      return {
        success: false,
        error:   `Écriture refusée — donnée invalide : ${result.error.message}`,
      };
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          this.physicalKey(key),
          JSON.stringify(result.data)
        );
      }
      return { success: true };
    } catch (e) {
      return {
        success: false,
        error:   `localStorage.setItem a échoué : ${String(e)}`,
      };
    }
  }

  purge(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.physicalKey(key));
    }
  }

  purgeAll(): void {
    if (typeof window !== 'undefined') {
      const sovereignKeys = Object.keys(localStorage)
        .filter(k => k.startsWith(this.prefix));
      sovereignKeys.forEach(k => localStorage.removeItem(k));
    }
  }

  clearAppStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  }

  has(key: string): boolean {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(this.physicalKey(key)) !== null;
    }
    return false;
  }

  getCorruptionReport(): CorruptionLog[] {
    return [...this.corruptionLog];
  }

  private logCorruption(key: string, rawValue: string, zodError: string): void {
    this.corruptionLog.push({
      key,
      timestamp: Date.now(),
      rawValue:  rawValue.slice(0, 200),
      zodError,
    });

    console.warn(`[SovereignStorage] Corruption détectée — clé: ${key}`, zodError);
  }

  // ── JOTAI INTEGRATION ──────────────────────────────────────────────────
  atomWithSovereignStorage<T>(key: string, schema: ZodSchema<T>, defaultValue: T): WritableAtom<T, [T | ((prev: T) => T)], void> {
    const initialValue = this.get(key, schema, defaultValue).data;
    const baseAtom = atom<T>(initialValue);
    
    return atom<T, [T | ((prev: T) => T)], void>(
        (get): T => get(baseAtom),
        (get, set, next: T | ((prev: T) => T)) => {
            const nextValue = typeof next === 'function' 
                ? (next as (prev: T) => T)(get(baseAtom)) 
                : next;
            this.set(key, nextValue, schema);
            set(baseAtom, nextValue);
        }
    );
  }
}

export const SovereignStorage = new SovereignStorageService();
