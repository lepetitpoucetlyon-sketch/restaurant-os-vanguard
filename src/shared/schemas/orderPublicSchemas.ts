import { z } from 'zod';

export const CreateOrderItemInputSchema = z.object({
    productId: z.string().min(1, 'productId requis'),
    categoryId: z.string().optional().default('cat-default'),
    name: z.string().min(1, 'Nom produit requis'),
    quantity: z.number().int().positive('La quantité doit être positive'),
    unitPriceMu: z.number().int().nonnegative('Prix en microunités'),
    course: z.enum(['STARTER', 'MAIN', 'DESSERT', 'BEVERAGE', 'DEFAULT']).optional().default('DEFAULT'),
    seatNumber: z.number().int().positive().optional(),
    taxRate: z.enum(['0.055', '0.10', '0.20']).optional().default('0.10'),
    allergens: z.array(z.string()).optional().default([]),
    notes: z.string().optional(),
});

export const CreateOrderInputSchema = z.object({
    tableNumber: z.string().optional(),
    tableId: z.string().optional(),
    customerName: z.string().optional(),
    channel: z.enum(['DINE_IN', 'TAKEAWAY', 'MOBILE_SERVER', 'QR_TABLE', 'DELIVERY']).default('DINE_IN'),
    items: z.array(CreateOrderItemInputSchema).min(1, 'Au moins un article est requis'),
    notes: z.string().optional(),
});

export type CreateOrderItemInput = z.infer<typeof CreateOrderItemInputSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;
