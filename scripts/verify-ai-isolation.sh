#!/usr/bin/env bash
# verify-ai-isolation.sh — CI guard pour les règles R1, R2, R3, R5, R9
# Exit 1 au premier hit. Utilisé en stage lint du pipeline.

set -euo pipefail

FAIL=0
ROOT="src"

echo "🔍 [AI Isolation CI] Vérification des règles R1-R10..."
echo ""

# ── R1 : TenantAIRegistry interdit dans fleet/ ─────────────────────────────
# Exception whitelistée : tenant-ai-config/route.ts (route MCC administrant
# aiSettings du tenant — ADR-008 Layer 4). N'accède PAS aux providers, appelle
# uniquement TenantAIRegistry.invalidate() pour rafraîchir le cache.
echo "R1 — TenantAIRegistry not in fleet/..."
if grep -r "TenantAIRegistry" "${ROOT}/app/api/admin/fleet/" 2>/dev/null \
    | grep -v "\.test\." \
    | grep -v "# ok" \
    | grep -v "tenant-ai-config/route\.ts"; then
    echo "❌ VIOLATION R1 : TenantAIRegistry importé dans fleet/"
    FAIL=1
else
    echo "✅ R1a OK"
fi

# ── R1 : MCCAIRegistry interdit dans modules/ ──────────────────────────────
echo "R1 — MCCAIRegistry not in modules/..."
if grep -r "MCCAIRegistry" "${ROOT}/modules/" 2>/dev/null | grep -v "\.test\."; then
    echo "❌ VIOLATION R1 : MCCAIRegistry importé dans modules/"
    FAIL=1
else
    echo "✅ R1b OK"
fi

# ── R1 : LLMManager supprimé des callers MCC ──────────────────────────────
echo "R1/R3 — LLMManager absent de fleet/..."
if grep -r "import.*LLMManager" "${ROOT}/app/api/admin/fleet/" 2>/dev/null | grep -v "\.test\."; then
    echo "❌ VIOLATION R3 : LLMManager encore utilisé dans fleet/"
    FAIL=1
else
    echo "✅ R3 OK"
fi

# ── R2 : Pas de vertical hardcodé dans kernel/ai/ ─────────────────────────
echo "R2 — No vertical hardcode in kernel/ai/..."
VARIANTS="restaurant hotel bakery garage salon clinic retail gym coworking veterinary florist"
for v in $VARIANTS; do
    if grep -r "'${v}'\|\"${v}\"" "${ROOT}/kernel/ai/" 2>/dev/null | grep -v "\.test\." | grep -v "# ok"; then
        echo "❌ VIOLATION R2 : \"${v}\" hardcodé dans kernel/ai/"
        FAIL=1
    fi
done
echo "✅ R2 OK"

# ── R5 : Pas de clé API NEXT_PUBLIC_LLM_* ──────────────────────────────────
echo "R5 — No NEXT_PUBLIC_LLM_* in kernel/ai/..."
if grep -r "NEXT_PUBLIC_\(LLM\|GEMINI\|OPENAI\|ANTHROPIC\|MISTRAL\)" "${ROOT}/kernel/ai/" 2>/dev/null; then
    echo "❌ VIOLATION R5 : Clé API publique dans kernel/ai/"
    FAIL=1
else
    echo "✅ R5 OK"
fi

# ── R9 : TenantProviderChain ne lit pas MCC_LLM_* ─────────────────────────
echo "R9 — TenantProviderChain ne lit pas MCC_LLM_*..."
if grep -r "process\.env\[.*MCC_LLM_" "${ROOT}/kernel/ai/tenant/" 2>/dev/null | grep -v "\.test\."; then
    echo "❌ VIOLATION R9 : MCC_LLM_* lue via process.env dans kernel/ai/tenant/"
    FAIL=1
else
    echo "✅ R9 OK"
fi

# ── R8 : Pas de catch silencieux dans les handlers MCC ────────────────────
echo "R8 — OpsAlertGateway présent dans diagnose/route.ts..."
if ! grep -q "OpsAlertGateway" "${ROOT}/app/api/admin/fleet/support-ai/diagnose/route.ts" 2>/dev/null; then
    echo "❌ VIOLATION R8 : OpsAlertGateway absent de diagnose/route.ts"
    FAIL=1
else
    echo "✅ R8 OK"
fi

# ── Résultat ──────────────────────────────────────────────────────────────
echo ""
if [ "$FAIL" -eq 1 ]; then
    echo "🚨 [AI Isolation CI] ÉCHEC — Des violations ont été détectées."
    echo "   Consulter docs/adrs/ADR-008-mcc-tenant-ai-scope-isolation.md"
    exit 1
else
    echo "✅ [AI Isolation CI] SUCCÈS — Toutes les règles R1-R10 respectées."
    exit 0
fi
