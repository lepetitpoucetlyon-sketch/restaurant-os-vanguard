/**
 * 🎨 SHARED UI TYPES
 * Types légers sans dépendances pour éviter les dépendances circulaires.
 */

/** Nouveau prop sémantique — `brand` utilise --action-primary (couleur tenant) */
export type StatCardIntent = "brand" | "success" | "warning" | "danger" | "info" | "neutral";
