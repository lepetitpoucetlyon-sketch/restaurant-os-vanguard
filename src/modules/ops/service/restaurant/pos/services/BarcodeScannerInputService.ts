export interface BarcodeParseResult {
  rawBarcode: string;
  symbology: 'EAN13' | 'EAN8' | 'CODE128' | 'QR' | 'UNKNOWN';
  sku: string;
  isVariableWeight: boolean;
  weightGrams?: number;
  priceInMicrounits?: number;
}

/**
 * BarcodeScannerInputService — Angle mort I4.
 * Analyse et extrait les données des douchettes code-barres, y compris les préfixes GS1 / EAN-13 à poids variable (préfixes 20 à 29).
 */
export class BarcodeScannerInputService {
  static parseBarcode(rawInput: string): BarcodeParseResult {
    const trimmed = rawInput.trim();

    // Standard EAN-13
    if (/^\d{13}$/.test(trimmed)) {
      const prefix = trimmed.substring(0, 2);

      // In-store variable weight (prefix 20 to 29)
      // Format: 20 SSSS PPPPC (where SSSS is SKU, PPPP is weight in grams or price in cents)
      if (['20', '21', '22', '23', '24', '25', '26', '27', '28', '29'].includes(prefix)) {
        const sku = trimmed.substring(2, 6);
        const valuePart = parseInt(trimmed.substring(6, 12), 10);
        // Prefix 28/29 typically weight in grams
        return {
          rawBarcode: trimmed,
          symbology: 'EAN13',
          sku: `SKU-${sku}`,
          isVariableWeight: true,
          weightGrams: valuePart,
        };
      }

      return {
        rawBarcode: trimmed,
        symbology: 'EAN13',
        sku: trimmed,
        isVariableWeight: false,
      };
    }

    if (/^\d{8}$/.test(trimmed)) {
      return {
        rawBarcode: trimmed,
        symbology: 'EAN8',
        sku: trimmed,
        isVariableWeight: false,
      };
    }

    return {
      rawBarcode: trimmed,
      symbology: trimmed.startsWith('http') || trimmed.includes('{') ? 'QR' : 'CODE128',
      sku: trimmed,
      isVariableWeight: false,
    };
  }
}
