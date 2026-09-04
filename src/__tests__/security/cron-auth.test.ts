import { describe, expect, it } from 'vitest';

import { isAuthorizedCronRequest } from '@/lib/server/cronAuth';

describe('cronAuth', () => {
  const secret = 'cron-secret-for-test';

  it('accepte uniquement le Bearer exact', () => {
    const request = new Request('https://app.example/api/cron/tick', {
      headers: { authorization: `Bearer ${secret}` },
    });
    expect(isAuthorizedCronRequest(request, secret)).toBe(true);
  });

  it('refuse les anciens headers et secrets placés dans l’URL', () => {
    const legacyHeader = new Request('https://app.example/api/cron/tick', {
      headers: { 'x-cron-secret': secret },
    });
    const querySecret = new Request(`https://app.example/api/cron/tick?secret=${secret}`);
    expect(isAuthorizedCronRequest(legacyHeader, secret)).toBe(false);
    expect(isAuthorizedCronRequest(querySecret, secret)).toBe(false);
  });

  it('refuse un secret absent ou différent', () => {
    const request = new Request('https://app.example/api/cron/tick', {
      headers: { authorization: 'Bearer incorrect' },
    });
    expect(isAuthorizedCronRequest(request, secret)).toBe(false);
    expect(isAuthorizedCronRequest(request, undefined)).toBe(false);
  });
});
