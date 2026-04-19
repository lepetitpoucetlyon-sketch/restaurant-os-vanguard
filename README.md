# Restaurant OS

Application d'exploitation restaurant en mode white-label, pensée pour être dupliquée client par client.

**Propriétaire Légal**: Mohammed-ali Boudjaadar (Tous droits réservés © 2026)

## Modèle de déploiement

- 1 client = 1 domaine
- 1 client = 1 projet Firebase
- 1 client = 1 base de données isolée
- Le code produit reste commun, la configuration d'instance change via `.env.local`
- L'accès Firestore passe par une session Firebase émise après validation du PIN côté Cloud Function
- **Gouvernance Centrale** : La flotte est administrée par le Master Command Control (MCC).

## 👑 Empire Fleet Orchestration

Le système intègre nativement un moteur d'orchestration industrielle pour gérer 10,000+ instances :

- **Master Command Control (MCC)** : Dashboard central de gestion de flotte (`/admin/mcc`).
- **Provisioning Engine** : "Birth of a Clone" automatisé avec injecteur de DNA (NF525, 2FA, Branding).
- **MacroBrain (AI)** : Détection d'anomalies transverses et insights de rentabilité globale.
- **Empire Telemetry** : Flux d'audit unifié en temps réel via `EmpireAuditLogger`.

## Démarrage local

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Variables importantes

La couche d'instance white-label est centralisée dans [instance.ts](./src/config/instance.ts).

Les variables les plus importantes sont :

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_TAGLINE`
- `NEXT_PUBLIC_APP_DESCRIPTION`
- `NEXT_PUBLIC_DEFAULT_DOMAIN`
- `NEXT_PUBLIC_RESTAURANT_NAME`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `GEMINI_API_KEY`

## Onboarding d'un nouveau client

1. Copier le manifest client:
   - `cp templates/client-instance.template.json client-configs/mon-client.json`
2. Créer le projet Firebase du restaurant.
3. Renseigner le JSON client avec la marque, le domaine et la config Firebase.
4. Générer l'environnement:
   - `npm run instance:generate -- client-configs/mon-client.json .env.local`
5. Valider la config:
   - `npm run instance:validate -- .env.local`
6. Déployer les règles, les functions et le front sur le domaine du client.
7. Vérifier l'identité seeded dans `settings/global`.

## Scripts utiles

- `npm run atlas` : lance le workspace Graphify voisin
- `npm run instance:generate -- <client.json> <output.env>` : génère une config d'instance
- `npm run instance:validate -- <client.json|.env.local>` : valide une instance avant livraison
- `npm run instance:preflight -- <client.json|.env.local>` : valide puis compile Functions + app pour une instance
- `npm run instance:preflight:sample` : lance le préflight sur un exemple d'instance non sensible
- `npm run release:check` : exécute le préflight d'exemple puis les tests
- `npm --prefix functions run build` : compile les callable functions de login/IA avant déploiement

## White-Label

Documentation détaillée :

- [White-label Setup](./docs/WHITE_LABEL_SETUP.md)
- [Client Instance Runbook](./docs/CLIENT_INSTANCE_RUNBOOK.md)
- [Multi-Instance Maintenance](./docs/MULTI_INSTANCE_MAINTENANCE.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Architecture Tooling](./docs/ARCHITECTURE_TOOLING.md)
