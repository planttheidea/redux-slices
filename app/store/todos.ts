import { createSliceBuilder } from '../../src';

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

const { createAction, createMemoizedSelector, createReducer, createSlice } =
  createSliceBuilder('todos', INITIAL_STATE);

const addTodo = createAction('add', (todo: string) => todo);
const clearTodos = createAction('clear');
const removeTodo = createAction('remove', (todo: Item) => todo);
const toggleTodoComplete = createAction(
  'toggle-complete',
  (item: Item) => item,
);

type Actions = {
  [addTodo.type]: typeof addTodo;
  [clearTodos.type]: typeof clearTodos;
  [removeTodo.type]: typeof removeTodo;
  [toggleTodoComplete.type]: typeof toggleTodoComplete;
};

const reducer = createReducer<Actions>({
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

const getItems = createMemoizedSelector((state) => state.items);

export default createSlice({
  actionCreators: { addTodo, clearTodos, removeTodo, toggleTodoComplete },
  reducer,
  selectors: { getItems },
});
