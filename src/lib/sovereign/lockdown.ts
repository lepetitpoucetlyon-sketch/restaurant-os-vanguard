import { Nexus } from '@/lib/nexus/NexusAdapter';
import { JsonObject } from "@/lib/types/json";

export async function generateFingerprint(): Promise<string> {
  const userAgent = navigator.userAgent;
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const concurrency = navigator.hardwareConcurrency ? navigator.hardwareConcurrency.toString() : "unknown";

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  let canvasFingerprint = "no-canvas";
  
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Sovereign Lockdown Fingerprint", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("Sovereign Lockdown Fingerprint", 4, 17);
    canvasFingerprint = canvas.toDataURL();
  }

  const rawData = `${userAgent}|${screenResolution}|${concurrency}|${canvasFingerprint}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(rawData);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return hashHex;
}

export type VerificationResult = 
  | { status: "CERTIFIED" }
  | { status: "REVOKED" }
  | { status: "REQUIRES_2FA"; methods: ("email" | "sms")[] }
  | { status: "REQUIRES_MANAGER_VALIDATION" };

export async function verifyDevice(uid: string, currentFingerprint: string, isFixedAsset: boolean = false): Promise<VerificationResult> {
  const userData = await Nexus.adapter.get<Record<string, unknown>>(`users/${uid}`);
  /**
   * Auto-certification réservée au niveau proprietaire (100) du tenant.
   *
   * ⚠️  L'ancien test (role === "SUPER_ADMIN" || role === "super_admin") confondait
   *     le propriétaire du tenant avec le super admin MCC — cette confusion est résolue.
   *     Le super admin MCC opère via isMCCMode() / FLEET_OPERATOR et n'a PAS de compte
   *     dans la collection tenant `users/`.
   */
  const isProprietaire = userData?.role === "proprietaire";

  const devicePath = `users/${uid}/certifiedDevices/${currentFingerprint}`;
  const deviceData = await Nexus.adapter.get<Record<string, unknown>>(devicePath);

  if (!deviceData) {
    if (isProprietaire) {
      await Nexus.adapter.set(devicePath, {
        fingerprint: currentFingerprint,
        certifiedAt: new Date().toISOString(),
        autoCertifiedAs: "proprietaire",
        userAgent: navigator.userAgent
      });
      return { status: "CERTIFIED" };
    }

    if (isFixedAsset) {
      return { status: "REQUIRES_MANAGER_VALIDATION" };
    }

    const preferences2FA = (userData as JsonObject)?.preferences2FA as Record<string, boolean> || {};
    const methods: ("email" | "sms")[] = [];
    if (preferences2FA.email_enabled) methods.push("email");
    if (preferences2FA.sms_enabled) methods.push("sms");

    if (methods.length === 0) {
      return { status: "REQUIRES_MANAGER_VALIDATION" };
    }

    return { status: "REQUIRES_2FA", methods };
  }

  if (deviceData?.revoked) {
    return { status: "REVOKED" };
  }

  return { status: "CERTIFIED" };
}

export async function certifyDeviceWith2FA(uid: string, fingerprint: string): Promise<void> {
  await Nexus.adapter.set(`users/${uid}/certifiedDevices/${fingerprint}`, {
    fingerprint,
    certifiedAt: new Date().toISOString(),
    certifiedVia: "2FA",
    userAgent: navigator.userAgent
  });
}


export async function revokeDevice(uid: string, fingerprint: string): Promise<void> {
  await Nexus.adapter.set(`users/${uid}/certifiedDevices/${fingerprint}`, { revoked: true, revokedAt: new Date().toISOString() }, { merge: true });
}
