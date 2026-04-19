import { FiscalEngine } from '../src/domain/services/FiscalEngine';
import { LegalArchiveService } from '../src/domain/services/LegalArchiveService';

async function runEmpireVsChaosAudit() {
    console.log("🚀 Starting EMPIRE VS CHAOS Audit Simulation...");
    const instanceId = "EMP-PARIS-01";
    
    // 1. EMPIRE WEEK: Perfect Transactional Flow
    console.log("\n--- Phase 1: Empire Week (Integrity) ---");
    let lastSeal = undefined;
    const empireSeals = [];
    
    for (let i = 1; i <= 5; i++) {
        const transaction = { id: `TX-${i}`, amountInCents: 1500 * i, items: ['Pizza', 'Wine'] };
        lastSeal = await FiscalEngine.sealEntry(`TX-${i}`, transaction, { lastSeal, instanceId });
        empireSeals.push(lastSeal);
        console.log(`✅ Sealed TX-${i}: ${lastSeal.hash.substring(0, 8)}...`);
    }
    
    const empireAudit = await FiscalEngine.runAudit(empireSeals, instanceId);
    console.log(`📊 Empire Audit Result: ${empireAudit.isValid ? "PASS ✅" : "FAIL ❌"}`);
    
    // 2. SEAL THE PERIOD
    console.log("\n--- Phase 2: Legal Archiving ---");
    const vault = await LegalArchiveService.sealPeriod("2026-Q1", empireSeals, instanceId);
    console.log(`📂 Vault Created: ${vault.id} | GlobalHash: ${vault.globalHash.substring(0, 8)}...`);
    
    // 3. CHAOS MOMENT: Manual Tampering Simulation
    console.log("\n--- Phase 3: Chaos Moment (Tampering Detection) ---");
    const tamperedSeals = JSON.parse(JSON.stringify(empireSeals));
    tamperedSeals[2].dataSnapshot = tamperedSeals[2].dataSnapshot.replace("Pizza", "Caviar"); // Fake price/item change
    console.log("⚠️ Injecting data corruption in TX-3...");
    
    const chaosAudit = await FiscalEngine.runAudit(tamperedSeals, instanceId);
    console.log(`📊 Chaos Audit Result: ${chaosAudit.isValid ? "DETECTED 🛡️" : "FAILED TO DETECT 🚨"}`);
    if (!chaosAudit.isValid) {
        console.log(`🛑 Violation Type: ${chaosAudit.violations[0].type}`);
    }

    // 4. VERIFY VAULT
    console.log("\n--- Phase 4: Vault Verification ---");
    const isVaultValid = await LegalArchiveService.verifyVaultIntegrity(vault, empireSeals);
    console.log(`🔒 Vault Integrity Check: ${isVaultValid ? "SUCCESS ✅" : "TAMPERED ❌"}`);
}

runEmpireVsChaosAudit().catch(console.error);
