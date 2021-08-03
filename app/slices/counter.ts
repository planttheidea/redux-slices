import { createSliceBuilder } from '../../src';

const INITIAL_STATE = {
  count: 0,
  deep: { nested: 'object' },
};

const {
  createAction,
  createReducer,
  createMemoizedSelector,
  createSelector,
  set,
} = createSliceBuilder('counter', INITIAL_STATE);

const increment = createAction('increment', (number?: number) => number);
const decrement = createAction('decrement');
const reset = createAction('reset');
const sendError = createAction('error', () => new Error('boom'));

const getCount = createSelector((state) => state.count);
const getDoubledCount = createMemoizedSelector(({ count }) => {
  console.log('Setting doubled count cache');

  return count * 2;
});

type ActionMap = {
  [decrement.type]: typeof decrement;
  [increment.type]: typeof increment;
  [reset.type]: typeof reset;
};

const reducer = createReducer<ActionMap>({
  [decrement.type]: (currentState) => ({
    ...currentState,
    count: currentState.count - 1,
  }),
  [increment.type]: (currentState, { payload = 1 }) => ({
    ...currentState,
    count: currentState.count + payload,
  }),
  [reset.type]: () => INITIAL_STATE,
});

export default set({
  actionCreators: {
    decrement,
    increment,
    reset,
    sendError,
  },
  reducer,
  selectors: { getDoubledCount, getCount },
});
