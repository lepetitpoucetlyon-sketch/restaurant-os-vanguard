import crypto from 'crypto';

const SECRET_KEY = process.env.INTERNAL_API_SECRET || process.env.NEXTAUTH_SECRET || 'nexus-reservation-secret-key-grade-x';

/**
 * 🛡️ ReservationTokenSigner (Angle Mort #106)
 * Génère et vérifie des jetons HMAC signés pour les liens 1-clic d'annulation / modification,
 * empêchant tout tiers malveillant d'annuler une réservation par force brute d'ID.
 */
export class ReservationTokenSigner {
  /**
   * Génère une signature sécurisée pour une réservation
   */
  static generateToken(reservationId: string, tenantId: string): string {
    const data = `${tenantId}:${reservationId}`;
    return crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex').slice(0, 32);
  }

  /**
   * Vérifie la validité du jeton
   */
  static verifyToken(reservationId: string, tenantId: string, token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    const expected = this.generateToken(reservationId, tenantId);
    try {
      return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  /**
   * Construit l'URL autonome sécurisée
   */
  static buildSecureModifyUrl(baseUrl: string, reservationId: string, tenantId: string): string {
    const token = this.generateToken(reservationId, tenantId);
    return `${baseUrl}/reservation/${reservationId}?token=${token}`;
  }
}
