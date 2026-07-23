import { useState, useEffect } from 'react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
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
        const unsubscribe = Nexus.adapter.onSnapshot<SwitchboardState | null>('mcc/switchboard', (data) => {
            if (data) {
                setState(data);
            }
            setLoading(false);
        }, { onError: (error) => {
            console.error('[SWITCHBOARD] Error listening to state', error);
            setLoading(false);
        }});

        return () => unsubscribe();
    }, []);

    const toggleModule = async (moduleName: keyof SwitchboardState, reason: string) => {
        try {
            const currentState = state[moduleName];
            const newState = !currentState;
            
            await Nexus.adapter.update('mcc/switchboard', {
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
