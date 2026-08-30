import { registerKdsRoutingHandler } from '../handlers/KdsRoutingHandler';
import { registerKdsCourseManagerHandler } from '../handlers/KdsCourseManagerHandler';
import { registerKdsPrepTimeAnalyzerHandler } from '../handlers/KdsPrepTimeAnalyzerHandler';
import { registerKdsPassNotifierHandler } from '../handlers/KdsPassNotifierHandler';
import { registerKdsPrintFallbackHandler } from '../handlers/KdsPrintFallbackHandler';
import { registerKDSReadyHandler } from '../handlers/KDSReadyHandler';
import { registerGroupPrepTasksHandler } from '../handlers/GroupPrepTasksHandler';
import { registerRecipeChangeKDSHandler } from '../handlers/RecipeChangeKDSHandler';
import { registerKdsPrepDelayAlertHandler } from '../handlers/KdsPrepDelayAlertHandler';
import { registerKdsCoursePassedHandler } from '../handlers/KdsCoursePassedHandler';
import { registerFireNextCourseHandler } from '../handlers/FireNextCourseHandler';
import { registerDishReboundHandler } from '../handlers/DishReboundHandler';

export function registerOpsKdsHandlers(): Array<() => void> {
  return [
    registerKdsCoursePassedHandler(),
    registerKdsRoutingHandler(),
    registerKdsCourseManagerHandler(),
    registerKdsPrepTimeAnalyzerHandler(),
    registerKdsPassNotifierHandler(),
    registerKdsPrintFallbackHandler(),
    registerKDSReadyHandler(),
    registerGroupPrepTasksHandler(),
    registerRecipeChangeKDSHandler(),
    registerKdsPrepDelayAlertHandler(),
    registerFireNextCourseHandler(),
    registerDishReboundHandler(),
  ];
}
