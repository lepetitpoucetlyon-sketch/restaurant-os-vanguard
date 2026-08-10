'use client';

import { useCallback, useState } from 'react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { StorageManager } from '@/infrastructure/services/storage';
import { useAtomValue, useSetAtom } from 'jotai';
import { tenantIdAtom, tenantBrandTokensAtom } from '@/bootstrap/store/pillars/sovereign';
import type { BrandConfig } from '@/shared/nexus/tokens/brand';

/**
 * Gère la lecture/écriture des BrandTokens pour le tenant courant.
 * Upload → Firebase Storage → URL → Firestore /brands/{id}/config/tokens
 */
export function useBrandEditor() {
  const tenantId = useAtomValue(tenantIdAtom) as string;
  const setBrandTokens = useSetAtom(tenantBrandTokensAtom);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const brandPath = `brands/${tenantId ?? 'default'}/config/tokens`;

  const saveTokens = useCallback(async (patch: Partial<BrandConfig>) => {
    if (!tenantId) return;
    setIsSaving(true);
    try {
      await Nexus.adapter.set(brandPath, {
        tenantId,
        ...patch,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setBrandTokens(patch as unknown as import("@/shared/nexus/tokens/brand").BrandConfig);
    } finally {
      setIsSaving(false);
    }
  }, [tenantId, brandPath, setBrandTokens]);

  const uploadAsset = useCallback(async (
    file: File,
    slot: 'logo' | 'favicon' | 'banner'
  ): Promise<string> => {
    if (!tenantId) throw new Error('Tenant non résolu');
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `brands/${tenantId}/${slot}.${ext}`;
      return await StorageManager.provider.upload(path, file, { contentType: file.type });
    } finally {
      setIsUploading(false);
    }
  }, [tenantId]);

  /** Upload + sauvegarde en une seule opération */
  const uploadAndSave = useCallback(async (
    file: File,
    slot: 'logo' | 'favicon' | 'banner'
  ) => {
    const url = await uploadAsset(file, slot);
    const key = slot === 'logo' ? 'logoUrl' : slot === 'favicon' ? 'faviconUrl' : 'bannerUrl';
    await saveTokens({ [key]: url } as Partial<BrandConfig>);
    return url;
  }, [uploadAsset, saveTokens]);

  return { saveTokens, uploadAsset, uploadAndSave, isUploading, isSaving };
}
