# redux-slices

Manage slices of redux store in a concise, clear, and well-typed way

- [redux-slices](#redux-slices)
  - [Usage](#usage)
  - [API](#api)
    - [createSlice](#createslice)
      - [Initial state typing](#initial-state-typing)
    - [createAction](#createaction)
    - [createReducer](#createreducer)
      - [ActionCreatorMap](#actioncreatormap)
    - [createSelector](#createselector)
    - [createMemoizedSelector](#creatememoizedselector)
  - [Comparable libraries](#comparable-libraries)
    - [`createSlice` from Redux Toolkit](#createslice-from-redux-toolkit)
    - [`redux-actions`](#redux-actions)

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

export const add = createAction('added', (todo: string) => todo);
export const complete = createAction('completed', (item: Item) => item);
export const remove = createAction('removed', (todo: Item) => todo);

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
function createSlice(sliceName: string, initialState?: object): Slice;
```

Creates a slice of state based on the name and initial state passed, and returns a suite of utilities that allow construction of common redux implementation methods. If `initialState` is not passed, the slice will default to an empty object for its state.

#### Initial state typing

Clearly defining the contract of your Redux state is considered a best practice, and `redux-slices` leans into this by making the type of your state object inferred from the `initialState` value passed. However, there are some scenarios where you want more control over the typing:

- You defined your initial state with `as const`, and you want the state typing to be wider
- You have dynamic population of the state, and you start with an empty object

In these cases, you can pass generics to `createSlice` to ensure this typing is respected:

```ts
const slice = createSlice<'name', { dynamic?: boolean }>('name', {});
```

### createAction

```ts
function createAction(
  actionType: string,
  getPayload?: (...args: any[]) => any,
  getMeta?: (...args: any[]) => any,
): ((...args: any[]) => any) & { type: string };
```

Creates an action creator that will construct the action in a [Flux Standard Action](https://github.com/redux-utilities/flux-standard-action) format based on the type and getters passed:

- If both getters are passed, the action will contain both `payload` and `meta`
- If only `getPayload` is passed, the action will contain `payload` but not `meta`
- If only `getMeta` is passed, the action will contain `meta` but not `payload`
- If no getters are passed, the action will not contain either `payload` or `meta`

The action creator returned will also have a static `type` property on it, which will allow easy mapping with [`createReducer`](#createreducer).

If using TypeScript, the action creator returned will create action objects that are narrowly-typed based on the `sliceName` provided to [`createSlice`](#createslice) and the handler passed to `createAction`. Example:

```ts
const { createAction } = createSlice('todos', { items: [] });

const add = createAction('added', (value: string) => value);
// `action` is typed as { payload: string, type 'todos/added' }
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
const add = createAction('added', (value) => value);

const reducer = createReducer({
  [add.type]: (state, { payload: value }) => ({
    ...state,
    items: [...items, { complete: false, value }],
  }),
});
```

If using TypeScript, you can pass a type map of type => handler, and it will narrowly-type all handlers for you:

```ts
const add = createAction('added', (value) => value);

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
const add = createAction('added', (value: string) => value);

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
const add = createAction('added', (value: string) => value);

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

## Comparable libraries

There are libraries in the wild that try to solve the same problem `redux-slices` solves, but there are some differences worth calling out. As a note, these comparisons are based on generating action creators and reducers; the scoped selector concept that `redux-slices` provides do not exist in these libraries.

### [`createSlice` from Redux Toolkit](https://redux-toolkit.js.org/api/createSlice)

Redux Toolkit, and the RTK team in general, garner much respect. For most projects RTK is a great way to hit the ground running. That said, there are a few limitations with the `createSlice` API:

- Generated once through a large configuration object (readability can suffer with large slices)
- Forces use of `immer` for state changes
- Typing of action payloads is manual
- Custom action creators are clunky, and do not conform to FSA standards
- Use with action creators for external slices via `extraReducers` can be challenging and confusing

### [`redux-actions`](https://github.com/redux-utilities/redux-actions)

While it is longer maintained, it has similar goals. Like `redux-slices`, it follows FSA standards, and is agnostic about how state changes occur. The main difference is typing; the library was not written with first-class TS support in mind, and therefore the action creators and reducers require a lot of manual typing.
