/* eslint-disable guard-for-in, no-restricted-syntax, no-param-reassign, no-use-before-define */

import createSlice from './createSlice';

import type { Reducer } from './createSlice';

type SliceTypes = {
  explicit: Record<string, Record<string, true>>;
  unknown: Record<string, true>;
};

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

type DeepReadonlyArray<T> = ReadonlyArray<DeepReadonly<T>>;

type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Record<string, any>
  ? DeepReadonlyObject<T>
  : T;

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
  x: infer R
) => any
  ? R
  : never;

function combineSlices<
  StateSlice extends ReturnType<typeof createSlice>,
  OtherReducers extends Record<string, Reducer<Record<string, any>>>
>(slices: readonly StateSlice[], otherReducers?: OtherReducers) {
  // This is a fun trick, where we leverage the `StateSlice` generic (which will include all
  // possible slices) to grab the first parameter of the `getState` method, which is the
  // complete state. This creates a union of all slices. We then use `UnionToIntersection`
  // to convert this to an intersection of all slices.
  type State = UnionToIntersection<
    Readonly<Parameters<StateSlice['getState']>[0]>
  > &
    {
      [Key in keyof OtherReducers]: ReturnType<OtherReducers[Key]>;
    };

  const otherSlices = otherReducers
    ? ((Object.keys(otherReducers).map((name) => ({
        name,
        reduce: otherReducers[name],
      })) as unknown) as StateSlice[])
    : [];
  const reducerSlices: StateSlice[] = []
    .concat(slices, otherSlices)
    .filter((slice) => typeof slice.reduce === 'function');
  const stateSize = reducerSlices.length;

  const {
    explicit: explicitTypes,
    unknown: unknownTypes,
  } = reducerSlices.reduce<SliceTypes>(
    (types, slice) => {
      const { actionHandlers } = slice;

      if (actionHandlers) {
        for (const type in actionHandlers) {
          if (!types.explicit[type]) {
            types.explicit[type] = {};
          }

          types.explicit[type][slice.name] = true;
        }
      } else {
        types.unknown[slice.name] = true;
      }

      return types;
    },
    { explicit: {}, unknown: {} }
  );

  return (state: State = {} as State, action: any) => {
    const nextState = {} as State;
    const explicitSlicesForType = explicitTypes[action.type];

    let hasChanged = Object.keys(state).length !== stateSize;

    for (let index = 0; index < stateSize; ++index) {
      const slice = reducerSlices[index];
      const sliceName = slice.name;

      const current = state[sliceName as keyof typeof state];
      const next =
        !current ||
        unknownTypes[sliceName] ||
        (explicitSlicesForType && explicitSlicesForType[sliceName])
          ? slice.reduce(current, action)
          : current;

      // @ts-ignore
      nextState[sliceName as keyof State] = next;

      if (next !== current) {
        hasChanged = true;
      }
    }

    return ((hasChanged ? nextState : state) as unknown) as DeepReadonly<State>;
  };
}

export default combineSlices;
