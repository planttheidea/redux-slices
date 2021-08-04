import SliceBuilder from '../src/SliceBuilder';
import Slice from '../src/Slice';

const INITIAL_STATE = {
  items: [
    { id: 1, started: false },
    { id: 2, started: false },
    { id: 3, started: false },
  ],
};

describe('redux-slices/src/SliceBuilder', () => {
  describe('init', () => {
    it('should create an instance with the correct name and initial state', () => {
      const result = new SliceBuilder('name', INITIAL_STATE);

      expect(result.name).toBe('name');
      expect(result.initialState).toBe(INITIAL_STATE);
    });

    it('should create an instance with a default initial state if none is provided', () => {
      const result = new SliceBuilder('name');

      expect(result.name).toBe('name');
      expect(result.initialState).toEqual({});
    });

    it('should thrown an error if a name is not a string', () => {
      // @ts-expect-error - Testing invalid name type
      expect(() => new SliceBuilder(Symbol('name'))).toThrow(
        'Name provided to `SliceBuilder` must be a string; received symbol.',
      );
    });
  });

  describe('createAction', () => {
    const sliceBuilder = new SliceBuilder('create-action');

    it('should create a function that has a `type` property that is a static presentation of the `type` on the action itself', () => {
      const result = sliceBuilder.createAction('type-only');

      expect(result).toEqual(expect.any(Function));
      expect(result.type).toEqual(expect.any(String));
      expect(result.type).toBe(result().type);
    });

    it('should create an action type that is namespaced to the slice', () => {
      const name = 'type-only';
      const result = sliceBuilder.createAction(name);

      expect(result.type.startsWith(sliceBuilder.name)).toBe(true);
      expect(result.type.endsWith(name)).toBe(true);
    });

    it('should create an action with just a `type` if no payload or meta handlers are passed', () => {
      const result = sliceBuilder.createAction('type-only');

      expect(result()).toEqual({ type: 'create-action/type-only' });
    });

    it('should create an action with a `payload` property if a payload handler is passed', () => {
      const result = sliceBuilder.createAction(
        'type-only',
        (value: number) => value * 2,
      );

      expect(result(2)).toEqual({
        payload: 4,
        type: 'create-action/type-only',
      });
    });

    it('should create an action with both `payload` and `error` properties if the payload handler returns an instance of an Error', () => {
      const result = sliceBuilder.createAction(
        'type-only',
        (value: number) => new Error(`Boom for ${value * 2}`),
      );

      expect(result(2)).toEqual({
        error: true,
        payload: new Error('Boom for 4'),
        type: 'create-action/type-only',
      });
    });

    it('should create an action with a `meta` property if a meta handler is passed', () => {
      const result = sliceBuilder.createAction(
        'type-only',
        null,
        (value: number) => value * 2,
      );

      expect(result(2)).toEqual({
        meta: 4,
        type: 'create-action/type-only',
      });
    });

    it('should create an action with both `payload` and `meta` propertes if both payload and meta handlers are passed', () => {
      const result = sliceBuilder.createAction(
        'type-only',
        (value: number) => value * 2,
        (value: number, context: object) => context,
      );

      expect(result(2, { context: 'test' })).toEqual({
        meta: { context: 'test' },
        payload: 4,
        type: 'create-action/type-only',
      });
    });

    it('should create an action with `payload`, `meta`, and `error` properties if the payload handler returns an instance of an Error', () => {
      const result = sliceBuilder.createAction(
        'type-only',
        (value: number) => new Error(`Boom for ${value * 2}`),
        (value: number, context: object) => context,
      );

      expect(result(2, { context: 'test' })).toEqual({
        error: true,
        meta: { context: 'test' },
        payload: new Error('Boom for 4'),
        type: 'create-action/type-only',
      });
    });

    it('should be callable outside the context of the slice', () => {
      const { createAction } = sliceBuilder;

      const result = createAction('type-only');

      expect(result()).toEqual({ type: 'create-action/type-only' });
    });
  });

  describe('createMemoizedSelector', () => {
    const sliceBuilder = new SliceBuilder(
      'create-memoized-selector',
      INITIAL_STATE,
    );

    it('should create a selector that returns the value requested', () => {
      const result = sliceBuilder.createMemoizedSelector(
        (state) => state.items,
      );
      const mockCompleteState = {
        [sliceBuilder.name]: INITIAL_STATE,
      };

      expect(result(mockCompleteState)).toBe(INITIAL_STATE.items);
    });

    it('should create a selector that returns the computed value requested', () => {
      const result = sliceBuilder.createMemoizedSelector((state) =>
        state.items.filter(({ id }) => id % 2 === 0),
      );
      const mockCompleteState = {
        [sliceBuilder.name]: INITIAL_STATE,
      };

      expect(result(mockCompleteState)).toEqual([INITIAL_STATE.items[1]]);
    });

    it('should create a selector that returns the computed value requested with extra arguments', () => {
      const result = sliceBuilder.createMemoizedSelector(
        (state, modulus: number) =>
          state.items.filter(({ id }) => id % modulus === 0),
      );
      const mockCompleteState = {
        [sliceBuilder.name]: INITIAL_STATE,
      };

      expect(result(mockCompleteState, 2)).toEqual([INITIAL_STATE.items[1]]);
    });

    it('should create a selector that does not re-compute the value if state is unchanged', () => {
      const result = sliceBuilder.createMemoizedSelector((state) =>
        state.items.filter(({ id }) => id % 2 === 0),
      );

      const mockCompleteState = {
        [sliceBuilder.name]: INITIAL_STATE,
      };

      const items = result(mockCompleteState);

      expect(items).toEqual([INITIAL_STATE.items[1]]);

      const items2 = result(mockCompleteState);

      expect(items2).toBe(items);
    });

    it('should create a selector thats re-computes the value if state changes', () => {
      const result = sliceBuilder.createMemoizedSelector((state) =>
        state.items.filter(({ id }) => id % 2 === 0),
      );

      const mockCompleteState = {
        [sliceBuilder.name]: INITIAL_STATE,
      };

      const items = result(mockCompleteState);

      expect(items).toEqual([INITIAL_STATE.items[1]]);

      const items2 = result(mockCompleteState);

      expect(items2).toBe(items);

      const newItems = [...INITIAL_STATE.items, { id: 4, started: false }];
      const mockUpdatedCompleteState = {
        [sliceBuilder.name]: {
          ...INITIAL_STATE,
          items: newItems,
        },
      };

      const items3 = result(mockUpdatedCompleteState);

      expect(items3).not.toBe(items2);
      expect(items3).toEqual([newItems[1], newItems[3]]);
    });

    it('should create a selector that does not re-compute the value if state is unchanged with extra arguments', () => {
      const result = sliceBuilder.createMemoizedSelector(
        (state, modulus: number) =>
          state.items.filter(({ id }) => id % modulus === 0),
      );

      const mockCompleteState = {
        [sliceBuilder.name]: INITIAL_STATE,
      };

      const items = result(mockCompleteState, 2);

      expect(items).toEqual([INITIAL_STATE.items[1]]);

      const items2 = result(mockCompleteState, 2);

      expect(items2).toBe(items);
    });

    it('should create a selector that does not re-computes the value if the extra arguments change', () => {
      const result = sliceBuilder.createMemoizedSelector(
        (state, modulus: number) =>
          state.items.filter(({ id }) => id % modulus === 0),
      );

      const mockCompleteState = {
        [sliceBuilder.name]: INITIAL_STATE,
      };

      const items = result(mockCompleteState, 2);

      expect(items).toEqual([INITIAL_STATE.items[1]]);

      const items2 = result(mockCompleteState, 2);

      expect(items2).toBe(items);

      const items3 = result(mockCompleteState, 3);

      expect(items3).not.toBe(items2);
      expect(items3).toEqual([INITIAL_STATE.items[2]]);
    });

    it('should be callable outside the context of the slice', () => {
      const { createMemoizedSelector } = sliceBuilder;

      const result = createMemoizedSelector((state) => state.items);
      const mockCompleteState = {
        [sliceBuilder.name]: INITIAL_STATE,
      };

      expect(result(mockCompleteState)).toBe(INITIAL_STATE.items);
    });
  });

  describe('createReducer', () => {
    const sliceBuilder = new SliceBuilder('create-reducer', INITIAL_STATE);

    it('should create a pass-through functional reducer that only coalesces undefined state', () => {
      const result = sliceBuilder.createReducer((state, action) => {
        return action.type === 'foo'
          ? { ...state, items: state.items.filter((_, index) => index === 0) }
          : state;
      });

      expect(result).toEqual(expect.any(Function));
      expect(result(undefined, { type: 'INIT' })).toBe(INITIAL_STATE);

      const afterDispatch = result(INITIAL_STATE, { type: 'foo' });

      expect(afterDispatch).toEqual({
        ...INITIAL_STATE,
        items: [{ id: 1, started: false }],
      });
    });

    it('should create a reducer function that maps specific action types', () => {
      const start = sliceBuilder.createAction(
        'start',
        (value: number) => value,
      );
      const stop = sliceBuilder.createAction('stop');

      type ActionMap = {
        [start.type]: typeof start;
        [stop.type]: typeof stop;
      };

      const result = sliceBuilder.createReducer<ActionMap>({
        [start.type]: (state, { payload: toStart }) => ({
          ...state,
          items: state.items.map((item) =>
            item.id > toStart ? item : { ...item, started: true },
          ),
        }),
        [stop.type]: (state) => ({
          ...state,
          items: state.items.map((item) => ({ ...item, started: false })),
        }),
      });

      expect(result).toEqual(expect.any(Function));
      expect(result(undefined, { type: 'INIT' })).toBe(INITIAL_STATE);

      const afterDispatch1 = result(INITIAL_STATE, start(2));

      expect(afterDispatch1).toEqual({
        ...INITIAL_STATE,
        items: [
          { id: 1, started: true },
          { id: 2, started: true },
          { id: 3, started: false },
        ],
      });

      const afterDispatch2 = result(afterDispatch1, stop());

      expect(afterDispatch2).toEqual({
        ...afterDispatch1,
        items: [
          { id: 1, started: false },
          { id: 2, started: false },
          { id: 3, started: false },
        ],
      });
    });

    it('should throw an error if an invalid type is passed', () => {
      // @ts-expect-error - Testing invalid reducer type
      expect(() => sliceBuilder.createReducer(null)).toThrow(
        'Handlers passed to `SliceBuilder<create-reducer>.setReducer` must be either a reducer function or an object of action-specific reducers.',
      );
    });

    it('should be callable outside the context of the slice', () => {
      const { createReducer } = sliceBuilder;

      const result = createReducer((state, action) => {
        return action.type === 'foo'
          ? { ...state, items: state.items.filter((_, index) => index === 0) }
          : state;
      });

      expect(result).toEqual(expect.any(Function));
      expect(result(undefined, { type: 'INIT' })).toBe(INITIAL_STATE);
    });
  });

  describe('createSelector', () => {
    const sliceBuilder = new SliceBuilder('create-selector', INITIAL_STATE);

    it('should create a selector that returns the value requested', () => {
      const result = sliceBuilder.createSelector((state) => state.items);
      const mockCompleteState = {
        [sliceBuilder.name]: INITIAL_STATE,
      };

      expect(result(mockCompleteState)).toBe(INITIAL_STATE.items);
    });

    it('should create a selector that returns the computed value requested', () => {
      const result = sliceBuilder.createSelector((state) =>
        state.items.filter(({ id }) => id % 2 === 0),
      );
      const mockCompleteState = {
        [sliceBuilder.name]: INITIAL_STATE,
      };

      expect(result(mockCompleteState)).toEqual([INITIAL_STATE.items[1]]);
    });

    it('should create a selector that returns the computed value requested with extra arguments', () => {
      const result = sliceBuilder.createSelector((state, modulus: number) =>
        state.items.filter(({ id }) => id % modulus === 0),
      );
      const mockCompleteState = {
        [sliceBuilder.name]: INITIAL_STATE,
      };

      expect(result(mockCompleteState, 2)).toEqual([INITIAL_STATE.items[1]]);
    });

    it('should be callable outside the context of the slice', () => {
      const { createSelector } = sliceBuilder;

      const result = createSelector((state) => state.items);
      const mockCompleteState = {
        [sliceBuilder.name]: INITIAL_STATE,
      };

      expect(result(mockCompleteState)).toBe(INITIAL_STATE.items);
    });
  });

  describe('createSlice', () => {
    const sliceBuilder = new SliceBuilder('create-slice', INITIAL_STATE);

    it('should return a frozen Slice instance', () => {
      const result = sliceBuilder.createSlice({});

      expect(result).toBeInstanceOf(Slice);
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should have a default reducer if none is passed', () => {
      const result = sliceBuilder.createSlice({});

      expect(result.reducer).toEqual(expect.any(Function));
      // @ts-expect-error - reducer should be passed two parameters, but they are ignored
      expect(result.reducer()).toBe(INITIAL_STATE);
    });

    it('should contain all stored properties', () => {
      const action = sliceBuilder.createAction('action');
      const reducer = sliceBuilder.createReducer((state) => state);
      const selector = sliceBuilder.createSelector((state) => state.items);

      const result = sliceBuilder.createSlice({
        actionCreators: { action },
        reducer,
        selectors: { selector },
      });

      expect(result.actionCreators).toEqual({ action });
      expect(result.reducer).toBe(reducer);
      expect(result.selectors).toEqual({ selector });
    });

    it('should contain defaults for "empty" properties', () => {
      const reducer = sliceBuilder.createReducer((state) => state);

      const result = sliceBuilder.createSlice({
        reducer,
      });

      expect(result.actionCreators).toEqual({});
      expect(result.reducer).toBe(reducer);
      expect(result.selectors).toEqual({});
    });

    it('should be callable outside the context of the slice', () => {
      const { createSlice } = sliceBuilder;

      const result = createSlice({});

      expect(result).toBeInstanceOf(Slice);
      expect(Object.isFrozen(result)).toBe(true);
    });
  });
});
