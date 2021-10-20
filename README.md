# redux-slices

Manage slices of redux store in a concise, clear, and well-typed way

## Usage

```ts
import { createSlice } from 'redux-slices';
import type { ActionCreatorMap } from 'redux-slices';

type Item = { complete: boolean; value: string };
type State = { items: Item[] };

const INITIAL_STATE: State = { items: [] };

const { createAction, createReducer, createSelector } = createSlice(
  'todos',
  INITIAL_STATE,
);

export const add = createAction('add', (todo: string) => todo);
export const complete = createAction('complete', (item: Item) => item);
export const remove = createAction('remove', (todo: Item) => todo);

type HandledActions = ActionCreatorMap<
  [typeof add, typeof complete, typeof remove]
>;

export const reducer = createReducer<HandledActions>({
  [add.type]: (state, { payload: value }) => ({
    ...state,
    items: [...state.items, { complete: false, value }],
  }),
  [complete.type]: (state, { payload }) => ({
    ...state,
    items: state.items.map((item) =>
      item === payload ? { ...item, complete: true } : item,
    ),
  }),
  [remove.type]: (state, { payload }) => ({
    ...state,
    items: state.items.map((item) => item !== payload),
  }),
});

export const getTodos = createSelector((slice) => slice.items);
```

## API

### createSlice

```ts
function createSlice(sliceName: string, initialState: object): Slice;
```

Creates a slice of state based on the name and initial state passed, and returns a suite of utilities that allow construction of common redux implementation methods.

### createAction

```ts
function createAction(
  actionType: string,
  getPayload?: (...args: any[]) => any,
  getMeta?: (...args: any[]) => any,
): ((...args: any[]) => any) & { type: string };
```

Creates an action creator that will construct the action in a Flux Standard Action format based on the type and getters passed:

- If both getters are passed, the action will contain both `payload` and `meta`
- If only `getPayload` is passed, the action will contain `payload` but not `meta`
- If only `getMeta` is passed, the action will contain `meta` but not `payload`
- If no getters are passed, the action will not contain either `payload` or `meta`

The action creator returned will also have a static `type` property on it, which will allow easy mapping with [`createReducer`](#createreducer).

If using TypeScript, the action creator returned will create action objects that are narrowly-typed based on the `sliceName` provided to [`createSlice`](#createslice) and the handler passed to `createAction`. Example:

```ts
const { createAction } = createSlice('todos', { items: [] });

const add = createAction('add', (value: string) => value);
// `action` is typed as { payload: string, type 'todos/add' }
const action = add('stuff');
```

### createReducer

```ts
type SliceReducer = (slice: StateSlice, action: Action) => StateSlice;

function createReducer<ActionHandlerMap>(
  actionHandlerMap: ActionHandlerMap,
): SliceReducer;
function createReducer(sliceReducer: SliceReducer): SliceReducer;
```

There are two ways to create a reducer:

- Pass a map of action-specific reducers, each of which will receive the slice of state and the action dispatched and return a new slice of state
- Pass a traditional reducer function, which will receive the slice of state and the action dispatched and return a new slice of state

Using the former is preferred, because `redux-slices` will internally optimize the slice's reducer to only call handlers when the corresponding action type matches. `redux-slices` makes this easier by including the `type` property on any action creator generated with [`createAction`](#createaction):

```js
const add = createAction('add', (value) => value);

const reducer = createReducer({
  [add.type]: (state, { payload: value }) => ({
    ...state,
    items: [...items, { complete: false, value }],
  }),
});
```

If using TypeScript, you can pass a type map of type => handler, and it will narrowly-type all handlers for you:

```ts
const add = createAction('add', (value) => value);

const actions = {
  [add.type]: add;
};

const reducer = createReducer<typeof actions>({
  // `payload` will automatically be typed as a `string`, as in the handler above
  [add.type]: (state, { payload: value }) => ({
    ...state,
    items: [...items, { complete: false, value }],
  }),
});
```

There is also a convenience type, [`ActionCreatorMap`](#actioncreatormap), provided to simplify the generation of this map from the action creators.

#### ActionCreatorMap

If using TypeScript, an additional typing utility is provided to narrowly-type all handlers based on the actions for the slice without incurring any additional runtime cost.

```ts
const add = createAction('add', (value: string) => value);

type ActionHandlers = ActionCreatorMap<[typeof add]>;

const reducer = createReducer<ActionHandlers>({
  [add.type]: (state, { payload: value }) => ({
    ...state,
    items: [...items, { complete: false, value }],
  }),
});
```

The action handler typing for the is also not specific to the slice the reducer is created for; you can easily leverage action creators from other slices.

```ts
import { reset } from './appSlice';
...
const add = createAction('add', (value: string) => value);

type ActionHandlers = ActionCreatorMap<[typeof add, typeof reset]>;

const reducer = createReducer<ActionHandlers>({
  [add.type]: (state, { payload: value }) => ({
    ...state,
    items: [...items, { complete: false, value }],
  }),
  [reset.type]: (state) => ({ ...state, items: [] }),
});
```

### createSelector

```ts
function createSelector(
  selector: (slice: StateSlice, ...args: any[]) => any,
): (state: State, ...args: any[]) => any;
```

Creates a selector that receives the full state and returns a value derived from the specific slice of state.

```ts
const { createSelector } = createSlice('todos', { items: [] });

const getItems = createSelector((slice) => slice.items);
```

_NOTE_: The selector created is not memoized. If you use the selector to derive a new object, it is recommended to use [`createMemoizedSelector`](#creatememoizedselector) instead.

### createMemoizedSelector

```ts
function createMemoizedSelector(
  selector: (slice: StateSlice, ...args: any[]) => any,
): (state: State, ...args: any[]) => any;
```

Creates a memoizedselector that receives the full state and returns a value derived from the specific slice of state.

```ts
const { createMemoizedSelector } = createSlice('todos', { items: [] });

const getOpenItems = createMemoizedSelector((slice) =>
  slice.items.filter((item) => !item.completed),
);
```

_NOTE_: Memoization has inherent runtime costs, which may not be worth if the values being returned from the selector have consistent references (e.g., if simply returning values from state). For simpler use-cases, it is recommended to use [`createSelector`](#createselector) instead.
