/**
 * 🛡️ SecurityDeriver — dérive la politique de sécurité applicative (§C.10 P2b).
 *
 * Complète `RbacDeriver.RolesTemplate.passwordPolicy` avec :
 *  - session_timeout_min : durée d'inactivité avant déconnexion (santé strict, retail large)
 *  - mfa_required_roles : rôles pour lesquels MFA obligatoire (cf. RbacDeriver, on ré-utilise)
 *  - password_policy_details : longueur, complexité, historique, rotation
 *  - ip_whitelist_enabled : whitelist IP recommandée (finance, luxe, santé)
 *  - sso_required : SSO obligatoire (grands comptes)
 *  - audit_login_journal : journal d'audit des connexions (santé/audit)
 *  - webauthn_hardware_key : clés physiques U2F/FIDO2 (L3 admin)
 */

import type { PlatformVariant } from '@/modules/system';
import type { QualificationAnswers } from '../qualification/QualificationAnswers';

// ── Types de sortie ─────────────────────────────────────────────────────────────

export interface PasswordPolicyDetails {
    readonly minLength: number;
    readonly requireUppercase: boolean;
    readonly requireDigit: boolean;
    readonly requireSpecial: boolean;
    /** Historique : nb derniers mots de passe interdits à la rotation. */
    readonly historyDepth: number;
    /** Rotation en jours (0 = pas de rotation forcée). */
    readonly rotationDays: number;
}

export interface DerivedSecurity {
    readonly session_timeout_min: number;
    readonly password_policy: PasswordPolicyDetails;
    readonly mfa_required_roles: readonly string[];
    readonly ip_whitelist_enabled: boolean;
    readonly sso_required: boolean;
    readonly audit_login_journal: boolean;
    readonly webauthn_hardware_key: boolean;
    readonly derivedFrom: Record<string, string>;
}

// ── Entrée ──────────────────────────────────────────────────────────────────────

export interface SecurityDeriverInput {
    readonly answers: QualificationAnswers;
    readonly variant: PlatformVariant;
    /** Depuis RbacDeriver — mêmes rôles à protéger. */
    readonly mfaRolesFromRbac?: readonly string[];
}

// ── Dérivation ──────────────────────────────────────────────────────────────────

export function deriveSecurity(input: SecurityDeriverInput): DerivedSecurity {
    const { answers, variant, mfaRolesFromRbac } = input;
    const derivedFrom: Record<string, string> = {};

    // ── Session timeout ────────────────────────────────────────────────────
    const isHealth = variant === 'clinic' || variant === 'veterinary';
    const session_timeout_min = isHealth ? 15
        : answers.axis1_scale === 'eti' ? 60
        : answers.axis1_scale === 'pme' ? 120
        : 480;  // 8h par défaut retail/petit
    derivedFrom['session_timeout_min'] = isHealth
        ? `variant=${variant} (santé) → 15min strict`
        : `axis1_scale=${answers.axis1_scale} → ${session_timeout_min}min`;

    // ── Password policy détaillée ─────────────────────────────────────────
    const password_policy = derivePasswordPolicy(answers);
    derivedFrom['password_policy'] = `scale=${answers.axis1_scale} + rbac=${answers.axis1_rbac}`;

    // ── MFA : cascade selon échelle + granularité RBAC ────────────────────
    const mfa_required_roles = mfaRolesFromRbac ?? [];
    derivedFrom['mfa_required_roles'] = mfaRolesFromRbac
        ? 'issu de RbacDeriver.mfaRequiredFor'
        : 'aucun (RbacDeriver non fourni en input)';

    // ── IP whitelist ──────────────────────────────────────────────────────
    const ip_whitelist_enabled = isHealth || answers.axis1_scale === 'eti';
    derivedFrom['ip_whitelist_enabled'] = ip_whitelist_enabled
        ? `variant=${variant} ou scale=eti → whitelist recommandée`
        : 'non requis';

    // ── SSO ──────────────────────────────────────────────────────────────
    const sso_required = answers.axis1_scale === 'eti' && answers.axis1_rbac === 'granular';
    derivedFrom['sso_required'] = sso_required
        ? 'scale=eti + rbac=granular → SSO obligatoire pour audit centralisé'
        : 'facultatif';

    // ── Audit login ──────────────────────────────────────────────────────
    const audit_login_journal = isHealth || answers.axis1_scale === 'eti' || answers.axis3_safety === 'work_accidents';
    derivedFrom['audit_login_journal'] = audit_login_journal
        ? `santé/eti/AT → journal login obligatoire (Art. L1121-1 CT + Art. 32 RGPD)`
        : 'non requis';

    // ── WebAuthn hardware key ────────────────────────────────────────────
    const webauthn_hardware_key = answers.axis1_scale === 'eti' && (isHealth || answers.axis1_rbac === 'granular');
    derivedFrom['webauthn_hardware_key'] = webauthn_hardware_key
        ? 'L3 santé/granular → clé physique FIDO2 recommandée pour admin'
        : 'non requis';

    return {
        session_timeout_min,
        password_policy,
        mfa_required_roles,
        ip_whitelist_enabled,
        sso_required,
        audit_login_journal,
        webauthn_hardware_key,
        derivedFrom,
    };
}

// ── Password policy ─────────────────────────────────────────────────────────────

function derivePasswordPolicy(answers: QualificationAnswers): PasswordPolicyDetails {
    if (answers.axis1_scale === 'eti' || answers.axis1_rbac === 'granular') {
        return {
            minLength: 14, requireUppercase: true, requireDigit: true, requireSpecial: true,
            historyDepth: 12, rotationDays: 90,
        };
    }
    if (answers.axis1_scale === 'pme' || answers.axis1_rbac === 'standard') {
        return {
            minLength: 10, requireUppercase: true, requireDigit: true, requireSpecial: true,
            historyDepth: 5, rotationDays: 180,
        };
    }
    return {
        minLength: 8, requireUppercase: true, requireDigit: true, requireSpecial: false,
        historyDepth: 3, rotationDays: 0,
    };
}
