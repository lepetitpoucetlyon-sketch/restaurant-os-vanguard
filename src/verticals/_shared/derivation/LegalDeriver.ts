/**
 * ⚖️ LegalDeriver — dérive les documents/contrats/assurances légaux du tenant (§C.10 P2b).
 *
 * Produit une liste indicative de :
 *  - contractTypes[] : contrats types à mettre en place (CGV, CGU, contrats de
 *    travail selon convention collective détectée, contrats fournisseurs, etc.).
 *  - legalMentions : mentions légales obligatoires selon le pays + secteur.
 *  - cookiePolicy : politique cookies (si mod_marketing/analytics).
 *  - professionalInsurance : recommandation type + couverture par secteur.
 *
 * Ces documents ne sont pas GÉNÉRÉS ici (c'est le rôle du `LegalContractGenerator`
 * du pilier compliance), mais leur LISTE et leurs paramètres sont calculés.
 */

import type { PlatformVariant } from '@/modules/system';
import type { CapabilitySet } from '../catalog/CapabilityCatalog';
import type { QualificationAnswers } from '@/modules/commerce';

// ── Types de sortie ─────────────────────────────────────────────────────────────

export interface ContractType {
    readonly id: string;
    readonly label: string;
    readonly required: boolean;
    readonly derivedFrom: string;
}

export interface InsuranceRecommendation {
    readonly type: string;
    readonly coverage: readonly string[];
    readonly rationale: string;
}

export interface DerivedLegal {
    readonly contractTypes: readonly ContractType[];
    readonly legalMentions: readonly string[];
    readonly cookiePolicy: { required: boolean; templateId: string };
    readonly professionalInsurance: InsuranceRecommendation;
    readonly collectiveAgreement: { idcc: string | null; name: string | null };
}

// ── Entrée ──────────────────────────────────────────────────────────────────────

export interface LegalDeriverInput {
    readonly answers: QualificationAnswers;
    readonly variant: PlatformVariant;
    readonly effectiveCapabilities: CapabilitySet;
    readonly country?: string;
}

// ── Dérivation ──────────────────────────────────────────────────────────────────

export function deriveLegal(input: LegalDeriverInput): DerivedLegal {
    const { answers, variant, effectiveCapabilities: caps, country = 'FR' } = input;
    const contracts: ContractType[] = [];

    // ── Contrats client universels ──────────────────────────────────────────
    contracts.push({
        id: 'cgv',
        label: answers.axis2_commerceModel === 'b2b_quotes' ? 'CGV B2B' : 'CGV B2C',
        required: true,
        derivedFrom: `axis2_commerceModel=${answers.axis2_commerceModel}`,
    });
    if (caps['mod_reservations']) {
        contracts.push({
            id: 'cgu_booking',
            label: 'CGU réservation en ligne',
            required: true,
            derivedFrom: 'mod_reservations = true',
        });
    }
    if (caps['mod_marketing']) {
        contracts.push({
            id: 'consent_marketing',
            label: 'Formulaire de consentement marketing (opt-in)',
            required: true,
            derivedFrom: 'mod_marketing = true → RGPD Art. 7',
        });
    }

    // ── Contrats RH selon convention collective inférée ────────────────────
    const cc = deriveCollectiveAgreement(variant);
    if (caps['mod_hr'] || answers.axis1_scale !== 'solo') {
        contracts.push({
            id: 'employment_contract_cdi',
            label: `Contrat de travail CDI (${cc.name ?? 'convention à préciser'})`,
            required: true,
            derivedFrom: `mod_hr ou scale ≠ solo (convention ${cc.idcc ?? 'à déterminer'})`,
        });
        contracts.push({
            id: 'employment_contract_cdd',
            label: `Contrat de travail CDD (${cc.name ?? 'convention à préciser'})`,
            required: false,
            derivedFrom: 'usage saisonnier',
        });
    }

    // ── Contrats fournisseurs ──────────────────────────────────────────────
    if (caps['mod_inventory']) {
        contracts.push({
            id: 'supplier_agreement',
            label: 'Contrat cadre fournisseur',
            required: false,
            derivedFrom: 'mod_inventory = true',
        });
    }

    // ── Mentions légales ────────────────────────────────────────────────────
    const legalMentions: string[] = [];
    legalMentions.push(country === 'FR' ? 'Éditeur (raison sociale, SIREN, RCS, capital, siège social)' : 'Éditeur du site');
    legalMentions.push('Hébergeur (nom, adresse, téléphone)');
    legalMentions.push('Directeur de la publication');
    if (variant === 'clinic' || variant === 'veterinary') {
        legalMentions.push('Numéro RPPS/ADELI + Ordre professionnel');
    }
    if (variant === 'garage') {
        legalMentions.push('Assurance décennale garage / certification centre agréé');
    }
    if (variant === 'salon') {
        legalMentions.push('CAP coiffure / esthétique du responsable technique');
    }

    // ── Politique cookies ──────────────────────────────────────────────────
    const cookiesNeeded = caps['mod_google_analytics'] === true || caps['mod_marketing'] === true;
    const cookiePolicy = {
        required: cookiesNeeded,
        templateId: cookiesNeeded ? 'cookie_policy_fr_v2' : 'none',
    };

    // ── Assurance professionnelle recommandée ──────────────────────────────
    const professionalInsurance = deriveInsurance(variant, answers);

    return {
        contractTypes: contracts,
        legalMentions,
        cookiePolicy,
        professionalInsurance,
        collectiveAgreement: cc,
    };
}

// ── Conventions collectives ────────────────────────────────────────────────────

function deriveCollectiveAgreement(variant: PlatformVariant): { idcc: string | null; name: string | null } {
    switch (variant) {
        case 'restaurant': case 'hotel': case 'bakery':
            return { idcc: '1979', name: 'HCR (Hôtels Cafés Restaurants)' };
        case 'garage':
            return { idcc: '1090', name: 'Services de l\'automobile' };
        case 'clinic': case 'veterinary':
            return { idcc: '2264', name: 'FEHAP (santé, action sociale)' };
        case 'salon':
            return { idcc: '2596', name: 'Coiffure' };
        case 'retail':
            return { idcc: '1517', name: 'Commerces non alimentaires' };
        case 'gym':
            return { idcc: '2511', name: 'Sport' };
        case 'coworking':
            return { idcc: '1486', name: 'Bureaux d\'études techniques' };
        case 'florist':
            return { idcc: '1978', name: 'Fleuristes, vente et services animaux familiers' };
        default:
            return { idcc: null, name: null };
    }
}

// ── Assurance ──────────────────────────────────────────────────────────────────

function deriveInsurance(variant: PlatformVariant, answers: QualificationAnswers): InsuranceRecommendation {
    const scale = answers.axis1_scale;
    const baseCoverage = ['RC exploitation', 'RC professionnelle', 'Dommages aux biens'];
    switch (variant) {
        case 'restaurant': case 'hotel': case 'bakery':
            return {
                type: 'Multirisque professionnelle HCR',
                coverage: [...baseCoverage, 'Intoxication alimentaire', 'Perte d\'exploitation', 'Bris de matériel de cuisine'],
                rationale: `Secteur bouche → risque intoxication + valeur matériel → assurance étendue obligatoire${scale === 'solo' ? ' (limite couverture réduite pour artisan)' : ''}`,
            };
        case 'clinic': case 'veterinary':
            return {
                type: 'RC médicale professionnelle',
                coverage: [...baseCoverage, 'Faute médicale', 'Erreur diagnostique', 'Cyber-santé (données patients)'],
                rationale: 'Santé → RC médicale obligatoire (Loi Kouchner) + cyber (données Art. 9 RGPD)',
            };
        case 'garage':
            return {
                type: 'Multirisque garage',
                coverage: [...baseCoverage, 'Véhicules confiés', 'Casse mécanique après intervention'],
                rationale: 'Garage → responsabilité véhicules confiés obligatoire',
            };
        case 'salon':
            return {
                type: 'RC coiffure/esthétique',
                coverage: [...baseCoverage, 'Allergies clients', 'Produits cosmétiques défectueux'],
                rationale: 'Prestations sur la personne → RC allergies obligatoire',
            };
        case 'gym':
            return {
                type: 'Multirisque salle de sport',
                coverage: [...baseCoverage, 'Accidents sportifs adhérents', 'Matériel de musculation'],
                rationale: 'Activité physique encadrée → RC accidents sportifs obligatoire',
            };
        default:
            return {
                type: 'Multirisque professionnelle standard',
                coverage: baseCoverage,
                rationale: 'Couverture professionnelle de base recommandée',
            };
    }
}
