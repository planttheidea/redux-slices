import SliceBuilder from './Slice';

import type { AnyState } from './internalTypes';

/**
 * Create a new Slice instance based on the `name` and `initialState` passed.
 *
 * @param name name of the slice
 * @param initialState initial state of the slice
 * @returns SliceBuilder instance
 */
export function createSlice<Name extends string, InitialState extends AnyState>(
  name: Name,
  initialState: InitialState,
) {
  return new SliceBuilder(name, initialState);
}
