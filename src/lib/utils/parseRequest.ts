import { ZodSchema } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🏛️ PARSE REQUEST - Grade X Sentinel
 * Standardized Zod validation for API route bodies.
 */

interface ParseSuccess<T> {
  success: true;
  data: T;
}

interface ParseFailure {
  success: false;
  response: NextResponse;
}

export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

export async function parseRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ParseResult<T>> {
  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Corps de requête JSON invalide', code: 'INVALID_JSON' },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(rawBody);

  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error:  'Données invalides',
          code:   'VALIDATION_FAILED',
          detail: result.error.issues.map(i => ({
            path:    i.path.join('.'),
            message: i.message,
            code:    i.code,
          })),
        },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: result.data };
}
