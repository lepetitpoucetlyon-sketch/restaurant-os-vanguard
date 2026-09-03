export type NotificationChannel = 'push' | 'email' | 'sms' | 'whatsapp' | 'slack';

export interface AlertRouting {
    eventType: string;
    recipients: string[];
    channels: NotificationChannel[];
    enabled: boolean;
    /** Responsabilité métier ciblée (RESP_HYGIENE, RESP_FISCAL…) — lue par AlertRouter. */
    responsibility?: string;
    /** Rôles de repli si aucun destinataire nommé — normalisés par AlertRouter. */
    roles?: string[];
    /** Délai (min) avant escalade au niveau supérieur (lot escalade). */
    escalateAfterMinutes?: number;
    /** Responsabilité vers laquelle escalader (lot escalade). */
    escalateTo?: string;
}

export interface NotificationsConfig {
    globalSound: boolean;
    doNotDisturb: boolean;
    dndStartTime: string;
    dndEndTime: string;
}

export interface ReportSchedule {
    id: string;
    name: string;
    type: 'daily' | 'weekly' | 'monthly';
    sendTime: string;
    recipients: string[];
    content: string[];
}
