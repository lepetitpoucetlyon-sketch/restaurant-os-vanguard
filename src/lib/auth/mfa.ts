'use client';

/**
 * TOTP MFA utilities — super_admin MCC enforcement (mcc-core-3)
 *
 * TOTP = RFC 6238 (Google Authenticator, Authy, etc.)
 *
 * Provider-agnostique (firestore.md §12 Lot B2.a) : passe par
 * `getClientAuthProvider()`, ne connaît plus le SDK Firebase directement.
 * Le seul fichier qui en dépend est `@/lib/auth/clientAuthProvider`.
 */

import { getClientAuthProvider, type MfaEnrollmentSession } from './clientAuthProvider';

export type { MfaEnrollmentSession as MFAEnrollmentSession };

/** Returns true if the current user has at least one MFA factor enrolled. */
export function isMFAEnrolled(): boolean {
    return getClientAuthProvider().isMfaEnrolled();
}

/**
 * Starts a TOTP enrollment session.
 * Returns the secret (opaque) and the otpauth:// URL for QR code display.
 */
export async function startTOTPEnrollment(accountName: string): Promise<MfaEnrollmentSession> {
    return getClientAuthProvider().startMfaEnrollment(accountName);
}

/**
 * Completes TOTP enrollment by verifying the OTP entered by the user.
 * Throws if the OTP is invalid.
 */
export async function completeTOTPEnrollment(
    secret: unknown,
    otp: string,
    displayName = 'Authenticator'
): Promise<void> {
    return getClientAuthProvider().completeMfaEnrollment(secret, otp, displayName);
}

/**
 * Un-enrolls all MFA factors for the current user.
 * Only for admin use; not exposed in normal UI.
 */
export async function unenrollAllMFA(): Promise<void> {
    return getClientAuthProvider().unenrollAllMfa();
}
