import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

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
  const db = getFirestore();

  const userDocRef = doc(db, "users", uid);
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.exists() ? userDoc.data() : null;
  const isSuperAdmin = userData?.role === "SUPER_ADMIN" || userData?.role === "super_admin";

  const deviceDocRef = doc(db, "users", uid, "certifiedDevices", currentFingerprint);
  const deviceDoc = await getDoc(deviceDocRef);

  if (!deviceDoc.exists()) {
    if (isSuperAdmin) {
      // Auto-certify Super-Admin
      await setDoc(deviceDocRef, {
        fingerprint: currentFingerprint,
        certifiedAt: new Date().toISOString(),
        autoCertifiedAs: "SUPER_ADMIN",
        userAgent: navigator.userAgent
      });
      return { status: "CERTIFIED" };
    }

    if (isFixedAsset) {
      return { status: "REQUIRES_MANAGER_VALIDATION" };
    }

    const preferences2FA = userData?.preferences2FA || {};
    const methods: ("email" | "sms")[] = [];
    if (preferences2FA.email_enabled) methods.push("email");
    if (preferences2FA.sms_enabled) methods.push("sms");

    // Si aucune méthode n'est configurée, on peut par exemple forcer la validation manager
    if (methods.length === 0) {
      return { status: "REQUIRES_MANAGER_VALIDATION" };
    }

    return { status: "REQUIRES_2FA", methods };
  }

  const deviceData = deviceDoc.data();
  if (deviceData?.revoked) {
    return { status: "REVOKED" };
  }

  return { status: "CERTIFIED" };
}

export async function certifyDeviceWith2FA(uid: string, fingerprint: string): Promise<void> {
  const db = getFirestore();
  const deviceDocRef = doc(db, "users", uid, "certifiedDevices", fingerprint);
  await setDoc(deviceDocRef, {
    fingerprint,
    certifiedAt: new Date().toISOString(),
    certifiedVia: "2FA",
    userAgent: navigator.userAgent
  });
}


export async function revokeDevice(uid: string, fingerprint: string): Promise<void> {
  const db = getFirestore();
  const deviceDocRef = doc(db, "users", uid, "certifiedDevices", fingerprint);
  await setDoc(deviceDocRef, { revoked: true, revokedAt: new Date().toISOString() }, { merge: true });
}
