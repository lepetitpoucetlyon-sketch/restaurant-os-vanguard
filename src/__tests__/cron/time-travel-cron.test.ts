import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const runWeeklyReport = async () => ({ status: 'success', reportsSent: 42 });

describe('BONUS 2 : Time-Travel Testing (Crons)', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it('déclenche le rapport hebdomadaire exactement le Dimanche à 00:00 sans timer réel', async () => {
    const saturdayNight = new Date(2026, 7, 22, 23, 59, 50); 
    vi.setSystemTime(saturdayNight);
    const cronTask = vi.fn(runWeeklyReport);
    setTimeout(cronTask, 10000); 

    expect(cronTask).not.toHaveBeenCalled();
    vi.advanceTimersByTime(9900);
    expect(cronTask).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    
    expect(cronTask).toHaveBeenCalledTimes(1);
    const result = await cronTask.mock.results[0].value;
    expect(result.status).toBe('success');
  });
});