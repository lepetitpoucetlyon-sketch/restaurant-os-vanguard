# 🏛️ RESTAURANT OS - ARCHITECTURE RULES

## 🛰️ VANGUARD ESCALATION PROTOCOL (Protocole d'Escalade)

This protocol defines the level of architectural rigor required for each module based on its impact on the system's sovereignty and legal compliance.

---

### 🛡️ LEVEL 1: 'CORE' (Sovereign Pillars)
**Modules**: `Ops`, `Finance`, `Logistics`, `Compliance`, `Human`.
**Requirements**:
- **Total Suture**: Must use `NEXUS INTERNAL MAPPER` for data ingestion.
- **STX Codes**: Must use `OperationalIdentity` (STX_ALPHA, STX_LAMBDA, etc.) for path resolution.
- **Genome Validation**: Must pass through `GenomeValidator` for all write operations.
- **Rigor**: Zero tolerance for `any`. 100% type safety.

### 🍃 LEVEL 2: 'LÉGER' (Velocity Modules)
**Modules**: `SEO`, `Marketing`, `Intelligence`, `UI/UX`, `Analytics`.
**Requirements**:
- **Simplicity**: Direct use of atoms or standard React hooks.
- **No Suture**: Avoid `NexusInternalMapper` unless strictly necessary for shared types.
- **No STX**: Domain paths can be static or simplified.
- **Velocity**: Prioritize development speed and visual excellence over absolute structural rigor.

---

### ⚡ MUTATION CRITERIA (Escalation Rule)
A **Level 2 (Léger)** module must escalate to **Level 1 (Core)** ONLY if it meets one of the following criteria:

---

## 🚧 PHYSICAL ENFORCEMENT (L'IA de Barbelés)

The following rules are physically enforced by ESLint. Any violation will result in a **Build Failure**.

### 1. NO DEEP IMPORTS
- **Rule**: `no-restricted-imports`
- **Constraint**: Forbidden to import from `@modules/pillar/subfolder/*`.
- **Solution**: Always import from the pillar's public API: `@modules/pillar`.

### 2. CORE ISOLATION
- **Rule**: `overrides` for `src/hooks`, `src/lib`, `src/shared/nexus`.
- **Constraint**: Forbidden to import from `@modules` or `@domain`.
- **Reason**: The "Brain" and "Nervous System" must not depend on the "Limbs".

### 3. DEPRECATED PATHS
- **Forbidden**: `@/shared/types`, `@/types`, `@/modules/gateway/auth`.
- **Replacement**: Use `@nexus/contracts` or `@nexus/guards`.

### 4. ANTI-RELATIVE SUTURE
- **Constraint**: `../../..` imports are restricted if they cross major directory boundaries.
- **Solution**: Use path aliases.

---

## 🆘 DIPLOMATIE DE CRISE (Sovereign Errors)

All system failures must be structured using the `SovereignError` contract.

### 1. ERROR STRUCTURE
```typescript
interface SovereignError {
  code: string;    // e.g., OPS_001
  pillar: string;  // e.g., OPS, FINANCE
  message: string; // Human readable
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
```

### 2. PILLAR SIGNATURES
Every error must carry its pillar prefix. This allows the UI to display context-aware recovery steps (e.g., pointing to the Fiscal Seal for a `FIN_002` error).

### 3. TRANSLATION MANDATE
Raw technical errors (network, database, parsing) MUST be passed through the `NexusInternalMapper.translateError()` function before being returned to the UI layer.
1.  **Fiscal Impact**: The module needs to write to the Grand Ledger (`STX_LAMBDA`).
2.  **Production Flow**: The module modifies the real-time production chain (Orders, KDS, Stock) (`STX_GAMMA`).
3.  **Legal Compliance**: The module handles PII or requires NF525/HACCP sealing.

---

### 📦 BARREL GOVERNANCE (Smart Seal)
- Use `node .nexus/scripts/smart-seal.js` to automate sub-folder exports.
- **Root Indexes**: Must remain manual to define the "Public API" of the module.
- **Internal Suture**: Use the term **Mapper** for internal data translation. **Bridge** is reserved for external (MCC/Fleet) communication.

---

### 📜 SOVEREIGN CONTRACTS (Contrats Souverains)

#### 1. ADDITION (Surface API)
- **Rule**: A module never imports from the internal files of another module.
- **Standard**: Always import from the root index: `import { ... } from '@/modules/ops';`.
- **Rationale**: The root index is a stable plug. The internal implementation can change without breaking the caller.

#### 2. MODIFICATION (Mapper Shield)
- **Rule**: Data structure changes in the database must be absorbed by the **Mapper** (Internal) or **Connector** (Léger).
- **Standard**: The Public API (what the index exports) remains stable.
- **Rationale**: The Mapper acts as an adapter, transforming "dirty" raw data into the stable contract expected by the rest of the Empire.

#### 3. SUPPRESSION (TypeScript Death)
- **Rule**: To delete a module, comment out its export in the root index first.
- **Standard**: Follow the red TS errors to clean up all dependencies.
- **Rationale**: TypeScript acts as a guide, ensuring a 100% clean removal without residual "ghost" code.

#### 4. CIRCULAR DEPENDENCIES (The Red Zone)
- **Problem**: Pillar A needs B, and B needs A.
- **Solution**: Shared data must be "deported".
---

### 🧪 LOW ALTITUDE PROTOCOL (Vol en Basse Altitude)

#### 1. THE LABORATORY (`src/laboratory/`)
- **Purpose**: "Quick & Dirty" experimentation and UI prototyping.
- **Rules**:
    - Files must use `.lab.tsx` or `.lab.ts`.
    - **No Core Interaction**: Components in `src/modules` or `src/engines` cannot import from the Lab.
    - **No Merge**: Lab files are excluded from production builds and should not be merged into `main` without suture.

#### 2. NEUTRAL GROUND (`src/shared/nexus/contracts/`)
- **Purpose**: Automatic resolution of circular dependencies.
- **Rule**: If a circularity is detected between modules, deport the shared types/interfaces here immediately.

#### 3. QUICK DEPLOY CLI
- **Command**: `npm run nexus:deploy -- --type=[hook|component|...] --pillar=[name] --name=[name]`
- **Effect**: Creates the file, adds boilerplate, and triggers `nexus:seal` automatically.

---

### 👻 GHOST MODE PROTOCOL (Sovereign Override)

#### 1. TRIGGER: "PROTOCOL VANGUARD: GHOST MODE"
- When this mode is active, the agent is allowed to code freely without worrying about folder structure or exports to prioritize raw creation speed.

#### 2. CLOSURE: "VANGUARD: SEAL THE GHOST"
- At the end of a Ghost session, the agent MUST perform a **Suture Phase**:
    - Move files to their correct pillars.
    - Run `npm run nexus:seal`.
    - Verify imports and type safety (Grade X).
