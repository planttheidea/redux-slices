import { createSlice } from '../../src';

export const name = 'todos';

export type Item = {
  complete: boolean;
  value: string;
};

type State = {
  items: Item[];
};

const INITIAL_STATE: State = {
  items: [],
};

const { createAction, createMemoizedSelector, createReducer } = createSlice(
  name,
  INITIAL_STATE,
);

export const addTodo = createAction('add', (todo: string) => todo);
export const clearTodos = createAction('clear');
export const removeTodo = createAction('remove', (todo: Item) => todo);
export const toggleTodoComplete = createAction(
  'toggle-complete',
  (item: Item) => item,
);

type Actions = {
  [addTodo.type]: typeof addTodo;
  [clearTodos.type]: typeof clearTodos;
  [removeTodo.type]: typeof removeTodo;
  [toggleTodoComplete.type]: typeof toggleTodoComplete;
};

export const reducer = createReducer<Actions>({
  [addTodo.type]: (state, { payload: value }) => ({
    ...state,
    items: [...state.items, { complete: false, value }],
  }),
  [clearTodos.type]: () => INITIAL_STATE,
  [removeTodo.type]: (state, { payload }) => ({
    ...state,
    items: state.items.filter((item) => item !== payload),
  }),
  [toggleTodoComplete.type]: (state, { payload }) => ({
    ...state,
    items: state.items.map((item) =>
      item !== payload ? item : { ...item, complete: !item.complete },
    ),
  }),
});

export const getItems = createMemoizedSelector((state) => state.items);
