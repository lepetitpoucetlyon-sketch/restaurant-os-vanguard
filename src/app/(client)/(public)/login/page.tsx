"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/kernel/hooks";
import { PinLogin } from "@nexus/guards/PinLogin";
import type { OnboardingState } from "@nexus/contracts/onboarding.types";

export default function LoginPage() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || checked) return;
        setChecked(true);

        // Vérifier si l'onboarding est terminé avant de rediriger
        fetch('/api/tenant/onboarding/status')
            .then(res => res.ok ? res.json() as Promise<OnboardingState> : null)
            .then(state => {
                if (!state?.completedAt) {
                    router.replace('/onboarding');
                } else {
                    router.replace('/pos');
                }
            })
            .catch(() => router.replace('/pos'));
    }, [isAuthenticated, checked, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary">
            <PinLogin />
        </div>
    );
}
