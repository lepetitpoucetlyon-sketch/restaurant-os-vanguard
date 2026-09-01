import { registerKdsRoutingHandler } from '@/modules/ops';
import { registerKdsCourseManagerHandler } from '@/modules/ops';
import { registerKdsPrepTimeAnalyzerHandler } from '@/modules/ops';
import { registerKdsPassNotifierHandler } from '@/modules/ops';
import { registerKdsPrintFallbackHandler } from '@/modules/ops';
import { registerGroupPrepTasksHandler } from '../handlers/GroupPrepTasksHandler';
import { registerRecipeChangeKDSHandler } from '../handlers/RecipeChangeKDSHandler';
import { registerKdsPrepDelayAlertHandler } from '@/modules/ops';
import { registerKdsCoursePassedHandler } from '@/modules/ops';
import { registerFireNextCourseHandler } from '@/verticals/restaurant/handlers/FireNextCourseHandler';
import { registerDishReboundHandler } from '@/modules/ops';

export function registerOpsKdsHandlers(): Array<() => void> {
  return [
    registerKdsCoursePassedHandler(),
    registerKdsRoutingHandler(),
    registerKdsCourseManagerHandler(),
    registerKdsPrepTimeAnalyzerHandler(),
    registerKdsPassNotifierHandler(),
    registerKdsPrintFallbackHandler(),
    registerGroupPrepTasksHandler(),
    registerRecipeChangeKDSHandler(),
    registerKdsPrepDelayAlertHandler(),
    registerFireNextCourseHandler(),
    registerDishReboundHandler(),
  ];
}
