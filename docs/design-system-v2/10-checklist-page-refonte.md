# 10 — Checklist d'Homologation & Refonte d'une Page (20 Points)

Toute page refondue en V5 doit valider les 20 critères suivants avant validation :

## Structure & Layout
- [ ] 1. La page est enveloppée dans `<PageShell>` avec titre, icône et fil d'Ariane cohérent.
- [ ] 2. Les sous-sections utilisent `<SectionCard>` avec la variante adaptée (`default`, `glass`, `premium`).
- [ ] 3. Les indicateurs numériques sont disposés dans un `<StatGrid>` responsive.
- [ ] 4. Les barres de filtres et CTA utilisent `<ActionBar>`.

## Sécurité & RBAC
- [ ] 5. La page est protégée par `export default withPageGuard(Page, "pageKey")`.
- [ ] 6. Tous les onglets internes sont protégés par `<TabGuard pageKey="..." tabKey="...">`.
- [ ] 7. Toutes les actions sensibles (suppression, remise, export) sont filtrées par `<ActionGuard>`.
- [ ] 8. Les éléments conditionnels intra-page utilisent `<RoleAwareView>`.

## Design & Tokens Sémantiques
- [ ] 9. Aucune couleur hexadécimale hardcodée (100% de tokens sémantiques Tailwind v4).
- [ ] 10. Les contrastes de texte respectent les normes WCAG AA (ou AAA sur POS/KDS).
- [ ] 11. Les typographies utilisent exclusivement `font-brand`, `font-ui` et `font-mono`.
- [ ] 12. Les rayons de bordure respectent les tokens standard `--radius-*`.

## Responsive & Cibles Matérielles
- [ ] 13. La page s'affiche sans défilement horizontal ni troncature sur mobile (375px).
- [ ] 14. La page dispose d'une disposition optimisée sur tablette tactile (iPad 1024px).
- [ ] 15. Le mode Kiosk tactile est pris en charge sur les vues interactives (POS/KDS).
- [ ] 16. Les cibles tactiles respectent la taille minimale de 44×44px.

## États Asynchrones & Robustesse
- [ ] 17. L'état de chargement initial affiche un `<SkeletonList>` approprié.
- [ ] 18. L'état vide en l'absence de données affiche un `<EmptyState>` v2 avec CTA.
- [ ] 19. Aucune erreur console JavaScript (`read_console_messages` vierge).
- [ ] 20. Typecheck `npx tsc --noEmit` et tests Vitest 100% verts.
