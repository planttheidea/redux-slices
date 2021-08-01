import Slice from './Slice';

import type { AnyState } from './internalTypes';

export const createSlice = <Name extends string, InitialState extends AnyState>(
  name: Name,
  initialState: InitialState,
) => new Slice(name, initialState);
