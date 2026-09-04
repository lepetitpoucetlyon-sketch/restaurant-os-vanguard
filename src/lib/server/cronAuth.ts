import 'server-only';

import { timingSafeEqual } from 'node:crypto';

/** Valide le contrat Vercel Cron : `Authorization: Bearer $CRON_SECRET`. */
export function isAuthorizedCronRequest(
  request: Request,
  expectedSecret = process.env.CRON_SECRET,
): boolean {
  if (!expectedSecret) return false;
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return false;
  const suppliedSecret = authorization.slice('Bearer '.length);
  const supplied = Buffer.from(suppliedSecret);
  const expected = Buffer.from(expectedSecret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
