# Implémentation de l'Assistant Vocal Agentique (Gemini 3.1 Flash Live)

Ce document décrit la stratégie d'intégration de l'assistant vocal en temps réel via l'API Gemini 3.1 Flash Live dans Restaurant OS.

> [!IMPORTANT]
> L'objectif est de fournir une expérience "Live" (échange vocal naturel et bidirectionnel) capable de lire les données métier de l'application et d'exécuter des actions (Agentique) tout en respectant strictement le système de permissions des utilisateurs (Profils 0404, etc.).

### [Phase 2] Chirurgie JSX & Typage (Stabilité Structurelle)
Restauration binaire et fermeture des balises orphelines, et normalisation des types dans :
- `src/app/(ops)/operations/page.tsx`
- `src/app/(admin)/simulator/page.tsx`
- `src/app/(admin)/account-settings/page.tsx`
- `src/app/(admin)/actions/operations.ts` (Suture Room -> Area)
- `src/app/(admin)/actions/hr.ts` (Suture StaffService -> HumanResources)

## État des Lieux et Préparation

1. **Clé API configurée** : Le fichier `.env.local` a été initialisé à la racine du projet pour accueillir `NEXT_PUBLIC_GEMINI_API_KEY`.
2. **Déclencheur identifié** : Le bouton micro dans `GlobalFAB.tsx` (déclencheur `Alt+V`) sera le point d'entrée. 
3. **Modèle de données local** : L'application utilise intensivement React Context et Dexie.js (IndexedDB) pour stocker les données (Inventaire, Réservations, Recettes, Auth).
4. **Sécurité et Rôles** : `AuthContext.tsx` contient la logique de permissions (ex: `canDo(action)` et des niveaux de rôles `ROLE_LEVELS`). L'assistant devra utiliser ce contexte pour savoir s'il a le droit de répondre ou d'agir.

## Changements Proposés (Architecture)

Afin de permettre à Gemini de discuter verbalement et d'interagir avec l'application web, nous allons devoir créer un pont entre l'API WebSocket de Gemini Live et les Contextes React locaux.

### 1. Interface Visuelle de Conversation [Nouveau Composant]
- Création d'un composant `VoiceAssistantOverlay.tsx`.
- Affichage d'une interface élégante (type "glassmorphism" ou "premium dark mode") s'ouvrant lors du clic sur le micro.
- Visualisation du texte (Speech-to-Text) et des réponses de l'IA.
- Indicateur de statut (Écoute, Réflexion, Parole).
- Historique des conversations stockées (via Dexie.js dans la base de données locale).

### 2. Le Moteur Gemini Live (WebSocket & Audio) [Nouveau Hook]
- Création d'un hook `useGeminiLive.ts`.
- Gestion de la connexion WebSocket vers l'API Multimodal Live de Google.
- Capture du microphone local via l'API Web Audio (AudioWorklet) pour envoyer l'audio en streaming PCM 16kHz à Gemini.
- Réception et lecture de l'audio retourné par Gemini via le navigateur.

### 3. Capacités Agentiques (Tool Calling / Function Calling)
L'intelligence de l'agent résidera dans les outils (Tools) qu'on lui déclare au démarrage de la connexion.
On va créer un catalogue d'outils liés aux contextes locaux :
- `checkInventory({ itemName: string })` : Interroge `InventoryContext` (ex: "Combien reste-t-il de Burrata ?").
- `createReservation({ clientName: string, date: string, time: string, pax: number })` : Appelle `ReservationsContext` (ex: "Ajoute une réservation pour 2...").
- `getRecipe({ name: string })` : Interroge `RecipeContext`.
- `getDailyStats()` : Interroge la caisse pour le chiffre d'affaires.

### 4. Filtrage de Sécurité basé sur les Rôles
Lorsqu'un outil est appelé par Gemini, le système interceptera l'appel et vérifiera les permissions de l'utilisateur actuellement connecté (via `AuthContext.currentUser`).
- Si l'action nécessite le rôle `manager` et que c'est un `server`, l'outil refusera la requête en renvoyant à Gemini : *"Permission refusée"*. L'agent vocal expliquera alors naturellement à l'utilisateur qu'il n'a pas les droits nécessaires.

---

## Validation des Choix (En Attente d'Approbation)

Suite à nos échanges, voici la structure retenue pour le lancement :

### 1. Sécurité de la Clé API (Backend Proxy)
Pour éviter d'exposer la clé Gemini dans le navigateur, nous allons créer une **Route API Next.js Server-Side (`/api/gemini-live`)**. C'est le serveur (backend) qui gérera la communication avec Google. Le navigateur (client) se connectera à notre propre route API sécurisée temporelle. La clé sera stockée uniquement dans les variables d'environnement serveur.

### 2. Historique des Conversations
- Chaque utilisateur aura un historique de conversation pour la session en cours.
- L'enregistrement complet (Logs AI) sera stocké dans IndexedDB ou la structure locale, avec un niveau d'habilitation `Admin` (niveau 100). 
- **Seul un profil Administrateur** pourra consulter l'historique complet des requêtes de tout le staff (ex: vérifier ce que les serveurs ont demandé à l'IA).

### 3. Interface Visuelle (UX)
- Une **Fenêtre Flottante Premium** (Glassmorphism, couleurs sombres/dorées) s'ouvrira en bas ou sur le côté au clic sur le bouton micro.
- Visualisation de l'onde sonore en temps réel et transcription textuelle "chat" de l'échange vocal.

### 4. Liste des Possibilités Agentiques (À Valider Ensemble)

Voici les capacités que nous pouvons apprendre à Gemini dès la V1 (selon l'application existante). **Quelles sont celles que tu veux retenir en priorité absolue pour cette première intégration ?**

*   📅 **Réservations & Floor Plan**
    *   *« Ajoute une réservation pour 2 personnes demain à 20h au nom de M. Leroy. »*
    *   *« Est-ce qu'on a de la place en terrasse pour 4 personnes ce soir ? »*
*   📦 **Inventaire & Stocks**
    *   *« Combien reste-t-il de Burrata Crémeuse ? »*
    *   *« Retire 2 bouteilles de vin rouge du stock, casse. »*
*   🍳 **Cuisine (KDS) & Recettes**
    *   *« Affiche la fiche technique complète du Risotto aux Truffes. »*
    *   *« Combien j'ai de commandes en cours d'envoi en cuisine ? »*
*   👥 **Staff & RH (Managers uniquement)**
    *   *« Quel est le shift de Clara Leroy aujourd'hui ? »*
    *   *« Ajoute un retard de 15 minutes pour le cuisinier ce matin. »*
*   💎 **CRM (Base Clients)**
    *   *« Est-ce que le profil "CRM001" (Marie Dupont) a des allergies ? »*
    *   *« Quel est le chiffre moyen dépensé par Jean Martin ? »*
*   📊 **Finance & Chiffre d'Affaires (Directeurs uniquement)**
    *   *« Quel est le chiffre d'affaires total généré aujourd'hui jusqu'à présent ? »*
