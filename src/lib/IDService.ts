/**
 * 🛰️ IDService - Grade VI Resource Identification
 * Centralized service for generating deterministic or secure identifiers.
 */
export class IDService {
  /**
   * Generates a standard HACCP Quality Control number.
   * Format: QC-YYYYMMDD-XXXX (where XXXX is a short unique suffix)
   */
  static generateQCNumber(): string {
    const now = new Date();
    const datePart = now.getFullYear() + 
                     String(now.getMonth() + 1).padStart(2, '0') + 
                     String(now.getDate()).padStart(2, '0');
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `QC-${datePart}-${suffix}`;
  }

  /**
   * Generates a generic resource ID.
   */
  static generateId(prefix: string = ''): string {
    const main = Math.random().toString(36).substring(2, 11);
    return prefix ? `${prefix}_${main}` : main;
  }
}
