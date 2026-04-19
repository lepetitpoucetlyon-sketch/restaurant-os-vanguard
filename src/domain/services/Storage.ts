import { StorageService } from '@/lib/StorageService';
import { Nexus } from '@/lib/nexus/NexusAdapter';

/**
 * 📦 Domain Storage Service (Grade IX)
 * 
 * Orchestrates file operations with high-level tenant awareness.
 * Enforces tenant-isolated storage paths using the Nexus engine.
 */
export const Storage = {
    /**
     * Uploads a file (File object or Base64 string) to a tenant-specific path.
     * @param file - The file data to upload.
     * @param subPath - The target subpath (e.g., 'haccp/label.png').
     * @returns The public download URL.
     */
    async upload(file: File | string, subPath: string): Promise<string> {
        // Enforce Grade IX tenant isolation via Nexus
        const tenantStoragePath = Nexus.getTenantPath(`storage/${subPath}`);
        
        if (typeof file === 'string') {
            return StorageService.uploadBase64Image(file, tenantStoragePath);
        }
        return StorageService.uploadFile(file, tenantStoragePath);
    },

    /**
     * Deletes a file from the tenant-specific storage.
     * @param subPath - The subpath of the file to delete.
     */
    async delete(subPath: string): Promise<void> {
        const tenantStoragePath = Nexus.getTenantPath(`storage/${subPath}`);
        return StorageService.deleteFile(tenantStoragePath);
    },

    /**
     * Retrieves the download URL for a file.
     * @param subPath - The subpath of the file.
     */
    async getUrl(subPath: string): Promise<string> {
        const tenantStoragePath = Nexus.getTenantPath(`storage/${subPath}`);
        return StorageService.getFileURL(tenantStoragePath);
    },

    /**
     * Specialized: Upload HACCP-related documents (labels, temperature logs).
     */
    async uploadHACCP(file: File | string, filename: string): Promise<string> {
        return this.upload(file, `haccp/${filename}`);
    },

    /**
     * Specialized: Upload Staff documents (ID cards, contracts).
     */
    async uploadStaffDoc(staffId: string, file: File | string, filename: string): Promise<string> {
        return this.upload(file, `staff/${staffId}/${filename}`);
    }
};
