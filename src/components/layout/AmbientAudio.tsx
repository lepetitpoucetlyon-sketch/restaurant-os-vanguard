// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 🌌 AmbientAudio Controller
 * Synthesizes a premium, cinematic drone background using the Web Audio API.
 * No external media files required. 
 */
export const AmbientAudio: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Web Audio API refs
    const ctxRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const oscillatorsRef = useRef<OscillatorNode[]>([]);
    const lfosRef = useRef<OscillatorNode[]>([]);

    const initializeAudio = useCallback(() => {
        if (ctxRef.current) return;
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        ctxRef.current = ctx;

        // Master Gain
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0; // Start muted
        masterGain.connect(ctx.destination);
        masterGainRef.current = masterGain;

        // Frequencies for an ominous/ambient "Empire" drone (A minor / suspended)
        const freqs = [55, 110, 164.81]; // A1, A2, E3

        freqs.forEach((freq, index) => {
            // Main drone osc
            const osc = ctx.createOscillator();
            osc.type = index === 0 ? 'sine' : 'triangle';
            osc.frequency.value = freq;
            
            // Gain for this osc
            const oscGain = ctx.createGain();
            oscGain.gain.value = 0.15;

            // Lowpass Filter for depth
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400 + (index * 200);
            filter.Q.value = 2;

            // LFO to modulate filter (Breathing effect)
            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.05 + (index * 0.02); // Very slow LFO
            
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 200; // Modulation depth
            
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);

            // Routing
            osc.connect(filter);
            filter.connect(oscGain);
            oscGain.connect(masterGain);

            // Start nodes
            osc.start();
            lfo.start();

            oscillatorsRef.current.push(osc);
            lfosRef.current.push(lfo);
        });

        setIsInitialized(true);
    }, []);

    const togglePlayback = () => {
        if (!isInitialized) {
            initializeAudio();
        }

        const ctx = ctxRef.current;
        const masterGain = masterGainRef.current;
        if (!ctx || !masterGain) return;

        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        if (isPlaying) {
            // Fade out
            masterGain.gain.setTargetAtTime(0, ctx.currentTime, 1);
            setIsPlaying(false);
        } else {
            // Fade in
            masterGain.gain.setTargetAtTime(0.5, ctx.currentTime, 3); // Max volume 0.5
            setIsPlaying(true);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            masterGainRef.current?.gain.setTargetAtTime(0, ctxRef.current?.currentTime || 0, 0.5);
            setTimeout(() => {
                oscillatorsRef.current.forEach(o => o.stop());
                lfosRef.current.forEach(l => l.stop());
                ctxRef.current?.close();
            }, 1000);
        };
    }, []);

    return (
        <div className="flex items-center gap-2 bg-[#161618] border border-white/5 px-4 py-2.5 rounded-xl cursor-pointer hover:bg-[#1c1c1f] transition-all group" onClick={togglePlayback}>
            <div className={`relative flex items-center justify-center w-5 h-5 rounded-full transition-colors ${isPlaying ? 'text-indigo-400' : 'text-gray-500'}`}>
                {isPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                
                {/* Visualizer bars */}
                <AnimatePresence>
                    {isPlaying && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute -right-6 flex items-end gap-[2px] h-3.5"
                        >
                            {[1, 2, 3].map((i) => (
                                <motion.div 
                                    key={i}
                                    className="w-1 bg-indigo-500 rounded-t-sm"
                                    animate={{ height: ['20%', '100%', '20%'] }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: i * 0.2
                                    }}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className={`flex flex-col ml-1 ${isPlaying ? 'mr-6' : 'mr-0'} transition-all`}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 line-clamp-1">
                    Ambient Soundtrack
                </span>
                <span className={`text-[8px] uppercase tracking-tighter font-black ${isPlaying ? 'text-indigo-500' : 'text-gray-600'}`}>
                    {isPlaying ? 'Playing • Empire Drone' : 'Muted'}
                </span>
            </div>
        </div>
    );
};
