/**
 * 📊 Analytics & IoT Types
 */

export interface IoTMetric {
    id: string;
    name: string;
    value: number;
    type: 'temperature' | 'hz' | 'humidity' | 'pressure';
    status: 'normal' | 'alert' | 'critical';
    trend: 'up' | 'down' | 'stable';
    anomalous: boolean;
    timestamp: string;
}

export interface ComplianceAlert {
    id: string;
    userName: string;
    message: string;
}

export interface ProfitabilityAlert {
    productId: string;
    productName: string;
    currentMarginInCents: number;
    suggestedPriceInCents: number;
    impactLevel: 'high' | 'medium' | 'low';
    category: string;
}
