import 'server-only';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

const execFileAsync = promisify(execFile);

export interface ScraplingCatalogItem {
    name: string;
    description: string;
    price: number;
    category: string;
    source?: string;
}

export interface ScraplingResult {
    success: boolean;
    url: string;
    status: number;
    metadata: {
        title: string;
        description: string;
        og_title: string;
        og_image: string;
        favicon: string;
    };
    contact?: {
        telephones: string[];
        emails: string[];
    };
    socials: Record<string, string>;
    internal_target_pages: string[];
    catalog_items?: ScraplingCatalogItem[];
    json_ld: Record<string, unknown>[];
    headings: {
        h1: string[];
        h2: string[];
        h3: string[];
    };
    crawled_subpages_count?: number;
    error?: string;
}

export interface ScraplingOptions {
    stealth?: boolean;
    crawl?: boolean;
    timeoutSeconds?: number;
}

/**
 * ⚡ ScraplingBridge — High-speed Python Scrapling integration for Restaurant OS.
 * Uses d4vinci/Scrapling for stealth requests, adaptive parsing, and metadata extraction.
 */
export const ScraplingBridge = {
    async scrape(url: string, options: ScraplingOptions = {}): Promise<ScraplingResult> {
        const pythonBin = path.join(process.cwd(), '.venv', 'bin', 'python');
        const scriptPath = path.join(process.cwd(), 'scripts', 'scrapling_agent.py');
        const args = [scriptPath, '--url', url];

        if (options.stealth) args.push('--stealth');
        if (options.crawl) args.push('--crawl');
        if (options.timeoutSeconds) args.push('--timeout', String(options.timeoutSeconds));

        try {
            logger.info(`[ScraplingBridge] Scraping ${url} (stealth=${Boolean(options.stealth)})`);
            const { stdout, stderr } = await execFileAsync(pythonBin, args, {
                timeout: (options.timeoutSeconds || 15) * 1000,
                maxBuffer: 10 * 1024 * 1024,
            });

            if (stderr) {
                logger.debug(`[ScraplingBridge] stderr: ${stderr.trim()}`);
            }

            // Extract the JSON portion from stdout
            const jsonStart = stdout.indexOf('{');
            const jsonEnd = stdout.lastIndexOf('}');
            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error(`Invalid JSON output from Scrapling: ${stdout}`);
            }

            const rawJson = stdout.slice(jsonStart, jsonEnd + 1);
            return JSON.parse(rawJson) as ScraplingResult;
        } catch (err) {
            const error = toError(err);
            logger.error(`[ScraplingBridge] Scrape failed for ${url}: ${error.message}`);
            return {
                success: false,
                url,
                status: 500,
                metadata: { title: '', description: '', og_title: '', og_image: '', favicon: '' },
                socials: {},
                internal_target_pages: [],
                json_ld: [],
                headings: { h1: [], h2: [], h3: [] },
                error: error.message,
            };
        }
    },
};
