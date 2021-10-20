import Slice from './Slice';

import type { AnyState } from './internalTypes';

export type { ActionCreatorMap } from './internalTypes';

/**
 * Create a new Slice instance based on the `name` and `initialState` passed.
 *
 * @param name name of the slice
 * @param initialState initial state of the slice
 * @returns Slice instance
 */
export function createSlice<Name extends string, InitialState extends AnyState>(
  name: Name,
  initialState: InitialState,
) {
  return new Slice(name, initialState);
}
