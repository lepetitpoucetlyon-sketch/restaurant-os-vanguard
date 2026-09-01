import { logger } from '@/lib/logger';

export const VisualIdentityExtractor = {
    /**
     * Captures a screenshot of a given URL and returns it as a Base64 string.
     * Uses Playwright Headless for industrial performance.
     */
    captureUrl: async (url: string): Promise<string> => {
        if (typeof window !== 'undefined') {
            throw new Error("VisualIdentityExtractor is server-only and cannot be executed on the client side.");
        }

        // Prevent Turbopack from bundling playwright internal fonts in client graph
        const playwrightModule = await (eval('import("playwright")') as Promise<typeof import('playwright')>);
        const chromium = playwrightModule.chromium;
        
        logger.info(`[Nexus Vision] Launching capture for: ${url}`);
        
        const browser = await chromium.launch({
            headless: true,
        });

        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            deviceScaleFactor: 1,
        });

        const page = await context.newPage();

        try {
            // Navigation with timeout and wait for network idle
            await page.goto(url, { 
                waitUntil: 'networkidle', 
                timeout: 30000 
            });

            // Handling potential cookie banners or overlays (optional but recommended)
            // For now, take a high-quality snapshot above the fold
            const buffer = await page.screenshot({
                type: 'jpeg',
                quality: 80,
                fullPage: false,
            });

            logger.info(`[Nexus Vision] Snapshot captured successfully (${buffer.length} bytes)`);
            
            return buffer.toString('base64');
        } catch (error) {
            console.error(`[Nexus Vision] Capture failed:`, error);
            throw new Error(`Failed to capture visual identity from ${url}`);
        } finally {
            await browser.close();
        }
    }
};
