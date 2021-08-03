import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunk from 'redux-thunk';
import counter from './slices/counter';
import device from './slices/device';

import type { ThunkAction } from 'redux-thunk';

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
    const updateResults = Object.keys(nextState).reduce((results, key) => {
      if (nextState[key] !== prevState[key]) {
        results[key] = {
          prev: prevState[key],
          next: nextState[key],
        };
      }

      return results;
    }, {});

    console.log('store updated', updateResults);
  } else {
    console.log('store not updated');
  }

  prevState = nextState;
});

const {
  actionCreators: { decrement, increment, reset: resetCounter, sendError },
  selectors: { getDoubledCount, getCount },
} = counter;
const {
  actionCreators: { resume, reset: resetDevice },
} = device;

store.dispatch(increment(2));
store.dispatch(resetCounter());
store.dispatch(resetCounter());
store.dispatch(sendError());
store.dispatch(increment(50));
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
