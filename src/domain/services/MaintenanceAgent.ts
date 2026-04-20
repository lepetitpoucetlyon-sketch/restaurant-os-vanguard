// @ts-nocheck
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { logger } from "@/lib/axiom";
import { DNAInjector } from "@/lib/ai/DNAInjector";
import { MaintenanceTicket, MaintenanceAIAnalysis, MaintenanceTicketContext } from "@/types/maintenance.types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * 🤖 MaintenanceAgent - Restaurant OS
 * Gère l'automatisation du support technique et de la maintenance flotte.
 * Grade VI: Industrialized Security & Support.
 */
export const MaintenanceAgent = {
    /**
     * 1. SIGNALEMENT (Submit SOS)
     */
    async submitSOS(ticket: Omit<MaintenanceTicket, 'status' | 'createdAt' | 'updatedAt' | 'priority' | 'id'>): Promise<string> {
        try {
            const ticketId = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
            
            // Calcul automatique de la priorité
            let priority: MaintenanceTicket['priority'] = 'medium';
            if (ticket.type === 'CRITICAL_BUG') priority = 'critical';
            else if (ticket.type === 'DATA_INCONSISTENCY') priority = 'high';
            else if (ticket.type === 'PERFORMANCE') priority = 'medium';
            else priority = 'low';

            const now = new Date().toISOString();
            const data: MaintenanceTicket = {
                ...ticket,
                id: ticketId,
                status: 'pending',
                priority,
                createdAt: now,
                updatedAt: now,
            };

            await Nexus.adapter.set(`maintenanceTickets/${ticketId}`, data);
            
            logger.info('MaintenanceAgent: [Step 1] SOS Ticket signals', { 
                ticketId, 
                domain: ticket.pageKey,
                type: ticket.type 
            });
            
            // Lancement immédiat de la contextualisation
            this.runAutoMaintenance(ticketId, data);

            return ticketId;
        } catch (error) {
            logger.error('MaintenanceAgent: SOS submission failed', { error });
            throw error;
        }
    },

    /**
     * ORCHESTRATEUR CENTRAL (Steps 2 to 8)
     */
    async runAutoMaintenance(ticketId: string, ticketData: MaintenanceTicket) {
        try {
            // 2. CONTEXTUALISATION
            logger.info('MaintenanceAgent: [Step 2] Collecting system context', { ticketId, domain: ticketData.pageKey });
            const context: MaintenanceTicketContext = {
                route: ticketData.systemState.currentRoute,
                domain: ticketData.pageKey || 'Universal',
                logs: ticketData.logs.slice(-50), // Plus de logs pour l'analyse
                tenant: ticketData.tenantId,
                activeModules: ticketData.systemState.activeModules
            };

            // 3. DIAGNOSTIC & 4. PROPOSITION PR
            logger.info('MaintenanceAgent: [Step 3-4] AI Diagnosis & PR Generation', { ticketId });
            const analysis = await this.analyzeWithAI(ticketData, context);

            // 5. VALIDATION (Prêt pour revue Admin dans le MCC)
            await Nexus.adapter.update(`maintenanceTickets/${ticketId}`, {
                status: 'pr_ready',
                aiAnalysis: analysis,
                updatedAt: new Date().toISOString(),
            });
            logger.info('MaintenanceAgent: [Step 5] PR Ready for Admin Review', { ticketId, diagnostic: analysis.summary });

            // Note: Steps 6 & 7 (Application & Vérification) sont manuelles/semi-auto via l'UI.
        } catch (error) {
            logger.error('MaintenanceAgent: Maintenance cycle failed', { ticketId, error });
        }
    },

    /**
     * AI CORE : Analyse Gemini Pro avec Injection d'ADN
     */
    async analyzeWithAI(ticket: MaintenanceTicket, context: MaintenanceTicketContext): Promise<MaintenanceAIAnalysis> {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // 🧬 Récupération de l'ADN Client
        const tenantDNA = await DNAInjector.getTenantDNA(ticket.tenantId);

        const prompt = `
            You are the Senior SRE for Restaurant OS Empire.
            
            === CLIENT DNA (Rules to respect) ===
            ${tenantDNA}

            === MAINTENANCE REQUEST ===
            - Ticket ID: ${ticket.id}
            - Domain/Module: ${ticket.pageKey || 'Universal'}
            - Issue: ${ticket.description}
            - Type: ${ticket.type}
            - Technical Context: ${JSON.stringify(context)}

            === TASK ===
            1. Identify root cause in the module "${ticket.pageKey || 'Universal'}".
            2. Provide a code fix OR a configuration change suggestion.
            3. Ensure compliance with NF525 and the client's DNA rules.
            4. If it's a UI glitch, specify components to check.

            Return JSON format only:
            {
                "summary": "Short explanation",
                "potentialCause": "Technical depth",
                "affectedFiles": ["src/app/..."],
                "proposedFix": "diff or instruction",
                "domainConfig": {} // Optional suggested config update
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Nettoyage JSON strict
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { 
                summary: "Analyse brute (Echec parsing JSON)", 
                potentialCause: "Analysis engine fallback", 
                affectedFiles: [], 
                proposedFix: text 
            };
        }

        try {
            const analysis: MaintenanceAIAnalysis = JSON.parse(jsonMatch[0]);
            return analysis;
        } catch (e) {
            return { 
                summary: "Erreur de formatage AI", 
                potentialCause: "JSON Parse Error", 
                affectedFiles: [], 
                proposedFix: text 
            };
        }
    },

    /**
     * 8. NOTIFICATION (Simple Log Final)
     */
    async finalizeTicket(ticketId: string, resolution: string) {
        logger.info(`🏛️ [EMPIRE NOTIFICATION] Ticket ${ticketId} résolu.`, { resolution });
        console.log(`%c 🛡️ NEURAL SHIELD : RESOLUTION ACHIEVED - TICKET ${ticketId} `, 'background: #C5A059; color: black; font-weight: bold;');
    }
};
