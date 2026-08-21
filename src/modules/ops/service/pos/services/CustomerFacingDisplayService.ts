export type DisplayState = 'idle' | 'scanning' | 'payment_pending' | 'thank_you';

export interface DisplayCartItem {
  name: string;
  quantity: number;
  priceInMicrounits: number;
  totalInMicrounits: number;
}

export interface CustomerFacingDisplayPayload {
  terminalId: string;
  state: DisplayState;
  welcomeMessage?: string;
  items?: DisplayCartItem[];
  totalInMicrounits?: number;
  paidInMicrounits?: number;
  changeDueInMicrounits?: number;
  paymentQrUrl?: string;
}

/**
 * CustomerFacingDisplayService — Angle mort I3.
 * Gère le flux d'affichage temps réel sur l'écran client (Customer-Facing Display 2x20 VFD ou tablette secondaire).
 */
export class CustomerFacingDisplayService {
  /**
   * Formate le payload pour un écran VFD 2 lignes × 20 colonnes.
   */
  static formatVfdLines(payload: CustomerFacingDisplayPayload): { line1: string; line2: string } {
    if (payload.state === 'idle') {
      return {
        line1: (payload.welcomeMessage || 'BIENVENUE').padEnd(20, ' ').substring(0, 20),
        line2: 'RESTAURANT OS'.padStart(20, ' ').substring(0, 20),
      };
    }

    if (payload.state === 'scanning' && payload.items && payload.items.length > 0) {
      const lastItem = payload.items[payload.items.length - 1];
      const priceEuros = (lastItem.priceInMicrounits / 1_000_000).toFixed(2) + 'E';
      const name = lastItem.name.substring(0, 20 - priceEuros.length - 1);
      const totalEuros = ((payload.totalInMicrounits || 0) / 1_000_000).toFixed(2) + 'E';

      return {
        line1: `${name} ${priceEuros}`.padEnd(20, ' ').substring(0, 20),
        line2: `TOTAL: ${totalEuros}`.padStart(20, ' ').substring(0, 20),
      };
    }

    if (payload.state === 'thank_you') {
      const changeEuros = ((payload.changeDueInMicrounits || 0) / 1_000_000).toFixed(2) + 'E';
      return {
        line1: 'MERCI DE VOTRE VISITE'.substring(0, 20),
        line2: `RENDU: ${changeEuros}`.padStart(20, ' ').substring(0, 20),
      };
    }

    return {
      line1: 'EN ATTENTE PAIEMENT '.substring(0, 20),
      line2: `TOTAL: ${((payload.totalInMicrounits || 0) / 1_000_000).toFixed(2)}E`.padStart(20, ' ').substring(0, 20),
    };
  }
}
