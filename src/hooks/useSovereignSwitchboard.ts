import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logCorrectiveAction } from '@/lib/sovereign/telemetry';

export interface SwitchboardState {
    telemetryActive: boolean;
    samActive: boolean;
    nexusSyncActive: boolean;
    clientInterfaceActive: boolean;
}

const DEFAULT_STATE: SwitchboardState = {
    telemetryActive: true,
    samActive: true,
    nexusSyncActive: true,
    clientInterfaceActive: true
};

export function useSovereignSwitchboard() {
    const [state, setState] = useState<SwitchboardState>(DEFAULT_STATE);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const switchboardRef = doc(db, 'mcc', 'switchboard');
        const unsubscribe = onSnapshot(switchboardRef, (snapshot) => {
            if (snapshot.exists()) {
                setState(snapshot.data() as SwitchboardState);
            } else {
                // Sincérité à la Racine: If document doesn't exist, we don't assume `as any`.
                // We fallback to DEFAULT_STATE visually.
            }
            setLoading(false);
        }, (error) => {
            console.error('[SWITCHBOARD] Error listening to state', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const toggleModule = async (moduleName: keyof SwitchboardState, reason: string) => {
        try {
            const currentState = state[moduleName];
            const newState = !currentState;
            
            const switchboardRef = doc(db, 'mcc', 'switchboard');
            await updateDoc(switchboardRef, {
                [moduleName]: newState
            });

            // Loggue chaque action corrective
            await logCorrectiveAction('TOGGLE_MODULE', moduleName, currentState, newState, reason);
            
            return true;
        } catch (error) {
            console.error(`[SWITCHBOARD] Failed to toggle ${moduleName}`, error);
            return false;
        }
    };

    return {
        state,
        loading,
        toggleModule
    };
}
