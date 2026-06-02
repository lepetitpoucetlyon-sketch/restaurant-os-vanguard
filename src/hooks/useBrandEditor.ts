'use client';

import { useCallback, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '@/lib/firebase';
import { useAtomValue, useSetAtom } from 'jotai';
import { tenantIdAtom, tenantBrandTokensAtom } from '@/store/pillars/sovereign';
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

  const brandRef = doc(firestore, 'brands', tenantId ?? 'default', 'config', 'tokens');

  /** Sauvegarde des tokens (patch partiel) */
  const saveTokens = useCallback(async (patch: Partial<BrandConfig>) => {
    if (!tenantId) return;
    setIsSaving(true);
    try {
      await setDoc(brandRef, {
        tenantId,
        ...patch,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setBrandTokens({ ...(patch as any) });
    } finally {
      setIsSaving(false);
    }
  }, [tenantId, brandRef, setBrandTokens]);

  /** Upload d'un fichier image vers Firebase Storage, retourne l'URL publique */
  const uploadAsset = useCallback(async (
    file: File,
    slot: 'logo' | 'favicon' | 'banner'
  ): Promise<string> => {
    if (!tenantId) throw new Error('Tenant non résolu');
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `brands/${tenantId}/${slot}.${ext}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, { contentType: file.type });
      return await getDownloadURL(storageRef);
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
