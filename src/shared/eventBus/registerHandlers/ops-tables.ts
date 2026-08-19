import { registerFloorPlanCapacityHandler } from '../handlers/FloorPlanCapacityHandler';
import { registerTableTurnoverAnalyzerHandler } from '../handlers/TableTurnoverAnalyzerHandler';
import { registerNoShowTableReleaseHandler } from '../handlers/NoShowTableReleaseHandler';
import { registerTableAutoReleaseHandler } from '../handlers/TableAutoReleaseHandler';
import { registerTableLockHandler } from '../handlers/TableLockHandler';
import { registerTableTransferHandler } from '../handlers/TableTransferHandler';

export function registerOpsTableHandlers(): Array<() => void> {
  return [
    registerFloorPlanCapacityHandler(),
    registerTableTurnoverAnalyzerHandler(),
    registerNoShowTableReleaseHandler(),
    registerTableAutoReleaseHandler(),
    registerTableLockHandler(),
    registerTableTransferHandler(),
  ];
}
