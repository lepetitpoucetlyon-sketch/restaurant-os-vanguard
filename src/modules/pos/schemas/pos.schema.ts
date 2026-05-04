import { z } from 'zod';
export const PosSchema = z.object({ id: z.string().uuid() });
export type Pos = z.infer<typeof PosSchema>;
