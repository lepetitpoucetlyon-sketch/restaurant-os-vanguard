import { OTP } from 'otplib';
import { logger } from '@/lib/logger';
import { whiteLabelInstanceConfig } from '@/config/instance';

const otp = new OTP();

export class MFAService {
  static generateSecret(adminEmail: string) {
    const secret  = otp.generateSecret();
    const otpauth = otp.generateURI({
      issuer: whiteLabelInstanceConfig.appName,
      label:  adminEmail,
      secret,
    });
    return { secret, otpauth };
  }

  static verifyToken(adminEmail: string, token: string, expectedSecret: string): boolean {
    try {
      const result  = otp.verifySync({ token, secret: expectedSecret });
      const isValid = result.valid;
      if (!isValid) {
        logger.warn(`[MFA] Tentative d'accès refusée (Token Invalide) pour ${adminEmail}`);
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
