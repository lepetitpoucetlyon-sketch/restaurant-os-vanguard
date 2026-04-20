import { z } from 'zod';

/**
 * 🔍 Quality Module Zod Schemas
 * Grade VI - HACCP & NF525 Compliance
 */

const ControlStatusSchema = z.enum(['pass', 'warning', 'fail', 'not_applicable', 'not_measured', 'quarantine']);

export const QualityControlItemSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  product_name: z.string(),
  product_category: z.string(),
  batch_number: z.string().optional(),
  lot_number: z.string().optional(),
  quantity_ordered: z.number(),
  quantity_delivered: z.number(),
  quantity_accepted: z.number(),
  quantity_rejected: z.number(),
  is_rejected: z.boolean(),
  checks: z.object({
    temperature: z.object({
      required: z.boolean(),
      performed: z.boolean(),
      measured: z.number().optional(),
      status: ControlStatusSchema
    }),
    visual: z.object({
      performed: z.boolean(),
      status: ControlStatusSchema
    })
  })
});

export const QualityControlSchema = z.object({
  id: z.string().optional(),
  control_number: z.string().optional(),
  supplier_id: z.string(),
  supplier_name: z.string(),
  controlled_at: z.string(),
  delivery_conditions: z.object({
    transport_type: z.string(),
    truck_temperature: z.number().optional(),
    compliant: z.boolean().optional()
  }).optional(),
  items: z.array(QualityControlItemSchema),
  summary: z.object({
    total_items: z.number(),
    overall_status: ControlStatusSchema,
    supplier_score_impact: z.number().optional()
  }),
  signature: z.object({
    captured: z.boolean(),
    data: z.string().optional(),
    signer_name: z.string().optional()
  }).optional()
});
