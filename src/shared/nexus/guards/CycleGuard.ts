import { logger } from '@/lib/logger';
import { Sentry } from '@/lib/sentry';

/**
 * 🌀 CycleGuard - The "Circuit Breaker" for DAG structures.
 * Prevents infinite recursions in recipes and dependency flows.
 */
export class CycleGuard {
    /**
     * Detects if adding a dependency creates a cycle.
     * Uses Depth-First Search (DFS).
     */
    static hasCycle(graph: Record<string, string[]>, startNode: string): boolean {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const check = (node: string): boolean => {
            if (recursionStack.has(node)) {
                const errorMsg = `[CycleGuard] CIRCULAR_DEPENDENCY_DETECTED at node: ${node}`;
                logger.error(errorMsg);
                
                // 🛡️ SENTRY SUTURE: Send DAG violation to the MCC
                Sentry.captureMessage(errorMsg, {
                    level: 'fatal',
                    tags: { service: "CycleGuard", integrity: "DAG_VIOLATION" },
                    extra: { graph, offendingNode: node }
                });
                
                return true;
            }
            if (visited.has(node)) return false;

            visited.add(node);
            recursionStack.add(node);

            const neighbors = graph[node] || [];
            for (const neighbor of neighbors) {
                if (check(neighbor)) return true;
            }

            recursionStack.delete(node);
            return false;
        };

        return check(startNode);
    }

    /**
     * Validates a recipe structure before persistence.
     */
    static validateRecipe(recipeId: string, dependencies: string[]): boolean {
        // Simplified graph for validation - in real-world, we'd fetch the full tree
        const mockGraph: Record<string, string[]> = {
            [recipeId]: dependencies
        };

        if (this.hasCycle(mockGraph, recipeId)) {
            throw new Error(`DAG_VIOLATION: Recipe [${recipeId}] creates a circular dependency.`);
        }
        return true;
    }
}
