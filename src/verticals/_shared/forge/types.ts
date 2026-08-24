/**
 * 🏭 Types purs pour le générateur Vertical Forge.
 *
 * Découplé de `generateVertical.ts` pour casser les cycles circulaires avec les templates.
 */

export interface GeneratedFile {
    /** Chemin relatif à la racine du repo. */
    path: string;
    content: string;
    /** Ne pas écraser si le fichier existe déjà (composants métier, seeds édités…). */
    skipIfExists?: boolean;
}

export interface WiringPatch {
    file: string;
    /** Ancre textuelle où insérer (ligne existante après laquelle insérer). */
    anchor: string;
    snippet: string;
    description: string;
}

export interface ForgeOutput {
    slug: string;
    files: GeneratedFile[];
    wiring: WiringPatch[];
    issues: string[];
}
