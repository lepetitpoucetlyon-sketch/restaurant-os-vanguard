import { makeMccAdapter } from '@/verticals/_shared/adapters';

/** MCC custom = socle universel (health ping + audit fiscal), sans métriques spécifiques. */
export const CustomMccAdapter = makeMccAdapter();
