/**
 * Safely coerce a domain object into SovereignData for Forge mutations.
 * This helper isolates the runtime boundary cast in a single location,
 * making it auditable and replaceable when the Forge generics evolve.
 */
import type { SovereignData } from '@/shared/nexus-contract';

export function toSovereignData<T extends Record<string, unknown>>(obj: T): SovereignData {
    return obj as unknown as SovereignData;
}
