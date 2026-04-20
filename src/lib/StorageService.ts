import { ref, uploadString, getDownloadURL, uploadBytes, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export const StorageService = {
  /**
   * Uploads a base64 image (DataURL) to Firebase Storage.
   * @param base64Data The base64 string (including data:image/jpeg;base64, prefix)
   * @param path The full path in storage (e.g., 'tenants/my-tenant/haccp/labels/img123.jpg')
   */
  async uploadBase64Image(base64Data: string, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    
    // We expect the prefix "data:image/jpeg;base64,"
    // Firebase uploadString can handle it with 'data_url' format
    await uploadString(storageRef, base64Data, 'data_url');
    
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  },

  /**
   * Uploads a File object to Firebase Storage.
   */
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  },

  /**
   * Deletes a file from Firebase Storage.
   */
  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  },

  /**
   * Gets the download URL for a specific path.
   */
  async getFileURL(path: string): Promise<string> {
    const storageRef = ref(storage, path);
    return getDownloadURL(storageRef);
  }
};
