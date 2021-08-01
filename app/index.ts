import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunk from 'redux-thunk';
// import { createSelector } from 'reselect';
import { createSlice } from '../src';

import type { ThunkAction } from 'redux-thunk';

const counter = createSlice('counter', {
  count: 0,
  deep: { nested: 'object' },
});

const { reset: resetSlice } = counter;

const increment = counter.createAction(
  'increment',
  (number?: number) => number,
);
const decrement = counter.createAction('decrement');

const getCount = counter.createSelector((state) => state.count);
const getDoubledCount = counter.createMemoizedSelector(({ count }) => {
  console.log('Setting doubled count cache');

  return count * 2;
});

counter.setReducer({
  [decrement.type]: (currentState) => ({
    ...currentState,
    count: currentState.count - 1,
  }),
  [increment.type]: (
    currentState,
    { payload = 1 }: ReturnType<typeof increment>,
  ) => ({
    ...currentState,
    count: currentState.count + payload,
  }),
});

const device = createSlice('device', {
  isActive: false,
  deep: { nested: 'value' },
});

const resume = device.createAction('resume');

device.setReducer({
  [resume.type]: (currentState) => ({
    ...currentState,
    isActive: true,
  }),
});

const otherReducers = {
  notSlice: () => ({ not: 'slice' }),
};

const store = createStore(
  combineReducers({
    ...otherReducers,
    [counter.name]: counter.reduce,
    [device.name]: device.reduce,
  }),
  // combineSlices([counter, device], otherReducers),
  applyMiddleware(
    // redux-thunk
    thunk,
    // redux-logger
    () => (dispatch) => (action) => {
      console.log('action received: ', action);

      return dispatch(action);
    },
  ),
);

const state = store.getState();

// state.device.deep.nested = 'other';

const sliceState = counter.getState(state);

console.log({ state, sliceState });

// const { not } = state.notSlice;

store.subscribe(() => {
  console.log('store updated', store.getState());
});

store.dispatch(increment(2));
store.dispatch(resetSlice());
store.dispatch(resume());
store.dispatch(device.reset());
store.dispatch(increment());
store.dispatch(decrement());
store.dispatch(increment());
store.dispatch(increment(63));
store.dispatch(increment());

console.log('count: ', getCount(store.getState()));
console.log('doubled count: ', getDoubledCount(store.getState()));
console.log('doubled count: ', getDoubledCount(store.getState()));

store.dispatch({ type: 'IGNORED' });

store.dispatch(increment());

const customReset =
  (): ThunkAction<void, any, undefined, ReturnType<typeof resetSlice>> =>
  (dispatch, getState) => {
    console.log('customReset called');

    if (getCount(getState())) {
      console.log('resetting');

      dispatch(resetSlice());
    }
  };

store.dispatch<any>(customReset());
store.dispatch<any>(customReset());
store.dispatch<any>(customReset());
