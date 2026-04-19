const SINGULARITY_EMPIRE = {
  "nom": "NEXUS CORE",
  "genre": "racine",
  "description": "Système d'Exploitation Restaurant OS - État Singularité 46/46. Architecture Hexagonale Agnostique avec Isolation SovereignGuard.",
  "chemins": [
    {
      "nom": "🛡️ SÉCURITÉ",
      "genre": "domaine",
      "description": "Couche SovereignGuard périmétrique (RBAC + Isolation Tenant).",
      "chemins": [
        {
          "nom": "Context Isolation",
          "genre": "critique",
          "description": "Validation du tenantID en temps réel sur chaque I/O.",
          "depth": 3,
          "chemins": [
            {
              "nom": "Context Isolation Layer",
              "genre": "critique",
              "description": "Expansion automatique niveau 4",
              "depth": 4,
              "chemins": [
                {
                  "nom": "Token Verification Engine",
                  "genre": "critique",
                  "description": "Expansion automatique niveau 5",
                  "depth": 5,
                  "chemins": [
                    {
                      "nom": "IdentityManager.validate()",
                      "genre": "action",
                      "description": "Expansion automatique niveau 6",
                      "depth": 6,
                      "chemins": [
                        {
                          "nom": "Firestore.getDoc(tenantAuth)",
                          "genre": "action",
                          "description": "Expansion automatique niveau 7",
                          "depth": 7
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "nom": "AuthStaff (RBAC)",
          "genre": "critique",
          "description": "Gestion des permissions granulaires par rôle.",
          "depth": 3,
          "chemins": [
            {
              "nom": "AuthStaff (RBAC) Layer",
              "genre": "critique",
              "description": "Expansion automatique niveau 4",
              "depth": 4,
              "chemins": [
                {
                  "nom": "Token Verification Engine",
                  "genre": "critique",
                  "description": "Expansion automatique niveau 5",
                  "depth": 5,
                  "chemins": [
                    {
                      "nom": "IdentityManager.validate()",
                      "genre": "action",
                      "description": "Expansion automatique niveau 6",
                      "depth": 6,
                      "chemins": [
                        {
                          "nom": "Firestore.getDoc(tenantAuth)",
                          "genre": "action",
                          "description": "Expansion automatique niveau 7",
                          "depth": 7
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "nom": "Zero-Trust I/O",
          "genre": "critique",
          "description": "Contrôle strict des accès au Grand Livre.",
          "depth": 3,
          "chemins": [
            {
              "nom": "Zero-Trust I/O Layer",
              "genre": "critique",
              "description": "Expansion automatique niveau 4",
              "depth": 4,
              "chemins": [
                {
                  "nom": "Token Verification Engine",
                  "genre": "critique",
                  "description": "Expansion automatique niveau 5",
                  "depth": 5,
                  "chemins": [
                    {
                      "nom": "IdentityManager.validate()",
                      "genre": "action",
                      "description": "Expansion automatique niveau 6",
                      "depth": 6,
                      "chemins": [
                        {
                          "nom": "Firestore.getDoc(tenantAuth)",
                          "genre": "action",
                          "description": "Expansion automatique niveau 7",
                          "depth": 7
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      "depth": 2
    },
    {
      "nom": "⚡ PERFORMANCE",
      "genre": "domaine",
      "description": "Mise à l'échelle et optimisation RAM pour terminaux 8GB.",
      "chemins": [
        {
          "nom": "Nukleaire GC",
          "genre": "action",
          "description": "Purge automatique du registre global (TTL 120s).",
          "depth": 3,
          "chemins": [
            {
              "nom": "Nukleaire GC Layer",
              "genre": "action",
              "description": "Expansion automatique niveau 4",
              "depth": 4,
              "chemins": [
                {
                  "nom": "Atom Garbage Collector",
                  "genre": "action",
                  "description": "Expansion automatique niveau 5",
                  "depth": 5,
                  "chemins": [
                    {
                      "nom": "FinalizationRegistry.cleanup()",
                      "genre": "action",
                      "description": "Expansion automatique niveau 6",
                      "depth": 6,
                      "chemins": [
                        {
                          "nom": "WeakRef.deref()",
                          "genre": "action",
                          "description": "Expansion automatique niveau 7",
                          "depth": 7
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "nom": "WeakRef Registry",
          "genre": "action",
          "description": "Suivi des atomes orphelins via FinalizationRegistry.",
          "depth": 3,
          "chemins": [
            {
              "nom": "WeakRef Registry Layer",
              "genre": "action",
              "description": "Expansion automatique niveau 4",
              "depth": 4,
              "chemins": [
                {
                  "nom": "Atom Garbage Collector",
                  "genre": "action",
                  "description": "Expansion automatique niveau 5",
                  "depth": 5,
                  "chemins": [
                    {
                      "nom": "FinalizationRegistry.cleanup()",
                      "genre": "action",
                      "description": "Expansion automatique niveau 6",
                      "depth": 6,
                      "chemins": [
                        {
                          "nom": "WeakRef.deref()",
                          "genre": "action",
                          "description": "Expansion automatique niveau 7",
                          "depth": 7
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "nom": "$O(1)$ Atomic Resolution",
          "genre": "revenue",
          "description": "Accès direct aux domaines d'atomes.",
          "depth": 3,
          "chemins": [
            {
              "nom": "$O(1)$ Atomic Resolution Layer",
              "genre": "revenue",
              "description": "Expansion automatique niveau 4",
              "depth": 4,
              "chemins": [
                {
                  "nom": "Atom Garbage Collector",
                  "genre": "revenue",
                  "description": "Expansion automatique niveau 5",
                  "depth": 5,
                  "chemins": [
                    {
                      "nom": "FinalizationRegistry.cleanup()",
                      "genre": "action",
                      "description": "Expansion automatique niveau 6",
                      "depth": 6,
                      "chemins": [
                        {
                          "nom": "WeakRef.deref()",
                          "genre": "action",
                          "description": "Expansion automatique niveau 7",
                          "depth": 7
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      "depth": 2
    },
    {
      "nom": "⚖️ FISCALITÉ",
      "genre": "domaine",
      "description": "Légal et Notarisation NF525 Ready.",
      "chemins": [
        {
          "nom": "Ledger Chain",
          "genre": "critique",
          "description": "Chaînage SHA-256 séquentiel des écritures.",
          "depth": 3,
          "chemins": [
            {
              "nom": "Ledger Chain Layer",
              "genre": "critique",
              "description": "Expansion automatique niveau 4",
              "depth": 4,
              "chemins": [
                {
                  "nom": "SHA-256 Chaining Service",
                  "genre": "critique",
                  "description": "Expansion automatique niveau 5",
                  "depth": 5,
                  "chemins": [
                    {
                      "nom": "FiscalEngine.notarize()",
                      "genre": "action",
                      "description": "Expansion automatique niveau 6",
                      "depth": 6,
                      "chemins": [
                        {
                          "nom": "Ledger.append(hash)",
                          "genre": "action",
                          "description": "Expansion automatique niveau 7",
                          "depth": 7
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "nom": "TimeSync",
          "genre": "critique",
          "description": "Synchronisation universelle de l'horloge.",
          "depth": 3,
          "chemins": [
            {
              "nom": "TimeSync Layer",
              "genre": "critique",
              "description": "Expansion automatique niveau 4",
              "depth": 4,
              "chemins": [
                {
                  "nom": "SHA-256 Chaining Service",
                  "genre": "critique",
                  "description": "Expansion automatique niveau 5",
                  "depth": 5,
                  "chemins": [
                    {
                      "nom": "FiscalEngine.notarize()",
                      "genre": "action",
                      "description": "Expansion automatique niveau 6",
                      "depth": 6,
                      "chemins": [
                        {
                          "nom": "Ledger.append(hash)",
                          "genre": "action",
                          "description": "Expansion automatique niveau 7",
                          "depth": 7
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "nom": "Fiscal Closure",
          "genre": "revenue",
          "description": "Preuves de conformité inaltérables.",
          "depth": 3,
          "chemins": [
            {
              "nom": "Fiscal Closure Layer",
              "genre": "revenue",
              "description": "Expansion automatique niveau 4",
              "depth": 4,
              "chemins": [
                {
                  "nom": "SHA-256 Chaining Service",
                  "genre": "revenue",
                  "description": "Expansion automatique niveau 5",
                  "depth": 5,
                  "chemins": [
                    {
                      "nom": "FiscalEngine.notarize()",
                      "genre": "action",
                      "description": "Expansion automatique niveau 6",
                      "depth": 6,
                      "chemins": [
                        {
                          "nom": "Ledger.append(hash)",
                          "genre": "action",
                          "description": "Expansion automatique niveau 7",
                          "depth": 7
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      "depth": 2
    },
    {
      "nom": "🛒 OPÉRATIONS",
      "genre": "domaine",
      "description": "Flux opérationnels haute performance.",
      "chemins": [
        {
          "nom": "Sync.Orders",
          "genre": "action",
          "description": "Flux de commandes atomique.",
          "depth": 3,
          "chemins": [
            {
              "nom": "Sync.Orders Layer",
              "genre": "action",
              "description": "Expansion automatique niveau 4",
              "depth": 4,
              "chemins": [
                {
                  "nom": "Nexus Transaction Logic",
                  "genre": "action",
                  "description": "Expansion automatique niveau 5",
                  "depth": 5,
                  "chemins": [
                    {
                      "nom": "NexusSyncService.update()",
                      "genre": "action",
                      "description": "Expansion automatique niveau 6",
                      "depth": 6,
                      "chemins": [
                        {
                          "nom": "Firestore.setDoc(atomic)",
                          "genre": "action",
                          "description": "Expansion automatique niveau 7",
                          "depth": 7
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "nom": "Sync.Stocks",
          "genre": "action",
          "description": "Inventaire en temps réel sans latence.",
          "depth": 3,
          "chemins": [
            {
              "nom": "Sync.Stocks Layer",
              "genre": "action",
              "description": "Expansion automatique niveau 4",
              "depth": 4,
              "chemins": [
                {
                  "nom": "Nexus Transaction Logic",
                  "genre": "action",
                  "description": "Expansion automatique niveau 5",
                  "depth": 5,
                  "chemins": [
                    {
                      "nom": "NexusSyncService.update()",
                      "genre": "action",
                      "description": "Expansion automatique niveau 6",
                      "depth": 6,
                      "chemins": [
                        {
                          "nom": "Firestore.setDoc(atomic)",
                          "genre": "action",
                          "description": "Expansion automatique niveau 7",
                          "depth": 7
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "nom": "Sync.HR",
          "genre": "action",
          "description": "Gestion des shifts et présences.",
          "depth": 3,
          "chemins": [
            {
              "nom": "Sync.HR Layer",
              "genre": "action",
              "description": "Expansion automatique niveau 4",
              "depth": 4,
              "chemins": [
                {
                  "nom": "Nexus Transaction Logic",
                  "genre": "action",
                  "description": "Expansion automatique niveau 5",
                  "depth": 5,
                  "chemins": [
                    {
                      "nom": "NexusSyncService.update()",
                      "genre": "action",
                      "description": "Expansion automatique niveau 6",
                      "depth": 6,
                      "chemins": [
                        {
                          "nom": "Firestore.setDoc(atomic)",
                          "genre": "action",
                          "description": "Expansion automatique niveau 7",
                          "depth": 7
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      "depth": 2
    },
    {
      "nom": "🧬 DARWINIENNE",
      "genre": "domaine",
      "description": "Intelligence auto-réparatrice et résilience par le chaos.",
      "chemins": [
        {
          "nom": "Chaos Monkey",
          "genre": "critique",
          "description": "Simulation d'attaques et de dérives de données pour l'entraînement du système.",
          "depth": 3,
          "chemins": [
            {
              "nom": "Chaos Monkey Layer",
              "genre": "critique",
              "description": "Expansion automatique niveau 4",
              "depth": 4,
              "chemins": [
                {
                  "nom": "Self-Healing Worker",
                  "genre": "critique",
                  "description": "Expansion automatique niveau 5",
                  "depth": 5,
                  "chemins": [
                    {
                      "nom": "CRC Checksum Validation",
                      "genre": "action",
                      "description": "Expansion automatique niveau 6",
                      "depth": 6,
                      "chemins": [
                        {
                          "nom": "MemoryInjection.apply()",
                          "genre": "action",
                          "description": "Expansion automatique niveau 7",
                          "depth": 7
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "nom": "Self-Healing",
          "genre": "action",
          "description": "Détection CRC et injection automatique de correctifs sur le tas mémoire.",
          "depth": 3,
          "chemins": [
            {
              "nom": "Self-Healing Layer",
              "genre": "action",
              "description": "Expansion automatique niveau 4",
              "depth": 4,
              "chemins": [
                {
                  "nom": "Self-Healing Worker",
                  "genre": "action",
                  "description": "Expansion automatique niveau 5",
                  "depth": 5,
                  "chemins": [
                    {
                      "nom": "CRC Checksum Validation",
                      "genre": "action",
                      "description": "Expansion automatique niveau 6",
                      "depth": 6,
                      "chemins": [
                        {
                          "nom": "MemoryInjection.apply()",
                          "genre": "action",
                          "description": "Expansion automatique niveau 7",
                          "depth": 7
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "nom": "Negative Entropy",
          "genre": "revenue",
          "description": "Maintien de l'ordre structurel face au désordre opérationnel.",
          "depth": 3,
          "chemins": [
            {
              "nom": "Negative Entropy Layer",
              "genre": "revenue",
              "description": "Expansion automatique niveau 4",
              "depth": 4,
              "chemins": [
                {
                  "nom": "Self-Healing Worker",
                  "genre": "revenue",
                  "description": "Expansion automatique niveau 5",
                  "depth": 5,
                  "chemins": [
                    {
                      "nom": "CRC Checksum Validation",
                      "genre": "action",
                      "description": "Expansion automatique niveau 6",
                      "depth": 6,
                      "chemins": [
                        {
                          "nom": "MemoryInjection.apply()",
                          "genre": "action",
                          "description": "Expansion automatique niveau 7",
                          "depth": 7
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      "depth": 2
    }
  ],
  "depth": 1
};

if (typeof window !== 'undefined') {
    window.SINGULARITY_EMPIRE = SINGULARITY_EMPIRE;
}
