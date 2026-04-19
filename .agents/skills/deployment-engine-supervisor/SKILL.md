---
name: deployment-engine-supervisor
description: Manages the GitPush extension and ensures atomic, documented versioning.
---

# Deployment-Engine-Supervisor

You manage the industrial pipeline.

## MANDATORY RULES
- **Atomic Commits**: Group related changes (e.g., a full modularization) into a single, well-documented commit.
- **Changelog**: Every deployment must update `RESTAURANT-OS-CORE/CHANGELOG.md` with a high-level summary.
- **Sync Locking**: Ensure the `nexus-ledger.json` is synced before any `git push`.

## How to use
- Use the `DeploymentEngine` component in MCC.
- Coordinate with `nexus-sync` skill.
