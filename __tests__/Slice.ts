import Slice from '../src/Slice';
import SliceBuilder from '../src/SliceBuilder';

const SLICE_BUILDER = new SliceBuilder('slice', { value: 123 });

describe('redux-slices/src/Slice', () => {
  it('should contain all stored properties', () => {
    const action = SLICE_BUILDER.createAction('action');
    const reducer = SLICE_BUILDER.createReducer((state) => state);
    const selector = SLICE_BUILDER.createSelector((state) => state.value);

    type Name = typeof SLICE_BUILDER.name;
    type State = ReturnType<typeof reducer>;
    type ReducerHandler = typeof reducer;
    type ActionCreators = { action: typeof action };
    type Selectors = { selector: typeof selector };

    const result = new Slice<
      Name,
      State,
      ReducerHandler,
      ActionCreators,
      Selectors
    >({
      actionCreators: { action },
      name: SLICE_BUILDER.name,
      reducer,
      selectors: { selector },
    });

    expect(result.actionCreators).toEqual({ action });
    expect(result.reducer).toBe(reducer);
    expect(result.selectors).toEqual({ selector });
  });

  it('should contain defaults for "empty" properties', () => {
    const reducer = SLICE_BUILDER.createReducer((state) => state);

    type Name = typeof SLICE_BUILDER.name;
    type State = ReturnType<typeof reducer>;
    type ReducerHandler = typeof reducer;

    const result = new Slice<Name, State, ReducerHandler, {}, {}>({
      name: SLICE_BUILDER.name,
      reducer,
    });

    expect(result.actionCreators).toEqual({});
    expect(result.reducer).toBe(reducer);
    expect(result.selectors).toEqual({});
  });
});
