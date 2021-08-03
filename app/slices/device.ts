import { createSlice } from '../../src';

const deviceSlice = createSlice('device', {
  isActive: false,
  deep: { nested: 'value' },
});

const reset = deviceSlice.createAction('reset');
const resume = deviceSlice.createAction('resume');

const reducer = deviceSlice.createReducer((state, action) => {
  switch (action.type) {
    case reset.type:
      return deviceSlice.initialState;

    case resume.type:
      return state.isActive ? state : { ...state, isActive: true };

    default:
      return state;
  }
});

export default deviceSlice.set({
  actionCreators: { reset, resume },
  reducer,
});
