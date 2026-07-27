import { IStorageProvider } from './types';

class StorageManagerClass {
    private _provider: IStorageProvider | null = null;

    set provider(provider: IStorageProvider) {
        this._provider = provider;
    }

    get provider(): IStorageProvider {
        if (!this._provider) {
            throw new Error('[StorageManager] No storage provider registered.');
        }
        return this._provider;
    }
}

export const StorageManager = new StorageManagerClass();
