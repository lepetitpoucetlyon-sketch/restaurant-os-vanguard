/**
 * 🏛️ FIRESTORE TYPES - Grade X Suture
 */

export type RawFirestore<T> = Omit<T, 'id'> & {
  id: string;
  createdAt?: number;
  updatedAt?: number;
};

export type WhereFilterOp =
    | '<' | '<=' | '==' | '!=' | '>=' | '>'
    | 'array-contains' | 'array-contains-any'
    | 'in' | 'not-in';

export interface FirestoreQueryConstraint {
    field: string;
    operator: WhereFilterOp;
    value: unknown;
}
