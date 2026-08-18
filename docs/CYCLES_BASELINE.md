# 🏛️ Référentiel & Baseline des Cycles Madge (Baseline 966)

> **Dernière mise à jour** : 2026-08-18 (Vague A — Instrumentation & Ratchet)  
> **Commande d'analyse de référence** : `npx madge --circular --extensions ts,tsx --ts-config tsconfig.json src/`  
> **Script d'inspection** : `node scripts/cycles-inspector.mjs --export=docs/cycles-analysis.json`

---

## 📊 1. Métriques Clés de la Baseline

| Métrique | Valeur | Pourcentage |
| :--- | :---: | :---: |
| **Total des Cycles Détectés** | **966** | 100% |
| **Cycles Cross-Piliers** (Inter-modules) | **897** | 92.9% |
| **Cycles transitant par un `index.ts` (Barrel)** | **958** | 99.2% |
| **Cycles contenant des fichiers de Types / Schemas** | **938** | 97.1% |
| **Longueur des boucles circulaires** | Min: 2 · Max: 43 | Moyenne: 26.9 nœuds |

---

## 🏆 2. Top 15 des Nœuds Hubs Circulaires

Ces 15 fichiers concentrent la quasi-totalité des 966 boucles circulaires du système. Les traiter en priorité libère plus de 85% des cycles.

| Rang | Fichier | Occurrences | % des Cycles | Nature du Hub |
| :---: | :--- | :---: | :---: | :---: |
| **1** | `src/modules/logistics/index.ts` | **847** | 87.7% | 🛢️ Barrel Pilier |
| **2** | `src/shared/nexus/contracts/index.ts` | **844** | 87.4% | 🛢️ Barrel Contrats Nexus |
| **3** | `src/modules/finance/index.ts` | **814** | 84.3% | 🛢️ Barrel Pilier |
| **4** | `src/modules/logistics/approvisionnement/procurement/index.ts` | **812** | 84.1% | 🛢️ Barrel Sous-domaine |
| **5** | `src/modules/logistics/approvisionnement/procurement/ProcurementBridge.ts` | **812** | 84.1% | ⚙️ Service Métier |
| **6** | `src/modules/human/index.ts` | **766** | 79.3% | 🛢️ Barrel Pilier |
| **7** | `src/modules/finance/components/FacturXDownloadButton.tsx` | **763** | 79.0% | 🖥️ Composant UI |
| **8** | `src/modules/finance/services/AccountingReportService.ts` | **763** | 79.0% | ⚙️ Service Métier |
| **9** | `src/modules/commerce/index.ts` | **723** | 74.8% | 🛢️ Barrel Pilier |
| **10** | `src/modules/human/effectifs/hr/components/PlanningDashboard.tsx` | **722** | 74.7% | 🖥️ Composant UI |
| **11** | `src/modules/human/effectifs/hr/index.ts` | **719** | 74.4% | 🛢️ Barrel Sous-domaine |
| **12** | `src/shared/nexus/contracts/nexus.types.ts` | **715** | 74.0% | 📜 Définitions de Types |
| **13** | `src/shared/nexus/contracts/commerce.types.ts` | **715** | 74.0% | 📜 Définitions de Types |
| **14** | `src/shared/nexus/contracts/common.types.ts` | **713** | 73.8% | 📜 Définitions de Types |
| **15** | `src/shared/providers/NexusCoreContext.ts` | **709** | 73.4% | 🏛️ Contexte React Root |

---

## 🔒 3. Mécanisme du Ratchet Preflight

Le seuil `MADGE_CYCLES_MAX` est inscrit dans [`scripts/preflight.sh`](file:///Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/scripts/preflight.sh).
Tout commit ou merge qui introduirait un 967ᵉ cycle fait échouer le build de preflight.

```bash
# Règle d'or du Ratchet :
# Si CYCLE_COUNT > MADGE_CYCLES_MAX -> ❌ Échec bloquant
# Si CYCLE_COUNT < MADGE_CYCLES_MAX -> ⬇️ Invitation à abaisser le seuil
```

### Calendrier des Seuils Cibles :
- **Vague A (Actuelle)** : `MADGE_CYCLES_MAX = 966`
- **Vague B (Post-Type Harvesting)** : `MADGE_CYCLES_MAX = 250`
- **Vague C (Post-Kernel Contracts)** : `MADGE_CYCLES_MAX = 30`
- **Vague D (Post-Runtime Fixes)** : `MADGE_CYCLES_MAX = 0`
