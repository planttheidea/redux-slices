import { createSliceBuilder } from '../../src';

const deviceSlice = createSliceBuilder('device', {
  isActive: false,
  deep: { nested: 'value' },
});

const reset = deviceSlice.createAction('reset');
const resume = deviceSlice.createAction('resume');

const reducer = deviceSlice.createReducer({
  [reset.type]: () => deviceSlice.initialState,
  [resume.type]: (currentState) => ({
    ...currentState,
    isActive: true,
  }),
});

export default deviceSlice.set({
  actionCreators: { reset, resume },
  reducer,
});
