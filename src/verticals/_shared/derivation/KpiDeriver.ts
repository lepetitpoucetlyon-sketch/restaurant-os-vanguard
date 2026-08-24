/**
 * 📊 KpiDeriver — dérive KPIs sectoriels + dashboards par rôle (§C.10 P2d).
 *
 * Chaque variant a un socle de KPIs métier pertinents (ticket moyen pour resto,
 * rotation table, occupancy rate hôtel, rebooking salon, no-show clinic…).
 * Ces KPIs sont ensuite AFFECTÉS À DES DASHBOARDS PAR RÔLE (le chef voit stock
 * et HACCP, le patron voit CA et marge, le directeur voit consolidé multi-site).
 *
 * Sortie consommée par P3 (générateur templates kpiDashboard).
 */

import type { PlatformVariant } from '@/modules/system';
import type { CapabilitySet } from '../catalog/CapabilityCatalog';
import type { QualificationAnswers } from '../qualification/QualificationAnswers';
import type { RolesTemplate } from './RbacDeriver';

// ── Types de sortie ─────────────────────────────────────────────────────────────

export interface Kpi {
    readonly id: string;
    readonly label: string;
    readonly unit: string;
    readonly description: string;
    /** Rôles qui doivent voir ce KPI par défaut. */
    readonly visibleTo: readonly string[];
}

export interface DashboardSpec {
    readonly id: string;
    readonly label: string;
    /** Rôle destinataire principal. */
    readonly ownerRole: string;
    readonly kpiIds: readonly string[];
}

export interface DerivedKpis {
    readonly kpis: readonly Kpi[];
    readonly dashboardsByRole: readonly DashboardSpec[];
    readonly reportFrequency: 'daily' | 'weekly' | 'monthly';
    readonly derivedFrom: Record<string, string>;
}

// ── Entrée ──────────────────────────────────────────────────────────────────────

export interface KpiDeriverInput {
    readonly answers: QualificationAnswers;
    readonly variant: PlatformVariant;
    readonly effectiveCapabilities: CapabilitySet;
    readonly roles: RolesTemplate;
}

// ── Dérivation ──────────────────────────────────────────────────────────────────

export function deriveKpis(input: KpiDeriverInput): DerivedKpis {
    const { answers, variant, effectiveCapabilities: caps, roles } = input;
    const derivedFrom: Record<string, string> = {};

    // ── KPIs socle universels ─────────────────────────────────────────────
    const kpis: Kpi[] = [
        { id: 'revenue', label: 'Chiffre d\'affaires', unit: '€', description: 'CA encaissé sur la période.', visibleTo: ['admin', 'manager', 'direction'] },
        { id: 'transactions', label: 'Transactions', unit: '#', description: 'Nombre de tickets/factures.', visibleTo: ['admin', 'manager', 'operator'] },
        { id: 'avg_ticket', label: 'Ticket moyen', unit: '€', description: 'Panier moyen par transaction.', visibleTo: ['admin', 'manager'] },
    ];

    // ── KPIs sectoriels ────────────────────────────────────────────────────
    kpis.push(...sectorKpis(variant));
    derivedFrom['sector_kpis'] = `variant=${variant} → KPIs sectoriels ajoutés`;

    // ── KPIs par capability ────────────────────────────────────────────────
    if (caps['mod_reservations']) {
        kpis.push({ id: 'no_show_rate', label: 'Taux de no-show', unit: '%', description: 'Réservations non honorées.', visibleTo: ['admin', 'manager'] });
        kpis.push({ id: 'booking_rate', label: 'Taux de réservation', unit: '%', description: 'Créneaux occupés / créneaux disponibles.', visibleTo: ['manager', 'operator'] });
    }
    if (caps['mod_inventory']) {
        kpis.push({ id: 'stockout_events', label: 'Ruptures de stock', unit: '#', description: 'Événements de rupture sur la période.', visibleTo: ['manager', 'admin'] });
    }
    if (caps['mod_haccp']) {
        kpis.push({ id: 'haccp_alerts', label: 'Alertes HACCP', unit: '#', description: 'Nombre d\'alertes température/DLC.', visibleTo: ['responsable_hygiene', 'manager', 'admin'] });
    }
    if (caps['mod_hr']) {
        kpis.push({ id: 'staff_count', label: 'Effectif actif', unit: '#', description: 'Salariés en poste.', visibleTo: ['admin', 'manager', 'rh_manager'] });
        kpis.push({ id: 'absenteeism_rate', label: 'Absentéisme', unit: '%', description: 'Taux d\'absences.', visibleTo: ['admin', 'rh_manager'] });
    }
    if (caps['mod_marketing']) {
        kpis.push({ id: 'campaign_ctr', label: 'CTR campagnes', unit: '%', description: 'Taux de clic marketing.', visibleTo: ['admin', 'manager'] });
    }
    if (caps['mod_fleet_management']) {
        kpis.push({ id: 'consolidated_revenue', label: 'CA consolidé flotte', unit: '€', description: 'CA agrégé multi-établissements.', visibleTo: ['direction', 'franchise_admin'] });
    }

    // ── Dashboards par rôle ────────────────────────────────────────────────
    const dashboardsByRole = buildDashboardsByRole(kpis, roles);
    derivedFrom['dashboardsByRole'] = 'agrégation KPIs.visibleTo par role.key';

    // ── Fréquence rapports selon échelle ───────────────────────────────────
    const reportFrequency: DerivedKpis['reportFrequency'] =
        answers.axis1_scale === 'eti' ? 'daily' :
        answers.axis1_scale === 'pme' ? 'weekly' :
        'monthly';
    derivedFrom['reportFrequency'] = `axis1_scale=${answers.axis1_scale} → ${reportFrequency}`;

    return { kpis, dashboardsByRole, reportFrequency, derivedFrom };
}

function sectorKpis(variant: PlatformVariant): Kpi[] {
    switch (variant) {
        case 'restaurant':
            return [
                { id: 'table_rotation', label: 'Rotation table', unit: 'x/j', description: 'Nombre moyen de couverts par table par jour.', visibleTo: ['manager', 'chef_cuisine'] },
                { id: 'avg_cover_price', label: 'Ticket moyen couvert', unit: '€', description: 'CA / nb couverts.', visibleTo: ['admin', 'manager'] },
                { id: 'food_cost_pct', label: 'Coût matière %', unit: '%', description: 'Ratio coût matière / CA.', visibleTo: ['admin', 'chef_cuisine'] },
            ];
        case 'hotel':
            return [
                { id: 'occupancy_rate', label: 'Taux d\'occupation', unit: '%', description: 'Chambres occupées / chambres disponibles.', visibleTo: ['admin', 'manager', 'reception'] },
                { id: 'adr', label: 'Prix moyen (ADR)', unit: '€', description: 'Average Daily Rate.', visibleTo: ['admin', 'manager'] },
                { id: 'revpar', label: 'RevPAR', unit: '€', description: 'Revenue per Available Room.', visibleTo: ['admin', 'direction'] },
            ];
        case 'clinic': case 'veterinary':
            return [
                { id: 'consultation_count', label: 'Consultations', unit: '#', description: 'Nombre de consultations sur la période.', visibleTo: ['praticien', 'admin'] },
                { id: 'rebook_rate', label: 'Taux de re-consultation', unit: '%', description: 'Fidélisation patients/animaux.', visibleTo: ['praticien', 'admin'] },
            ];
        case 'salon':
            return [
                { id: 'rebook_rate', label: 'Taux de rebooking', unit: '%', description: 'Clients qui reprennent RDV avant de partir.', visibleTo: ['admin', 'manager'] },
                { id: 'service_mix', label: 'Mix prestations', unit: '%', description: 'Répartition CA par type de service.', visibleTo: ['admin', 'manager'] },
            ];
        case 'gym':
            return [
                { id: 'active_members', label: 'Membres actifs', unit: '#', description: 'Adhérents à jour de cotisation.', visibleTo: ['admin', 'manager'] },
                { id: 'churn_rate', label: 'Taux d\'attrition', unit: '%', description: 'Perte d\'adhérents mensuelle.', visibleTo: ['admin', 'community_manager'] },
                { id: 'class_fill_rate', label: 'Remplissage cours', unit: '%', description: 'Places occupées / places offertes.', visibleTo: ['coach', 'manager'] },
            ];
        case 'coworking':
            return [
                { id: 'desk_occupancy', label: 'Occupation bureaux', unit: '%', description: 'Bureaux occupés / bureaux disponibles.', visibleTo: ['admin', 'community_manager'] },
                { id: 'meeting_room_utilization', label: 'Salles de réunion', unit: '%', description: 'Heures réservées / heures disponibles.', visibleTo: ['community_manager'] },
            ];
        case 'retail':
            return [
                { id: 'sell_through', label: 'Sell-through', unit: '%', description: 'Ventes / stock initial.', visibleTo: ['admin', 'manager'] },
                { id: 'ltv', label: 'LTV client', unit: '€', description: 'Valeur vie client moyenne.', visibleTo: ['admin', 'manager'] },
            ];
        case 'bakery':
            return [
                { id: 'shrinkage_pct', label: 'Casse / invendus', unit: '%', description: 'Produits invendus en fin de journée.', visibleTo: ['admin', 'boulanger'] },
                { id: 'morning_rush_conversion', label: 'Conversion rush matinal', unit: '%', description: 'Efficacité de la vente en pic 7h-9h.', visibleTo: ['manager'] },
            ];
        case 'garage':
            return [
                { id: 'workshop_utilization', label: 'Utilisation atelier', unit: '%', description: 'Heures productives / heures ouvrées.', visibleTo: ['admin', 'chef_atelier'] },
                { id: 'avg_repair_ticket', label: 'Ticket moyen réparation', unit: '€', description: 'Facture moyenne par intervention.', visibleTo: ['admin', 'manager'] },
            ];
        case 'florist':
            return [
                { id: 'perishable_waste', label: 'Déchets périssables', unit: '%', description: 'Fleurs invendues en fin de fraîcheur.', visibleTo: ['admin', 'fleuriste'] },
                { id: 'special_events_share', label: 'Part événementiel', unit: '%', description: 'CA événements (mariages/deuils) / total.', visibleTo: ['admin', 'manager'] },
            ];
        default:
            return [];
    }
}

function buildDashboardsByRole(kpis: readonly Kpi[], roles: RolesTemplate): DashboardSpec[] {
    const dashboards: DashboardSpec[] = [];
    for (const role of roles.roles) {
        const kpiIds = kpis.filter(k => k.visibleTo.includes(role.key)).map(k => k.id);
        if (kpiIds.length === 0) continue;
        dashboards.push({
            id: `dashboard.${role.key}`,
            label: `Dashboard ${role.label}`,
            ownerRole: role.key,
            kpiIds,
        });
    }
    return dashboards;
}
