import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunk from 'redux-thunk';
// import { createSelector } from 'reselect';
import { createSlice } from '../src';

import type { ThunkAction } from 'redux-thunk';

const counter = createSlice('counter', {
  count: 0,
  deep: { nested: 'object' },
});

const increment = counter.createAction(
  'increment',
  (number?: number) => number,
);
const decrement = counter.createAction('decrement');
const resetCounter = counter.createAction('reset', () => counter.initialState);

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
  [resetCounter.type]: () => counter.initialState,
});

const device = createSlice('device', {
  isActive: false,
  deep: { nested: 'value' },
});

const resetDevice = device.createAction('reset');
const resume = device.createAction('resume');

device.setReducer({
  [resetDevice.type]: () => device.initialState,
  [resume.type]: (currentState) => ({
    ...currentState,
    isActive: true,
  }),
});

const NOT_SLICE_STATE = { not: 'slice' };

const otherReducers = {
  notSlice: () => NOT_SLICE_STATE,
};

const store = createStore(
  combineReducers({
    ...otherReducers,
    [counter.name]: counter.reducer,
    [device.name]: device.reducer,
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

// const { not } = state.notSlice;

let prevState = store.getState();

store.subscribe(() => {
  const nextState = store.getState();

  if (nextState !== prevState) {
    console.log('store updated', {
      counter: nextState.counter !== prevState.counter,
      device: nextState.device !== prevState.device,
      notSlice: nextState.notSlice !== prevState.notSlice,
    });
  } else {
    console.log('store not updated');
  }

  prevState = nextState;
});

store.dispatch(increment(2));
store.dispatch(resetCounter());
store.dispatch(resetCounter());
store.dispatch(resume());
store.dispatch(resetDevice());
store.dispatch(resetDevice());
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
  (): ThunkAction<void, any, undefined, ReturnType<typeof resetCounter>> =>
  (dispatch, getState) => {
    console.log('customReset called');

    if (getCount(getState())) {
      console.log('resetting');

      dispatch(resetCounter());
    }
  };

store.dispatch<any>(customReset());
store.dispatch<any>(customReset());
store.dispatch<any>(customReset());
