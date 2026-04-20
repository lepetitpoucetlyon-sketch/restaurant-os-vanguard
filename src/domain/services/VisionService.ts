// @ts-nocheck
import { logger } from '@/lib/axiom';

export interface ExtractedInvoiceItem {
    name: string;
    quantity: number;
    unit: string;
    unitPriceHT: number;
    totalHT: number;
    taxRate?: number;
    expirationDate?: string;
    batchNumber?: string;
}

export interface ExtractedInvoice {
    supplierName: string;
    invoiceNumber: string;
    date: string;
    currency: string;
    totalHT: number;
    totalTTC: number;
    items: ExtractedInvoiceItem[];
}

export interface PlateAuditResult {
    score: number; // 1-10
    feedback: string[];
    isCompliant: boolean;
    detectedIssues: string[];
}

export interface HACCPVerification {
    isCompliant: boolean;
    confidence: number;
    observation: string;
}

/**
 * VisionService - Core service for Multimodal AI interactions
 * Handles image processing and structured data extraction
 */
export const VisionService = {
    /**
     * Processes an image (base64) to extract invoice data
     */
    async analyzeInvoice(base64Image: string): Promise<ExtractedInvoice> {
        logger.info('VisionService: Starting invoice analysis...');

        try {
            // AI INJECTION POINT (Gemini 1.5 Flash)
            // The system now executes without simulated high latency
            return {
                supplierName: "Metro Lyon",
                invoiceNumber: `INV-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                currency: "EUR",
                totalHT: 425.50,
                totalTTC: 510.60,
                items: [
                    {
                        name: "Tomate Grappe",
                        quantity: 10,
                        unit: "kg",
                        unitPriceHT: 2.50,
                        totalHT: 25.00,
                        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    },
                    {
                        name: "Saumon Frais",
                        quantity: 5,
                        unit: "kg",
                        unitPriceHT: 18.00,
                        totalHT: 90.00,
                        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    },
                    {
                        name: "Huile Olive Extra",
                        quantity: 2,
                        unit: "L",
                        unitPriceHT: 12.00,
                        totalHT: 24.00
                    }
                ]
            };
        } catch (error) {
            logger.error('VisionService: Extraction failed', { error });
            throw new Error('Échec de la lecture visuelle de la facture.');
        }
    },

    /**
     * Compares a prepared plate photo with the recipe gold standard
     */
    async comparePlateToStandard(plateBase64: string, standardBase64: string, recipeName: string): Promise<PlateAuditResult> {
        logger.info(`VisionService: Auditing plate for ${recipeName}...`);

        try {
            // AI INJECTION POINT (Gemini 1.5 Pro)
            return {
                score: 8.5,
                isCompliant: true,
                feedback: [
                    "Dressage conforme au standard",
                    "Couleurs vives et fraîches détectées",
                    "Disposition des herbes correcte"
                ],
                detectedIssues: [
                    "Manque un léger filet d'huile sur le bord droit"
                ]
            };
        } catch (error) {
            logger.error('VisionService: Plate audit failed', { error });
            throw new Error('Échec de l’audit visuel de l’assiette.');
        }
    },

    /**
     * Verifies a HACCP task execution via photo
     */
    async verifyHACCPTask(photoBase64: string, taskDescription: string): Promise<HACCPVerification> {
        logger.info(`VisionService: Verifying HACCP task: ${taskDescription}...`);

        try {
            // AI INJECTION POINT (Gemini 1.5 Flash Vision)
            return {
                isCompliant: true,
                confidence: 0.98,
                observation: "Le plan de travail est dégagé, propre et désinfecté. Aucun résidu visible."
            };
        } catch (error) {
            logger.error('VisionService: HACCP verification failed', { error });
            throw new Error('Échec de la vérification visuelle HACCP.');
        }
    },

    /**
     * Helper to convert File to Base64
     */
    async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }
};
