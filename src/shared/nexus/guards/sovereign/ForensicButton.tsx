import React, { useState } from 'react';
import { useStore } from 'jotai';
import { logger } from '@/lib/logger';

export const ForensicButton: React.FC = () => {
  const store = useStore();
  const [isCapturing, setIsCapturing] = useState(false);

  const handleForensicCapture = async () => {
    setIsCapturing(true);
    try {
      // Capture Jotai State
      const jotaiSnapshot = JSON.stringify(store);
      
      // Capture Screen (simulated placeholder for forensic snapshot)
      const screenshot = "SCREENSHOT_DATA_PLACEHOLDER";
      
      // Capture Console Errors (simulated context grab)
      const forensicData = {
        timestamp: new Date().toISOString(),
        jotaiSnapshot,
        screenshot,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      };
      
      logger.info('Forensic Snapshot Captured:', forensicData);
      
      // TODO: Dispatch to forensic endpoint
    } catch (error) {
      console.error('Forensic Capture Failed:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <button
      onClick={handleForensicCapture}
      disabled={isCapturing}
      className="bg-status-danger hover:bg-status-danger text-white font-bold py-2 px-4 rounded"
    >
      {isCapturing ? 'Capturing Nexus State...' : 'Trigger Forensic Snapshot'}
    </button>
  );
};
