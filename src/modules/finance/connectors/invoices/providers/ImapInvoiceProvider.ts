import type { IEmailInvoiceProvider, EmailWithAttachments } from '../types';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * IMAP générique — couvre OVH, Infomaniak, et tous les hébergeurs mail.
 * Variables requises : IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASSWORD
 *
 * Pour activer : npm i imap-simple @types/imap-simple
 */
interface ImapPart {
    which?: string;
    body?: unknown;
    disposition?: {
        type?: string;
        params?: { filename?: string };
    };
}

interface ImapMessage {
    attributes: {
        uid: number | string;
        struct?: unknown[];
    };
    parts: ImapPart[];
}

export class ImapInvoiceProvider implements IEmailInvoiceProvider {
    readonly id = 'imap';

    async connect(_tenantId: string, _oauthCode: string): Promise<void> {
        logger.info('[ImapInvoiceProvider] connect (IMAP — config via env vars IMAP_HOST/IMAP_USER/IMAP_PASSWORD)');
    }

    async isConnected(_tenantId: string): Promise<boolean> {
        return !!(process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASSWORD);
    }

    async fetchUnprocessed(_tenantId: string): Promise<EmailWithAttachments[]> {
        const host     = process.env.IMAP_HOST;
        const port     = Number(process.env.IMAP_PORT ?? 993);
        const user     = process.env.IMAP_USER;
        const password = process.env.IMAP_PASSWORD;

        if (!host || !user || !password) {
            throw new Error('IMAP_HOST, IMAP_USER, IMAP_PASSWORD requis');
        }

        try {
            // @ts-expect-error — imap-simple optionnel, installer avec: npm i imap-simple @types/imap-simple
             
            const imapSimple = await import('imap-simple') as { connect: (opts: Record<string, unknown>) => Promise<Record<string, unknown> & { openBox: (boxName: string) => Promise<void>; search: (criteria: unknown[], fetchOptions: Record<string, unknown>) => Promise<ImapMessage[]> }>; getParts: (struct: unknown[]) => ImapPart[] };
            const connection = await imapSimple.connect({
                imap: { host, port, user, password, tls: true, authTimeout: 5000 },
            });
            await connection.openBox('INBOX');
            const messages = await connection.search(
                ['UNSEEN', ['SINCE', new Date(Date.now() - 7 * 86400 * 1000).toUTCString()]],
                { bodies: ['HEADER', ''], struct: true }
            );
            const result: EmailWithAttachments[] = [];
            for (const msg of messages) {
                const headerPart = msg.parts.find(p => p.which === 'HEADER');
                const header     = headerPart?.body as Record<string, string[]> | undefined;
                const allParts   = imapSimple.getParts(msg.attributes.struct ?? []);
                const attachments = allParts.filter(p =>
                    String(p?.disposition?.type ?? '').toLowerCase() === 'attachment'
                );
                if (attachments.length) {
                    result.push({
                        messageId:   String(msg.attributes.uid),
                        from:        header?.['from']?.[0] ?? '',
                        subject:     header?.['subject']?.[0] ?? '',
                        date:        header?.['date']?.[0] ?? '',
                        attachments: attachments.map(a => ({
                            filename:    String(a.disposition?.params?.filename ?? 'document.pdf'),
                            contentType: 'application/pdf',
                            data:        '',
                        })),
                    });
                }
            }
            await (connection as unknown as { end: () => Promise<void> }).end();
            return result;
        } catch (err) {
            logger.error('[ImapInvoiceProvider] fetchUnprocessed error', toError(err).message);
            return [];
        }
    }

    async markProcessed(messageId: string): Promise<void> {
        logger.info('[ImapInvoiceProvider] markProcessed', messageId);
    }
}
