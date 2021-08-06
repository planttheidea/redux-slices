import React, { useCallback, useRef } from 'react';
import styled from '@emotion/styled';
import { useDispatch, useSelector } from 'react-redux';
import Button from './Button';
import { DARK_GRAY, LIGHT_GRAY, WHITE } from '../styles';
import { todos } from '../store';

import type { KeyboardEvent, MouseEvent } from 'react';

const { addTodo, clearTodos, getItems } = todos;

const Container = styled.div`
  display: flex;
  height: 40px;
  width: 100%;
`;

const Input = styled.input`
  background-color: ${WHITE};
  border: 1px solid ${LIGHT_GRAY};
  border-radius: 5px;
  color: ${DARK_GRAY};
  flex-grow: 1;
  font-size: 24px;
  height: inherit;
  margin: 0;
  padding: 10px;

  &:focus {
    box-shadow: 0 0 5px ${LIGHT_GRAY};
    outline: none;
  }
`;

function clearAndFocus(input: HTMLInputElement) {
  input.value = '';
  input.focus();
}

function submit(
  dispatch: ReturnType<typeof useDispatch>,
  input: HTMLInputElement,
) {
  dispatch(addTodo(input.value));
  clearAndFocus(input);
}

export default function Entry() {
  const inputRef = useRef(null);

  const dispatch = useDispatch();
  const onClickAdd = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();

      submit(dispatch, inputRef.current);
    },
    [inputRef],
  );
  const onClickClear = useCallback((event: MouseEvent) => {
    event.preventDefault();

    dispatch(clearTodos());
    clearAndFocus(inputRef.current);
  }, []);
  const onKeyDownSubmit = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();

        submit(dispatch, inputRef.current);
      }
    },
    [inputRef],
  );

  const items = useSelector(getItems);

  return (
    <Container>
      <Input autoFocus onKeyDown={onKeyDownSubmit} ref={inputRef} />
      <Button onClick={onClickAdd} type="submit">
        Add
      </Button>
      {Boolean(items.length) && (
        <Button onClick={onClickClear} type="reset">
          Clear
        </Button>
      )}
    </Container>
  );
}
