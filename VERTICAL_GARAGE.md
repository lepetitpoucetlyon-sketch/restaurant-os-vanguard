# VERTICAL_GARAGE.md — Playbook d'ouverture verticale

> Généré par `scripts/gen-vertical-playbook.ts` le 2026-08-12
> Variant : **garage** (préfixe événements : `auto.*`)
> Statut : ⚠️ 2 avertissement(s)

## Score d'ancrage : 10/12 points (2 ⚠️, 0 ❌)

| # | Point d'ancrage | Statut | Détail |
|---|----------------|--------|--------|
| 1 | Adapters verticaux | ✅ | 10 fichiers dans verticals/garage/adapters/ |
| 2 | DNA seed | ✅ | shared/seeds/garage-full-dna.ts |
| 3 | Tokens CSS | ✅ | kernel/nexus/tokens/verticals/garage.ts |
| 4 | roleLabels | ✅ | verticals/garage/roles.ts |
| 5 | IVerticalPlugin | ✅ | verticals/garage/AutoVertical.ts |
| 6 | VerticalEventBridge rules | ✅ | 7 règle(s) pour préfixe 'auto.*' |
| 7 | IVerticalInvoicingAdapter | ✅ | GarageInvoicingAdapter trouvé |
| 8 | NavConfig capabilities | ⚠️ | Variant non mentionné dans navConfig.ts |
| 9 | Événements déclarés | ✅ | 14 événement(s) préfixe 'auto.*' dans vertical.events.ts |
| 10 | Modules teintés (couplage restaurant) | ✅ | Aucun couplage restaurant hors pos/ |
| 11 | Connecteurs | ⚠️ | Aucun connecteur vertical enregistré |
| 12 | RGPD art.9 / PII | ✅ | Non applicable pour cette verticale |

## Prochaines actions


### ⚠️ Avertissements (2)

- **NavConfig capabilities** : Variant non mentionné dans navConfig.ts
- **Connecteurs** : Aucun connecteur vertical enregistré



## Checklist d'ouverture

- [ ] Tous les ❌ résolus
- [ ] Tests unitaires adapters (InvoicingAdapter + roleLabels)
- [ ] Test smoke ServiceTicket.open() → .close() pour cette verticale
- [ ] EventBridge : vérifier que les events source sont bien émis par `AutoVertical.ts`
- [ ] RBAC : vérifier que les pageOverrides utilisent les levels (pas les strings restaurant)
- [ ] NF525 : vérifier que ServiceTicket.close() génère bien un JournalEntry scellé

