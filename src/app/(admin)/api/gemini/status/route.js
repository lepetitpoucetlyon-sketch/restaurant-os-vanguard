import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  return NextResponse.json({ 
    configured: !!apiKey && apiKey.length > 10,
    provider: 'google-gemini',
    mode: 'secure-proxy'
  });
}
