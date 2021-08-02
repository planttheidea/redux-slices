import Slice from './Slice';

import type { AnyState } from './internalTypes';

/**
 * Create a new Slice instance based on the `name` and `initialState` passed.
 *
 * @param name - name of the slice
 * @param initialState - initial state of the slice
 * @returns - Slice instance
 */
export const createSlice = <Name extends string, InitialState extends AnyState>(
  name: Name,
  initialState: InitialState,
) => new Slice(name, initialState);
