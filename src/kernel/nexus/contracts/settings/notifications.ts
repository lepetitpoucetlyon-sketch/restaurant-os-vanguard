export type NotificationChannel = 'push' | 'email' | 'sms' | 'whatsapp' | 'slack';

export interface AlertRouting {
    eventType: string;
    recipients: string[];
    channels: NotificationChannel[];
    enabled: boolean;
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
