/**
 * HaccpLabelThermalPrintService.ts
 * 
 * Moteur d'impression thermique d'étiquettes de traçabilité HACCP et calcul de DLC secondaire.
 * Conforme à la réglementation CE 852/2004 et décret INCO 1169/2011.
 */

export type HaccpProductType =
  | 'minced_meat'          // Viande hachée crue (J+1 / 24h)
  | 'fresh_fish_seafood'   // Poissons & crustacés frais (J+2 / 48h)
  | 'cooked_preparation'   // Plats cuisinés, sauces, fonds (J+3 / 72h)
  | 'vacuum_packed'        // Préparations sous vide pasteurisées (J+5 / 120h)
  | 'pastry_cream'         // Crèmes pâtissières, ovo-produits (J+1 / 24h)
  | 'dairy_cheese'         // Fromages déconditionnés, crèmes (J+5 / 120h)
  | 'vegetable_prepared'   // Légumes lavés / épluchés / coupés (J+2 / 48h)
  | 'thawed_product'       // Produit décongelé (J+2 / 48h max, interdiction recongélation)
  | 'custom';              // Personnalisé

export type IncoAllergen =
  | 'gluten'
  | 'crustaceans'
  | 'eggs'
  | 'fish'
  | 'peanuts'
  | 'soybeans'
  | 'milk'
  | 'nuts'
  | 'celery'
  | 'mustard'
  | 'sesame'
  | 'sulphites'
  | 'lupin'
  | 'molluscs';

export interface HaccpLabelInput {
  tenantId: string;
  productName: string;
  productType: HaccpProductType;
  openedAtUtc: number;          // Date/Heure d'ouverture ou préparation en ms UTC
  openedByOperator: string;     // Ex: "Chef Thomas"
  originalBatchNumber: string;  // N° lot matière première fournisseur
  customShelfLifeHours?: number;// Si productType === 'custom'
  storageLocation: string;      // Ex: "Chambre Froide Positive 1 (+3°C)"
  allergens?: IncoAllergen[];
  storageTempMaxCelsius?: number; // Ex: 3.0
  notes?: string;
}

export interface HaccpLabelOutput {
  id: string;
  tenantId: string;
  productName: string;
  productType: HaccpProductType;
  openedAtUtc: number;
  secondaryDlcUtc: number;      // Date Limite de Consommation Secondaire calculée
  shelfLifeHours: number;
  openedByOperator: string;
  originalBatchNumber: string;
  storageLocation: string;
  storageTempMaxCelsius: number;
  allergens: IncoAllergen[];
  qrCodeData: string;           // Payload scellé pour scan DDPP
  tsplCommand: string;          // Commande TSPL pour imprimante thermique 58mm/80mm
  zplCommand: string;           // Commande ZPL pour imprimantes Zebra
  isExpired: boolean;
}

export class HaccpLabelThermalPrintService {
  /**
   * Calcule la durée légale de conservation secondaire en heures selon le type d'aliment.
   */
  public static resolveSecondaryShelfLifeHours(
    productType: HaccpProductType,
    customHours?: number
  ): number {
    switch (productType) {
      case 'minced_meat':
      case 'pastry_cream':
        return 24; // J+1
      case 'fresh_fish_seafood':
      case 'vegetable_prepared':
      case 'thawed_product':
        return 48; // J+2
      case 'cooked_preparation':
        return 72; // J+3 (Standard DDPP)
      case 'vacuum_packed':
      case 'dairy_cheese':
        return 120; // J+5
      case 'custom':
        return customHours && customHours > 0 ? customHours : 72;
      default:
        return 72;
    }
  }

  /**
   * Génère l'étiquette complète avec calcul de DLC secondaire, charge QR code et commandes thermiques.
   */
  public static generateLabel(input: HaccpLabelInput, nowUtc?: number): HaccpLabelOutput {
    const now = nowUtc ?? Date.now();
    const openedAt = input.openedAtUtc > 0 ? input.openedAtUtc : now;
    const shelfLifeHours = this.resolveSecondaryShelfLifeHours(
      input.productType,
      input.customShelfLifeHours
    );

    const secondaryDlcUtc = openedAt + shelfLifeHours * 3600 * 1000;
    const isExpired = now > secondaryDlcUtc;

    const openedDateStr = new Date(openedAt).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const dlcDateStr = new Date(secondaryDlcUtc).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const allergens = input.allergens ?? [];
    const storageTemp = input.storageTempMaxCelsius ?? 3.0;

    const id = `haccp_${openedAt}_${Math.random().toString(36).slice(2, 7)}`;
    const qrPayload = JSON.stringify({
      id,
      tenantId: input.tenantId,
      p: input.productName,
      lot: input.originalBatchNumber,
      op: input.openedByOperator,
      open: openedAt,
      dlc: secondaryDlcUtc,
      tMax: storageTemp,
      alg: allergens,
    });

    const qrCodeData = `resto-haccp://${Buffer.from(qrPayload).toString('base64')}`;

    // Commande TSPL pour imprimante thermique 60x40mm
    const tsplCommand = [
      'SIZE 60 mm, 40 mm',
      'GAP 2 mm, 0 mm',
      'DIRECTION 1',
      'CLS',
      `TEXT 20,20,"3",0,1,1,"${input.productName.toUpperCase()}"`,
      `TEXT 20,60,"2",0,1,1,"OUVERT LE : ${openedDateStr}"`,
      `TEXT 20,95,"3",0,1,1,"DLC : ${dlcDateStr}"`,
      `TEXT 20,140,"2",0,1,1,"LOT : ${input.originalBatchNumber} | OP : ${input.openedByOperator}"`,
      `TEXT 20,175,"1",0,1,1,"TEMP MAX : +${storageTemp}C | ALLERG : ${allergens.join(', ') || 'AUCUN'}"`,
      `QRCODE 360,30,L,4,A,0,"${qrCodeData}"`,
      'PRINT 1,1',
    ].join('\n');

    // Commande ZPL standard Zebra
    const zplCommand = [
      '^XA',
      '^PW480',
      '^LL320',
      `^FO20,20^A0N,30,30^FD${input.productName.toUpperCase()}^FS`,
      `^FO20,60^A0N,22,22^FDOUVERT LE: ${openedDateStr}^FS`,
      `^FO20,95^A0N,32,32^FDDLC: ${dlcDateStr}^FS`,
      `^FO20,140^A0N,20,20^FDLOT: ${input.originalBatchNumber} / OP: ${input.openedByOperator}^FS`,
      `^FO20,175^A0N,18,18^FDTEMP MAX: +${storageTemp}C | ALLERG: ${allergens.join(',') || 'AUCUN'}^FS`,
      `^FO340,30^BQN,2,4^FDQA,${qrCodeData}^FS`,
      '^XZ',
    ].join('\n');

    return {
      id,
      tenantId: input.tenantId,
      productName: input.productName,
      productType: input.productType,
      openedAtUtc: openedAt,
      secondaryDlcUtc,
      shelfLifeHours,
      openedByOperator: input.openedByOperator,
      originalBatchNumber: input.originalBatchNumber,
      storageLocation: input.storageLocation,
      storageTempMaxCelsius: storageTemp,
      allergens,
      qrCodeData,
      tsplCommand,
      zplCommand,
      isExpired,
    };
  }
}
