import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunk from 'redux-thunk';
import SliceBuilder from '../src/SliceBuilder';
import Slice from '../src/Slice';
import { createSliceBuilder } from '../src/index';

const INITIAL_STATE = {
  items: [
    { id: 1, started: false },
    { id: 2, started: false },
    { id: 3, started: false },
  ],
};

describe('redux-slices', () => {
  describe('createSliceBuilder', () => {
    it('should create a `SliceBuilder`', () => {
      const sliceBuilder = createSliceBuilder('slice', INITIAL_STATE);

      expect(sliceBuilder).toBeInstanceOf(SliceBuilder);
      expect(sliceBuilder.name).toBe('slice');
      expect(sliceBuilder.initialState).toBe(INITIAL_STATE);
    });

    it('should allow for building a full `Slice`', () => {
      const { createAction, createReducer, createSelector, createSlice } =
        createSliceBuilder('slice', INITIAL_STATE);

      const add = createAction('add');
      const reducer = createReducer({
        [add.type]: (state) => ({
          ...state,
          items: [
            ...state.items,
            { id: state.items.length + 1, started: false },
          ],
        }),
      });
      const getItems = createSelector((state) => state.items);

      const slice = createSlice({
        actionCreators: { add },
        reducer,
        selectors: { getItems },
      });

      expect(slice).toBeInstanceOf(Slice);
      expect(slice.actionCreators).toEqual({ add });
      expect(slice.reducer).toBe(reducer);
      expect(slice.selectors).toEqual({ getItems });
    });

    it('should work as expected with redux', () => {
      const { createAction, createReducer, createSelector, createSlice } =
        createSliceBuilder('slice', INITIAL_STATE);

      const add = createAction('add');
      const sliceReducer = createReducer({
        [add.type]: (state) => ({
          ...state,
          items: [
            ...state.items,
            { id: state.items.length + 1, started: false },
          ],
        }),
      });
      const getItems = createSelector((state) => state.items);

      const slice = createSlice({
        actionCreators: { add },
        reducer: sliceReducer,
        selectors: { getItems },
      });

      const sliceReducerSpy = jest.fn(slice.reducer);

      const reducer = combineReducers({
        [slice.name]: sliceReducerSpy,
      });
      const middleware = applyMiddleware(thunk);
      const store = createStore(reducer, middleware);

      expect(sliceReducerSpy).toHaveBeenCalledWith(undefined, {
        type: expect.any(String),
      });

      sliceReducerSpy.mockClear();

      const state = store.getState();

      expect(state).toEqual({
        slice: INITIAL_STATE,
      });

      const items = getItems(state);

      expect(items).toBe(INITIAL_STATE.items);

      store.dispatch(add());

      expect(sliceReducerSpy).toHaveBeenCalledWith(state.slice, {
        type: 'slice/add',
      });

      const updatedState = store.getState();
      const expectedItems = [
        { id: 1, started: false },
        { id: 2, started: false },
        { id: 3, started: false },
        { id: 4, started: false },
      ];

      expect(updatedState).toEqual({
        slice: {
          ...INITIAL_STATE,
          items: expectedItems,
        },
      });

      const updatedItems = getItems(updatedState);

      expect(updatedItems).toEqual(expectedItems);
    });
  });
});
