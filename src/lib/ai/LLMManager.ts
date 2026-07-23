import { ILLMProvider } from './types';

class LLMManagerClass {
    private _provider: ILLMProvider | null = null;

    set provider(provider: ILLMProvider) {
        this._provider = provider;
    }

    get provider(): ILLMProvider {
        if (!this._provider) {
            throw new Error('[LLMManager] No LLM provider registered. Call LLMManager.provider = new XxxProvider() at bootstrap.');
        }
        return this._provider;
    }
}

export const LLMManager = new LLMManagerClass();
