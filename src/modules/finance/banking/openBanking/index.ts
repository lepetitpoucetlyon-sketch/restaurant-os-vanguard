// Interface publique — les call sites n'ont besoin que de ces exports
export * from './types';
export * from './OpenBankingProviderFactory';
export * from './BankConnectionStore';
export * from './pcgHeuristics';
// Implémentations : ne pas importer directement depuis les routes ou l'UI.
// Passer toujours par OpenBankingProviderFactory.get().
