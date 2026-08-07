export function toError(e: unknown): Error {
  if (e instanceof Error) return e;
  if (typeof e === 'string') return new Error(e);
  try {
    return new Error(JSON.stringify(e));
  } catch {
    return new Error(String(e));
  }
}
