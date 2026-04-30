# RAPPORT DE STABILITÉ HERMES

## 1. ROUTAGE 401
- **Problème** : Erreur HTTP 401 causée par l'envoi de clés DashScope (format `sk-...`) au portail Qwen avec des headers OAuth.
- **Fix** : 
  - Filtrage systématique des clés commençant par `sk-` dans la fonction `_read_qwen_auth`.
  - Ajout de la méthode `_try_alibaba` dans `agent/auxiliary_client.py` pour détecter et router correctement les clés Alibaba/DashScope vers le bon endpoint.

## 2. ERREUR DE MODULE
- **Problème** : `ImportError` sur la fonction `get_pool_credentials`, qui n'existe pas dans le codebase.
- **Fix** : 
  - Remplacement de `get_pool_credentials` par l'utilisation robuste de `_select_pool_entry` et `_pool_runtime_api_key` pour la gestion dynamique des credentials.
  - Suppression de toute référence obsolète à `get_pool_credentials`.

## 3. STABILITÉ DU SYSTÈME
- **Amélioration** : 
  - Ajout d’un mécanisme de fallback auto-détecté dans `AIAgent.__init__` (`run_agent.py`) pour garantir la continuité d’exécution en cas de défaillance du modèle principal.
  - Intégration de modèles par défaut Alibaba (Qwen) dans la pile de fallback, assurant une résilience accrue face aux interruptions de service tiers.

---
*Document généré automatiquement — conformément au Protocole de Souveraineté Physique.*