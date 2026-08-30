/**
 * 🚀 SpeculativeToolEngine — Architecture Complète Spec-PTC
 * 
 * Orchestrateur de niveau souverain intégrant le parsing de préfixe streaming,
 * la membrane de conformité NF525 et le contexte d'exécution d'ombre.
 */

import { StreamingPrefixParser, ParsedToolIntent } from './StreamingPrefixParser';
import { ShadowExecutionContext, ToolExecutorFunction, SpeculativeExecutionResult } from './ShadowExecutionContext';

export interface SpeculativeMetrics {
  totalE2ELatencyMs: number;
  timeToFirstToolResultMs: number;
  speculatedToolsCount: number;
  cacheHitRate: number;
  wallTimeSavedMs: number;
}

export class SpeculativeToolEngine {
  private shadowContext: ShadowExecutionContext;
  private tokenBuffer: string = '';
  private tokenCount: number = 0;
  private detectedIntents: ParsedToolIntent[] = [];

  constructor(executor: ToolExecutorFunction) {
    this.shadowContext = new ShadowExecutionContext(executor);
  }

  /**
   * Alimente le moteur token par token au fil du streaming LLM.
   * Déclenche automatiquement les requêtes spéculatives dès détection d'intention.
   */
  public feedToken(token: string): ParsedToolIntent[] {
    this.tokenBuffer += token;
    this.tokenCount++;

    const newIntents = StreamingPrefixParser.parseStreamPrefix(this.tokenBuffer, this.tokenCount);
    for (const intent of newIntents) {
      // Éviter de re-spéculer si déjà détecté dans ce flux
      const alreadyTracked = this.detectedIntents.some(
        (d) => d.toolId === intent.toolId && JSON.stringify(d.params) === JSON.stringify(intent.params)
      );

      if (!alreadyTracked) {
        this.detectedIntents.push(intent);
        this.shadowContext.launchSpeculative(intent.toolId, intent.params);
      }
    }

    return this.detectedIntents;
  }

  /**
   * Résout une liste d'appels d'outils finaux une fois le stream terminé.
   */
  public async resolveTools(
    tools: Array<{ toolId: string; params: Record<string, unknown> }>
  ): Promise<{ results: SpeculativeExecutionResult[]; metrics: SpeculativeMetrics }> {
    const startTime = Date.now();
    const results: SpeculativeExecutionResult[] = [];
    let firstResultTime = 0;
    let speculatedHits = 0;
    let totalSavedMs = 0;

    for (const tool of tools) {
      const toolStart = Date.now();
      const res = await this.shadowContext.resolveTool(tool.toolId, tool.params);
      results.push(res);

      if (firstResultTime === 0) {
        firstResultTime = Date.now() - startTime;
      }

      if (res.wasSpeculated) {
        speculatedHits++;
        totalSavedMs += res.speculativeLeadTimeMs;
      }
    }

    const totalLatency = Date.now() - startTime;

    const metrics: SpeculativeMetrics = {
      totalE2ELatencyMs: totalLatency,
      timeToFirstToolResultMs: firstResultTime,
      speculatedToolsCount: speculatedHits,
      cacheHitRate: tools.length > 0 ? (speculatedHits / tools.length) * 100 : 0,
      wallTimeSavedMs: totalSavedMs,
    };

    // Reset du buffer après cycle
    this.reset();

    return { results, metrics };
  }

  /**
   * Exécute un ensemble d'outils selon le modèle standard (Sans Spec-PTC / Waterfall séquentiel).
   * Utilisé pour les benchmarks et les environnements sans streaming.
   */
  public static async executeWaterfall(
    tools: Array<{ toolId: string; params: Record<string, unknown> }>,
    executor: ToolExecutorFunction
  ): Promise<{ results: Array<{ toolId: string; data: unknown; durationMs: number }>; totalLatencyMs: number }> {
    const startTime = Date.now();
    const results = [];

    for (const tool of tools) {
      const toolStart = Date.now();
      const data = await executor(tool.toolId, tool.params);
      results.push({
        toolId: tool.toolId,
        data,
        durationMs: Date.now() - toolStart,
      });
    }

    return {
      results,
      totalLatencyMs: Date.now() - startTime,
    };
  }

  public reset(): void {
    this.tokenBuffer = '';
    this.tokenCount = 0;
    this.detectedIntents = [];
  }
}
