/**
 * 🏛️ FIRESTORE TYPES - Grade X Suture
 */

export type RawFirestore<T> = Omit<T, 'id'> & {
  id: string;
  createdAt?: number;
  updatedAt?: number;
};

export interface FirestoreQueryConstraint {
    field: string;
    operator: import('firebase/firestore').WhereFilterOp;
    value: unknown;
}
