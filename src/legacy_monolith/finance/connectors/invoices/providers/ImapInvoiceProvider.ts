import type { IEmailInvoiceProvider, EmailWithAttachments } from '../types';
import { logger } from '@/lib/logger';

/**
 * IMAP générique — couvre OVH, Infomaniak, et tous les hébergeurs mail.
 * Variables requises : IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASSWORD
 *
 * Pour activer : npm i imap-simple @types/imap-simple
 */
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
             
            const imapSimple = await import('imap-simple') as { connect: (opts: Record<string, unknown>) => Promise<Record<string, unknown> & { openBox: (boxName: string) => Promise<void>; search: (criteria: unknown[], fetchOptions: Record<string, unknown>) => Promise<unknown[]> }>; getParts: (struct: unknown[]) => Record<string, unknown>[] };
            const connection = await imapSimple.connect({
                imap: { host, port, user, password, tls: true, authTimeout: 5000 },
            });
            await connection.openBox('INBOX');
            const messages: Record<string, unknown>[] = await connection.search(
                ['UNSEEN', ['SINCE', new Date(Date.now() - 7 * 86400 * 1000).toUTCString()]],
                { bodies: ['HEADER', ''], struct: true }
            ) as Record<string, unknown>[];
            const result: EmailWithAttachments[] = [];
            for (const msg of messages) {
                const headerPart = (msg.parts as Record<string, unknown>[]).find((p: Record<string, unknown>) => p.which === 'HEADER');
                const header     = headerPart?.body as Record<string, string[]> | undefined;
                const allParts: Record<string, unknown>[] = imapSimple.getParts((msg.attributes as Record<string, unknown>).struct as unknown[] ?? []);
                const attachments = allParts.filter((p: Record<string, unknown>) =>
                    String((p?.disposition as Record<string, unknown>)?.type ?? '').toLowerCase() === 'attachment'
                );
                if (attachments.length) {
                    result.push({
                        messageId:   String((msg.attributes as Record<string, unknown>).uid),
                        from:        header?.['from']?.[0] ?? '',
                        subject:     header?.['subject']?.[0] ?? '',
                        date:        header?.['date']?.[0] ?? '',
                        attachments: attachments.map((a: Record<string, unknown>) => ({
                            filename:    String((a.disposition as Record<string, Record<string, unknown>>)?.params?.filename ?? 'document.pdf'),
                            contentType: 'application/pdf',
                            data:        '',
                        })),
                    });
                }
            }
            await (connection as unknown as { end: () => Promise<void> }).end();
            return result;
        } catch (err) {
            logger.error('[ImapInvoiceProvider] fetchUnprocessed error', String(err));
            return [];
        }
    }

    async markProcessed(messageId: string): Promise<void> {
        logger.info('[ImapInvoiceProvider] markProcessed', messageId);
    }
}
