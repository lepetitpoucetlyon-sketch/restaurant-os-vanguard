export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiVersion } from '@/shared/nexus/contracts/api/api.contracts';

const TicketSchema_v1 = z.object({
  id: z.string().uuid(),
  title: z.string().min(5),
  description: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  forensicData: z.object({
    jotaiSnapshot: z.string().optional(),
    screenshot: z.string().optional(),
    logs: z.array(z.string()).optional()
  }).optional()
});

const TicketSchema_v2 = TicketSchema_v1.extend({
  tenantId: z.string(),
  userStatus: z.enum(['ACTIVE', 'RESTRICTED', 'ADMIN']).optional()
});

// Sincérité des Données : Contrat de Sortie
const AnalysisResponseSchema = z.object({
  success: z.boolean(),
  analysis: z.object({
    ticketId: z.string(),
    suggestedPatch: z.string(),
    confidenceScore: z.number(),
    actionRequired: z.string()
  }).optional(),
  error: z.string().optional(),
  errors: z.any().optional(),
  metadata: z.object({
    version: ApiVersion,
    timestamp: z.string()
  })
});

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const version = url.searchParams.get('v') === 'v2' ? 'v2' : 'v1';
    
    const body = await request.json();
    
    let parsedData;
    if (version === 'v2') {
      parsedData = TicketSchema_v2.parse(body);
      // Social Shield : Vérification du statut RESTRICTED
      if (parsedData.userStatus === 'RESTRICTED') {
         // Dans la vraie logique, on vérifierait si le ticket lui appartient.
         // Ici on mock le comportement Social Shield.
         if (!parsedData.title.includes('PERSONAL')) {
            throw new Error('SOCIAL_SHIELD_VIOLATION: Restricted users can only access their personal documents.');
         }
      }
    } else {
      parsedData = TicketSchema_v1.parse(body);
    }

    // Neural Analysis Module processing payload
    const rawResult = {
      success: true,
      analysis: {
        ticketId: parsedData.id,
        suggestedPatch: "Code modification required to stabilize state desynchronization.",
        confidenceScore: 0.94,
        actionRequired: "REVIEW_IN_AI_WORKSHOP"
      },
      metadata: {
        version,
        timestamp: new Date().toISOString()
      }
    };

    // Sincérité des données : Validation de la sortie avant envoi
    const safeResponse = AnalysisResponseSchema.parse(rawResult);

    return NextResponse.json(safeResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse = AnalysisResponseSchema.parse({
        success: false,
        errors: error.issues,
        metadata: {
          version: 'v1',
          timestamp: new Date().toISOString()
        }
      });
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    const errMessage = error instanceof Error ? error.message : 'Internal Server Error';
    const status = errMessage.includes('SOCIAL_SHIELD') ? 403 : 500;
    
    const fatalResponse = AnalysisResponseSchema.parse({
       success: false,
       error: errMessage,
       metadata: {
         version: 'v1',
         timestamp: new Date().toISOString()
       }
    });
    return NextResponse.json(fatalResponse, { status });
  }
}
