import type { ReactNode } from 'react';
import { getPublicAccessConfig } from '@/lib/mcc/PublicAccessConfig';
import { PublicAccessClosed } from './PublicAccessClosed';

interface PublicAccessGateProps {
    feature: 'landing' | 'signup';
    children: ReactNode;
}

/**
 * Server component qui protège une page publique derrière le kill-switch MCC.
 * Si la feature est désactivée, rend <PublicAccessClosed> à la place du children.
 *
 * Fail-open : si la lecture Nexus échoue, on rend les enfants (ne pas fermer
 * la plateforme sur une erreur infra).
 */
export async function PublicAccessGate({ feature, children }: PublicAccessGateProps) {
    const config = await getPublicAccessConfig();
    const enabled = feature === 'landing' ? config.landingEnabled : config.signupEnabled;

    if (!enabled) {
        return <PublicAccessClosed feature={feature} customMessage={config.disabledMessage} />;
    }
    return <>{children}</>;
}
