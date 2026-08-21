import { PublicAccessGate } from '../components/PublicAccessGate';
import { SignupPage } from './SignupContent';

export default function Page() {
    return (
        <PublicAccessGate feature="signup">
            <SignupPage />
        </PublicAccessGate>
    );
}
