import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunk from 'redux-thunk';
import Slice from '../src/Slice';
import { createSlice } from '../src/index';

const INITIAL_STATE = {
  items: [
    { id: 1, started: false },
    { id: 2, started: false },
    { id: 3, started: false },
  ],
};

describe('redux-slices', () => {
  describe('createSlice', () => {
    it('should create a `Slice`', () => {
      const slice = createSlice('slice', INITIAL_STATE);

      expect(slice).toBeInstanceOf(Slice);
      expect(slice.name).toBe('slice');
      expect(slice.initialState).toBe(INITIAL_STATE);
    });

    it('should create a `Slice` without requiring an initial state', () => {
      const slice = createSlice<'slice', { optional?: any[] }>('slice');

      expect(slice).toBeInstanceOf(Slice);
      expect(slice.name).toBe('slice');
      expect(slice.initialState).toEqual({});
    });

    it('should allow for building a slice with action creators, selectors, and a reducer', () => {
      const { createAction, createReducer, createSelector } = createSlice(
        'slice',
        INITIAL_STATE,
      );

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

      expect(add).toEqual(expect.any(Function));
      expect(reducer).toEqual(expect.any(Function));
      expect(getItems).toEqual(expect.any(Function));
    });

    it('should work as expected with redux', () => {
      const { createAction, createReducer, createSelector } = createSlice(
        'slice',
        INITIAL_STATE,
      );

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

      const sliceReducerSpy = jest.fn(sliceReducer);

      const reducer = combineReducers({
        slice: sliceReducerSpy,
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
