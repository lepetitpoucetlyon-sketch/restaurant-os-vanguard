import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface PostMealReviewTrigger {
  tenantId: string;
  orderId: string;
  customerPhone: string;
  customerName: string;
  googlePlaceReviewUrl: string;
  channel?: 'sms' | 'whatsapp';
}

export interface ReviewDispatchResult {
  orderId: string;
  channel: 'sms' | 'whatsapp';
  smsBody: string;
  dispatchedAt: number;
}

/**
 * AutomaticReviewBoosterService — Angle mort L77.
 * Sollicitation automatique d'avis post-repas (SMS/WhatsApp 90 min après encaissement) avec lien direct Google Maps / TripAdvisor pour doper la note locale.
 */
export class AutomaticReviewBoosterService {
  static dispatchReviewRequest(trigger: PostMealReviewTrigger): ReviewDispatchResult {
    const channel = trigger.channel ?? 'sms';
    const smsBody = `Bonjour ${trigger.customerName}, merci pour votre venue ! Si vous avez apprécié votre expérience, partagez votre avis ici : ${trigger.googlePlaceReviewUrl}`;

    NexusEventBus.emit('crm.review_request_dispatched', {
      v: 1,
      tenantId: trigger.tenantId,
      orderId: trigger.orderId,
      customerPhone: trigger.customerPhone,
      channel,
      dispatchedAt: Date.now(),
    });

    return {
      orderId: trigger.orderId,
      channel,
      smsBody,
      dispatchedAt: Date.now(),
    };
  }
}
