import { describe, it, expect, afterEach } from 'vitest';
import { CryptoService } from '@/lib/CryptoService';
import { FiscalKeyService } from '@/src/modules/finance/services/FiscalKeyService';;
import { FiscalEngine } from '@/modules/finance/fiscalite/FiscalAdapter';

/**
 * 🔐 Non-forgeabilité de la signature fiscale NF525.
 *
 * L'ancien schéma (SHA-256(hash + instanceId), repli 'default_instance')
 * permettait à quiconque de forger un sceau valide. Ces tests verrouillent
 * le nouveau contrat : HMAC-SHA256 avec clé provisionnée, échec sans clé.
 */
describe('🔐 Signature fiscale — HMAC & non-forgeabilité', () => {
    const ENV_KEY = process.env.FISCAL_SIGNING_SECRET ?? '';

    afterEach(() => {
        process.env.FISCAL_SIGNING_SECRET = ENV_KEY;
        FiscalKeyService.reset();
    });

    it('refuse de sceller sans aucune clé provisionnée', async () => {
        delete process.env.FISCAL_SIGNING_SECRET;
        FiscalKeyService.reset();
        await expect(
            FiscalEngine.sealEntry('tx-1', { amount: 1000 }, { instanceId: 'tenant-sans-cle' })
        ).rejects.toThrow('FISCAL_SIGNING_KEY_MISSING');
    });

    it('refuse de signer avec une clé vide', async () => {
        await expect(CryptoService.signFiscalData('deadbeef', '')).rejects.toThrow('FISCAL_SIGNATURE_SECRET_MISSING');
    });

    it("une signature forgée avec l'instanceId (ancien schéma) est invalide", async () => {
        FiscalKeyService.provision('resto-paris', FiscalKeyService.generateKey());
        const seal = await FiscalEngine.sealEntry('tx-2', { amount: 4200 }, { instanceId: 'resto-paris' });

        const signature = seal.signature ?? '';
        expect(signature).not.toBe('');

        // L'attaquant connaît le hash et l'instanceId — il tente l'ancien schéma.
        const forged = await CryptoService.signFiscalData(seal.hash, 'resto-paris');
        expect(forged).not.toBe(signature);

        // Et la vérification avec la vraie clé valide bien le sceau légitime.
        const key = FiscalKeyService.requireKey('resto-paris');
        expect(await CryptoService.verifyFiscalSignature(seal.hash, signature, key)).toBe(true);
        expect(await CryptoService.verifyFiscalSignature(seal.hash, forged, key)).toBe(false);
    });

    it('deux tenants ont des clés distinctes → signatures distinctes pour le même hash', async () => {
        FiscalKeyService.provision('tenant-a', FiscalKeyService.generateKey());
        FiscalKeyService.provision('tenant-b', FiscalKeyService.generateKey());
        const hash = await CryptoService.generateHash('same-payload', 'GENESIS_ROOT_0000000000000000');
        const sigA = await CryptoService.signFiscalData(hash, FiscalKeyService.requireKey('tenant-a'));
        const sigB = await CryptoService.signFiscalData(hash, FiscalKeyService.requireKey('tenant-b'));
        expect(sigA).not.toBe(sigB);
    });

    it('la chaîne de hash reste vérifiable (le changement de signature ne casse pas verifyChain)', async () => {
        FiscalKeyService.provision('resto-chain', FiscalKeyService.generateKey());
        const s1 = await FiscalEngine.sealEntry('tx-a', { total: 100 }, { instanceId: 'resto-chain' });
        const s2 = await FiscalEngine.sealEntry('tx-b', { total: 200 }, { lastSeal: s1, instanceId: 'resto-chain' });
        const s3 = await FiscalEngine.sealEntry('tx-c', { total: 300 }, { lastSeal: s2, instanceId: 'resto-chain' });
        expect(await FiscalEngine.verifyChain([s1, s2, s3])).toBe(true);
        // Altération d'un maillon → chaîne invalide.
        const tampered = { ...s2, dataSnapshot: s2.dataSnapshot?.replace('200', '999') };
        expect(await FiscalEngine.verifyChain([s1, tampered, s3])).toBe(false);
    });
});
