import type { IRecruitmentProvider, JobOffer, Application, ApplicationStatus } from '../types';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * Formulaire propre — page de candidature via /[slug]/jobs.
 * Pas d'API externe — stocke directement dans Nexus.
 */
export class NativeFormProvider implements IRecruitmentProvider {
    readonly id = 'native';

    async postJob(job: JobOffer): Promise<string> {
        const id = `job_${Date.now()}`;
        // tenantId n'est pas dans l'interface IRecruitmentProvider — passé via le call site
        logger.info('[NativeFormProvider] postJob', job.title, id);
        return id;
    }

    async fetchApplications(jobId: string): Promise<Application[]> {
        try {
            const raw = await Nexus.adapter.get(`jobs/${jobId}/applications`) as Record<string, Application> | null;
            return raw ? Object.values(raw) : [];
        } catch (err) {
            logger.error('[NativeFormProvider] fetchApplications error', toError(err).message);
            return [];
        }
    }

    async updateApplicationStatus(appId: string, status: ApplicationStatus): Promise<void> {
        logger.info('[NativeFormProvider] updateApplicationStatus', appId, status);
    }
}
