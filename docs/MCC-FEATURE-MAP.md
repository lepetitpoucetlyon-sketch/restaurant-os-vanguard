# 🛰️ MCC — Carte des fonctionnalités (état de chaque bloc)

*Cartographie exhaustive du Master Control Cockpit. Lecture seule, snapshot 2026-08-22 (pendant qu'Antigravity travaille).*

**Surface réelle** : ~15 onglets · ~55 panels UI · **91 routes API** (`/api/admin/*`) · 12 handlers e-bus · ~20 services.

## Légende (honnête)
| Émoji | Signification |
|---|---|
| ✅ | **Vérifié réel & câblé** — j'ai lu le code, la logique existe et est branchée au flux |
| 🟢 | **Présent, code consistant** (route ≥18 L / service réel) — **non audité en profondeur** |
| ⚠️ | **Démo-grade / incomplet** — vérifié, mais logique creuse, métrique bidon, ou non persisté |
| 🔴 | **Orphelin / cassé** — calcule & émet mais **rien ne consomme** (résultat perdu) |
| ❌ | **Manquant / mort** — absent ou code non appelé |

> ⚠️ Repère clé mesuré : **11 events `fleet.*`/`mcc.*` sont orphelins** (emit=11, on=0). Beaucoup de blocs *calculent puis émettent dans le vide* → rien n'est persisté ni historisé.

---

## 1. 🏭 Provisioning & cycle de vie tenant
| Fonctionnalité | Support / route | État |
|---|---|---|
| Provisioning client B2B (Stripe → tenant) | `TenantProvisioningService.provisionNewClient` · `fleet/provision` | ✅ **solide** : saga rollback, seeding (config+PCG+genesis fiscal), RBAC, branding, DNS, Firebase Auth |
| Clone depuis tenant de référence | `provisionPostClone` | ✅ câblé |
| Changelog par tenant | `ChangelogService` (131 L) · `TenantChangelogPanel` · `fleet/changelog` | 🟢 |
| Décommission / liquidation | `DataIntegrityService` (WIPE) · `fleet/rgpd-purge` | 🟢 (WIPE réel) |
| `MerchantProvisioningService` (fleet) | `modules/fleet/services/` | ❌ **doublon MORT** : fabrique des chaînes (`shard-eu-west-…`, `HMAC-KEY-…`), `isReady:true` en dur, **0 appelant** |

## 2. 🚚 Flotte & devices
| Fonctionnalité | Support / route | État |
|---|---|---|
| Fleet Command (table de pilotage) | `FleetCommandTable` · `fleet/command` | 🟢 |
| Inventaire devices / hardware | `FleetDeviceInventory`, `HardwareHealthGrid`, `DeviceManager` · `fleet/device-activation` | 🟢 |
| Télémétrie & heartbeat | `FleetTelemetryPanel` · `fleet/telemetry/heartbeat`, `crash-report` | 🟢 (`MccHealthPingHandler` câblé) |
| Health score / universal health | `HealthHistorySparkline` · `fleet/health-score`, `universal-health` | 🟢 |
| **Monitoring SLA** | `SlaMonitoringFleetService` | ⚠️ détection breach réelle **MAIS `uptimePct` = 99.85/100 en dur** (bidon) · event orphelin 🔴 |
| MDM (lock / erase / delivery) | `mdm/devices`, `mdm/lock`, `mdm/erase` · `mcc/fleet/devices/*` | 🟢 |
| OTA broadcast / rollout / shadow | `FleetUpgradePanel` · `fleet/ota-broadcast`, `rollout`, `shadow-mode`, `upgrade` | 🟢 (`FleetRolloutService`) |
| Régions / hotspot / DNS | `fleet/region`, `hotspot`, `dns` | 🟢 |

## 3. 🏛️ System Tenants (démo / test / réf)
| Fonctionnalité | Support / route | État |
|---|---|---|
| Registre 24 tenants système | `SystemTenantRegistry` (87 L) · `SystemTenantsTab` | ✅ |
| Promotion réf → prod | `PromotionModal` · `mcc/system-tenants/promote` | 🟢 |
| Reset démo / test | `mcc/system-tenants/reset-demo`, `reset-test` · `fleet/seed-demo` | 🟢 |

## 4. 💰 Facturation & trésorerie
| Fonctionnalité | Support / route | État |
|---|---|---|
| Trésorerie flotte | `MCCTreasury`, `TreasuryTab` · `fleet/billing/treasury-report` | 🟢 |
| **Facturation SaaS multi-tenant** | `MultiTenantBillingEngineService` · `TenantBillingPanel` · `fleet/tenant-billing` | ⚠️ maths correctes (µunits, bps, TVA 20 %) **mais facture NON persistée** · event orphelin 🔴 · IP audit `127.0.0.1` en dur |
| Feature flags / usage / portal | `fleet/billing/feature-flags`, `usage`, `portal-session` | 🟢 (`FeatureFlagSyncHandler`) |
| Churn / contrats | `fleet/churn`, `contracts` | 🟢 (`ContractRenewalAlertHandler`) |

## 5. 🔒 Conformité & fiscal (NF525)
| Fonctionnalité | Support / route | État |
|---|---|---|
| Audit chaîne fiscale | `TaxAuditPanel`, `FiscalChainExplorer` · `compliance/chain-audit` | ✅ (NF525 = socle vérifié) |
| Audit fiscal par tenant | `compliance/fiscal-tenant-audit` · `MccFiscalAuditHandler` | ✅ câblé |
| Export archives WORM / FEC | `FiscalArchiveExportPanel` · `compliance/fiscal-archive-export`, `finance/fec/export` | 🟢 |
| Certificat NF525 / A4 | `CertificationCenter`, `LegalCertificateA4` · `compliance/nf525-certificate` | 🟢 |
| Cron audit NF525 | `fleet/cron/nf525-audit` | 🟢 |

## 6. 🧠 Intelligence & IA MCC
| Fonctionnalité | Support / route | État |
|---|---|---|
| Registre IA MCC (isolation MCC↔tenant) | `MCCAIRegistry`, `MCCProviderChain`, `MCCLLMTelemetry` | ✅ (ADR-008 livré) |
| Audit du scope IA | `AIScopeAuditPanel` · `intelligence/ai-toggle` | 🟢 |
| Oracle stratégique / insights | `StrategyOracle`, `MCCInsights` · `intelligence/strategy-oracle` · `FleetStratBriefingHandler` | 🟢 |
| Atelier IA / vision | `AIWorkshop` · `intelligence/vision`, `nam/analyze` | 🟢 |
| Config IA par tenant | `TenantAIConfigPanel` · `fleet/tenant-ai-config` | 🟢 |
| Stats workspace RAG | `fleet/rag` · `rag/workspace-stats` | 🟢 |

## 7. 🆘 Support & escalade
| Fonctionnalité | Support / route | État |
|---|---|---|
| Support IA (diagnose / drafts) | `SupportAIPanel`, `SupportDraftsPanel` · `fleet/support-ai/*` | ✅ **events câblés** (support emit=1/on=2) |
| Analyse ticket → brouillon Gemini | `SupportTicketAnalysisHandler` | ✅ |
| Escalade | `SupportEscalationHandler` · `fleet/support-gate`, `support-access` | 🟢 |

## 8. 📮 Event Bus & DLQ
| Fonctionnalité | Support / route | État |
|---|---|---|
| Santé de l'Event Bus | `EventBusHealthPanel`, `EventBusTab` | 🟢 |
| Flux d'audit MCC | `MCCAuditStream` | 🟢 |
| Dead Letter Queue (list/replay/export) | `dlq/page` · `dlq/list`, `replay`, `replay-batch`, `export` | 🟢 (`DLQQuarantineAlertHandler` câblé) |

## 9. 🧩 Plugins & verticales
| Fonctionnalité | Support / route | État |
|---|---|---|
| Catalogue / moteur de plugins | `PluginCatalogManager`, `PluginEnginePanel` · `fleet/plugins`, `catalog` | 🟢 |
| Activation verticale | `VerticalActivePanel` | 🟢 |

## 10. 🛡️ Sécurité & accès
| Fonctionnalité | Support / route | État |
|---|---|---|
| MFA / 2FA | `MFAGate` | 🟢 |
| Devices de confiance | `TrustedDevicePanel` · `fleet/trusted-devices` | 🟢 |
| Matrice RBAC | `rbac`, `users/assign-role`, `fleet/users/role` | 🟢 |
| Impersonation / reset PIN | `fleet/users/impersonate`, `reset-pin` · `TenantUsersPanel` | 🟢 |
| Override tenant (branding/debug/UI) | `TenantOverridePanel` (+ sections) · `fleet/tenant-override` | 🟢 |

## 11. ⚖️ RGPD & intégrité données
| Fonctionnalité | Support / route | État |
|---|---|---|
| Export / purge RGPD | `fleet/rgpd-export`, `rgpd-purge` | 🟢 |
| Intégrité / WIPE tenant | `DataIntegrityService` (85 L) | 🟢 (logique réelle) |

## 12. 🤝 Revendeurs · 13. 🌐 Public access · 14. 🚀 Déploiement · 15. 🔧 Dev
| Fonctionnalité | Support / route | État |
|---|---|---|
| Portail revendeur (apporteur d'affaires) | `ResellerPortal` · `mcc/reseller`, `reseller/commissions` | 🟢 (modèle = apport uniquement) |
| Kill-switch landing / accès public | `PublicAccessPanel`, `PublicAccessConfig` · `fleet/public-access` | ✅ (kill-switch livré) |
| Remote config kill-switch | `RemoteConfigKillSwitchService` (54 L) | 🟢 |
| Deployment / DNS / Disaster Recovery | `DeploymentEngine`, `DisasterRecoveryPanel` · `fleet/backup`, `restore`, `migrate`, `drain-outbox` | 🟢 |
| Benchmark inter-tenant | `CrossTenantBenchmarkService`, `FleetBenchmarkingService` | ⚠️ maths réelles **mais event orphelin** 🔴 |
| Intégration Git (Antigravity) | `git/push`, `git/status` | 🟢 |
| Payroll / HR export (MCC-side) | `hr/payroll/*` (Silae, merge), `hr/export/csv` | 🟢 |

---

## 🚩 CE QUI MANQUE / À BOUCLER (le vrai « il manque quoi »)

1. 🔴 **11 events orphelins** (`fleet.*` ×7, `mcc.*` ×4 : `saas_billing_invoiced`, `sla_breach_detected`, `merchant_provisioned`, `benchmark_computed`…). Ils sont **émis mais aucun handler ne les consomme** → **aucune persistance, aucun historique** de facturation / SLA / benchmark. C'est le trou n°1.
2. ⚠️ **Métriques bidon** : `SlaMonitoringFleetService.uptimePct` renvoie `99.85 / 100` en dur (pas d'agrégation réelle sur fenêtre glissante).
3. ⚠️ **Facturation non stockée** : `MultiTenantBillingEngineService` calcule + émet + retourne, mais **n'écrit jamais** la facture (dépend d'un handler inexistant).
4. ❌ **Code mort** : `MerchantProvisioningService` (doublon creux de la vraie provisioning) — à supprimer ou rendre thin-wrapper.
5. ⚠️ **Audit trail** : `ipAddress: '127.0.0.1'` codé en dur dans plusieurs `AuditLogger.logAction` (facturation, provisioning) → l'IP réelle de l'admin n'est pas tracée.
6. 🟡 **Historisation flotte** : comme les events sont orphelins, pas de séries temporelles santé/SLA/CA persistées → les sparklines/panels affichent probablement du calcul volatil, pas de l'historique.

## ✅ CE QUI EST SOLIDE (à ne pas toucher)
- **Provisioning B2B** (`TenantProvisioningService`) : saga + rollback, production-grade, câblé au webhook Stripe.
- **Chaîne fiscale NF525** : audit chaîne + scellement (socle vérifié).
- **Isolation IA MCC↔tenant** (ADR-008, `MCCAIRegistry`).
- **Invariant de souveraineté** : le MCC ne consomme **aucun** event métier tenant (0 `.on('order/consultation/…')`) — barrière respectée.
- **Support IA** : le seul domaine dont les events sont **réellement consommés**.
- **DLQ** : replay / export / quarantine réels.
- **Backend non creux** : les 91 routes admin sont toutes consistantes (≥18 L), aucune route vide.

---

> **Bilan** : le MCC a une **surface très large et un cœur solide** (provisioning, fiscal, IA, souveraineté). Sa faiblesse est la **couche `fleet/services` en « coverage-theater »** : des services qui calculent joliment mais **émettent dans le vide** — rien n'est persisté en bout de chaîne. Boucler les 11 events (handlers de persistance) transformerait ~40 % des blocs 🟢/⚠️ en ✅ réels.
