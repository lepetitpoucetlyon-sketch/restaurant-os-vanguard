export interface IStorageProvider {
    upload(path: string, data: Blob | File, metadata?: { contentType?: string }): Promise<string>;
    getDownloadUrl(path: string): Promise<string>;
    delete(path: string): Promise<void>;
}
