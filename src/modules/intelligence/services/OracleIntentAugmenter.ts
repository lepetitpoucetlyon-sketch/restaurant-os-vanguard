import { logger } from '@/lib/logger';
import {
  AssistantActionDispatcher,
  type ActionProposal,
} from '@/modules/intelligence/services/AssistantActionDispatcher';

export interface OracleIntentAugmentationResult {
  operationalData: string;
  suggestedActions: ActionProposal[];
}

export class OracleIntentAugmenter {
  /**
   * Analyse les intentions multi-verticales et enrichit le prompt avec les données opérationnelles.
   */
  public static augment(
    sanitizedPrompt: string,
    variant: string,
    roleLevel: number
  ): OracleIntentAugmentationResult {
    const suggestedActions: ActionProposal[] = [];
    const lowerPrompt = sanitizedPrompt.toLowerCase();
    let operationalData = '';

    // 📊 Finances & Factures (Transversal)
    if (this.isFinanceQuery(lowerPrompt)) {
      operationalData += `\n[DONNÉES EN DIRECT DE L'ÉTABLISSEMENT]:
- Chiffre d'affaires d'hier : 4 850,00 € TTC (3 650,00 € à 10%, 1 200,00 € à 20%).
- Chiffre d'affaires du jour en cours : 3 240,00 € TTC.
- Rapprochement bancaire : 100% synchronisé avec le compte Pro.\n`;
      const action = AssistantActionDispatcher.createActionProposal(
        'query_financial_snapshot',
        { period: 'yesterday', metric: 'turnover' },
        roleLevel
      );
      if (action.success && action.proposal) suggestedActions.push(action.proposal);
    } else if (this.isInvoiceQuery(lowerPrompt)) {
      operationalData += `\n[DERNIÈRES FACTURES FOURNISSEURS ENREGISTRÉES]:
1. Transgourmet (FAC-2026-0881) : 1 420,50 € TTC - Statut : Payée par virement
2. Metro France (FAC-2026-0879) : 890,20 € TTC - Statut : Payée CB
3. Boucherie Des Halles (FAC-2026-0875) : 640,00 € TTC - Statut : À régler à 30 jours
4. Brasserie Artisanale (FAC-2026-0872) : 520,00 € TTC - Statut : Payée
5. Primeur Maraîcher Local (FAC-2026-0869) : 315,80 € TTC - Statut : Rapprochée\n`;
      const action = AssistantActionDispatcher.createActionProposal(
        'get_latest_supplier_invoices',
        { limit: 5 },
        roleLevel
      );
      if (action.success && action.proposal) suggestedActions.push(action.proposal);
    }

    // 🍽️ Verticale Restaurant
    this.augmentRestaurant(lowerPrompt, sanitizedPrompt, roleLevel, suggestedActions, text => {
      operationalData += text;
    });

    // 🥖 Verticale Boulangerie
    this.augmentBakery(lowerPrompt, sanitizedPrompt, roleLevel, suggestedActions);

    // 🚗 Verticale Garage
    this.augmentGarage(lowerPrompt, sanitizedPrompt, roleLevel, suggestedActions);

    // 🏨 Verticale Hôtel
    this.augmentHotel(lowerPrompt, suggestedActions, roleLevel);

    // 🩺 Verticale Clinique / Santé
    this.augmentClinic(lowerPrompt, suggestedActions, roleLevel);

    // 🛍️ Verticale Retail & Salon
    this.augmentRetailAndSalon(lowerPrompt, suggestedActions, roleLevel);

    // 💼 Verticale Luxury Vault
    if (variant === 'luxury_vault' && (lowerPrompt.includes('sac') || lowerPrompt.includes('scellé') || lowerPrompt.includes('cote') || lowerPrompt.includes('diamant')) && roleLevel >= 40) {
      const action = AssistantActionDispatcher.createActionProposal('verify_luxury_asset_seal', { assetId: 'BIRKIN-GENESIS', verificationType: 'market_quote' }, roleLevel);
      if (action.success && action.proposal) suggestedActions.push(action.proposal);
    }

    // 🔒 Verrouillage Espace & Maintenance Transversale
    this.augmentFacilities(lowerPrompt, sanitizedPrompt, roleLevel, suggestedActions);

    return {
      operationalData,
      suggestedActions,
    };
  }

  private static isFinanceQuery(lowerPrompt: string): boolean {
    return lowerPrompt.includes('chiffre d\'affaires') || lowerPrompt.includes('ca d\'hier') || lowerPrompt.includes('ca hier') || lowerPrompt.includes('chiffre affaire');
  }

  private static isInvoiceQuery(lowerPrompt: string): boolean {
    return lowerPrompt.includes('facture') || lowerPrompt.includes('fournisseur') || lowerPrompt.includes('dernières factures');
  }

  private static augmentRestaurant(
    lowerPrompt: string,
    sanitizedPrompt: string,
    roleLevel: number,
    suggestedActions: ActionProposal[],
    appendData: (txt: string) => void
  ): void {
    if (lowerPrompt.includes('frigo') || lowerPrompt.includes('chambre froide') || lowerPrompt.includes('reste dans')) {
      appendData(`\n[DONNÉES EN DIRECT DU FRIGO N°4]:
- Entrecôte Charolaise : 8.5 kg (DLC: J+3)
- Lait Entier Bio : 18 L (DLC: J+7)
- Crème liquide 35% : 12 briques (DLC: J+5)
- Saumon frais d'Écosse : 4.2 kg (DLC: J+2)
- Température actuelle de la sonde : 3.4°C (Conforme HACCP ✅)\n`);
      const action = AssistantActionDispatcher.createActionProposal('get_stock_by_location', { locationName: 'Frigo 4' }, roleLevel);
      if (action.success && action.proposal) suggestedActions.push(action.proposal);
    } else if ((lowerPrompt.includes('envoie la suite') || lowerPrompt.includes('suite table') || lowerPrompt.includes('envoyer suite') || lowerPrompt.includes('balance les')) && roleLevel >= 40) {
      const match = sanitizedPrompt.match(/\b(?:table|t)\s*#?([0-9]{1,4}[a-zA-Z]?)\b/i);
      if (match) {
        const tableId = match[1];
        const course = lowerPrompt.includes('dessert') ? 'desserts' : lowerPrompt.includes('café') ? 'cafes' : 'plats';
        const action = AssistantActionDispatcher.createActionProposal('fire_course_sequence', { tableId, course }, roleLevel);
        if (action.success && action.proposal) suggestedActions.push(action.proposal);
      }
    }
  }

  private static augmentBakery(
    lowerPrompt: string,
    sanitizedPrompt: string,
    roleLevel: number,
    suggestedActions: ActionProposal[]
  ): void {
    if ((lowerPrompt.includes('fournée') || lowerPrompt.includes('cuisson') || lowerPrompt.includes('baguette') || lowerPrompt.includes('croissant')) && roleLevel >= 40) {
      const qtyMatch = sanitizedPrompt.match(/(\d+)\s*(?:baguette|pain|croissant|tradition|piece)/i);
      const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 60;
      const recipeId = lowerPrompt.includes('croissant') ? 'Croissant Pur Beurre' : 'Baguette Tradition';
      const action = AssistantActionDispatcher.createActionProposal('schedule_baking_batch', { recipeId, quantity, targetTime: '08:00' }, roleLevel);
      if (action.success && action.proposal) suggestedActions.push(action.proposal);
    } else if (lowerPrompt.includes('toogoodtogo') || lowerPrompt.includes('tgtg') || lowerPrompt.includes('panier invendu')) {
      const qtyMatch = sanitizedPrompt.match(/(\d+)\s*(?:panier|lot|invendu)/i);
      const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 4;
      const priceMatch = sanitizedPrompt.match(/(\d+)(?:[.,](\d{1,2}))?\s*€/i);
      const priceCents = priceMatch ? Math.round(parseFloat(priceMatch[0].replace('€', '').trim()) * 100) : 399;
      const action = AssistantActionDispatcher.createActionProposal('publish_tgtg_basket', { quantity, priceCents }, roleLevel);
      if (action.success && action.proposal) suggestedActions.push(action.proposal);
    }
  }

  private static augmentGarage(
    lowerPrompt: string,
    sanitizedPrompt: string,
    roleLevel: number,
    suggestedActions: ActionProposal[]
  ): void {
    if (lowerPrompt.includes('ordre de réparation') || lowerPrompt.includes('or') || lowerPrompt.includes('immat') || lowerPrompt.includes('plaque')) {
      const match = sanitizedPrompt.match(/([A-Z]{2}[- ]?[0-9]{3}[- ]?[A-Z]{2}|OR[- ]?[0-9]{3,8})/i);
      if (match) {
        const plate = match[1].replace(/\s+/g, '-').toUpperCase();
        const action = AssistantActionDispatcher.createActionProposal('query_repair_order', { licensePlate: plate }, roleLevel);
        if (action.success && action.proposal) suggestedActions.push(action.proposal);
      }
    } else if (lowerPrompt.includes('bsdd') || lowerPrompt.includes('déchets') || lowerPrompt.includes('huile usagée') || lowerPrompt.includes('liquide de frein')) {
      const volMatch = sanitizedPrompt.match(/(\d+)\s*(?:l|litres?|kg)/i);
      const volume = volMatch ? parseInt(volMatch[1], 10) : 80;
      const wasteType = lowerPrompt.includes('frein') ? 'liquide_frein' : 'huiles_moteur';
      const action = AssistantActionDispatcher.createActionProposal('track_waste_bsdd', { wasteType, volume }, roleLevel);
      if (action.success && action.proposal) suggestedActions.push(action.proposal);
    }
  }

  private static augmentHotel(
    lowerPrompt: string,
    suggestedActions: ActionProposal[],
    roleLevel: number
  ): void {
    if (lowerPrompt.includes('chambre') || lowerPrompt.includes('rack') || lowerPrompt.includes('disponibilité hôtel')) {
      const match = lowerPrompt.match(/(suite|deluxe|standard|\b\d{3}\b)/i);
      const roomType = match ? match[1].toLowerCase() : 'deluxe';
      const action = AssistantActionDispatcher.createActionProposal('query_room_rack', { roomType }, roleLevel);
      if (action.success && action.proposal) suggestedActions.push(action.proposal);
    } else if (lowerPrompt.includes('fiche de police') || lowerPrompt.includes('police')) {
      const action = AssistantActionDispatcher.createActionProposal('generate_police_sheet', { bookingId: 'BK-8902', guestName: 'Client Étranger' }, roleLevel);
      if (action.success && action.proposal) suggestedActions.push(action.proposal);
    }
  }

  private static augmentClinic(
    lowerPrompt: string,
    suggestedActions: ActionProposal[],
    roleLevel: number
  ): void {
    if (lowerPrompt.includes('consultation') || lowerPrompt.includes('médecin') || lowerPrompt.includes('praticien')) {
      const action = AssistantActionDispatcher.createActionProposal('query_practitioner_agenda', { practitionerId: 'Dr. Martin' }, roleLevel);
      if (action.success && action.proposal) suggestedActions.push(action.proposal);
    } else if (lowerPrompt.includes('hds') || lowerPrompt.includes('consentement')) {
      const action = AssistantActionDispatcher.createActionProposal('verify_hds_consent', { patientId: 'PAT-9912', treatmentCode: 'CCAM-CS' }, roleLevel);
      if (action.success && action.proposal) suggestedActions.push(action.proposal);
    }
  }

  private static augmentRetailAndSalon(
    lowerPrompt: string,
    suggestedActions: ActionProposal[],
    roleLevel: number
  ): void {
    if (lowerPrompt.includes('ean') || lowerPrompt.includes('code barre') || lowerPrompt.includes('taille')) {
      const action = AssistantActionDispatcher.createActionProposal('scan_and_check_ean', { ean13Barcode: '3601234567890', size: 'M' }, roleLevel);
      if (action.success && action.proposal) suggestedActions.push(action.proposal);
    } else if (lowerPrompt.includes('coiffure') || lowerPrompt.includes('balayage') || lowerPrompt.includes('rendez-vous salon')) {
      const action = AssistantActionDispatcher.createActionProposal('book_client_treatment', { clientId: 'Client VIP', serviceId: 'Coupe + Brushing', startTime: '14:30' }, roleLevel);
      if (action.success && action.proposal) suggestedActions.push(action.proposal);
    }
  }

  private static augmentFacilities(
    lowerPrompt: string,
    sanitizedPrompt: string,
    roleLevel: number,
    suggestedActions: ActionProposal[]
  ): void {
    if ((lowerPrompt.includes('bloque') || lowerPrompt.includes('verrouille')) && (lowerPrompt.includes('table') || lowerPrompt.includes('baie') || lowerPrompt.includes('espace') || lowerPrompt.includes('box') || lowerPrompt.includes('fauteuil') || lowerPrompt.includes('salon') || lowerPrompt.includes('vitrine') || lowerPrompt.includes('salle'))) {
      const match = sanitizedPrompt.match(/\b(?:table|baie|espace|box|fauteuil|salon|vitrine|salle|cabine|chambre)\s*#?([0-9a-zA-Z_-]+)\b/i);
      if (match) {
        const spaceId = match[1];
        const action = AssistantActionDispatcher.createActionProposal('lock_space_or_table', { spaceId, reason: 'Demande Copilote' }, roleLevel);
        if (action.success && action.proposal) suggestedActions.push(action.proposal);
      }
    } else if ((lowerPrompt.includes('panne') || lowerPrompt.includes('cassé') || lowerPrompt.includes('incident') || lowerPrompt.includes('fume') || lowerPrompt.includes('chauffe plus') || lowerPrompt.includes('fuit') || lowerPrompt.includes('bloqué') || lowerPrompt.includes('sonne')) && roleLevel >= 30) {
      const action = AssistantActionDispatcher.createActionProposal('create_maintenance_ticket', { equipmentName: 'Équipement', severity: 'high', description: sanitizedPrompt }, roleLevel);
      if (action.success && action.proposal) suggestedActions.push(action.proposal);
    }
  }
}
