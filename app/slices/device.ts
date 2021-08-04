import { createSliceBuilder } from '../../src';

const sliceBuilder = createSliceBuilder('device', {
  isActive: false,
  deep: { nested: 'value' },
});

const reset = sliceBuilder.createAction('reset');
const resume = sliceBuilder.createAction('resume');

const reducer = sliceBuilder.createReducer((state, action) => {
  switch (action.type) {
    case reset.type:
      return sliceBuilder.initialState;

    case resume.type:
      return state.isActive ? state : { ...state, isActive: true };

    default:
      return state;
  }
});

export default sliceBuilder.createSlice({
  actionCreators: { reset, resume },
  reducer,
});
