/**
 * QuickRestockQrService.ts
 * 
 * Moteur de réassort rapide par QR Code en chambre froide / économat.
 * Permet au commis/chef de scanner l'étiquette d'un casier pour ajouter instantanément
 * la quantité voulue au panier du bon fournisseur avec contrôle du Franco.
 */

export interface RestockQrPayload {
  version: 1;
  tenantId: string;
  ingredientId: string;
  ingredientName: string;
  storageLocation: string; // Ex: "Chambre Froide Positive - Étagère B3"
  defaultPackagesCount: number; // Quantité de réassort par défaut (ex: 2)
  supplierId: string;
  supplierName: string;
  packagePriceHtCts: number;
}

export interface RestockScanResult {
  isValid: boolean;
  payload?: RestockQrPayload;
  error?: string;
  cartItemToAdd?: {
    ingredientId: string;
    ingredientName: string;
    packagesCount: number;
    supplierId: string;
    supplierName: string;
    packagePriceHtCts: number;
    totalItemHtCts: number;
  };
}

export class QuickRestockQrService {
  /**
   * Encode une charge utile de réassort en chaîne URI scannable par caméra/douchette.
   */
  public static generateQrCodeData(payload: RestockQrPayload): string {
    const json = JSON.stringify(payload);
    // Encodage base64 pour URL sécurisée
    const encoded = typeof btoa !== 'undefined'
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json).toString('base64');

    return `resto-os://restock?d=${encoded}`;
  }

  /**
   * Décode et valide les données issues du scan d'un QR code de casier.
   */
  public static parseRestockScan(
    scannedText: string,
    currentTenantId: string,
    quantityOverride?: number
  ): RestockScanResult {
    try {
      if (!scannedText.startsWith('resto-os://restock?d=')) {
        return { isValid: false, error: 'Format QR Code réassort invalide' };
      }

      const rawBase64 = scannedText.replace('resto-os://restock?d=', '');
      const jsonStr = typeof atob !== 'undefined'
        ? decodeURIComponent(escape(atob(rawBase64)))
        : Buffer.from(rawBase64, 'base64').toString('utf8');

      const data = JSON.parse(jsonStr) as RestockQrPayload;

      if (data.version !== 1 || !data.ingredientId || !data.supplierId) {
        return { isValid: false, error: 'Données QR code incomplètes' };
      }

      if (data.tenantId !== currentTenantId) {
        return { isValid: false, error: 'Ce QR code appartient à un autre établissement' };
      }

      const packagesCount = quantityOverride && quantityOverride > 0
        ? quantityOverride
        : data.defaultPackagesCount;

      const totalItemHtCts = packagesCount * data.packagePriceHtCts;

      return {
        isValid: true,
        payload: data,
        cartItemToAdd: {
          ingredientId: data.ingredientId,
          ingredientName: data.ingredientName,
          packagesCount,
          supplierId: data.supplierId,
          supplierName: data.supplierName,
          packagePriceHtCts: data.packagePriceHtCts,
          totalItemHtCts,
        },
      };
    } catch {
      return { isValid: false, error: 'Échec de lecture du QR code' };
    }
  }
}
