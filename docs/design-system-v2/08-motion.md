# 08 — Dynamique de Mouvement & Courbes d'Animation (Motion)

Les animations apportent du feedback tactile et de la fluidité sans jamais ralentir la saisie en caisse.

## 1. Les 5 Courbes Officielles (Easings)

| Nom du Token | Courbe Bézier | Usage Recommandé |
|---|---|---|
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Transitions de pages, ouvertures de modales et accordéons |
| `--ease-out-back` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Badges de notification, compteurs incrémentés, popovers |
| `--ease-in-out-quint` | `cubic-bezier(0.83, 0, 0.17, 1)` | Glissements d'onglets, carrousels de catalogue |
| `--ease-spring` | `cubic-bezier(0.4, 0.5, 0.3, 1.4)` | Enfoncement des touches du pavé numérique POS et boutons |
| `--ease-bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Alertes d'erreur critique, échec d'authentification PIN |

## 2. Durations Standardisées

- **Instant (`100ms`)** : Feedback de clic, hover de bouton.
- **Fast (`200ms`)** : Apparition de tooltip, changement de statut badge.
- **Normal (`350ms`)** : Ouverture de volet latéral, transition de vue responsive.
- **Dramatic (`700ms`)** : Démarrage du splash screen cinématique.

## 3. Règle `prefers-reduced-motion`
Toutes les animations Framer Motion doivent désactiver les translations et opacités prolongées lorsque l'utilisateur a configuré son système en mouvement réduit :
```tsx
const shouldReduceMotion = useReducedMotion();
<motion.div animate={{ opacity: 1, y: shouldReduceMotion ? 0 : 10 }} />
```
