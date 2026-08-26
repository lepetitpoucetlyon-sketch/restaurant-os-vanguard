/**
 * 📡 StreamingPrefixParser — Speculative Programmatic Tool Calling (Spec-PTC)
 * 
 * Parseur de flux incrémental analysant les tokens LLM au fur et à mesure de leur émission.
 * Détecte les intentions d'outils, les blocs de code et les arguments JSON partiels
 * avant même que la génération du message ne soit terminée.
 */

export interface ParsedToolIntent {
  toolId: string;
  params: Record<string, unknown>;
  isComplete: boolean;
  confidence: number;
  extractedAtTokenIndex: number;
}

export class StreamingPrefixParser {
  private static readonly INTENT_PATTERNS: Array<{
    toolId: string;
    regex: RegExp;
    extractParams: (match: RegExpMatchArray, text: string) => Record<string, unknown>;
  }> = [
    {
      toolId: 'query_stock_level',
      regex: /(?:combien de|quantit[ée] de|stock de|reste(?:-t-il)? de?|combien d')\s+([\p{L}0-9'-]+(?:\s+[\p{L}0-9'-]+)*)/iu,
      extractParams: (m) => {
        const raw = m[1].replace(/\s+(?:il reste|dans|en|disponible|actuellement|svp|s'il te plaît).*$/iu, '').trim();
        return { itemName: raw };
      },
    },
    {
      toolId: 'query_location_inventory',
      regex: /(?:frigo|chambre froide|r[ée]serve|cave|bar)\s*(?:n[°o]?\s*)?([0-9\p{L}_-]+)/iu,
      extractParams: (m) => ({ locationId: m[0].trim() }),
    },
    {
      toolId: 'query_financial_snapshot',
      regex: /(?:chiffre d'affaires|ca|revenus?|ventes?)\s+(?:du jour|d'hier|du midi|du soir|hebdomadaire)/iu,
      extractParams: (m) => {
        const text = m[0].toLowerCase();
        const period = text.includes('hier') ? 'yesterday' : text.includes('midi') ? 'lunch' : text.includes('soir') ? 'dinner' : 'today';
        return { period };
      },
    },
    {
      toolId: 'query_table_status',
      regex: /(?:table|emplacement|poste)\s*#?([0-9]{1,4}[\p{L}]?)/iu,
      extractParams: (m) => ({ tableNumber: m[1].trim() }),
    },
    {
      toolId: 'query_haccp_alerts',
      regex: /(?:haccp|p[ée]remption|dlc|temp[ée]rature|anomalie sanitaire)/iu,
      extractParams: () => ({ filter: 'critical_or_warning' }),
    },
    {
      toolId: 'query_reservations',
      regex: /(?:r[ée]servations?|couverts?|arriv[ée]es?|pax)\s*(?:ce soir|ce midi|aujourd'hui|demain)?/iu,
      extractParams: (m) => ({ date: 'today', context: m[0].trim() }),
    },
  ];

  /**
   * Analyse un flux partiel de texte/tokens et extrait les intentions d'outils détectables.
   */
  public static parseStreamPrefix(streamBuffer: string, tokenCount: number): ParsedToolIntent[] {
    const intents: ParsedToolIntent[] = [];
    const trimmed = streamBuffer.trim();

    if (trimmed.length < 5) return intents;

    // 1. Détection programmatique directe (Blocs de code Tool Call / JSON)
    const jsonToolMatch = trimmed.match(/```(?:json)?\s*\{\s*"tool"\s*:\s*"([^"]+)"\s*,\s*"params"\s*:\s*(\{.*?\})/s);
    if (jsonToolMatch) {
      try {
        const toolId = jsonToolMatch[1];
        const params = JSON.parse(jsonToolMatch[2]);
        intents.push({
          toolId,
          params,
          isComplete: true,
          confidence: 1.0,
          extractedAtTokenIndex: tokenCount,
        });
        return intents;
      } catch {
        // JSON partiel en cours de stream
      }
    }

    // 2. Détection d'intention sémantique en flux naturel
    for (const pattern of this.INTENT_PATTERNS) {
      const match = trimmed.match(pattern.regex);
      if (match) {
        intents.push({
          toolId: pattern.toolId,
          params: pattern.extractParams(match, trimmed),
          isComplete: true,
          confidence: 0.9,
          extractedAtTokenIndex: tokenCount,
        });
      }
    }

    return intents;
  }
}
