import type Slice from './src/Slice';
import type { AnyState } from './src/internalTypes';

export type { ActionCreatorMap } from './src/internalTypes';

/**
 * Create a new Slice based on the `name` and `initialState` passed. This is handled in two stages:
 * - Create a slice builder, which will provide methods by which action creators, slice-specific
 *   selectors, and a reducer can be generated.
 * - Store the generated methods on a static slice, which can be consumed throughout the app.
 *
 * @example
 * import { createSlice } from 'redux-slices';
 *
 * export const name = 'counter';
 *
 * const INITIAL_STATE = { count: 0 };
 *
 * // Provide both the name and the initial state
 * const slice = createSlice(name, INITIAL_STATE);
 *
 * // Build the action creators
 * export nameconst increment = slice.createAction('increment', (size = 1) => size);
 * export const decrement = slice.createAction('decrement', (size = 1) => size);
 * export const reset = slice.createAction('reset');
 *
 * // Build selectors specific to the slice
 * export const getCount = slice.createSelector((state) => state.count);
 *
 * // For optimal TypeScript inference, provide a map of type => action to `createReducer`.
 * type ActionMap = {
 *  [increment.type]: typeof increment,
 *  [decrement.type]: typeof decrement,
 *  [reset.type]: typeof reset
 * };
 *
 * // Build reducer that is targeted to the actions for the slice
 * export const reducer = slice.createReducer<ActionMap>({
 *  [increment.type]: (state, { payload }) => ({ ...state, count: state.count + payload}),
 *  [decrement.type]: (state, { payload }) => ({ ...state, count: state.count - payload}),
 *  [reset.type]: (state) => INITIAL_STATE,
 * });
 *
 * @param name name of the slice
 * @param initialState initial state of the slice
 * @returns tools with which a slice can be built
 */
export function createSlice<Name extends string, InitialState extends AnyState>(
  name: Name,
  initialState: InitialState,
): Slice<Name, InitialState>;
