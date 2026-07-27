import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

const GEMINI_BASE_URL = process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = process.env.LLM_MODEL_REASONING || 'gemini-1.5-flash';

interface DiagnoseBody {
  tenantId: string;
  description: string;
  screenshotUrl?: string;
}

interface DiagnosticResult {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  probableCause: string;
  recommendedFix: string;
  escalate: boolean;
}

const SYSTEM_PROMPT = `Tu es un agent SAV L0 pour Restaurant OS, un logiciel tout-en-un de gestion de restaurant (POS, KDS, réservations, stocks, comptabilité NF525, HACCP, RH). Tu analyses les tickets support et retournes un diagnostic structuré.`;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const body = await req.json().catch(() => null) as DiagnoseBody | null;
  if (!body?.tenantId?.trim() || !body?.description?.trim()) {
    return NextResponse.json({ error: 'tenantId et description requis' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Configuration IA manquante (GEMINI_API_KEY)' }, { status: 503 });
  }

  const userPrompt = `Analyse ce problème signalé par un opérateur restaurant.
Tenant : ${body.tenantId.trim()}
Description : ${body.description.trim()}
${body.screenshotUrl ? `Screenshot : ${body.screenshotUrl}` : ''}

Retourne UNIQUEMENT un objet JSON valide avec ces champs :
{
  "severity": "critical" | "high" | "medium" | "low",
  "category": "string (ex: POS, Fiscal, Réseau, Auth, Stocks, KDS, RH, HACCP)",
  "probableCause": "string — cause technique concise",
  "recommendedFix": "string — étapes de résolution en français",
  "escalate": boolean
}`;

  const geminiRes = await fetch(
    `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    logger.error('[support-ai] Gemini error', { status: geminiRes.status, body: errText });
    return NextResponse.json({ error: `Erreur IA (${geminiRes.status})` }, { status: 502 });
  }

  const geminiData = await geminiRes.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  let diagnostic: DiagnosticResult;
  try {
    const clean = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    diagnostic = JSON.parse(clean) as DiagnosticResult;
  } catch {
    logger.error('[support-ai] Failed to parse Gemini response', raw);
    return NextResponse.json({ error: 'Réponse IA non parseable' }, { status: 502 });
  }

  const ticketId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await Nexus.adapter.set(`mcc/supportTickets/${ticketId}`, {
    id: ticketId,
    tenantId: body.tenantId.trim(),
    description: body.description.trim(),
    screenshotUrl: body.screenshotUrl ?? null,
    diagnostic,
    createdAt,
    createdBy: caller.uid,
    escalated: false,
  });

  logger.info(`[support-ai] Ticket ${ticketId} for tenant ${body.tenantId} (by ${caller.uid})`);
  return NextResponse.json({ ticketId, diagnostic, createdAt }, { status: 201 });
}
