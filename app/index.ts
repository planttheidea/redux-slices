import { applyMiddleware, combineReducers, createStore } from 'redux';
// import { createSelector } from 'reselect';
import { combineSlices, createSlice } from '../src';

const counter = createSlice('counter', {
  count: 0,
  deep: { nested: 'object' },
});

const {
  /* actionCreators: { reset: resetSlice }, */
  createAction,
  handle,
  reset: resetSlice,
} = counter;

const increment = createAction('increment', (number?: number) => number);
const decrement = createAction('decrement');

const getCount = counter.createSelector((state) => state.count);
const getDoubledCount = counter.createMemoizedSelector(({ count }) => {
  console.log('Setting doubled count cache');

  return count * 2;
});

const reset = () => (dispatch, getState) => {
  console.log('reset called');

  if (getCount(getState())) {
    console.log('resetting');

    dispatch(resetSlice());
  }
};

const device = createSlice('device', {
  isActive: true,
  deep: { nested: 'value' },
});
const resume = device.createAction('resume');

handle({
  [decrement.type]: (currentState) => ({
    ...currentState,
    count: currentState.count - 1,
  }),
  [increment.type]: (
    currentState,
    { payload = 1 }: ReturnType<typeof increment>
  ) => ({
    ...currentState,
    count: currentState.count + payload,
  }),
});

const otherReducers = {
  notSlice: () => ({ not: 'slice' }),
};

const store = createStore(
  combineSlices([counter, device], otherReducers),
  applyMiddleware(
    // redux-thunk
    (storeApi) => (dispatch) => (action) =>
      typeof action === 'function'
        ? action(storeApi.dispatch, storeApi.getState)
        : dispatch(action),
    // redux-logger
    () => (dispatch) => (action) => {
      console.log('action received: ', action);

      return dispatch(action);
    }
  )
);

const state = store.getState();

// state.device.deep.nested = 'other';

const sliceState = counter.getState(state);

console.log(state);

const { not } = state.notSlice;

store.subscribe(() => {
  console.log('store updated', store.getState());
});

store.dispatch(increment(2));
store.dispatch(resetSlice());
store.dispatch(resume());
// store.dispatch(device.reset());
store.dispatch(increment());
store.dispatch(decrement());
store.dispatch(increment());
store.dispatch(increment(63));
store.dispatch(increment());

console.log('count: ', getCount(store.getState()));
console.log('doubled count: ', getDoubledCount(store.getState()));
console.log('doubled count: ', getDoubledCount(store.getState()));

store.dispatch(increment());
store.dispatch(reset());
store.dispatch(reset());
store.dispatch(reset());