# 00 — Principes Fondamentaux du Design System V2

Restaurant OS Core repose sur une philosophie visuelle haut de gamme combinant la rigueur opérationnelle et l'esthétique "Empire Luxury Intelligence".

## Les 10 Principes Directeurs

1. **Souveraineté Esthétique du Tenant** : L'interface s'adapte dynamiquement à la charte graphique de chaque restaurant (couleur primaire, typographie, logo, rayons) tout en conservant une lisibilité et des contrastes parfaits.
2. **Densité Adaptative** :
   - *Mode Opérations (POS, KDS, Floor Plan, Stock)* : Densité compacte, cibles tactiles minimales de 44×44px, zéro scroll vertical superflu, contrastes AAA (7:1).
   - *Mode Direction (Finance, Analytics, RH)* : Densité confort, espacements aérés, visualisations analytiques riches.
3. **Zéro Flash of Unbranded Content (FOUT)** : Préchargement des assets clés (`<link rel="preload">`) et transition cinématique de démarrage (Splash Screen universel).
4. **Hiérarchie Typographique Trilatérale** :
   - Titres & Identité : Serif d'apparat (`Playfair Display`, `Cormorant Garamond`).
   - Interface & Données Opérationnelles : Sans-serif haute lisibilité (`Inter`, `Outfit`).
   - Valeurs Monétaires, Codes & Logs : Monospace de précision (`JetBrains Mono`).
5. **Glassmorphism Sobre & Précis** : Fond sombre `#0B0B0C`, cartes à translucidité contrôlée (`backdrop-blur-xl`, `border-white/10`), halo de marque réactif aux couleurs du tenant.
6. **Motion & Feedback Tactile Réactif** : Animations expressives utilisant des courbes physiques (spring, expo) d'une durée maximale de 200 à 350ms, sans latence pour les flux de caisse.
7. **Accessibilité & Préférences Utilisateur** : Respect inconditionnel de `prefers-reduced-motion` et conformité aux standards WCAG 2.1 AA/AAA.
8. **Ségrégation RBAC Native** : L'interface ne présente jamais d'actions ou d'onglets non autorisés (masquage ou désactivation explicite via `<TabGuard>` et `<ActionGuard>`).
9. **Multi-Device First** : Conception dédiée pour 4 cibles matérielles distinctes : Mobile PDA, Tablette iPad, Desktop Caisse fixe, Kiosk Borne interactive.
10. **Composabilité par Primitives** : Interdiction formelle des styles ad-hoc et des headers recomposés manuellement ; utilisation exclusive des primitives structurelles (`PageShell`, `SectionCard`, `StatGrid`, `ActionBar`).
