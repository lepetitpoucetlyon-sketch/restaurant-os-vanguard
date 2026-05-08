import { z } from 'zod';
import { SanitizedStringSchema, TimestampSchema, UUIDSchema, StatusSchema } from './primitives';

export const TableShapeSchema = z.enum(['rect', 'circle']).or(z.string());

export const TableSchema = z.object({
  id:                UUIDSchema,
  type:              z.literal('table').default('table'),
  number:            z.string(),
  seats:             z.number().int().min(1),
  status:            z.enum(['free', 'available', 'occupied', 'reserved', 'cleaning', 'locked']).or(z.string()),
  x:                 z.number(),
  y:                 z.number(),
  width:             z.number().optional(),
  height:            z.number().optional(),
  radius:            z.number().optional(),
  zoneId:            UUIDSchema,
  floorId:           UUIDSchema.optional(),
  shape:             TableShapeSchema,
  schemaVersion:     z.literal(2).default(2),
  updatedAt:         TimestampSchema.default(Date.now() as unknown), // TECH_DEBT: Zod union input — refacto primitives
}).catchall(z.any());

export const ReservationSchema = z.object({
  id:                UUIDSchema,
  type:              z.literal('reservation').default('reservation'),
  customerId:        UUIDSchema,
  customerName:      SanitizedStringSchema,
  tableId:           UUIDSchema.optional(),
  date:              z.string(), // ISO
  time:              z.string(), // HH:mm
  partySize:         z.number().int().min(1),
  covers:            z.number().int().min(1).optional(),
  status:            z.enum(['pending', 'confirmed', 'arrived', 'seated', 'cancelled', 'no_show']),
  duration:          z.number().int().min(1).optional(),
  notes:             SanitizedStringSchema.optional(),
  schemaVersion:     z.literal(2).default(2),
  updatedAt:         TimestampSchema.default(Date.now() as unknown), // TECH_DEBT: Zod union input — refacto primitives
}).catchall(z.any());

export const FloorSchema = z.object({
  id:                UUIDSchema,
  type:              z.literal('floor').default('floor'),
  name:              SanitizedStringSchema,
  level:             z.number().int(),
  isActive:          z.boolean().default(true),
  icon:              z.string().optional(),
  description:       SanitizedStringSchema.optional(),
  schemaVersion:     z.literal(2).default(2),
  updatedAt:         TimestampSchema.default(Date.now() as unknown), // TECH_DEBT: Zod union input — refacto primitives
}).catchall(z.any());

export const ZoneSchema = z.object({
  id:                UUIDSchema,
  type:              z.literal('zone').default('zone'),
  name:              SanitizedStringSchema,
  color:             z.string(),
  description:       SanitizedStringSchema.optional(),
  floorId:           UUIDSchema.optional(),
  x:                 z.number().optional(),
  y:                 z.number().optional(),
  width:             z.number().optional(),
  height:            z.number().optional(),
  schemaVersion:     z.literal(2).default(2),
  updatedAt:         TimestampSchema.default(Date.now() as unknown), // TECH_DEBT: Zod union input — refacto primitives
});

export type Table = z.infer<typeof TableSchema>;
export type Reservation = z.infer<typeof ReservationSchema>;
export type Floor = z.infer<typeof FloorSchema>;
export type Zone = z.infer<typeof ZoneSchema>;
