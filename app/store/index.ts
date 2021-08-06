import { combineReducers, createStore } from 'redux';
import * as todos from './todos';

export { todos };

const reducer = combineReducers({
  [todos.name]: todos.reducer,
});

const store = createStore(reducer);

export default store;
