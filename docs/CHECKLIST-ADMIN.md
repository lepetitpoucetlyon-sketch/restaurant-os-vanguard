# Checklist Admin — Go-to-market

> Établie le **2026-08-25** · état technique mesuré sur `main@0e93408d0`
> Portée : **tout ce qui doit être vrai avant le premier client payant** — juridique,
> fiscal, technique, exploitation, commercial.
> Les cases techniques sont mesurables ; les cases juridiques demandent un tiers.

---

## ⚠️ Lecture rapide — les 3 bloqueurs absolus

| # | Bloqueur | Nature | Sans lui |
|---|---|---|---|
| 1 | **Société immatriculée** | Juridique | Pas de SIRET → l'attestation NF525 s'imprime en pointillés, et tu ne peux pas facturer |
| 2 | **`FISCAL_SIGNING_SECRET` posé** | Technique | Aucune vente n'est scellable |
| 3 | **RC Pro souscrite** | Juridique | Un bug de TVA chez un client engage ton patrimoine |

Tout le reste est important. Ces trois-là sont **binaires**.

> ✅ **L'attestation NF525 n'est PAS un bloqueur** — le système est déjà construit
> (MCC + tenant + PDF + historique). Il attend seulement le SIRET. Voir §B.1.

---

# A — JURIDIQUE & SOCIÉTÉ

## A.1 Constitution

- [ ] **Société immatriculée** (SASU / SARL / SAS) — K-bis obtenu
- [ ] SIRET + numéro de TVA intracommunautaire
- [ ] Compte bancaire professionnel ouvert
- [ ] Statuts déposés
- [ ] Adresse de domiciliation (obligatoire sur les mentions légales et les factures)

## A.2 Assurances *(souvent oublié — coûteux si oublié)*

- [ ] **Responsabilité Civile Professionnelle (RC Pro)**
      → Un bug de calcul de TVA chez un client déclenche un redressement. C'est ta responsabilité.
      Vérifier que la police couvre explicitement **l'édition de logiciel** et la **perte de données**.
- [ ] Cyber-assurance (fuite de données clients / rançongiciel)
- [ ] Vérifier le plafond : un redressement fiscal sur un restaurant peut dépasser 50 k€

## A.3 Propriété intellectuelle

- [ ] **Cession de droits signée** par tout contributeur externe (freelance, agence, stagiaire)
      → Sans cession écrite, le code ne t'appartient pas. Bloquant en due diligence.
- [ ] Marque déposée à l'INPI (nom du produit + logo)
- [ ] Nom de domaine réservé (+ variantes défensives)
- [ ] Audit des licences des 39 dépendances de production (aucune GPL/AGPL contaminante)

## A.4 Contractuel

- [ ] **CGV / CGU** rédigées par un juriste (pas un modèle générique)
- [ ] **Contrat de licence SaaS** — durée, tarif, résiliation, limitation de responsabilité
- [ ] **DPA — accord de sous-traitance RGPD (art. 28)**
      → Tu es **sous-traitant** au sens du RGPD. Ce contrat est **obligatoire**, pas optionnel.
      Ton client (responsable de traitement) te le demandera, ou son expert-comptable le fera.
- [ ] **Clause de réversibilité** — restitution des données en fin de contrat, format et délai
- [ ] Conditions de résiliation (préavis, sort des données, remboursement)
- [ ] Mentions légales publiées sur le site
- [ ] Politique de confidentialité publiée

---

# B — FISCAL & NF525 *(le plus critique)*

## B.1 Attestation éditeur ✅ **DÉJÀ CONSTRUITE — reste 5 variables à remplir**

> **Correction du 2026-08-25** : une première version de cette checklist annonçait
> l'attestation comme « bloqueur absolu à instruire ». **C'est faux — le système est
> déjà implémenté de bout en bout.** Vérifié dans le code :

**Ce qui existe déjà**

| Composant | Chemin | Rôle |
|---|---|---|
| Document légal A4 | `admin/mcc/components/LegalCertificateA4.tsx` (204 l) | Attestation **2 volets** conforme |
| Centre de certification MCC | `admin/mcc/components/CertificationCenter.tsx` (253 l) | Génération + historique |
| Aperçu + historique | `CertPreviewPanel.tsx` · `CertHistoryTab.tsx` | |
| Génération PDF serveur | `api/admin/compliance/nf525-certificate/route.ts` (142 l) | PDF + hash SHA-256, garde `mcc_support` |
| Auto-attestation tenant | `compliance/qualite/haccp/components/NF525SelfAudit.tsx:167` | « Générer l'attestation NF525 (PDF) » |

**Le document est juridiquement correct :**
- Référence : **article 286, I-3° bis du CGI** — le bon article
- Modèle officiel DGFiP : **BOI-LETTRE-000242** — cité explicitement
- **VOLET 1** (éditeur) : représentant légal, société, adresse, SIRET, nom du logiciel,
  version, n° de licence, date de mise sur le marché
- Les 4 conditions légales reprises mot pour mot : *inaltérabilité, sécurisation,
  conservation, archivage*
- **VOLET 2** (utilisateur) : « J'atteste l'utiliser pour mes transactions depuis le… »
- Avertissement pénal art. 441-1 (45 000 € — faux et usage de faux)

**Ce qui reste réellement à faire**

- [ ] Renseigner les **5 variables d'environnement** de l'éditeur :
      ```
      NEXT_PUBLIC_PUBLISHER_NAME       # raison sociale
      NEXT_PUBLIC_PUBLISHER_REP_NAME   # représentant légal
      NEXT_PUBLIC_PUBLISHER_ADDRESS
      NEXT_PUBLIC_PUBLISHER_CITY
      NEXT_PUBLIC_PUBLISHER_SIRET
      ```
      → **Seule dépendance restante : que la société existe** (cf. A.1). Sans SIRET, les
      champs s'impriment en pointillés. Une fois la société immatriculée, c'est 5 minutes.
- [ ] **Discipline de versionnage** : l'attestation référence `whiteLabelInstanceConfig.version`.
      Une attestation vaut pour **une version précise** — définir quand une nouvelle version
      impose de réémettre les attestations clients.
- [ ] Signature de l'éditeur : vérifier le mode retenu (manuscrite scannée, électronique)
- [ ] Tester le parcours complet sur `_demo_restaurant` : générer, télécharger, relire le PDF

> **Nuance qui reste vraie :** conformité du code ≠ conformité juridique. Mais ici le pont
> entre les deux est **déjà construit** — il attend juste l'identité de la société.

## B.2 Archivage & contrôle

- [ ] Archivage fiscal **6 ans** garanti et testé (LPF art. L102 B)
- [ ] Procédure documentée de réponse à un contrôle DGFiP
- [ ] Documentation technique NF525 prête à fournir en contrôle
      (description de la chaîne de scellement, algorithme de hachage, journal des événements)
- [ ] Export FEC testé sur un jeu de données réel
- [ ] Test de restitution : l'inspecteur demande les données de mars 2026 → combien de temps ?

## B.3 Technique fiscal

- [ ] **`FISCAL_SIGNING_SECRET` généré et posé en production** 🔴
- [ ] Rotation du secret documentée (que se passe-t-il si on le change ?)
- [ ] Sceau GENESIS vérifié pour chaque tenant provisionné
- [ ] Test de bout en bout : vente → JournalEntry → FiscalSeal chaîné → export FEC

---

# C — TECHNIQUE : ce que tu avais listé

## C.1 Test matériel réel

- [ ] Imprimante ticket — impression réelle, format, découpe
- [ ] Imprimante hors ligne en plein service → comportement vérifié
- [ ] Plus de papier en cours de ticket → comportement vérifié
- [ ] Tiroir-caisse — ouverture réelle (kick ESC/POS, série, réseau)
- [ ] Tiroir qui refuse de s'ouvrir → procédure manuelle documentée
- [ ] TPE — transaction réelle sur au moins un des 6 adapters
      *(Stripe · Conecs · Sunday · PayGreen · LyfPay · Square)*
- [ ] Tablette cible — temps de démarrage, réactivité tactile, autonomie
- [ ] Test en conditions : mains mouillées, gants, écran gras, lumière de cuisine

## C.2 Connecteurs *(23 providers réels mesurés sur 15 familles)*

**Réservations** — 3 providers
- [ ] TheFork — compte partenaire, clés API, webhook testé
- [ ] Zenchef — idem
- [ ] Widget natif — parcours de réservation complet

**Livraison** — 2 providers
- [ ] UberEats — compte marchand, webhook signé
- [ ] Click & Collect — parcours complet

**Open Banking** — 5 providers ✅ *code complet, zéro stub*
- [ ] **GoCardless** (310 l) — compte, clés, sandbox → prod
- [ ] Powens (196 l) · Tink (173 l) · Bridge (114 l) · Qonto (104 l)
- [ ] ✅ **Pas d'agrément DSP2 à obtenir** — ces 5 sont des agrégateurs agréés AISP.
      Tu consommes leur agrément. Vérifier que le contrat le confirme par écrit.
- [ ] `tokenCipher.ts` — chiffrement des jetons bancaires vérifié en production
- [ ] Rapprochement bancaire testé sur un vrai compte

**Paiement / Facturation**
- [ ] Stripe — compte vérifié, webhook signé, passage en mode live
- [ ] Pennylane (comptabilité) — connexion réelle
- [ ] Import factures IMAP / Gmail — testé

**RH**
- [ ] Silae (paie) · Merge · Pointeuse QR

**Autres**
- [ ] Brevo (emailing) · Google Business (avis) · MQTT + Webhook (IoT capteurs)
- [ ] Météo : OpenWeatherMap · MétéoFrance · Ticketmaster
- [ ] Fournisseurs : Metro · Pomona · EmailPdf

**Pour chaque connecteur activé**
- [ ] Clés en production (pas en sandbox)
- [ ] Quota et coût de l'API connus
- [ ] Comportement si l'API tierce tombe
- [ ] Secret de webhook vérifié

## C.3 Refonte visuelle de la verticale

- [ ] Périmètre défini : quels écrans exactement ?
- [ ] ⚠️ **Ordre imposé** : faire le rangement `ui/` **avant** la refonte
      *(11 fichiers à renommer + `atomic/` à absorber — renommer après rendrait les diffs illisibles)*
- [ ] Cohérence avec le design system existant (48 primitives, 12 jeux de tokens)
- [ ] Vérifier sur la tablette cible, pas sur un écran 27"
- [ ] Contrastes validés en conditions réelles de cuisine

---

# D — TECHNIQUE : ce qui manquait à ta liste

*Issu des audits du 2026-08-25 — chaque point est mesuré.*

## D.1 Bloquants pilote

- [ ] **Pages d'erreur** — `error.tsx` mesuré à **0 fichier** dans tout l'App Router
      → une erreur sur `/pos` affiche l'écran blanc générique de Next, en plein service,
      panier perdu. Défaut le plus visible, correction la moins chère.
- [ ] **`haccp/iot-push` non authentifiée** — permet d'injecter de fausses températures.
      Le registre HACCP fait foi en contrôle sanitaire.
- [ ] **39 routes API sans garde** (sur 210) — dont `cron/*` et `widget/setup-intent`
- [ ] **File d'impression** — `PrintingService` n'a qu'un `catch { /* ignore */ }`

## D.2 Sauvegarde & reprise

- [ ] **Sauvegarder le dépôt** — 66 commits n'existent que sur une machine
      ```bash
      git bundle create ~/Desktop/restaurant-os-backup-$(date +%Y%m%d).bundle --all
      ```
- [ ] Sauvegardes automatiques des données client, planifiées et **vérifiées**
- [ ] **Restauration réellement testée** — une sauvegarde jamais restaurée n'est pas une sauvegarde
- [ ] RTO / RPO définis et écrits (combien de temps pour repartir, combien de données perdues)

## D.3 Production & exploitation

- [ ] Hébergement choisi — **où sont les données ?** (souveraineté, clause client)
- [ ] Domaine + SSL + DNS configurés
- [ ] Environnements séparés prod / staging
- [ ] Procédure de release et de **rollback** documentée
- [ ] **Monitoring & alerting actifs** — Sentry/Axiom présents mais instrumentés dans 4 fichiers
      → *comment apprends-tu qu'un client est en panne vendredi 20h : par une alerte ou par lui ?*
- [ ] Page de statut publique
- [ ] `npm audit` : **11 high + 21 moderate** en production, aucune gate

## D.4 Support *(le plus sous-estimé)*

- [ ] **Astreinte définie** 🔴
      → Un restaurant tourne **le soir, le week-end et les jours fériés**. Ton client sera
      en panne un samedi 20h, pas un mardi 10h. Qui répond ? Sous quel délai ?
- [ ] Canal de support (téléphone ? le staff en service n'écrit pas d'e-mail)
- [ ] SLA écrit — ce que tu promets contractuellement
- [ ] Procédure d'incident + communication client
- [ ] Documentation utilisateur à jour
- [ ] Formation initiale du staff prévue (durée, support, qui la fait)

---

# E — RGPD & DONNÉES

- [ ] **Registre des traitements** (art. 30 RGPD) — obligatoire
- [ ] Référent RGPD désigné (DPO non obligatoire ici, mais un responsable oui)
- [ ] Base légale documentée pour chaque traitement
- [ ] **Allergènes = donnée de santé** (art. 9 RGPD) 🔴
      → Catégorie particulière, régime renforcé : base légale explicite, minimisation,
      durée de conservation courte, **journalisation des accès**.
      Beaucoup d'éditeurs l'ignorent. Toi tu en stockes.
- [ ] Durées de conservation définies par type de donnée
- [ ] Droit à l'effacement — procédure testée de bout en bout
- [ ] Export de portabilité complet et testé
- [ ] Sous-traitants ultérieurs listés (hébergeur, Stripe, GoCardless, providers LLM…)
      et déclarés au client
- [ ] **Transferts hors UE** — les providers LLM (Anthropic, OpenAI) sont hors UE.
      À couvrir contractuellement, ou basculer les tenants sensibles sur le mode souverain.

---

# F — COMMERCIAL

- [ ] **Tarif défini** — et testé auprès d'au moins 3 restaurateurs avant de l'imprimer
- [ ] Bon de commande / contrat client prêt
- [ ] Facturation SaaS opérationnelle (Stripe : signup, checkout, webhook, dunning — code présent)
- [ ] Essai gratuit : durée, périmètre, bascule automatique
- [ ] **`_demo_restaurant` provisionné** — indispensable pour toute démo
- [ ] Parcours de démo répété (15 min chrono)
- [ ] Onboarding client documenté : de la signature à la première vente
- [ ] Site / page produit avec metadata SEO *(mesuré : 7 pages sur 25 en ont)*

---

# G — CONTINUITÉ *(la question que le client posera)*

- [ ] **« Que se passe-t-il si vous arrêtez ? »**
      → Un restaurateur qui confie sa caisse et sa comptabilité posera la question.
      Réponses possibles : séquestre de code, export garanti, engagement de préavis.
- [ ] Réversibilité contractuelle : format et délai de restitution des données
- [ ] Documentation d'exploitation suffisante pour qu'un tiers reprenne
- [ ] Bus factor : aujourd'hui, une seule personne connaît ce système

---

# H — GITLAB & DÉPÔT

- [ ] Dépôt GitLab créé
- [ ] **Pousser les 66 commits locaux** (aucune sauvegarde distante depuis le 23/08)
- [ ] Vérifier qu'aucun secret n'est dans l'historique (`git log -p | grep -i "key\|secret\|token"`)
- [ ] `.gitignore` couvre `.env*`, `.claude/.active-session`, artefacts de build
- [ ] Branches protégées + revue de code obligatoire
- [ ] CI branchée sur `preflight.sh`
- [ ] Accès : qui peut lire, qui peut pousser

---

# Ordre d'exécution recommandé

```
EN PARALLÈLE, TOUT DE SUITE
├── A.1 Société          ← délais administratifs longs, à lancer en premier
├── A.2 RC Pro           ← délai de souscription
└── H   GitLab + push    ← 1 heure, supprime le risque de tout perdre
    (B.1 attestation NF525 : déjà construite, se règle en 5 min dès le SIRET obtenu)

ENSUITE — TECHNIQUE (5-6 sessions, cf. PLAN-ACTION-UNIFIE vagues 0-1)
├── D.1 error.tsx · routes API · impression
├── B.3 FISCAL_SIGNING_SECRET
├── D.2 sauvegardes + restauration testée
└── D.3 monitoring branché

PUIS — TERRAIN
├── C.1 Test matériel réel     ← 1 journée
├── C.2 Connecteurs en prod    ← selon ce que le pilote utilise vraiment
└── C.3 Refonte visuelle       ← après le rangement ui/

AVANT DE SIGNER
├── A.4 CGV · DPA · réversibilité
├── E   Registre RGPD · allergènes
├── D.4 Astreinte définie
└── F   Tarif · démo · onboarding
```

---

# Les 4 choses qui manquaient le plus à ta liste

1. **RC Pro** — un bug de TVA chez un client déclenche un redressement. Sans assurance,
   c'est ton patrimoine personnel.

2. **DPA (art. 28 RGPD)** — obligatoire, pas optionnel. Le premier client sérieux, ou son
   expert-comptable, te le réclamera.

3. **Astreinte** — un restaurant tombe en panne **samedi 20h**, jamais mardi 10h.
   Sans réponse à cette question, le premier week-end difficile détruira la relation.

4. **Allergènes = donnée de santé** — régime RGPD renforcé. Presque personne ne le sait,
   et toi tu en stockes à côté de données nominatives de réservation.

---

*État technique mesuré le 2026-08-25 sur `main@0e93408d0`.
Les points juridiques demandent un professionnel — cette liste identifie les sujets,
elle ne remplace pas un conseil juridique.*
