export type ClockAction = "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END";

export interface TimeclockPayload {
  userId: string;
  userName: string;
  tenantId: string;
  terminalId: string;
  timestamp: string;
}

export interface DomainEventResult {
  type: 'EVENT';
  eventName: string;
  payload: Record<string, unknown>;
}

export interface DomainDbResult {
  type: 'DB_WRITE';
  path: string;
  payload: Record<string, unknown>;
}

export type TimeclockResult = DomainEventResult | DomainDbResult;

export function processTimeclockAction(
  action: ClockAction,
  data: TimeclockPayload,
  generateId: () => string
): TimeclockResult {
  if (action === 'CLOCK_IN' || action === 'CLOCK_OUT') {
    const eventName = action === 'CLOCK_IN' ? 'staff.clock_in' : 'staff.clock_out';
    return {
      type: 'EVENT',
      eventName,
      payload: {
        v: 1,
        tenantId: data.tenantId,
        userId: data.userId,
        userName: data.userName,
        terminalId: data.terminalId,
        timestamp: data.timestamp,
      },
    };
  } else {
    const entryId = generateId();
    const shiftPath = data.tenantId !== 'default' 
      ? `tenants/${data.tenantId}/shiftEntries/${entryId}` 
      : `shiftEntries/${entryId}`;
      
    return {
      type: 'DB_WRITE',
      path: shiftPath,
      payload: {
        id: entryId,
        userId: data.userId,
        userName: data.userName,
        type: action,
        timestamp: data.timestamp,
        location: { terminalId: data.terminalId },
      },
    };
  }
}
