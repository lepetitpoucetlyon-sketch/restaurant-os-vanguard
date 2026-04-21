import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { GeminiLiveService } from '@/domain/agent/GeminiLiveService';
import { useSettings } from '@/context/SettingsContext';
import { SovereignData } from '@/shared/nexus-contract';

interface WebkitWindow extends Window {
    webkitAudioContext: typeof AudioContext;
}

interface PerformanceMemory {
    memory: {
        usedJSHeapSize: number;
    };
}

/**
 * PRODUCTION-GRADE HOOK: useGeminiLive
 * Orchestrates the real-time interaction between the UI and the central agent.
 */
export function useGeminiLive() {
    const { currentUser, rolePermissions } = useAuth();
    const { settings } = useSettings();
    const [isActive, setIsActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [transcripts, setTranscripts] = useState<{ text: string, isUser: boolean, timestamp: number }[]>([]);
    const [lastToolCall, setLastToolCall] = useState<{ name: string, args: SovereignData } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const serviceRef = useRef<GeminiLiveService | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startSession = useCallback(async () => {
        if (!currentUser) return;
        
        setIsConnecting(true);
        setError(null);

        try {
            // 1. Initialiser le relais avec la configuration Nexus
            const response = await fetch('/api/gemini-live', {
                method: 'POST',
                body: JSON.stringify({ 
                    type: 'session_init', 
                    user: currentUser,
                    nexusConfig: settings.nexusConfig
                })
            });

            const relayData = await response.json();
            if (!response.ok) throw new Error("Échec Relais");

            // 2. Capturer le micro (PCM 16kHz)
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const audioContext = new (window.AudioContext || (window as WebkitWindow).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = audioContext;
            
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
                if (serviceRef.current) {
                    const inputData = e.inputBuffer.getChannelData(0);
                    
                    // VOICE ACTIVITY DETECTION (VAD) / INTERRUPT
                    const volume = inputData.reduce((acc, val) => acc + Math.abs(val), 0) / inputData.length;
                    if (volume > 0.1) {
                        serviceRef.current.stopPlayback();
                    }

                    const pcmData = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
                    }
                    serviceRef.current.sendAudio(pcmData);
                }
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            // 3. Connecter le service central avec l'ADN injecté
            const service = new GeminiLiveService(currentUser, rolePermissions, {
                onTranscript: (text, isUser) => {
                    setTranscripts(prev => [...prev, { text, isUser, timestamp: Date.now() }]);
                },
                onToolCall: (name, args) => {
                    setLastToolCall({ name, args });
                }
            });

            await service.connect({
                system_instruction: relayData.system_instruction,
                tools: relayData.tools
            });
            serviceRef.current = service;


            
            setIsActive(true);
        } catch (err) {
            const errorObj = err as Error;
            console.error("Gemini Live Hook Error:", errorObj);
            setError("Microphone ou Relais inaccessible.");
            stopSession();
        } finally {
            setIsConnecting(false);
        }
    }, [currentUser, rolePermissions]);

    const stopSession = useCallback(() => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        audioContextRef.current?.close();
        serviceRef.current?.disconnect();
        serviceRef.current = null;
        setIsActive(false);
    }, []);

    const sendText = useCallback((text: string) => {
        serviceRef.current?.sendText(text);
    }, []);

    const clearTranscripts = useCallback(() => {
        setTranscripts([]);
    }, []);



    // Cleanup on unmount
    useEffect(() => {
        return () => {
            serviceRef.current?.disconnect();
        };
    }, []);

    return {
        isActive,
        isConnecting,
        error,
        transcripts,
        lastToolCall,
        startSession,
        stopSession,
        sendText,
        clearTranscripts
    };

}
