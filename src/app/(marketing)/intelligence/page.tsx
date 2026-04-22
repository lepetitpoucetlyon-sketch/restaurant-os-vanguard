import React from 'react';
import { IntelligenceController } from './IntelligenceController';

// 🛰️ SERVER-SIDE DATA FETCHING (INDUSTRIAL PRE-HYDRATION)
// In production, these would be calls to Firestore Admin or a dedicated Internal API.
async function getIntelligenceData() {
    // Simulating database latency
    // await new Promise(resolve => setTimeout(resolve, 100));

    return {
        reviews: [
            { 
                id: '1', 
                author: 'Jean D.', 
                content: 'Service impeccable, mais un peu bruyant.', 
                rating: 4, 
                platform: 'google' as const, 
                date: new Date().toISOString(), 
                replied: false, 
                suggestedReply: "Merci Jean ! On travaille sur l'acoustique.",
                sentiment: 'positive' as const
            },
            { 
                id: '2', 
                author: 'Marie L.', 
                content: 'Le meilleur burger de Paris.', 
                rating: 5, 
                platform: 'tripadvisor' as const, 
                date: new Date().toISOString(), 
                replied: true,
                sentiment: 'positive' as const
            },
        ],
        complianceAlerts: [
            { id: 'c1', userName: 'Paul B.', message: 'Repos compensateur non respecté (11h requis).' },
        ],
        equipmentMetrics: [
            { 
                id: 'm1', 
                name: 'Chambre Froide 1', 
                value: 4.2, 
                type: 'temperature' as const, 
                status: 'normal' as const, 
                trend: 'stable' as const, 
                anomalous: false, 
                timestamp: new Date().toISOString() 
            },
            { 
                id: 'm2', 
                name: 'Four Vario', 
                value: 180, 
                type: 'hz' as const, 
                status: 'alert' as const, 
                trend: 'up' as const, 
                anomalous: true, 
                timestamp: new Date().toISOString() 
            },
        ],
        profitabilityAlerts: [
            { 
                productId: 'p1', 
                productName: 'Entrecôte 300g', 
                currentMarginInCents: 6500, 
                suggestedPriceInCents: 2800, 
                impactLevel: 'high' as const, 
                category: 'Viandes' 
            },
        ]
    };
}

/**
 * 🛰️ IntelligencePage - Reactor RSC Edition
 * Zero-client-bundle data rendering.
 */
export default async function IntelligencePage() {
    const data = await getIntelligenceData();

    return (
        <div className="flex flex-1 flex-col bg-bg-primary h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] -m-4 lg:-m-8 overflow-hidden relative pb-24 lg:pb-0">
            <IntelligenceController data={data} />
        </div>
    );
}
