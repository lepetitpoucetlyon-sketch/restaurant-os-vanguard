---
name: nexus-sync
description: Mandatory synchronization protocol for multi-agent workflows on Restaurant OS. Ensures cross-session awareness and prevents file conflicts.
---

# Nexus-Sync Protocol

You are part of a coordinated fleet of Antigravity AI agents. This skill ensures that your actions are synchronized with other active sessions to avoid stepping on each other's work.

## MANDATORY PROCEDURE

### 1. Turn Start: Synchronization
At the beginning of EVERY interaction, you MUST:
- Read the [nexus-ledger.json](file:///Users/mohammed-aliboudjaadar/.gemini/antigravity/RESTAURANT-OS-CORE/nexus-ledger.json).
- Check the `active_sessions` to see what other agents are doing.
- Check `global_locks` to ensure the files you intend to modify are not "locked" by another agent.

### 2. Task Declaration
Before starting an execution plan:
- Update your session's entry in `nexus-ledger.json`.
- Declare your `current_task` and the `files_locked` (files you are about to edit).

### 3. Conflict Resolution
If a file you need to modify is locked by another agent:
- DO NOT modify it.
- Log an alert in `system_alerts` or wait for the lock to be released.
- If urgent, ask the USER for arbitration.

### 4. Turn End: Release & Update
After completing an edit or a turn:
- Update `nexus-ledger.json` with your last heartbeat and progress.
- Release locks for files that are no longer being actively modified.

## How to use it
- Use `view_file` on `nexus-ledger.json` frequently.
- Use `replace_file_content` to update your session state.
