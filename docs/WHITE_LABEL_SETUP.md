# White-Label Setup

Ce projet est pensé pour être dupliqué par restaurant avec une infrastructure Firebase dédiée.

## Principe

- 1 restaurant = 1 domaine
- 1 restaurant = 1 projet Firebase
- 1 restaurant = 1 base isolée

Le but n'est pas de mutualiser les données entre clients, mais de garder un template produit unique et une configuration d'instance propre.

## Modèle de sécurité

- l'écran PIN ne lit plus directement la base en mode ouvert
- la connexion passe par une Cloud Function `loginWithPin`
- la Function émet une session Firebase Auth par utilisateur
- Firestore est fermé aux utilisateurs non authentifiés
- les profils de connexion affichés à l'écran sont servis par une Function `listLoginProfiles`

## Fichiers clés

- [instance.ts](../src/config/instance.ts) : couche de configuration white-label
- [firebase.ts](../src/lib/firebase.ts) : branchement Firebase par instance
- [SettingsContext.tsx](../src/context/SettingsContext.tsx) : defaults seedés pour l'identité du restaurant
- [layout.tsx](../src/app/layout.tsx) : branding public et metadata

## Variables à renseigner

Dans `.env.local` :

```env
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_APP_TAGLINE=
NEXT_PUBLIC_APP_DESCRIPTION=
NEXT_PUBLIC_SUPPORT_EMAIL=
NEXT_PUBLIC_SUPPORT_PHONE=
NEXT_PUBLIC_DEFAULT_DOMAIN=

NEXT_PUBLIC_RESTAURANT_NAME=
NEXT_PUBLIC_RESTAURANT_SLOGAN=
NEXT_PUBLIC_RESTAURANT_CUISINE=
NEXT_PUBLIC_RESTAURANT_CATEGORY=
NEXT_PUBLIC_RESTAURANT_SHORT_DESCRIPTION=
NEXT_PUBLIC_RESTAURANT_LONG_DESCRIPTION=
NEXT_PUBLIC_RESTAURANT_HEAD_CHEF=
NEXT_PUBLIC_RESTAURANT_OWNER=
NEXT_PUBLIC_RESTAURANT_LOGO=

NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=

GEMINI_API_KEY=
```

## Procédure nouveau client

1. Créer le projet Firebase du restaurant.
2. Activer Firestore, Storage et les Functions nécessaires.
3. Copier le manifest client template:

```bash
mkdir -p client-configs
cp templates/client-instance.template.json client-configs/maison-atlas.json
```

4. Renseigner le JSON client puis générer `.env.local`:

```bash
npm run instance:generate -- client-configs/maison-atlas.json .env.local
npm run instance:validate -- .env.local
```

5. Déployer le front, les Functions et les règles sur le domaine du client.
6. Contrôler la première initialisation:
   - `settings/global`
   - `systemConfig/role_permissions`
   - `users/user_root`
   - connexion PIN via `loginWithPin`

## Ce que cette couche résout

- suppression des identifiants Firebase hardcodés dans le code produit
- branding public configurable par instance
- identité restaurant seedée selon le client
- emails et domaines par défaut cohérents pour chaque déploiement

## Ce qu'il reste à compléter

- industrialiser encore plus la création d'instance client
- sécuriser complètement Firebase/Auth par instance
- préparer une stratégie de maintenance multi-instances
