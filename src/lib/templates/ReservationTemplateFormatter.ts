import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface ReservationTemplateContext {
  customerName?: string;
  firstName?: string;
  lastName?: string;
  restaurantName?: string;
  date?: string;
  time?: string;
  covers?: number;
  tableName?: string;
  modifyLink?: string;
  restaurantPhone?: string;
  cancellationPolicy?: string;
}

export const DEFAULT_RESERVATION_TEMPLATES = {
  confirmationSms: 'Bonjour {prenom}, votre réservation pour {couverts} pers. chez {restaurant} est confirmée le {date} à {heure}. Modifier/Annuler : {lien_modification}',
  reminderSms: 'Bonjour {prenom}, nous vous attendons chez {restaurant} le {date} à {heure} pour {couverts} pers. À très bientôt !',
  cancellationSms: 'Bonjour {prenom}, votre réservation du {date} à {heure} chez {restaurant} a bien été annulée.',
  waitlistSms: 'Bonne nouvelle {prenom} ! Une place pour {couverts} pers. vient de se libérer chez {restaurant} pour {heure}. Confirmez ici sous 15 min : {lien_modification}',
};

function buildReplacementsMap(ctx: ReservationTemplateContext): Record<string, string> {
  const { firstName: extractedFirst, lastName: extractedLast } = ReservationTemplateFormatter.splitName(ctx.customerName);
  const firstName = ctx.firstName ?? extractedFirst ?? 'Client';
  const lastName = ctx.lastName ?? extractedLast ?? '';
  const fullName = ctx.customerName ?? `${firstName} ${lastName}`.trim();
  const formattedDate = ReservationTemplateFormatter.formatDateReadable(ctx.date);
  const time = ctx.time ?? '';
  const covers = String(ctx.covers ?? 2);
  const restaurant = ctx.restaurantName ?? 'notre établissement';
  const modifyLink = ctx.modifyLink ?? '';
  const table = ctx.tableName ?? 'votre table';
  const phone = ctx.restaurantPhone ?? '';
  const cancellationPolicy = ctx.cancellationPolicy ?? '';

  return {
    '{prenom}': firstName,
    '{firstName}': firstName,
    '{nom}': lastName,
    '{lastName}': lastName,
    '{nom_complet}': fullName,
    '{fullName}': fullName,
    '{restaurant}': restaurant,
    '{etablissement}': restaurant,
    '{businessName}': restaurant,
    '{date}': formattedDate,
    '{date_courte}': ctx.date ?? '',
    '{heure}': time,
    '{time}': time,
    '{couverts}': covers,
    '{personnes}': covers,
    '{covers}': covers,
    '{guests}': covers,
    '{table}': table,
    '{tableName}': table,
    '{lien_modification}': modifyLink,
    '{modifyLink}': modifyLink,
    '{telephone}': phone,
    '{phone}': phone,
    '{politique_annulation}': cancellationPolicy,
  };
}

/**
 * 📝 ReservationTemplateFormatter
 * Formate et interpole dynamiquement toutes les variables de personnalisation
 * dans les SMS et emails de réservation (nom, prénom, heure, date, restaurant, lien...).
 */
export class ReservationTemplateFormatter {
  /**
   * Extrait prénom et nom d'un nom complet
   */
  static splitName(fullName?: string): { firstName: string; lastName: string } {
    if (!fullName || typeof fullName !== 'string') {
      return { firstName: 'Client', lastName: '' };
    }
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return { firstName, lastName };
  }

  /**
   * Formate la date de manière élégante en français (ex: "Mardi 18 Août 2026")
   */
  static formatDateReadable(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const d = parseISO(dateStr);
        return format(d, 'EEEE d MMMM yyyy', { locale: fr });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  /**
   * Interpole un template avec le dictionnaire de variables
   */
  static interpolate(template: string, ctx: ReservationTemplateContext): string {
    if (!template) return '';

    const replacements = buildReplacementsMap(ctx);
    let result = template;
    for (const [tag, val] of Object.entries(replacements)) {
      result = result.split(tag).join(val);
    }

    return result;
  }
}
