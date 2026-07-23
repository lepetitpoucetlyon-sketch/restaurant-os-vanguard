import { z } from 'zod';

export const PiiRecordSchema = z.object({
    subjectId: z.string(),
    tenantId: z.string(),
    encryptedPayload: z.string(),
    keyFingerprint: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type PiiRecord = z.infer<typeof PiiRecordSchema>;

export const PiiFieldsSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
});

export type PiiFields = z.infer<typeof PiiFieldsSchema>;
