'use client';

/**
 * Firebase TOTP MFA utilities — super_admin MCC enforcement (mcc-core-3)
 *
 * Requires Firebase Identity Platform (Blaze plan).
 * TOTP = RFC 6238 (Google Authenticator, Authy, etc.)
 */

import {
    getAuth,
    multiFactor,
    TotpMultiFactorGenerator,
    TotpSecret,
    type MultiFactorUser,
} from 'firebase/auth';

export interface MFAEnrollmentSession {
    secret: TotpSecret;
    qrUrl: string;
    manualKey: string;
}

/** Returns true if the current Firebase user has at least one MFA factor enrolled. */
export function isMFAEnrolled(): boolean {
    const user = getAuth().currentUser;
    if (!user) return false;
    const mfaUser: MultiFactorUser = multiFactor(user);
    return mfaUser.enrolledFactors.length > 0;
}

/**
 * Starts a TOTP enrollment session.
 * Returns the secret and the otpauth:// URL for QR code display.
 */
export async function startTOTPEnrollment(
    accountName: string
): Promise<MFAEnrollmentSession> {
    const user = getAuth().currentUser;
    if (!user) {
        console.warn('[MFA] No Firebase user, using mock TOTP session for DEV/Agnostic mode.');
        return {
            secret: {} as TotpSecret,
            qrUrl: `otpauth://totp/Restaurant%20OS%20MCC:${encodeURIComponent(accountName)}?secret=JBSWY3DPEHPK3PXP&issuer=Restaurant%20OS%20MCC`,
            manualKey: 'JBSWY3DPEHPK3PXP'
        };
    }

    const mfaUser = multiFactor(user);
    const session = await mfaUser.getSession();
    const secret = await TotpMultiFactorGenerator.generateSecret(session);

    const issuer = 'Restaurant OS MCC';
    const qrUrl = secret.generateQrCodeUrl(accountName, issuer);

    // manualKey = base32 secret for manual entry in authenticator apps
    const manualKey = secret.secretKey;

    return { secret, qrUrl, manualKey };
}

/**
 * Completes TOTP enrollment by verifying the OTP entered by the user.
 * Throws if the OTP is invalid.
 */
export async function completeTOTPEnrollment(
    secret: TotpSecret,
    otp: string,
    displayName = 'Authenticator'
): Promise<void> {
    const user = getAuth().currentUser;
    if (!user) {
        console.warn('[MFA] No Firebase user, verifying mock TOTP session.');
        if (otp !== '123456' && otp !== '000000') throw new Error('Mock OTP invalide (utiliser 123456)');
        return;
    }

    const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, otp);
    await multiFactor(user).enroll(assertion, displayName);
}

/**
 * Un-enrolls all MFA factors for the current user.
 * Only for admin use; not exposed in normal UI.
 */
export async function unenrollAllMFA(): Promise<void> {
    const user = getAuth().currentUser;
    if (!user) return;
    const mfaUser = multiFactor(user);
    for (const factor of mfaUser.enrolledFactors) {
        await mfaUser.unenroll(factor);
    }
}
