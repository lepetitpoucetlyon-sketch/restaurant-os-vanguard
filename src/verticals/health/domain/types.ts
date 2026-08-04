export interface IPatient {
    id: string;
    crmId: string; // Lien vers L2 Core CRM
    bloodType?: string;
    allergies: string[];
}

export interface IAppointment {
    id: string;
    patientId: string;
    doctorId: string;
    date: Date;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
}

export interface IPrescription {
    id: string;
    patientId: string;
    medications: string[];
    issuedAt: Date;
}
