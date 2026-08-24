/**
 * 🖨️ HardwareSizingDeriver — dimensionne le matériel physique du tenant (§C.10 P2c).
 *
 * Complète `CapabilityCatalog.requiredHardware` (types de matériel) par le
 * DIMENSIONNEMENT : combien de TPE, combien de sondes température, combien
 * d'imprimantes cuisine, quelle bande passante, faut-il un onduleur ?
 *
 * Ces valeurs SUGGÉRÉES sont présentées à l'opérateur pour validation avant
 * commande matériel — un pack peut être finalisé par le partenaire installateur.
 */

import type { PlatformVariant } from '@/modules/system';
import type { CapabilitySet } from '../catalog/CapabilityCatalog';
import type { QualificationAnswers } from '../qualification/QualificationAnswers';
import type { CompanyProfile } from '@/modules/commerce';

// ── Types de sortie ─────────────────────────────────────────────────────────────

export interface DerivedHardwareSizing {
    /** Nombre de terminaux de paiement recommandé. */
    readonly tpeCount: number;
    /** Nombre de postes caisse (tablettes ou PC). */
    readonly posStations: number;
    /** Nombre d'imprimantes ticket. */
    readonly receiptPrinters: number;
    /** Nombre d'imprimantes cuisine. */
    readonly kitchenPrinters: number;
    /** Nombre d'écrans KDS. */
    readonly kdsScreens: number;
    /** Nombre de sondes température (1 par frigo/chambre froide). */
    readonly temperatureProbes: number;
    /** Nombre de scanners code-barres. */
    readonly barcodeScanners: number;
    /** Nombre de bornes kiosk. */
    readonly kioskTerminals: number;
    /** Bande passante Internet recommandée (Mbps). */
    readonly bandwidthMbps: number;
    /** Onduleur requis (santé, prod critique). */
    readonly upsRequired: boolean;
    /** Estimation coût matériel EUR (indicative). */
    readonly estimatedHardwareCostEur: number;
    readonly derivedFrom: Record<string, string>;
}

// ── Entrée ──────────────────────────────────────────────────────────────────────

export interface HardwareSizingDeriverInput {
    readonly answers: QualificationAnswers;
    readonly variant: PlatformVariant;
    readonly effectiveCapabilities: CapabilitySet;
    readonly companyProfile?: CompanyProfile;
    /** Nombre de sites (défaut 1). Dimensionne le multiplicateur. */
    readonly siteCount?: number;
}

// ── Dérivation ──────────────────────────────────────────────────────────────────

export function deriveHardwareSizing(input: HardwareSizingDeriverInput): DerivedHardwareSizing {
    const { answers, variant, effectiveCapabilities: caps, companyProfile, siteCount = 1 } = input;
    const derivedFrom: Record<string, string> = {};

    const staff = answers.axis1_estimatedStaff ?? { solo: 1, tpe: 5, pme: 25, eti: 100 }[answers.axis1_scale];
    const catalogSize = companyProfile?.catalog.length ?? 0;

    // ── POS / TPE / imprimantes ticket ────────────────────────────────────
    let posStations = 1;
    if (caps['mod_pos']) {
        posStations = Math.max(1, Math.min(Math.ceil(staff / 8), 10));  // 1 poste par 8 employés, cap 10
        posStations *= siteCount;
    }
    const tpeCount = caps['mod_pos'] ? posStations : 0;
    const receiptPrinters = caps['mod_pos'] ? posStations : 0;
    derivedFrom['posStations'] = `staff=${staff}, siteCount=${siteCount} → ${posStations} postes`;

    // ── KDS et imprimantes cuisine ────────────────────────────────────────
    let kdsScreens = 0;
    let kitchenPrinters = 0;
    if (caps['mod_kds']) {
        kdsScreens = answers.axis5_production === 'kds_screens' ? Math.max(2, Math.ceil(catalogSize / 40)) * siteCount : 1;
        derivedFrom['kdsScreens'] = `axis5_production=${answers.axis5_production}, catalogSize=${catalogSize}`;
    }
    if (caps['mod_kitchen_management'] || answers.axis5_production === 'multi_printers') {
        kitchenPrinters = variant === 'restaurant' ? 2 * siteCount : 1 * siteCount;   // bar + cuisine
        derivedFrom['kitchenPrinters'] = `variant=${variant}, siteCount=${siteCount}`;
    }

    // ── Sondes température ──────────────────────────────────────────────────
    let temperatureProbes = 0;
    if (caps['mod_haccp']) {
        // 1 sonde par frigo/chambre froide — estimation depuis catalog perishable
        const perishableItems = companyProfile?.catalog.filter(i =>
            /frais|glace|surgelé|viande|poisson|fromage|yaourt|bouquet|fleur/i.test(i.name + i.category)
        ).length ?? 0;
        const estimatedFridges = Math.max(2, Math.ceil(perishableItems / 20));
        temperatureProbes = estimatedFridges * siteCount;
        derivedFrom['temperatureProbes'] = `mod_haccp=true, perishableItems=${perishableItems} → ${estimatedFridges} frigos × ${siteCount} sites`;
    }

    // ── Scanners code-barres ──────────────────────────────────────────────
    let barcodeScanners = 0;
    if (caps['mod_inventory']) {
        barcodeScanners = Math.max(1, Math.ceil(catalogSize / 100)) * siteCount;
        derivedFrom['barcodeScanners'] = `mod_inventory=true, catalogSize=${catalogSize}`;
    }

    // ── Bornes kiosk ──────────────────────────────────────────────────────
    let kioskTerminals = 0;
    if (caps['mod_kiosk']) {
        kioskTerminals = Math.max(1, Math.ceil(staff / 15)) * siteCount;
        derivedFrom['kioskTerminals'] = `mod_kiosk=true, staff=${staff}`;
    }

    // ── Bande passante ────────────────────────────────────────────────────
    let bandwidthMbps = 50;  // base
    if (kioskTerminals > 0) bandwidthMbps += kioskTerminals * 20;
    if (caps['mod_ai']) bandwidthMbps += 30;
    if (answers.axis1_scale === 'pme') bandwidthMbps = Math.max(bandwidthMbps, 100);
    if (answers.axis1_scale === 'eti') bandwidthMbps = Math.max(bandwidthMbps, 500);
    derivedFrom['bandwidthMbps'] = `base 50 + kiosks × 20 + AI + scale multiplier`;

    // ── Onduleur ──────────────────────────────────────────────────────────
    const upsRequired = variant === 'clinic' || variant === 'veterinary' || answers.axis1_scale === 'eti' || caps['mod_kds'] === true;
    derivedFrom['upsRequired'] = upsRequired
        ? `${variant} ou scale=eti ou mod_kds → onduleur recommandé`
        : 'non requis';

    // ── Estimation coût (indicative) ──────────────────────────────────────
    const cost =
        tpeCount * 400 +               // ~400€/TPE
        posStations * 800 +            // ~800€/tablette+support
        receiptPrinters * 250 +        // ~250€/imprimante ticket
        kdsScreens * 500 +             // ~500€/écran KDS
        kitchenPrinters * 350 +        // ~350€/imprimante cuisine
        temperatureProbes * 150 +      // ~150€/sonde IoT
        barcodeScanners * 200 +        // ~200€/scanner BT
        kioskTerminals * 3500 +        // ~3500€/borne
        (upsRequired ? 400 : 0);
    derivedFrom['estimatedHardwareCostEur'] = 'somme unitaires × quantités (prix indicatif marché FR)';

    return {
        tpeCount,
        posStations,
        receiptPrinters,
        kitchenPrinters,
        kdsScreens,
        temperatureProbes,
        barcodeScanners,
        kioskTerminals,
        bandwidthMbps,
        upsRequired,
        estimatedHardwareCostEur: cost,
        derivedFrom,
    };
}
