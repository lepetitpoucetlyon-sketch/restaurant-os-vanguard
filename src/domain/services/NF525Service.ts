/**
 * 🏛️ RESTAURANT OS - Compatibility Bridge
 * NF525 Service (Legacy Path)
 * 
 * This file preserves backward compatibility for imports pointing to 
 * @domain/services/NF525Service while the codebase transitions to 
 * the modular @modules/finance/ services.
 */

export * from '@modules/finance';
import { NF525Service } from '@modules/finance';
export { NF525Service };
