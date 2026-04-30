# 🧪 THE LABORATORY (Zone de Lab)

**Protocol**: Quick & Dirty Experimentation.
**Rigor**: Level 0 (None).

## Rules
1.  **Extension**: All files MUST end in `.lab.tsx` or `.lab.ts`.
2.  **Isolation**: Core components (`src/modules`, `src/engines`) are STRICTLY FORBIDDEN from importing anything from this directory.
3.  **No Merge**: This directory is excluded from production builds. A pre-commit hook (to be implemented) will block any commit containing imports from `src/laboratory` in core files.
4.  **Sandbox**: Use this to test UI ideas, complex logic, or "Ghost Mode" drafts before Suture.

---

*Fly low, fly fast, but keep the Empire clean.*
