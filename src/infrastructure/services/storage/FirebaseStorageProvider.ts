import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { IStorageProvider } from './types';

export class FirebaseStorageProvider implements IStorageProvider {
    async upload(path: string, data: Blob | File, metadata?: { contentType?: string }): Promise<string> {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, data, metadata);
        return getDownloadURL(storageRef);
    }

    async getDownloadUrl(path: string): Promise<string> {
        return getDownloadURL(ref(storage, path));
    }

    async delete(path: string): Promise<void> {
        await deleteObject(ref(storage, path));
    }
}
