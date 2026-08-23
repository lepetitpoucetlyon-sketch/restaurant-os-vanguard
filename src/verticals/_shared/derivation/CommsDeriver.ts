/**
 * 📢 CommsDeriver — dérive canaux d'alertes + templates transactionnels (§C.10 P2c).
 *
 * Produit :
 *  - alertChannels : canaux par urgence (critical, high, normal, low).
 *  - transactionalTemplates : templates auto-générés (confirmation résa, ticket,
 *    relance impayé) — chacun préconfiguré avec le branding scrapé.
 *  - marketingTemplates : templates promotionnels si mod_marketing ON.
 *  - fromAddress : email d'expédition par défaut.
 *  - respectLoi2004 : consentement double opt-in obligatoire pour marketing FR.
 */

import type { PlatformVariant } from '@/modules/system';
import type { CapabilitySet } from '../catalog/CapabilityCatalog';
import type { CompanyProfile } from '@/modules/commerce';
import type { QualificationAnswers } from '@/modules/commerce';

// ── Types de sortie ─────────────────────────────────────────────────────────────

export type CommsChannel = 'email' | 'sms' | 'push' | 'slack' | 'teams' | 'webhook';

export interface AlertChannelSet {
    readonly critical: readonly CommsChannel[];
    readonly high: readonly CommsChannel[];
    readonly normal: readonly CommsChannel[];
    readonly low: readonly CommsChannel[];
}

export interface CommsTemplate {
    readonly id: string;
    readonly kind: 'transactional' | 'marketing';
    readonly subject: string;
    /** Placeholders `{brand.name}`, `{customer.name}`, `{amount}`, etc. */
    readonly bodyHint: string;
    readonly primaryChannel: CommsChannel;
    readonly requiresConsent: boolean;
    readonly derivedFrom: string;
}

export interface DerivedComms {
    readonly alertChannels: AlertChannelSet;
    readonly transactionalTemplates: readonly CommsTemplate[];
    readonly marketingTemplates: readonly CommsTemplate[];
    readonly fromAddress: string;
    readonly respectLoi2004: boolean;
    readonly brandingApplied: { primaryColor: string; logoUrl?: string; name: string };
}

// ── Entrée ──────────────────────────────────────────────────────────────────────

export interface CommsDeriverInput {
    readonly answers: QualificationAnswers;
    readonly variant: PlatformVariant;
    readonly effectiveCapabilities: CapabilitySet;
    readonly companyProfile?: CompanyProfile;
}

// ── Dérivation ──────────────────────────────────────────────────────────────────

export function deriveComms(input: CommsDeriverInput): DerivedComms {
    const { answers, variant, effectiveCapabilities: caps, companyProfile } = input;

    // ── Canaux d'alertes selon échelle ────────────────────────────────────
    const alertChannels = deriveAlertChannels(answers);

    // ── Templates transactionnels selon capabilities ──────────────────────
    const transactionalTemplates: CommsTemplate[] = [];

    if (caps['mod_pos']) {
        transactionalTemplates.push({
            id: 'tx.receipt',
            kind: 'transactional',
            subject: 'Votre ticket de caisse {brand.name}',
            bodyHint: 'Merci {customer.name}, voici votre ticket dématérialisé du {date}. Montant : {amount}. Ce ticket vaut facture.',
            primaryChannel: 'email',
            requiresConsent: false,
            derivedFrom: 'mod_pos = true → ticket dématérialisé',
        });
    }
    if (caps['mod_reservations']) {
        transactionalTemplates.push({
            id: 'tx.booking_confirmation',
            kind: 'transactional',
            subject: 'Confirmation de votre rendez-vous — {brand.name}',
            bodyHint: 'Bonjour {customer.name}, nous confirmons votre rendez-vous du {date} à {time}. Pour annuler ou reporter : {link.cancel}.',
            primaryChannel: 'email',
            requiresConsent: false,
            derivedFrom: 'mod_reservations = true',
        });
        transactionalTemplates.push({
            id: 'tx.booking_reminder',
            kind: 'transactional',
            subject: 'Rappel : votre rendez-vous demain — {brand.name}',
            bodyHint: 'Rappel : votre rendez-vous {service} demain {date} à {time}. À demain !',
            primaryChannel: 'sms',
            requiresConsent: false,
            derivedFrom: 'mod_reservations = true → réduit no-show',
        });
    }
    if (caps['mod_quotes']) {
        transactionalTemplates.push({
            id: 'tx.quote',
            kind: 'transactional',
            subject: 'Votre devis {quote.number} — {brand.name}',
            bodyHint: 'Bonjour {customer.name}, voici votre devis n° {quote.number} valide jusqu\'au {expiry.date}.',
            primaryChannel: 'email',
            requiresConsent: false,
            derivedFrom: 'mod_quotes = true',
        });
    }
    if (caps['mod_accounting_management']) {
        transactionalTemplates.push({
            id: 'tx.invoice_reminder',
            kind: 'transactional',
            subject: 'Rappel — facture n° {invoice.number} — {brand.name}',
            bodyHint: 'Bonjour, nous constatons que la facture {invoice.number} du {date} est impayée. Merci de régulariser sous 8j.',
            primaryChannel: 'email',
            requiresConsent: false,
            derivedFrom: 'mod_accounting_management = true',
        });
    }
    if (caps['mod_haccp']) {
        transactionalTemplates.push({
            id: 'tx.haccp_alert',
            kind: 'transactional',
            subject: '⚠️ Alerte HACCP — {brand.name}',
            bodyHint: 'Alerte {alert.type} : {alert.description}. Action requise : {alert.action}.',
            primaryChannel: 'sms',
            requiresConsent: false,
            derivedFrom: 'mod_haccp = true → alertes critiques 24/7',
        });
    }

    // ── Templates marketing (si mod_marketing) ─────────────────────────────
    const marketingTemplates: CommsTemplate[] = [];
    if (caps['mod_marketing']) {
        marketingTemplates.push({
            id: 'mk.welcome',
            kind: 'marketing',
            subject: 'Bienvenue chez {brand.name} !',
            bodyHint: 'Merci de vous être inscrit. Voici un code promo de bienvenue : {promo.code}.',
            primaryChannel: 'email',
            requiresConsent: true,
            derivedFrom: 'mod_marketing = true → email opt-in',
        });
        marketingTemplates.push({
            id: 'mk.reactivation',
            kind: 'marketing',
            subject: 'On vous a manqué ? — {brand.name}',
            bodyHint: 'Ça fait longtemps ! Voici une offre pour votre retour : {offer}.',
            primaryChannel: 'email',
            requiresConsent: true,
            derivedFrom: 'mod_marketing = true → cycle de vie client',
        });
    }
    if (variant === 'clinic' || variant === 'veterinary') {
        transactionalTemplates.push({
            id: 'tx.vaccine_reminder',
            kind: 'transactional',
            subject: 'Rappel vaccinal — {brand.name}',
            bodyHint: 'Bonjour, le rappel vaccinal de {patient.name} est prévu {date.due}. Prenez RDV : {link.book}.',
            primaryChannel: 'email',
            requiresConsent: false,
            derivedFrom: `variant=${variant} → rappels vaccinaux`,
        });
    }

    // ── from address + branding ───────────────────────────────────────────
    const brandName = companyProfile?.identity.name ?? 'Mon Établissement';
    const domain = companyProfile?.identity.email?.split('@')[1] ?? 'restaurantos-core.local';
    const fromAddress = `no-reply@${domain}`;

    return {
        alertChannels,
        transactionalTemplates,
        marketingTemplates,
        fromAddress,
        respectLoi2004: true, // Toujours vrai — loi française
        brandingApplied: {
            primaryColor: companyProfile?.branding.primaryColor ?? '#C5A059',
            logoUrl: companyProfile?.branding.logoUrl,
            name: brandName,
        },
    };
}

// ── Canaux d'alerte ────────────────────────────────────────────────────────────

function deriveAlertChannels(answers: QualificationAnswers): AlertChannelSet {
    // Solo/TPE : email suffit
    if (answers.axis1_scale === 'solo' || answers.axis1_scale === 'tpe') {
        return {
            critical: ['sms', 'email'],
            high: ['email'],
            normal: ['email'],
            low: ['email'],
        };
    }
    // PME : Slack ajouté pour l'équipe
    if (answers.axis1_scale === 'pme') {
        return {
            critical: ['sms', 'email', 'slack'],
            high: ['email', 'slack'],
            normal: ['email', 'slack'],
            low: ['email'],
        };
    }
    // ETI : Teams + webhook (intégration ITSM), push pour les managers
    return {
        critical: ['sms', 'email', 'teams', 'webhook', 'push'],
        high: ['email', 'teams', 'push'],
        normal: ['email', 'teams'],
        low: ['email'],
    };
}
