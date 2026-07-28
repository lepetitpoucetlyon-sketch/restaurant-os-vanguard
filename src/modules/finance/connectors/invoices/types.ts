export interface EmailAttachment {
    filename: string;
    contentType: string;
    /** Base64-encoded content or raw Buffer. */
    data: string | Buffer;
}

export interface EmailWithAttachments {
    messageId: string;
    from: string;
    subject: string;
    date: string; // ISO 8601
    attachments: EmailAttachment[];
}

export interface IEmailInvoiceProvider {
    readonly id: string;
    /** OAuth handshake — stores token in Nexus tenants/{id}/connectors/invoices. */
    connect(tenantId: string, oauthCode: string): Promise<void>;
    fetchUnprocessed(tenantId: string): Promise<EmailWithAttachments[]>;
    markProcessed(messageId: string): Promise<void>;
    isConnected(tenantId: string): Promise<boolean>;
}
