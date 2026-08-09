import { logger } from '@/lib/logger';

export class TimeController {
  private currentTime: Date;

  constructor(startDate: Date = new Date('2026-08-10T08:00:00.000Z')) {
    this.currentTime = new Date(startDate);
  }

  getCurrentTime(): Date {
    return new Date(this.currentTime);
  }

  getISOString(): string {
    return this.currentTime.toISOString();
  }

  getDateString(): string {
    return this.currentTime.toISOString().split('T')[0];
  }

  advanceHours(hours: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + hours * 3600 * 1000);
    logger.info(`[TimeController] Temps avancé de ${hours}h -> ${this.getISOString()}`);
  }

  advanceMinutes(minutes: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + minutes * 60 * 1000);
  }

  setExactTime(timeIso: string): void {
    this.currentTime = new Date(timeIso);
    logger.info(`[TimeController] Temps fixé à ${this.getISOString()}`);
  }
}
