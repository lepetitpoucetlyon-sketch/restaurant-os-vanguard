# 🧬 INSTANCE CONFIG PATTERN

Le modèle génétique (Blueprint) utilisé pour définir une instance "Grade X" dans Restaurant OS.

## 1. Schéma de Configuration

Toute instance doit suivre la structure définie dans `lepetitpoucet.ts` :

### A. Capabilities (Pouvoirs)
Définit les modules activés pour cette instance.
- `haccpGuardEnabled` : Activation du module d'hygiène.
- `plateAuditEnabled` : Analyse des assiettes.
- `allowSupportAccess` : Autorise l'accès au support Suzerain (MCC).

### B. Custom Features
Spécificités métier (ex: `rotisserie: true`).

### C. Theme (Apparence)
- `primaryColor` / `secondaryColor`
- `logoUrl`
- `appearance` : 'light' | 'dark' | 'auto'

### D. Status (État Vital)
- `layoutType` : **CRITIQUE**. Définit l'interface ('default' pour Empire, 'sidebar' pour MCC).
- `licenceStatus` : 'active' | 'LOCKED'.
- `economy` : Paramètres de facturation et devise.

### E. Firebase (Infrastructure)
Configuration de la base de données isolée.

## 2. Le Piège du `layoutType`

> [!IMPORTANT]
> Le `layoutType` est la cause de la disparition récente de l'interface. S'il est réglé sur `sidebar`, l'utilisateur se retrouve dans l'interface administrative restreinte. Pour un restaurant opérationnel, il doit TOUJOURS être à `default`.

## 3. Template de Création (Nouveau Tenant)
```typescript
export const newTenantConfig: TenantConfig = {
    id: 'new-tenant',
    capabilities: { haccpGuardEnabled: true, plateAuditEnabled: false, allowSupportAccess: true },
    theme: { primaryColor: '#...', appearance: 'dark' },
    status: { layoutType: 'default', licenceStatus: 'active', economy: { basePrice: 0, currency: 'EUR' } },
    firebase: { projectId: '...', apiKey: '...' }
};
```
