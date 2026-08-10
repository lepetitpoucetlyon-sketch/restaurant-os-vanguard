import { z } from 'zod';

export function onValidated<T extends z.ZodTypeAny, Args extends any[], R>(
    schema: T,
    handler: (payload: z.infer<T>, ...args: Args) => R
) {
    return (payload: unknown, ...args: Args) => {
        const validated = schema.parse(payload);
        return handler(validated, ...args);
    };
}
