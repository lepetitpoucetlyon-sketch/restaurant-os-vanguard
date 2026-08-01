import { registerKdsRoutingHandler } from '../handlers/KdsRoutingHandler';
import { registerKdsCourseManagerHandler } from '../handlers/KdsCourseManagerHandler';
import { registerKdsPrepTimeAnalyzerHandler } from '../handlers/KdsPrepTimeAnalyzerHandler';
import { registerKdsPassNotifierHandler } from '../handlers/KdsPassNotifierHandler';
import { registerKdsPrintFallbackHandler } from '../handlers/KdsPrintFallbackHandler';

export function registerOpsKdsHandlers(): Array<() => void> {
  return [
    registerKdsRoutingHandler(),
    registerKdsCourseManagerHandler(),
    registerKdsPrepTimeAnalyzerHandler(),
    registerKdsPassNotifierHandler(),
    registerKdsPrintFallbackHandler(),
  ];
}
