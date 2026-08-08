/**
 * NexusEvents — Catalogue centralisé des events du bus.
 *
 * Ce fichier est un PUR AGRÉGATEUR — zéro définition d'event ici.
 * Chaque domaine a son propre fichier :
 *
 *   system.events.ts   — intégrations, tenant lifecycle, fleet, MCC, audit, souveraineté
 *   ops.events.ts      — orders, KDS, stock, inventory, tables, réservations, livraison
 *   finance.events.ts  — finance, fournisseurs, NF525
 *   common.events.ts   — CRM, HR, commerce, HACCP, compliance, notifications, analytics
 *   support.events.ts  — tickets support
 *   vertical.events.ts — hotel, health, auto, bakery, salon, retail, connectors
 *
 * Pour ajouter un event : aller dans le fichier du bon domaine, jamais ici.
 * Pour ajouter une verticale : créer une section dans vertical.events.ts.
 */
import type { SYSTEMEvents }   from './system.events';
import type { OPSEvents }      from './ops.events';
import type { FINANCEEvents }  from './finance.events';
import type { COMMONEvents }   from './common.events';
import type { SUPPORTEvents }  from './support.events';
import type { VERTICALEvents } from './vertical.events';

export type NexusEvents =
  & SYSTEMEvents
  & OPSEvents
  & FINANCEEvents
  & COMMONEvents
  & SUPPORTEvents
  & VERTICALEvents;

// Ré-exports pour les consumers qui importent les interfaces de domaine directement
export type { SYSTEMEvents, OPSEvents, FINANCEEvents, COMMONEvents, SUPPORTEvents, VERTICALEvents };
