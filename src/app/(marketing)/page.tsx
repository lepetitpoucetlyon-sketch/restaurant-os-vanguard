import { PublicAccessGate } from './components/PublicAccessGate';
import { MarketingHomePage } from './HomeContent';

export default function Page() {
    return (
        <PublicAccessGate feature="landing">
            <MarketingHomePage />
        </PublicAccessGate>
    );
}
