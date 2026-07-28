export type AutomationTrigger =
    | { type: 'birthday'; daysBeforeDay: number }
    | { type: 'inactivity'; daysInactive: number }
    | { type: 'post_visit'; daysAfterVisit: number };

export interface CampaignRecipient {
    email: string;
    name?: string;
    vars?: Record<string, string>;
}

export interface Campaign {
    id: string;
    subject: string;
    htmlContent: string;
    recipients: CampaignRecipient[];
    scheduledAt?: string; // ISO 8601
}

export interface CampaignStats {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
}

export interface Contact {
    email: string;
    name?: string;
    phone?: string;
    tags?: string[];
    attributes?: Record<string, string>;
}

export interface IEmailMarketingProvider {
    readonly id: string;
    /** Returns the provider campaign ID. */
    sendCampaign(campaign: Campaign): Promise<string>;
    fetchStats(campaignId: string): Promise<CampaignStats>;
    syncContacts(contacts: Contact[]): Promise<void>;
    /** Returns the provider automation ID. */
    createAutomation(trigger: AutomationTrigger): Promise<string>;
}
