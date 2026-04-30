import { Nexus } from '@/lib/nexus/NexusAdapter';
import { StockItem } from '@modules/logistics';
import { Reservation } from '@modules/commerce';
import { User } from '@nexus/contracts';
import { Recipe } from '@nexus/contracts';
import { Account } from '@modules/finance';
import { HygieneLog, Candidate } from '@nexus/contracts';

export interface SLMTrainingPair {
    instruction: string;
    input: string;
    output: string;
    category: string; // Used for role-based access control alignment
}

/**
 * SLM DATA GENERATOR - SaaS 360 Knowledge
 * Transforms real business data into training pairs for the local SLM.
 * Strictly anonymizes all customer and PII data.
 */

export class SLMDataGenerator {
    
    // --- ANONYMIZATION UTILS ---
    private static anonymizeName(name: string): string {
        if (!name) return "Client";
        return `Client_${name.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 1000)}`;
    }

    // --- PAIRS GENERATION ---

    /**
     * Generates stock knowledge pairs from Firestore
     */
    static async generateStockPairs(): Promise<SLMTrainingPair[]> {
        const stocks = await Nexus.adapter.query<StockItem>('stock_items');
        const pairs: SLMTrainingPair[] = [];

        stocks.forEach(item => {
            const itemName = item.ingredientName;
            const quantity = item.quantity || item.currentStock || 0;
            const unit = item.unit || "unités";
            const location = item.storageLocationId || "Zone inconnue";

            pairs.push({
                instruction: `Vérifie l'état du stock pour l'ingrédient ${itemName}.`,
                input: `Requête de disponibilité stock pour ${itemName}`,
                output: `Le stock actuel de ${itemName} est de ${quantity} ${unit}. Il est stocké dans : ${location}. Statut : ${item.status || 'ok'}.`,
                category: 'inventory'
            });

            if (item.status === 'low' || (quantity as number) < 5) {
                pairs.push({
                    instruction: `Quels ingrédients sont en rupture ou en stock faible ?`,
                    input: `Alerte stock faible`,
                    output: `ATTENTION : L'ingrédient ${itemName} est en stock faible (${quantity} ${unit} restants).`,
                    category: 'inventory'
                });
            }
        });

        return pairs;
    }

    /**
     * Generates Customer & Reservation knowledge from Firestore
     */
    static async generateReservationPairs(): Promise<SLMTrainingPair[]> {
        const reservations = await Nexus.adapter.query<Reservation>('reservations');
        const pairs: SLMTrainingPair[] = [];

        reservations.forEach(res => {
            const anonName = this.anonymizeName(res.customerName);
            pairs.push({
                instruction: `Consulte les détails de la réservation de ${anonName}.`,
                input: `Détails réservation ${res.id}`,
                output: `Réservation pour ${anonName} le ${res.date} à ${res.time}. Nombre de couverts : ${res.covers}. Statut : ${res.status}.${res.isVip ? " Client VIP." : ""}`,
                category: 'reservations'
            });
        });

        return pairs;
    }

    /**
     * Generates Menu & Recipe knowledge from Firestore
     */
    static async generateRecipePairs(): Promise<SLMTrainingPair[]> {
        const recipes = await Nexus.adapter.query<Recipe>('recipes');
        const pairs: SLMTrainingPair[] = [];

        recipes.forEach(recipe => {
            const ingredientsList = recipe.ingredients?.map((ing) => {
                return `${ing.quantity}${ing.unit} de ${ing.name}`;
            }).join(', ');
            pairs.push({
                instruction: `Comment préparer le plat : ${recipe.name} ?`,
                input: `Recette technique ${recipe.name}`,
                output: `Le plat ${recipe.name} appartient à la catégorie ${recipe.category}. Ingrédients nécessaires : ${ingredientsList || "Non spécifiés"}.`,
                category: 'kitchen'
            });
        });

        return pairs;
    }

    /**
     * Finance Knowledge from Firestore
     */
    static async generateFinancePairs(): Promise<SLMTrainingPair[]> {
        const accounts = await Nexus.adapter.query<Account>('accounts');
        const pairs: SLMTrainingPair[] = [];

        accounts.forEach(acc => {
            pairs.push({
                instruction: `Quel est le solde du compte ${acc.code} (${acc.name}) ?`,
                input: `Consultation compte compta ${acc.code}`,
                output: `Le compte ${acc.code} (${acc.name}) est un compte de type ${acc.type} (Classe ${acc.class}). Statut : ${acc.isActive ? "Actif" : "Inactif"}.`,
                category: 'accounting'
            });
        });

        return pairs;
    }

    /**
     * HACCP & Compliance Knowledge from Firestore
     */
    static async generateHACCPPairs(): Promise<SLMTrainingPair[]> {
        const logs = await Nexus.adapter.query<HygieneLog>('hygieneLogs', {
            orderBy: { field: 'createdAt', direction: 'desc' },
            limit: 20
        });
        const pairs: SLMTrainingPair[] = [];

        logs.forEach(log => {
            pairs.push({
                instruction: `Quel est l'état du dernier contrôle d'hygiène sur ${log.item} ?`,
                input: `Vérification conformité HACCP ${log.item}`,
                output: `Dernier contrôle sur ${log.item} (${log.zone}) effectué le ${new Date(log.createdAt).toLocaleDateString()}. Statut : ${log.status === 'ok' ? 'CONFORME' : 'ALERTE/NON-CONFORME'}.`,
                category: 'haccp'
            });
        });

        return pairs;
    }

    /**
     * HR & Staff Knowledge from Firestore
     */
    static async generateStaffHRPairs(): Promise<SLMTrainingPair[]> {
        const users = await Nexus.adapter.query<User>('users');
        const candidates = await Nexus.adapter.query<Candidate>('candidates');
        
        const pairs: SLMTrainingPair[] = [];

        // Staff
        users.forEach(u => {
            pairs.push({
                instruction: `Quel est le rôle de ${u.name} dans l'équipe ?`,
                input: `Infos employé ${u.name}`,
                output: `${u.name} occupe le poste de ${u.role}. Performance moyenne : ${u.performanceScore?.toFixed(1) || "N/A"}/5.`,
                category: 'staff'
            });
        });

        // Recruitment
        const openRoles = [...new Set(candidates.map(c => c.appliedRole))].filter((role): role is string => !!role);
        openRoles.forEach(role => {
            const applicants = candidates.filter(c => c.appliedRole === role && c.status === 'new');
            pairs.push({
                instruction: `Avancement du recrutement pour le poste de ${role} ?`,
                input: `Pipeline recrutement ${role}`,
                output: `Il y a actuellement ${applicants.length} candidat(s) en attente de traitement pour le poste de ${role}.`,
                category: 'recruitment'
            });
        });

        return pairs;
    }

    /**
     * Master export function
     */
    static async exportFullDataset(): Promise<string> {
        const systemPrompt = `Vous êtes l'IA locale 'Oracle Light' de Restaurant OS. Répondez de manière ultra-concise (max 2 phrases). Vous devez respecter strictement les accès utilisateur. Si on vous pose une question sur une catégorie à laquelle l'utilisateur n'a pas accès, ou pour toute action proactive, répondez : "FORCE_GEMINI_FALLBACK".`;
        
        const sets = await Promise.all([
            this.generateStockPairs(),
            this.generateReservationPairs(),
            this.generateRecipePairs(),
            this.generateFinancePairs(),
            this.generateHACCPPairs(),
            this.generateStaffHRPairs()
        ]);

        const allPairs = sets.flat();
        
        return allPairs.map(p => JSON.stringify({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `${p.instruction}${p.input ? `\nContext: ${p.input}` : ""}` },
                { role: "assistant", content: p.output }
            ]
        })).join('\n');
    }
}
