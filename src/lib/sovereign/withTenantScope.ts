import { Query, query, where } from 'firebase/firestore';

export function withTenantScope<T>(q: Query<T>, organizationId: string): Query<T> {
  return query(q, where('organizationId', '==', organizationId));
}
