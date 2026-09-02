import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint PWA Web Share Target
 * Permet de recevoir des documents partagés (BL, factures fournisseurs, photos de livraison)
 * directement depuis l'appareil du restaurateur et de rediriger vers l'écran de réception.
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const name = formData.get('name')?.toString() || '';
        const description = formData.get('description')?.toString() || '';
        const media = formData.get('media');

        // Log d'ingestion technique du partage PWA
        const hasMedia = media instanceof File && media.size > 0;
        const targetUrl = new URL('/admin/inventory/reception', req.url);
        targetUrl.searchParams.set('shared', 'true');
        if (name) targetUrl.searchParams.set('name', encodeURIComponent(name));
        if (hasMedia) targetUrl.searchParams.set('mediaType', encodeURIComponent((media as File).type));

        // Redirection 303 (See Other) canonique pour la Web Share Target API PWA
        return NextResponse.redirect(targetUrl, 303);
    } catch (error) {
        // En cas d'erreur de parsing multipart, redirection de secours vers la réception
        const fallbackUrl = new URL('/admin/inventory/reception', req.url);
        return NextResponse.redirect(fallbackUrl, 303);
    }
}
