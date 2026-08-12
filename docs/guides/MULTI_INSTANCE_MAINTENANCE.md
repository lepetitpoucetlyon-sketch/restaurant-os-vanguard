# Multi-Instance Maintenance

Ce document decrit comment maintenir plusieurs restaurants a partir du meme socle produit.

## Principe

- un seul template applicatif
- une configuration d’instance par client
- aucun fork de code metier si possible
- les differences client vivent dans la config, le contenu et le deploiement

## Cycle recommande

1. Developper les correctifs et evolutions dans le repo template.
2. Valider sur un environnement de recette.
3. Lancer un preflight par client:

```bash
npm run instance:preflight -- client-configs/maison-atlas.json
```

Pour valider la chaine commune en CI ou avant une release template:

```bash
npm run release:check
```

4. Deployer l’instance cliente avec son projet Firebase dedie.
5. Journaliser la version livree et la date de deploiement.

## Ce qu’il faut mutualiser

- code produit
- Cloud Functions
- regles Firestore
- scripts de generation/validation d’instance
- documentation d’exploitation

## Ce qu’il faut isoler

- `.env.local`
- credentials Firebase
- domaine client
- branding client
- donnees Firestore du client
- parametrage IA du client

## Anti-patterns a eviter

- modifier le code directement pour un seul client
- committer des `.env.local` ou des JSON clients sensibles
- laisser un client avec des placeholders ou `restaurant.local`
- deployer sans `instance:validate` ou `instance:preflight`

## Checklist release

- config client validee
- Functions compilees
- build app OK
- regles Firestore deployees
- login PIN teste
- role permissions teste
- assistant IA teste si active

## Fichiers utiles

- [Client Instance Runbook](./CLIENT_INSTANCE_RUNBOOK.md)
- [White-Label Setup](./WHITE_LABEL_SETUP.md)
- [client-instance.template.json](../templates/client-instance.template.json)
