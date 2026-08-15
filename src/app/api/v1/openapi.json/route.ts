import { NextResponse } from 'next/server';
import { OpenApiSpecService } from '@/lib/api/OpenApiSpecService';

export const dynamic = 'force-dynamic';

export async function GET() {
  const spec = OpenApiSpecService.getSpec();
  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
