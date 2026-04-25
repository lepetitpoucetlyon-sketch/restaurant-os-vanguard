# 🏰 TENANT REGISTRY

Le catalogue officiel des instances (Digital Twins) gérées par ce Nexus.

## 1. Instances Actives

| ID | Nom | Version | Type de Cuisine |
|:---|:---|:---|:---|
| `lepetitpoucet` | Le Petit Poucet (Lyon) | 2.0.0 (Grade X) | Rôtisserie |
| `bistrolyon` | Bistro Lyon | 1.5.0 | Gastronomique |
| `urbanburger` | Urban Burger | 1.8.0 | Fast Casual |

## 2. Résolution Dynamique (`instances/index.ts`)
Le registre utilise un `tenantRegistry` statique qui mappe les IDs aux objets de configuration. La fonction `getTenantConfig(tenantId)` est le point d'entrée unique pour récupérer l'identité d'un restaurant.

## 3. Sécurité de Résolution
- **Fallback Policy** : Si un ID est invalide, le système renvoie `null`, ce qui déclenche une erreur critique dans le `NexusCoreProvider`.
- **Isolation Firebase** : Chaque instance possède son propre `projectId` et ses clés API dédiées dans l'objet `firebase`.

## 4. Points de Vigilance
- **Gestion des Clés API** : Les clés sont chargées via des variables d'environnement. Si une clé manque, l'instance ne pourra pas se synchroniser.
- **Mise à jour du Registre** : Toute nouvelle instance doit être importée et ajoutée manuellement dans `src/instances/index.ts`.
