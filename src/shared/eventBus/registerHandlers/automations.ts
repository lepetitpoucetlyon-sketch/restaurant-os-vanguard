import { registerAutomationRunner } from '@/modules/intelligence';

export function registerAutomationHandlers(): Array<() => void> {
  return registerAutomationRunner();
}
