import { chromium } from 'playwright';

/**
 * VISUAL IDENTITY EXTRACTOR (Nexus V15.5)
 * The "Eye" of the Branding Engine.
 * Responsible for capturing a visual representation of a prospect's digital presence.
 */
export const VisualIdentityExtractor = {
    /**
     * Captures a screenshot of a given URL and returns it as a Base64 string.
     * Uses Playwright Headless for industrial performance.
     */
    captureUrl: async (url: string): Promise<string> => {
        console.log(`[Nexus Vision] Launching capture for: ${url}`);
        
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

            console.log(`[Nexus Vision] Snapshot captured successfully (${buffer.length} bytes)`);
            
            return buffer.toString('base64');
        } catch (error) {
            console.error(`[Nexus Vision] Capture failed:`, error);
            throw new Error(`Failed to capture visual identity from ${url}`);
        } finally {
            await browser.close();
        }
    }
};
