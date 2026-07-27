import type { IPaymentTerminalAdapter, TerminalAdapterType } from './types';
import { SimulatorAdapter } from './adapters/SimulatorAdapter';
import { ManualAdapter } from './adapters/ManualAdapter';

/**
 * Factory agnostique — charge chaque adapter TPE en lazy import.
 * Ajouter un nouveau provider : déposer son adapter dans ./adapters/ et ajouter un case ici.
 * Aucun import Firebase ni SDK IA direct — les adapters communiquent via leur propre protocole réseau.
 */
export async function buildAdapter(type: TerminalAdapterType): Promise<IPaymentTerminalAdapter> {
    switch (type) {
        case 'simulator': return new SimulatorAdapter();
        case 'manual':    return new ManualAdapter();
        case 'stripe': {
            const { StripeTerminalAdapter } = await import('./adapters/StripeTerminalAdapter');
            return new StripeTerminalAdapter();
        }
        case 'sumup': {
            const { SumUpAdapter } = await import('./adapters/SumUpAdapter');
            return new SumUpAdapter();
        }
        case 'worldline': {
            const { WorldlineAdapter } = await import('./adapters/WorldlineAdapter');
            return new WorldlineAdapter();
        }
        case 'adyen': {
            const { AdyenAdapter } = await import('./adapters/AdyenAdapter');
            return new AdyenAdapter();
        }
        case 'ingenico': {
            const { IngenicoDirectAdapter } = await import('./adapters/IngenicoDirectAdapter');
            return new IngenicoDirectAdapter();
        }
        case 'zettle': {
            const { ZettleAdapter } = await import('./adapters/ZettleAdapter');
            return new ZettleAdapter();
        }
        case 'verifone': {
            const { VerifoneAdapter } = await import('./adapters/VerifoneAdapter');
            return new VerifoneAdapter();
        }
        case 'square': {
            const { SquareAdapter } = await import('./adapters/SquareAdapter');
            return new SquareAdapter();
        }
        case 'sunday': {
            const { SundayAdapter } = await import('./adapters/SundayAdapter');
            return new SundayAdapter();
        }
        case 'lyfpay': {
            const { LyfPayAdapter } = await import('./adapters/LyfPayAdapter');
            return new LyfPayAdapter();
        }
        case 'paygreen': {
            const { PayGreenAdapter } = await import('./adapters/PayGreenAdapter');
            return new PayGreenAdapter();
        }
        case 'conecs': {
            const { ConecsAdapter } = await import('./adapters/ConecsAdapter');
            return new ConecsAdapter();
        }
        default:
            return new ManualAdapter();
    }
}
