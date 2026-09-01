/**
 * NexusEvents — Catalogue centralisé des events du bus.
 *
 * Ce fichier est un PUR AGRÉGATEUR — zéro définition d'event ici.
 * Chaque domaine a son propre fichier (aucun > ~300 L, cf. ADR sur la dissolution
 * de l'ex-common.events.ts monolithique) :
 *
 *   system.events.ts        — intégrations, tenant lifecycle, fleet, MCC, audit, souveraineté, notifications, sms
 *   ops.events.ts            — orders, tables, réservations (session/salle), production
 *   restaurant.events.ts     — verticale RESTAURANT : caisse, bar, cuisine/passe (ex-pos + ex-kds)
 *   delivery.events.ts       — livraison, coursiers
 *   reservations.events.ts   — cycle de vie réservation (créée/màj/annulée/no-show)
 *   finance.events.ts        — finance, fournisseurs, NF525, paiements
 *   compliance.events.ts     — HACCP, sécurité, RGPD, rappels, certifications
 *   human.events.ts          — RH, pointage, paie
 *   commerce.events.ts       — CRM, marketing, promotions, avis
 *   intelligence.events.ts   — IA, anomalies, analytics
 *   logistics.events.ts      — stock, achats, gaspillage
 *   facility.events.ts       — équipements, maintenance, plan de salle
 *   support.events.ts        — tickets support
 *   vertical.events.ts       — hotel, health, auto, bakery, salon, retail, connectors
 *
 * Pour ajouter un event : aller dans le fichier du bon domaine, jamais ici.
 * Pour ajouter une verticale : créer une section dans vertical.events.ts.
 * Un event qui n'a de sens QUE pour un restaurant va dans restaurant.events.ts ;
 * un event de service valable pour les 12 variantes reste dans ops.events.ts.
 */
import type { SYSTEMEvents }       from './system.events';
import type { OPSEvents }          from './ops.events';
import type { RESTAURANTEvents }   from './restaurant.events';
import type { DELIVERYEvents }     from './delivery.events';
import type { RESERVATIONSEvents } from './reservations.events';
import type { FINANCEEvents }      from './finance.events';
import type { COMPLIANCEEvents }   from './compliance.events';
import type { HUMANEvents }        from './human.events';
import type { COMMERCEEvents }     from './commerce.events';
import type { INTELLIGENCEEvents } from './intelligence.events';
import type { LOGISTICSEvents }    from './logistics.events';
import type { FACILITYEvents }     from './facility.events';
import type { SUPPORTEvents }      from './support.events';
import type { VERTICALEvents }     from './vertical.events';

export type NexusEvents =
  & SYSTEMEvents
  & OPSEvents
  & RESTAURANTEvents
  & DELIVERYEvents
  & RESERVATIONSEvents
  & FINANCEEvents
  & COMPLIANCEEvents
  & HUMANEvents
  & COMMERCEEvents
  & INTELLIGENCEEvents
  & LOGISTICSEvents
  & FACILITYEvents
  & SUPPORTEvents
  & VERTICALEvents;

// Ré-exports pour les consumers qui importent les interfaces de domaine directement
export type {
  SYSTEMEvents, OPSEvents, RESTAURANTEvents, DELIVERYEvents, RESERVATIONSEvents,
  FINANCEEvents, COMPLIANCEEvents, HUMANEvents, COMMERCEEvents, INTELLIGENCEEvents,
  LOGISTICSEvents, FACILITYEvents, SUPPORTEvents, VERTICALEvents,
};
