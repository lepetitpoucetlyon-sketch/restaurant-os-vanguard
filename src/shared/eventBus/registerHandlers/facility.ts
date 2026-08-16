import { EquipmentFaultHandler } from '../handlers/EquipmentFaultHandler';
import { registerHardwareFaultHandler } from '../handlers/HardwareFaultHandler';

export function registerFacilityHandlers(): Array<() => void> {
  return [
    EquipmentFaultHandler.register(),
    registerHardwareFaultHandler(),
  ];
}
