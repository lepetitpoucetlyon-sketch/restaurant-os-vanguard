import { z } from 'zod';

export const TicketSchema_v1 = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(5, "Le titre est requis"),
  description: z.string().min(10, "Description requise pour l'analyse IA"),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['ui', 'logic', 'performance', 'security', 'other']),
  metadata: z.object({
    jotaiSnapshot: z.any().optional(),
    consoleLogs: z.array(z.string()).optional(),
    timestamp: z.number(),
    screenshotBase64: z.string().optional()
  }).optional()
});

export type Ticket_v1 = z.infer<typeof TicketSchema_v1>;
