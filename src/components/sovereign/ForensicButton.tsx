"use client";

import React, { useCallback } from 'react';
import { useStore } from 'jotai';
import { z } from 'zod';
import { TicketSchema_v1 } from '@/shared/validation/TicketSchema';
import { toast } from 'sonner';

export function ForensicButton() {
  const store = useStore();

  const handleForensicCapture = useCallback(async () => {
    console.log("[NEXUS BRIDGE] Début de la capture Forensic...");

    const snapshot = {
      timestamp: Date.now(),
      storeId: store.toString(),
      message: "Jotai Store capture (Metadata)"
    };

    const consoleLogs = ["[NEXUS BRIDGE] No recent unhandled exceptions caught in standard buffer."];
    const screenshotData = "data:image/png;base64,mocked_screenshot_base64_nexus";

    const ticketData = {
      title: "Auto-Generated Forensic Ticket",
      description: "Capture automatisée via ForensicButton. Nécessite une analyse NAM.",
      priority: "high",
      category: "ui",
      metadata: {
        jotaiSnapshot: snapshot,
        consoleLogs,
        timestamp: Date.now(),
        screenshotBase64: screenshotData
      }
    };

    try {
      const validTicket = TicketSchema_v1.parse(ticketData);
      console.log("[NEXUS BRIDGE] Validation Zod TicketSchema_v1 OK:", validTicket);

      const res = await fetch('/api/nam/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validTicket)
      });

      const responseData = await res.json();
      console.log("[NEXUS BRIDGE] NAM Analysis Result:", responseData);

    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("[NEXUS BRIDGE] Zod Validation Failed:", error.issues);
        toast.error(`Validation Failed: ${error.issues.map((e: { message: string }) => e.message).join(", ")}`);
      } else {
        console.error("[NEXUS BRIDGE] Unexpected error:", error);
      }
    }
  }, [store]);

  return (
    <button 
      onClick={handleForensicCapture}
      className="fixed bottom-4 right-4 z-50 bg-status-danger hover:bg-status-danger text-white font-bold py-2 px-4 rounded shadow-lg flex items-center gap-2 transition-colors"
      aria-label="Capture Forensic"
    >
      <span>📸 Forensic Capture (NEXUS)</span>
    </button>
  );
}
