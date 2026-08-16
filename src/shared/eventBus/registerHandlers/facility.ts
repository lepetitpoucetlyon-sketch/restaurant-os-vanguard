import { EquipmentFaultHandler } from '../handlers/EquipmentFaultHandler';

export function registerFacilityHandlers(): Array<() => void> {
  return [
    EquipmentFaultHandler.register(),
  ];
}
