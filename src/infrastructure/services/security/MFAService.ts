import * as otplib from 'otplib';
const { authenticator } = otplib;
import { logger } from '@/lib/logger';

export class MFAService {
  /**
   * Génère un nouveau secret TOTP pour un administrateur du MCC.
   * Retourne le secret et l'URI pour générer un QR Code (Google Authenticator / Authy).
   */
  static generateSecret(adminEmail: string) {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(adminEmail, 'Restaurant OS Empire', secret);
    return { secret, otpauth };
  }

  /**
   * Vérifie un code TOTP (ex: 123456) soumis par l'administrateur.
   */
  static async verifyToken(adminEmail: string, token: string, expectedSecret: string): Promise<boolean> {
    try {
      const isValid = authenticator.verify({ token, secret: expectedSecret });
      
      if (!isValid) {
        logger.warn(`[MFA] Tentative d'accès refusée (Token Invalide) pour l'admin ${adminEmail}`);
      } else {
        logger.info(`[MFA] Authentification 2FA réussie pour ${adminEmail}`);
      }
      
      return isValid;
    } catch (err) {
      logger.error(`[MFA] Erreur lors de la vérification TOTP`, err);
      return false;
    }
  }
}
