import type { ISourceConnector, ConnectorId } from './types';
import { ZenchefConnector } from './zenchef/ZenchefConnector';
import { TheForkConnector } from './thefork/TheForkConnector';
import { ZeltyConnector } from './zelty/ZeltyConnector';
import { LAdditionConnector } from './laddition/LAdditionConnector';
import { LightspeedConnector } from './lightspeed/LightspeedConnector';
import { TillerConnector } from './tiller/TillerConnector';
import { PennylaneConnector } from './pennylane/PennylaneConnector';

const REGISTRY: Record<ConnectorId, ISourceConnector> = {
    zenchef:    new ZenchefConnector(),
    thefork:    new TheForkConnector(),
    zelty:      new ZeltyConnector(),
    laddition:  new LAdditionConnector(),
    lightspeed: new LightspeedConnector(),
    tiller:     new TillerConnector(),
    pennylane:  new PennylaneConnector(),
    sage:       new PennylaneConnector(), // Placeholder — même interface FEC
    cashpad:    new LAdditionConnector(), // Placeholder — CSV générique
    popina:     new LAdditionConnector(), // Placeholder — CSV générique
};

export const ConnectorRegistry = {
    get(id: string): ISourceConnector {
        const connector = REGISTRY[id as ConnectorId];
        if (!connector) throw new Error(`[ConnectorRegistry] Connecteur inconnu: ${id}`);
        return connector;
    },

    list(): ISourceConnector[] {
        return Object.values(REGISTRY);
    },

    available(): ConnectorId[] {
        return Object.keys(REGISTRY) as ConnectorId[];
    },
};
