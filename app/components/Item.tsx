import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import styled from '@emotion/styled';
import Button from './Button';
import { LIGHT_GRAY } from '../styles';
import { todos } from '../store';

import type { Item as ItemType } from '../store/todos';

const { removeTodo, toggleTodoComplete } = todos;

const Container = styled.div`
  border-top: 1px dotted ${LIGHT_GRAY};
  display: flex;
  align-items: center;
  padding: 15px 0;
  width: 100%;
`;

type ValueProps = {
  isComplete: boolean;
};

const Value = styled.span`
  display: block;
  flex-grow: 1;
  font-style: ${(props: ValueProps) =>
    props.isComplete ? 'italic' : 'normal'};
  text-decoration: ${(props: ValueProps) =>
    props.isComplete ? 'line-through' : 'none'};
`;

type Props = {
  item: ItemType;
};

export default function Item({ item }: Props) {
  const dispatch = useDispatch();
  const onClickComplete = useCallback(() => {
    dispatch(toggleTodoComplete(item));
  }, [item]);
  const onClickRemove = useCallback(() => {
    dispatch(removeTodo(item));
  }, [item]);

  return (
    <Container>
      <Value isComplete={item.complete}>{item.value}</Value>

      <Button onClick={onClickComplete} type="button">
        {item.complete ? 'Restart' : 'Complete'}
      </Button>
      <Button onClick={onClickRemove} type="button">
        Remove
      </Button>
    </Container>
  );
}
