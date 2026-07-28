export type ApplicationStatus = 'new' | 'reviewing' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface JobOffer {
    title: string;
    description: string;
    location: string;
    type: 'full_time' | 'part_time' | 'interim' | 'apprenticeship';
    salary?: { min: number; max: number; currency: string };
    startDate?: string;
}

export interface Application {
    id: string;
    externalId: string;
    jobId: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone?: string;
    cvUrl?: string;
    coverLetter?: string;
    status: ApplicationStatus;
    appliedAt: string; // ISO 8601
}

export interface IRecruitmentProvider {
    readonly id: string;
    /** Posts the job offer and returns the externalId from the provider. */
    postJob(job: JobOffer): Promise<string>;
    fetchApplications(jobId: string): Promise<Application[]>;
    updateApplicationStatus(appId: string, status: ApplicationStatus): Promise<void>;
}
