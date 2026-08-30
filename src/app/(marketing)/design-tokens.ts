/**
 * Palette marketing — glassmorphisme sombre distinct du DS opérationnel.
 *
 * DÉCISION PRODUIT 2026-08-30 (AUDIT-DS) : les pages marketing (conversion
 * prospects) ont un langage visuel distinct de l'UI applicative (gérants/
 * serveurs). Ce fichier documente et normalise ces tokens pour éviter les
 * couleurs `white/[0.02]` hardcodées éparpillées et permettre un ajustement
 * global de l'identité conversion.
 *
 * Ces tokens sont pour usage interne dans `src/app/(marketing)/**` uniquement
 * (exempté du cliquet DS opérationnel par `scripts/measure/measures.mjs` m11).
 */

// Alphas d'overlay glassmorphisme (sur fond sombre)
export const marketingGlass = {
  surfaceMuted: "bg-white/[0.02]",
  surfaceCard: "bg-white/[0.04]",
  surfaceHover: "bg-white/[0.05]",
  surfaceActive: "bg-white/[0.06]",
  surfaceElevated: "bg-white/[0.08]",
} as const;

// Borders subtiles (sur fond sombre)
export const marketingBorder = {
  subtle: "border-white/[0.06]",
  default: "border-white/[0.08]",
  hover: "border-white/[0.12]",
  focus: "border-white/[0.15]",
  accent: "border-amber-500/50",
} as const;

// Texte marketing (contrastes calculés pour fond sombre glassmorphisme)
export const marketingText = {
  primary: "text-white",
  secondary: "text-white/70",
  muted: "text-white/45",
  hint: "text-white/25",
  brand: "text-amber-400",
  brandHover: "hover:text-amber-300",
} as const;

// Accents doré / conversion (héro CTA, focus, boutons primaires marketing)
export const marketingAccent = {
  ring: "focus:ring-amber-500/25",
  ringStrong: "focus:ring-amber-500/50",
  border: "focus:border-amber-500/50",
  hoverGlow: "hover:bg-amber-500/5",
  gradientHero: "bg-gradient-to-br from-amber-500/10 to-transparent",
} as const;

// Layouts standards de card marketing (composables via cn())
export const marketingCard = {
  base: "rounded-2xl border transition-all duration-500",
  interactive: "group hover:bg-white/[0.04] hover:border-white/[0.12]",
  padding: "p-6 sm:p-8",
} as const;

export const MARKETING_TOKENS = {
  glass: marketingGlass,
  border: marketingBorder,
  text: marketingText,
  accent: marketingAccent,
  card: marketingCard,
} as const;
