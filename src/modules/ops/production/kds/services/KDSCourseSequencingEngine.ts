import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import type { CartItem, CourseType } from '../../../workflow/engine/types';

export type CourseStatus = 'HOLD' | 'FIRED' | 'COOKING' | 'READY' | 'SERVED';

export interface KDSCourseState {
  course: CourseType;
  status: CourseStatus;
  items: CartItem[];
  firedAt?: number;
  readyAt?: number;
  servedAt?: number;
}

export interface KDSTicketCourses {
  orderId: string;
  tableId?: string;
  tenantId: string;
  courses: Record<CourseType, KDSCourseState>;
  nextRequestedCourse?: CourseType;
  requestedAt?: number;
}

/**
 * 👨‍🍳 KDSCourseSequencingEngine
 * Moteur d'orchestration et de cadençage des plats en cuisine (Entrée → Plat → Dessert).
 */
export class KDSCourseSequencingEngine {
  /**
   * Initialise le séquençage d'une commande :
   * L'Entrée (ou le premier service disponible) passe en 'FIRED', le reste passe en 'HOLD'.
   */
  static async initializeOrderCourses(
    tenantId: string,
    orderId: string,
    tableId: string | undefined,
    items: CartItem[]
  ): Promise<KDSTicketCourses> {
    const coursesMap: Record<CourseType, KDSCourseState> = {
      entree: { course: 'entree', status: 'HOLD', items: [] },
      plat: { course: 'plat', status: 'HOLD', items: [] },
      dessert: { course: 'dessert', status: 'HOLD', items: [] },
    };

    for (const item of items) {
      const course = item.course ?? 'plat';
      coursesMap[course].items.push(item);
    }

    // Le premier service non vide est immédiatement FIRED
    const firstCourse: CourseType =
      coursesMap.entree.items.length > 0
        ? 'entree'
        : coursesMap.plat.items.length > 0
        ? 'plat'
        : 'dessert';

    coursesMap[firstCourse].status = 'FIRED';
    coursesMap[firstCourse].firedAt = Date.now();

    const ticketCourses: KDSTicketCourses = {
      orderId,
      tableId,
      tenantId,
      courses: coursesMap,
    };

    await Nexus.adapter.set(`tenants/${tenantId}/kdsCourses/${orderId}`, ticketCourses);
    logger.info(`[KDS] Séquençage initialisé pour order ${orderId} : 1er service=${firstCourse} (FIRED)`);

    return ticketCourses;
  }

  /**
   * Envoi du service suivant (Fire next course) — déclenché par la salle ou la cuisine.
   */
  static async fireCourse(
    tenantId: string,
    orderId: string,
    course: CourseType,
    firedBy: string
  ): Promise<KDSTicketCourses> {
    const existing = await Nexus.adapter.get<KDSTicketCourses>(`tenants/${tenantId}/kdsCourses/${orderId}`);
    if (!existing) {
      throw new Error(`Séquençage introuvable pour la commande ${orderId}`);
    }

    const now = Date.now();
    existing.courses[course].status = 'FIRED';
    existing.courses[course].firedAt = now;
    existing.nextRequestedCourse = undefined;

    await Nexus.adapter.set(`tenants/${tenantId}/kdsCourses/${orderId}`, existing);

    // Émission des événements du bus
    await NexusEventBus.emit('ops.course.fired', {
      v: 1,
      tenantId,
      orderId,
      tableId: existing.tableId,
      course,
      firedBy,
      firedAt: now,
    });

    await NexusEventBus.emit('kds.fire_next_course', {
      v: 1,
      tenantId,
      orderId,
      course: course === 'entree' ? 1 : course === 'plat' ? 2 : 3,
      firedBy,
      firedAt: now,
    });

    logger.info(`[KDS] Service ${course} envoyé (FIRED) pour la commande ${orderId} par ${firedBy}`);
    return existing;
  }

  /**
   * Demande d'envoi de la suite par la salle ("Envoyer la suite")
   */
  static async requestNextCourse(
    tenantId: string,
    orderId: string,
    nextCourse: CourseType,
    requestedBy: string
  ): Promise<KDSTicketCourses> {
    const existing = await Nexus.adapter.get<KDSTicketCourses>(`tenants/${tenantId}/kdsCourses/${orderId}`);
    if (!existing) {
      throw new Error(`Séquençage introuvable pour la commande ${orderId}`);
    }

    const now = Date.now();
    existing.nextRequestedCourse = nextCourse;
    existing.requestedAt = now;

    await Nexus.adapter.set(`tenants/${tenantId}/kdsCourses/${orderId}`, existing);

    await NexusEventBus.emit('ops.course.next_requested', {
      v: 1,
      tenantId,
      orderId,
      tableId: existing.tableId,
      requestedCourse: nextCourse,
      requestedBy,
      requestedAt: now,
    });

    logger.info(`[KDS] Suite demandée pour ${nextCourse} sur commande ${orderId} par ${requestedBy}`);
    return existing;
  }
}
