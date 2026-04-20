// @ts-nocheck
"use server";

import { BrandingService, BrandInput } from "@/domain/services/BrandingService";

/**
 * SERVER ACTION: extractBrandingFromUrl
 * Securely triggers URL analysis from the server side to avoid playwright leaks.
 */
export async function extractBrandingFromUrl(url: string): Promise<BrandInput> {
    return await BrandingService.extractFromUrl(url);
}
