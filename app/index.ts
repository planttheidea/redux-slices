import { createSlice, combineSlices } from '../src';

const slice = createSlice('name', { foo: 'bar' });

const actionCreator = slice.createAction<string>('UPDATE_FOO');

const action = actionCreator('baz');
// This should be an error
const actionInvalid = actionCreator(123);