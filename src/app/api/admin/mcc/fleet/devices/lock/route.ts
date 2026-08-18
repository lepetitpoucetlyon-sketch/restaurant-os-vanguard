import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

/**
 * Generates an APNs (Apple Push Notification service) JWT token for MDM commands.
 * This requires an Apple Developer Enterprise account and an MDM Vendor certificate.
 */
function generateMDMAuthToken() {
  // In a real environment, this reads the .p8 private key and signs a JWT
  return `mdm_jwt_${crypto.randomBytes(16).toString('hex')}`;
}

export async function POST(req: NextRequest) {
  const caller = await requireMccLevel(req, 'mcc_super_admin');
  if (isDenied(caller)) return caller as NextResponse;

  try {
    const { tenantId, serialNumber, lock } = await req.json();

    if (!tenantId || !serialNumber || typeof lock !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Standard MDM Command Payload (XML plist format usually, converted to JSON for the wrapper)
    const mdmPayload = {
      CommandUUID: crypto.randomUUID(),
      Command: {
        RequestType: lock ? 'DeviceLock' : 'ClearPasscode',
        // Message displayed on the iPad screen when locked
        Message: lock ? "Cet appareil a été verrouillé par l'administrateur Restaurant OS. Veuillez régulariser votre situation." : "",
      }
    };

    logger.info(`[MDM Apple] Preparing APNs payload for ${serialNumber} (Lock: ${lock})`, { payload: mdmPayload });

    // In a real scenario, we send this command to our MDM server (e.g. MicroMDM, NanoMDM) 
    // or directly via APNs if we host our own MDM endpoints.
    const mdmEndpoint = process.env.MDM_SERVER_URL || 'https://mock-mdm.restaurant-os.com/v1/commands';
    const authToken = generateMDMAuthToken();

    try {
      if (process.env.MDM_SERVER_URL) {
        const response = await fetch(`${mdmEndpoint}/${serialNumber}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(mdmPayload)
        });

        if (!response.ok) throw new Error(`MDM API returned ${response.status}`);
        logger.info(`[MDM Apple] APNs Push sent successfully to ${serialNumber}`);
      } else {
        logger.warn(`[MDM Apple] Simulated APNs Push (Missing MDM_SERVER_URL)`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating network delay
      }
    } catch (mdmError) {
      logger.error(`[MDM Apple] Failed to push MDM command`, { error: mdmError });
      return NextResponse.json({ error: 'MDM Server Unreachable', details: String(mdmError) }, { status: 502 });
    }

    return NextResponse.json({ 
      success: true, 
      locked: lock,
      commandUUID: mdmPayload.CommandUUID
    });

  } catch (error) {
    logger.error('[MDM Kill Switch] Failed to process command', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
