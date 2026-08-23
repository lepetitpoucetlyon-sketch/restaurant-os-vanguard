# 09 — Les 12 Antipatterns Proscrits (Impeccable Lint Rules)

Liste des erreurs courantes à éradiquer lors de la refonte des pages :

| # | Mauvaise Pratique (Antipattern) | Bonne Pratique (Standard V2) |
|---|---|---|
| 1 | `bg-surface-card/50 animate-pulse` inline | Utiliser `<SkeletonList variant="..." />` |
| 2 | En-têtes recomposés à la main avec `<h1>` ad-hoc | Utiliser `<PageShell title="..." />` |
| 3 | Couleurs hardcodées (`#C5A059`, `#111827`, `text-black`) | Utiliser les tokens `text-brand`, `bg-surface-bg`, `text-text-primary` |
| 4 | Conteneur avec `rounded-[2rem]` et bordures arbitraires | Utiliser `<SectionCard variant="glass | default">` |
| 5 | Onglets sans protection de rôle | Encapsuler chaque `<TabsTrigger>` dans `<TabGuard>` |
| 6 | Boutons sensibles (remises, clôtures) visibles par tous | Encapsuler dans `<ActionGuard action="...">` |
| 7 | Flash blanc ou layout vide lors du chargement de données | Afficher des skeletons structurés ou un `LoadingState` |
| 8 | Media queries cassées écrites avec des largeurs magiques (`@media (max-width: 768px)`) | Utiliser les tokens `--bp-*` et le hook `useBreakpoint()` |
| 9 | Cibles tactiles trop petites (< 40px) sur les écrans tactiles | Hauteur minimale de 44px sur tous les boutons opérationnels |
| 10 | Modales qui débordent de l'écran mobile sans défilement interne | Utiliser `<BottomSheet>` sur mobile et `<Modal>` sur desktop |
| 11 | Utilisation de polices non déclarées dans le design system | Utiliser exclusivement `font-brand`, `font-ui` et `font-mono` |
| 12 | Tableaux sans état vide ni pagination claire | Utiliser `<EmptyState v2>` en l'absence de données |
