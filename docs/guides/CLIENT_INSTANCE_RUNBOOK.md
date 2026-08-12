# Client Instance Runbook

Ce runbook sert a livrer une nouvelle instance white-label sans modifier le code metier.

## Principe

- 1 client = 1 domaine
- 1 client = 1 projet Firebase
- 1 client = 1 base isolee
- le code reste commun, la configuration d’instance change

## Preparer un nouveau client

1. Creer ou recuperer un domaine dedie.
2. Creer un projet Firebase dedie au client.
3. Activer Firestore, Storage, Hosting et les Functions necessaires.
4. Copier le template JSON:

```bash
mkdir -p client-configs
cp templates/client-instance.template.json client-configs/maison-atlas.json
```

5. Remplir le JSON client avec:
   - marque
   - domaine
   - informations restaurant
   - configuration Firebase
   - cle Gemini si l’IA est active

## Generer la configuration d’instance

```bash
npm run instance:generate -- client-configs/maison-atlas.json .env.local
npm run instance:validate -- .env.local
npm run instance:preflight -- .env.local
```

Pour vérifier rapidement la chaîne complète sans données client:

```bash
npm run instance:preflight:sample
```

## Verifications avant deploiement

- le domaine client est correct
- la config Firebase pointe vers le projet du client
- `NEXT_PUBLIC_ENABLE_PROFILE_SWITCHER=false`
- la cle Gemini est renseignee si l’assistant IA doit etre actif
- aucune valeur `your-*`, `Mon Restaurant` ou `restaurant.local` ne reste dans la config

## Deploiement d’une nouvelle instance

1. Charger les bonnes variables d’environnement.
2. Compiler et deployer les Functions, Hosting et les regles du projet Firebase du client.
   - `npm --prefix functions run build`
3. Verifier la premiere initialisation:
   - `settings/global`
   - `systemConfig/role_permissions`
   - `users/user_root`
   - `loginWithPin`
   - `listLoginProfiles`
4. Controler les parcours critiques:
   - login PIN
   - commandes
   - staff
   - settings
   - assistant IA si active

## Strategie de maintenance multi-instances

- garder `restaurant-os-app` comme socle unique
- eviter les forks de code par client
- pousser les correctifs dans le template commun
- redelivrer ensuite les instances clients avec leur propre `.env`
- reserver les personnalisations clients a la configuration et au contenu, pas au code

## Rollback minimum

- conserver la derniere version stable du front et des Functions pour chaque client
- sauvegarder Firestore avant les operations sensibles
- ne pas changer auth/regles/seed en meme temps qu’une grosse release visuelle

## Fichiers utiles

- [White-Label Setup](./WHITE_LABEL_SETUP.md)
- [instance.ts](../src/config/instance.ts)
- [features.ts](../src/config/features.ts)
- [client-instance.template.json](../templates/client-instance.template.json)
