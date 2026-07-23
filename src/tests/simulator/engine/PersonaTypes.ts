export interface PersonaContext {
  tenantId: string;
  operatorId: string;
}

export interface ActResult {
  label: string;
  layer: string;
  success: boolean;
  durationMs: number;
  data?: Record<string, unknown>;
  error?: string;
}

export interface PersonaResult {
  personaId: string;
  tenantId: string;
  acts: ActResult[];
  durationMs: number;
  success: boolean;
  payload: Record<string, unknown>;
}

export type PersonaFn = (ctx: PersonaContext) => Promise<PersonaResult>;

export async function runAct(
  label: string,
  layer: string,
  fn: () => Promise<unknown>
): Promise<ActResult> {
  const start = Date.now();
  try {
    const data = await fn();
    return {
      label,
      layer,
      success: true,
      durationMs: Date.now() - start,
      data: data as Record<string, unknown>,
    };
  } catch (e) {
    return {
      label,
      layer,
      success: false,
      durationMs: Date.now() - start,
      error: String(e),
    };
  }
}
