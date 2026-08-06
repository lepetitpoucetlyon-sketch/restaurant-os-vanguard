import { describe, it, expect } from 'vitest';
import { SelfHealingEngine } from '@shared/services/SelfHealingEngine';
import { QuantumCrypto } from '@/lib/QuantumCrypto';
import { ShieldedContext, SovereignSecurityViolation } from '@/modules/intelligence';
 
import { DNAInjector } from '@/modules/intelligence/ia/ai/DNAInjector';

describe('Sovereign Grade X++ - Deep Core Refortification Tests', () => {

    describe('1. Merkle Tree & Self-Healing', () => {
        it('should calculate identical Merkle roots for identical states', () => {
            const stateA = [{ id: '1', name: 'Burger' }, { id: '2', name: 'Pizza' }];
            const stateB = [{ id: '1', name: 'Burger' }, { id: '2', name: 'Pizza' }];
            
            const rootA = SelfHealingEngine.calculateCRC(stateA);
            const rootB = SelfHealingEngine.calculateCRC(stateB);
            
            expect(rootA).toBe(rootB);
            expect(rootA).not.toBe('0');
        });

        it('should detect state drift through Merkle mismatches', () => {
            const stateA = [{ id: '1', name: 'Burger' }];
            const stateB = [{ id: '1', name: 'Burger-Corrupt' }];
            
            const rootA = SelfHealingEngine.calculateCRC(stateA);
            const rootB = SelfHealingEngine.calculateCRC(stateB);
            
            expect(rootA).not.toBe(rootB);
        });

        it('should calculate stable Merkle tree structure hierarchically', () => {
            const data = { id: 'node_1', val: 42 };
            const tree = SelfHealingEngine.calculateMerkleTree(data);
            
            expect(tree.leaves.length).toBeGreaterThan(0);
            expect(tree.root).toBeTypeOf('string');
        });
    });

    describe('2. Post-Quantum Lattice (LWE PoC) Cryptography', () => {
        it('should generate a valid LWE seal and pass math verification', async () => {
            const data = 'order_tx_1001_amount_4500';
            const secret = 'quantum-secret-key-mcc-fleet';
            
            const seal = await QuantumCrypto.generateQuantumSeal(data, secret);
            
            expect(seal.version).toBe('V5.5-PQ');
            expect(seal.latticeSignature).toContain('PQ-LATTICE-SIG-LWE-V5.5:');
            
            const isValid = QuantumCrypto.verifySeal(seal, data, secret);
            expect(isValid).toBe(true);
        });

        it('should reject a tampered LWE seal signature with altered noise', async () => {
            const data = 'order_tx_1001_amount_4500';
            const secret = 'quantum-secret-key-mcc-fleet';
            
            const seal = await QuantumCrypto.generateQuantumSeal(data, secret);
            
            // Tamper the lattice signature payload to introduce massive noise
            const payloadStr = seal.latticeSignature.substring('PQ-LATTICE-SIG-LWE-V5.5:'.length);
            const payload = JSON.parse(payloadStr);
            payload.b[0] = (payload.b[0] + 50) % payload.q; // Add huge error
            
            const tamperedSeal = {
                ...seal,
                latticeSignature: `PQ-LATTICE-SIG-LWE-V5.5:${JSON.stringify(payload)}`
            };
            
            const isValid = QuantumCrypto.verifySeal(tamperedSeal, data, secret);
            expect(isValid).toBe(false);
        });
    });

    describe('3. Multi-Tenant Sandbox & ShieldedContext', () => {
        it('should execute functions within a sandbox context successfully', async () => {
            const tenantId = 'lepetitpoucet';
            const active = await ShieldedContext.run(tenantId, () => {
                return ShieldedContext.getActiveTenant();
            });
            expect(active).toBe(tenantId);
        });

        it('should assert tenant access inside sandboxed execution threads', async () => {
            const tenantId = 'lepetitpoucet';
            
            await ShieldedContext.run(tenantId, () => {
                expect(() => ShieldedContext.assertTenantAccess(tenantId)).not.toThrow();
                expect(() => ShieldedContext.assertTenantAccess('other-tenant')).toThrow(SovereignSecurityViolation);
            });
        });

        it('should block DNAInjector calls trying to access context crossover DNA', async () => {
            const correctTenant = 'tenant-vanguard';
            const maliciousTenant = 'tenant-attacker';

            // Execution inside attacker's context should throw when requesting vanguard's DNA
            await ShieldedContext.run(maliciousTenant, async () => {
                await expect(DNAInjector.getTenantDNA(correctTenant)).rejects.toThrow(SovereignSecurityViolation);
            });
        });
    });
});
