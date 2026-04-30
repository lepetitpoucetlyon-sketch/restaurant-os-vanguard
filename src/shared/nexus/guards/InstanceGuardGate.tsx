'use client';

import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { instanceStateAtom } from '@/store/instanceGuardAtoms';
import { InstanceGuard } from '@nexus/guards/InstanceGuard';

/**
 * 🛰️ InstanceGuardGate - Sovereignty Barrier
 * Blocks the entire application if the host is not authorized.
 * Placement: MUST be inside NexusCoreProvider to have access to atoms.
 */
export const InstanceGuardGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useAtom(instanceStateAtom);
    const [traceId] = React.useState(() => Math.random().toString(36).substring(7).toUpperCase());

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            // 🛡️ PROJECT_ID_CAPTURE: Get current Firebase Project from environment
            const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'UNSET';
            
            const tenantId = InstanceGuard.validateInstance(hostname, firebaseProjectId);
            const isAuthorized = tenantId !== 'UNAUTHORIZED';
            const isDev = tenantId === '__dev__';

            setState({
                isAuthorized,
                tenantId: isAuthorized ? tenantId : null,
                hostname,
                isDev
            });

            if (!isAuthorized) {
                console.error(`[ SOVEREIGNTY_ALERT ] UNAUTHORIZED_INSTANCE_DETECTED: Host=${hostname}, Project=${firebaseProjectId}`);
            }
        }
    }, [setState]);

    // --- 🏛️ LOCK SCREEN (UNAUTHORIZED) ---
    if (state.hostname !== null && !state.isAuthorized) {
        return (
            <div style={{
                backgroundColor: '#000',
                color: '#ff0000',
                height: '100vh',
                width: '100vw',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'JetBrains Mono, monospace',
                textAlign: 'center',
                padding: '2rem',
                border: '10px solid #ff0000',
                boxSizing: 'border-box'
            }}>
                <div style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    [ UNAUTHORIZED_INSTANCE ]
                </div>
                <div style={{ fontSize: '1.2rem', maxWidth: '600px', lineHeight: '1.5' }}>
                    Sovereignty Protocol Alpha active.
                    <br />
                    Host <strong>{state.hostname}</strong> is not listed in the Empire Whitelist.
                    <br /><br />
                    Execution halted to prevent code extraction.
                </div>
                <div style={{ marginTop: '3rem', opacity: 0.5, fontSize: '0.8rem' }}>
                    &gt; REMOTE_TRACE_ID: {traceId}
                    <br />
                    &gt; STATUS: ACCESS_DENIED
                </div>
            </div>
        );
    }

    // --- 🛠️ DEV MODE BADGE ---
    const devBadge = state.hostname !== null && state.isDev && (
        <div style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            backgroundColor: '#ffcc00',
            color: '#000',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            zIndex: 9999,
            fontFamily: 'JetBrains Mono, monospace',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)'
        }}>
            DEV_MODE_ACTIVE
        </div>
    );

    // Initial state check (avoiding flicker or permanent hang)
    if (state.hostname === null) {
        return (
            <div style={{ backgroundColor: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em' }}>
                [ INITIALIZING_EMPIRE_SIGNALS... ]
            </div>
        );
    }

    return (
        <>
            {devBadge}
            {children}
        </>
    );
};
